import os
import cv2
import time
import asyncio
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

from app.models import DashboardState, SignalResult, TelemetryData
from app.face.mesh import FaceMeshProcessor
from app.signals.s1_boundary import S1BoundaryDetector
from app.signals.s2_occlusion import S2OcclusionDetector
from app.signals.s3_texture import S3TextureDetector
from app.signals.s4_blink import S4BlinkDetector
from app.signals.s5_avsync import S5AVSyncDetector
from app.signals.heatmap import HeatmapGenerator
from app.fusion.ewma import EWMAFusionEngine
from app.challenge.engine import ChallengeEngine

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
TARGET_FPS = int(os.getenv("TARGET_FPS", 5))
EWMA_ALPHA = float(os.getenv("EWMA_ALPHA", 0.25))
APP_ENV = os.getenv("APP_ENV", "development")

app = FastAPI()

if APP_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

frontend_dist = "frontend/dist" if os.path.exists("frontend/dist") else "../frontend/dist"
assets_dir = os.path.join(frontend_dist, "assets")
if os.path.exists(assets_dir):
    app.mount('/assets', StaticFiles(directory=assets_dir), name='assets')

@app.get("/")
async def root():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "VeyLance Backend Running (Frontend not built)"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "veylance", "version": "0.1.0"}

@app.get("/api/status")
async def api_status():
    return {"status": "active"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    face_mesh = FaceMeshProcessor()
    s1 = S1BoundaryDetector()
    s2 = S2OcclusionDetector()
    s3 = S3TextureDetector()
    s4 = S4BlinkDetector()
    s5 = S5AVSyncDetector()
    heatmap_gen = HeatmapGenerator()
    fusion = EWMAFusionEngine(alpha=EWMA_ALPHA)
    challenge_engine = ChallengeEngine()
    
    session_id = "session_" + str(int(time.time()))
    frame_interval = 1.0 / TARGET_FPS
    last_frame_time = 0
    
    try:
        while True:
            audio_rms = None
            data = None
            try:
                # Try receiving as text (JSON envelope with audio)
                msg = await websocket.receive()
                if msg.get('type') == 'websocket.receive':
                    if 'text' in msg and msg['text']:
                        import json, base64
                        payload = json.loads(msg['text'])
                        frame_bytes = base64.b64decode(payload['frame'])
                        audio_rms = payload.get('audio_rms', None)
                        data = frame_bytes
                    elif 'bytes' in msg and msg['bytes']:
                        data = msg['bytes']
                        audio_rms = None
                    else:
                        continue
                elif msg.get('type') == 'websocket.disconnect':
                    break
            except Exception:
                continue
            
            if data is None:
                continue
            
            now = time.time()
            
            if now - last_frame_time < frame_interval:
                continue
                
            last_frame_time = now
            
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                continue
                
            all_landmarks = face_mesh.process_all(frame)
            
            signals = []
            alert = None
            
            if len(all_landmarks) > 0:
                faces = face_mesh.get_all_face_boxes(all_landmarks, frame.shape)
                
                primary_idx = 0
                for i, face in enumerate(faces):
                    if face.is_primary:
                        primary_idx = i
                        break
                        
                landmarks = all_landmarks[primary_idx]
                hull = face_mesh.get_face_hull(landmarks, frame.shape)
                
                s1_res = s1.process(frame, landmarks, hull)
                s2_res = s2.process(landmarks, ts=now)
                s3_res = s3.process(frame, landmarks)
                s4_res = s4.process(landmarks)
                s5_res = s5.process(landmarks, audio_rms, now)
                
                if s5.is_active:
                    signals = [s1_res, s2_res, s3_res, s4_res, s5_res]
                else:
                    signals = [s1_res, s2_res, s3_res, s4_res]
                    
                trust_score, risk_level = fusion.process(signals)
                
                heatmap_data = heatmap_gen.generate(frame, landmarks, hull)
                zone_list = s2.get_occlusion_zones(landmarks, frame.shape)
                
                ch_state = challenge_engine.check_trigger(trust_score)
                
                # Notify challenge engine when a blink occurs
                prev_blink_count = getattr(s4, '_prev_blink_count', 0)
                current_blink_count = len(s4.blink_events)
                if current_blink_count > prev_blink_count:
                    challenge_engine.notify_blink()
                s4._prev_blink_count = current_blink_count

                passed, boost = challenge_engine.verify(landmarks, is_blink=s4.in_blink)
                if passed:
                    fusion.boost_trust(boost)
                    trust_score, risk_level = fusion.process(signals)
                    
                instant_risk = fusion.get_instant_risk(signals)
                smoothed_risk = fusion.prev_s
                
                telemetry = TelemetryData(
                    ear=s4.current_ear,
                    blink_rate=s4.blink_rate,
                    blink_cv=s4.regularity_cv,
                    avg_duration_ms=s4.avg_blink_duration_ms,
                    laplacian_var=s1.last_lap_var,
                    color_corr=s1.last_color_corr,
                    ipd_drift=s2.last_ipd_drift,
                    hf_ratio=s3.last_hf_ratio,
                    lbp_entropy=s3.last_lbp_entropy,
                    instant_risk=instant_risk,
                    smoothed_risk=smoothed_risk,
                    faces_count=len(all_landmarks),
                    audio_rms=audio_rms if audio_rms is not None else 0.0,
                    s5_correlation=s5.last_correlation
                )

                state = DashboardState(
                    timestamp=now,
                    session_id=session_id,
                    face_detected=True,
                    trust_score=trust_score,
                    risk_level=risk_level,
                    signals=signals,
                    challenge=ch_state,
                    faces=faces,
                    faces_count=len(all_landmarks),
                    heatmap=heatmap_data,
                    occlusion_zones=zone_list,
                    telemetry=telemetry
                )
            else:
                s2_res = s2.process(None, ts=now)
                
                telemetry = TelemetryData(
                    ear=0.0,
                    blink_rate=0.0,
                    blink_cv=0.0,
                    avg_duration_ms=0.0,
                    laplacian_var=0.0,
                    color_corr=0.0,
                    ipd_drift=s2.last_ipd_drift,
                    hf_ratio=0.0,
                    lbp_entropy=0.0,
                    instant_risk=0.0,
                    smoothed_risk=0.0,
                    faces_count=0,
                    audio_rms=0.0,
                    s5_correlation=0.0
                )
                state = DashboardState(
                    timestamp=now,
                    session_id=session_id,
                    face_detected=False,
                    trust_score=0.0,
                    risk_level='ALERT',
                    signals=[],
                    faces=[],
                    faces_count=0,
                    telemetry=telemetry
                )
                
            await websocket.send_text(state.model_dump_json())
            
    except WebSocketDisconnect:
        print(f"Client disconnected: {session_id}")
    except Exception as e:
        print(f"Error: {e}")
