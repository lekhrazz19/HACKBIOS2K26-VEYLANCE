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
from app.signals.s4_blink import S4BlinkDetector
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

if os.path.exists("frontend/dist/assets"):
    app.mount('/assets', StaticFiles(directory='frontend/dist/assets'), name='assets')

@app.get("/")
async def root():
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
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
    s4 = S4BlinkDetector()
    heatmap_gen = HeatmapGenerator()
    fusion = EWMAFusionEngine(alpha=EWMA_ALPHA)
    challenge_engine = ChallengeEngine()
    
    session_id = "session_" + str(int(time.time()))
    frame_interval = 1.0 / TARGET_FPS
    last_frame_time = 0
    
    try:
        while True:
            data = await websocket.receive_bytes()
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
                s2_res = s2.process(landmarks)
                s4_res = s4.process(landmarks)
                signals = [s1_res, s2_res, s4_res]
                trust_score, risk_level = fusion.process(signals)
                
                heatmap_data = heatmap_gen.generate(frame, landmarks, hull)
                zone_list = s2.get_occlusion_zones(landmarks, frame.shape)
                
                ch_state = challenge_engine.check_trigger(trust_score)
                passed, boost = challenge_engine.verify(landmarks, is_blink=(len(s4.blink_events) > 0 and s4.in_blink))
                if passed:
                    fusion.boost_trust(boost)
                    trust_score, risk_level = fusion.process(signals)
                    
                instant_risk = 0.4 * s1_res.score + 0.35 * s2_res.score + 0.25 * s4_res.score
                smoothed_risk = fusion.prev_s
                
                telemetry = TelemetryData(
                    ear=s4.current_ear,
                    blink_rate=s4.blink_rate,
                    blink_cv=s4.regularity_cv,
                    avg_duration_ms=s4.avg_blink_duration_ms,
                    laplacian_var=s1.last_lap_var,
                    color_corr=s1.last_color_corr,
                    ipd_drift=s2.last_ipd_drift,
                    instant_risk=instant_risk,
                    smoothed_risk=smoothed_risk,
                    faces_count=len(all_landmarks)
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
                telemetry = TelemetryData(
                    ear=0.0,
                    blink_rate=0.0,
                    blink_cv=0.0,
                    avg_duration_ms=0.0,
                    laplacian_var=0.0,
                    color_corr=0.0,
                    ipd_drift=0.0,
                    instant_risk=0.0,
                    smoothed_risk=0.0,
                    faces_count=0
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
