import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceBox, SimulationScenario } from '../types';
import { VideoSourceType } from '../hooks/useWebcam';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  faceDetected: boolean;
  faces?: FaceBox[];
  trustScore?: number;
  riskLevel?: string;
  sourceType?: VideoSourceType;
  onSelectSource?: (source: VideoSourceType) => void;
  onStartCapture?: () => void;
  onStopCapture?: () => void;
  isMirrored?: boolean;
  isSimulating?: boolean;
  activeScenario?: SimulationScenario;
}

export const WebcamView: React.FC<WebcamViewProps> = ({ 
  videoRef, 
  isCapturing, 
  faceDetected, 
  faces, 
  trustScore = 100, 
  riskLevel = 'HIGH_TRUST', 
  sourceType = 'camera', 
  onSelectSource, 
  onStartCapture, 
  onStopCapture, 
  isMirrored = true,
  isSimulating = false,
  activeScenario = 'baseline'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Main HUD & Face Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isRunning = isCapturing || isSimulating;
    if (!isRunning) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Optional Cyber HUD Coordinate Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Center targeting reticle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Synthetic Avatar Renderer (when simulating and no webcam)
    if (isSimulating && !isCapturing) {
      const time = Date.now() * 0.003;
      const cx = w * 0.5 + Math.sin(time * 0.6) * 12;
      const cy = h * 0.46 + Math.cos(time * 0.4) * 8;
      const faceR = 125;

      // Dark avatar silhouette backdrop
      const avatarGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, faceR * 1.5);
      avatarGrad.addColorStop(0, 'rgba(30, 41, 59, 0.85)');
      avatarGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = avatarGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, faceR * 0.85, faceR * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Facial Wireframe Contour
      ctx.strokeStyle = riskLevel === 'ALERT' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, faceR * 0.85, faceR * 1.15, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eyes
      const eyeOffset = 46;
      const eyeY = cy - 22;
      const isBlinking = activeScenario === 'robotic_blink' ? false : Math.sin(time * 3) > 0.85;

      // Left eye
      ctx.fillStyle = riskLevel === 'ALERT' ? '#ef4444' : '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(cx - eyeOffset, eyeY, 14, isBlinking ? 2 : 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.beginPath();
      ctx.ellipse(cx + eyeOffset, eyeY, 14, isBlinking ? 2 : 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // IPD connecting laser line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - eyeOffset, eyeY);
      ctx.lineTo(cx + eyeOffset, eyeY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mouth
      const mouthY = cy + 58;
      const mouthWidth = activeScenario === 'av_desync' ? 32 + Math.sin(time * 8) * 8 : 28;
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, mouthWidth, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3-Finger Occlusion Hand Simulation
      if (activeScenario === 'occlusion_warp') {
        const handX = cx + Math.sin(time * 2) * 20;
        const handY = cy + 20 + Math.cos(time * 2) * 15;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        // Draw 3 finger paths
        for (let f = -1; f <= 1; f++) {
          ctx.beginPath();
          ctx.roundRect(handX + f * 18 - 8, handY - 45, 16, 65, 8);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('OCCLUSION WARP SHEAR DETECTED', handX - 110, handY + 45);
      }
    }

    // 3. Facial Landmark Points (when showLandmarks is enabled)
    const effectiveFaces = faces && faces.length > 0 ? faces : (isSimulating ? [{ id: 0, x: 0.28, y: 0.18, w: 0.44, h: 0.58, is_primary: true }] : []);

    effectiveFaces.forEach((face) => {
      // Calculate framing
      const cx = face.x + face.w / 2;
      const cy = face.y + face.h / 2;
      const squareSize = Math.max(face.w, face.h) * 1.25;
      
      const sqX = Math.max(0.01, cx - squareSize / 2);
      const sqY = Math.max(0.01, cy - squareSize / 2);
      const sqW = Math.min(0.98 - sqX, squareSize);
      const sqH = Math.min(0.98 - sqY, squareSize);
      
      const drawX = (isMirrored && !isSimulating)
        ? (1.0 - (sqX + sqW)) * canvas.width 
        : sqX * canvas.width;
      const drawY = sqY * canvas.height;
      const drawW = sqW * canvas.width;
      const drawH = sqH * canvas.height;
      
      if (face.is_primary) {
        // === PRIMARY TARGET ===
        const isAlert = riskLevel === 'ALERT';
        const isWarn = riskLevel === 'WARNING';
        const primaryColor = isAlert ? '#ef4444' : (isWarn ? '#f59e0b' : '#06b6d4');
        const fillColor = isAlert ? 'rgba(239, 68, 68, 0.08)' : (isWarn ? 'rgba(245, 158, 11, 0.08)' : 'rgba(6, 182, 212, 0.08)');
        
        ctx.fillStyle = fillColor;
        ctx.fillRect(drawX, drawY, drawW, drawH);
        
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        
        // High-contrast corner brackets
        const cornerLen = Math.min(32, drawW * 0.22);
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(drawX, drawY + cornerLen); ctx.lineTo(drawX, drawY); ctx.lineTo(drawX + cornerLen, drawY);
        // Top-right
        ctx.moveTo(drawX + drawW - cornerLen, drawY); ctx.lineTo(drawX + drawW, drawY); ctx.lineTo(drawX + drawW, drawY + cornerLen);
        // Bottom-right
        ctx.moveTo(drawX + drawW, drawY + drawH - cornerLen); ctx.lineTo(drawX + drawW, drawY + drawH); ctx.lineTo(drawX + drawW - cornerLen, drawY + drawH);
        // Bottom-left
        ctx.moveTo(drawX + cornerLen, drawY + drawH); ctx.lineTo(drawX, drawY + drawH); ctx.lineTo(drawX, drawY + drawH - cornerLen);
        ctx.stroke();
        
        // Center crosshair
        const centerCross = 12;
        const midX = drawX + drawW / 2;
        const midY = drawY + drawH / 2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX - centerCross, midY); ctx.lineTo(midX + centerCross, midY);
        ctx.moveTo(midX, midY - centerCross); ctx.lineTo(midX, midY + centerCross);
        ctx.stroke();

        // Mesh Dots Overlay
        if (showLandmarks) {
          ctx.fillStyle = primaryColor;
          const numDots = 24;
          for (let i = 0; i < numDots; i++) {
            const angle = (i / numDots) * Math.PI * 2;
            const rx = drawW * 0.32 * Math.cos(angle);
            const ry = drawH * 0.40 * Math.sin(angle);
            ctx.beginPath();
            ctx.arc(midX + rx, midY + ry, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Top Header Tag
        const tagText = isSimulating 
          ? `SIMULATED TARGET: [${activeScenario.toUpperCase()}]` 
          : `ACTIVE TARGET: SUBJECT #${face.id + 1}`;
        ctx.font = 'bold 12px monospace';
        const tagWidth = ctx.measureText(tagText).width + 16;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(drawX, Math.max(0, drawY - 26), tagWidth, 22);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, Math.max(0, drawY - 26), tagWidth, 22);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(tagText, drawX + 8, Math.max(0, drawY - 26) + 15);
        
        // Bottom Integrity Badge
        const integrityText = `INTEGRITY: ${Math.round(trustScore)}% [${riskLevel}]`;
        ctx.font = 'bold 11px monospace';
        const intWidth = ctx.measureText(integrityText).width + 16;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(drawX, drawY + drawH + 4, intWidth, 22);
        ctx.strokeStyle = primaryColor;
        ctx.strokeRect(drawX, drawY + drawH + 4, intWidth, 22);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(integrityText, drawX + 8, drawY + drawH + 19);

      } else {
        // === SECONDARY SUBJECTS (OTHER PARTICIPANTS) ===
        const secColor = 'rgba(245, 158, 11, 0.75)';
        ctx.strokeStyle = secColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.setLineDash([]);
        
        const secText = `SUBJECT #${face.id + 1} [UNVERIFIED]`;
        ctx.font = '10px monospace';
        const secWidth = ctx.measureText(secText).width + 12;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(drawX, Math.max(0, drawY - 20), secWidth, 18);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(secText, drawX + 6, Math.max(0, drawY - 20) + 13);
      }
    });
  }, [faces, isCapturing, isSimulating, activeScenario, trustScore, riskLevel, isMirrored, showGrid, showLandmarks]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col justify-between group cyber-grid"
    >
      {/* Top Source Switcher Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Source Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
          <button
            onClick={() => onSelectSource && onSelectSource('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceType === 'camera' && !isSimulating
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Webcam</span>
          </button>

          <button
            onClick={() => onSelectSource && onSelectSource('screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sourceType === 'screen' && !isSimulating
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Screen Share</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 uppercase font-mono">
              Meet
            </span>
          </button>
        </div>

        {/* Live Badges and Tactical HUD Toggles */}
        <div className="flex items-center gap-2">
          {/* Tactical HUD Overlay Control Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow">
            <button
              onClick={() => setShowGrid(prev => !prev)}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${showGrid ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}
              title="Toggle HUD Grid"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setShowLandmarks(prev => !prev)}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${showLandmarks ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}
              title="Toggle Mesh Landmark Dots"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
                <circle cx="19" cy="12" r="2" strokeWidth="2" />
                <circle cx="5" cy="12" r="2" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${isFullscreen ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
              title="Fullscreen"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          {(isCapturing || isSimulating) && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-xs font-mono font-semibold rounded-full flex items-center gap-2 border border-slate-700/60 shadow pointer-events-none">
                <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-indigo-400' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-slate-200">
                  {isSimulating ? 'SIMULATION REPLAY' : (sourceType === 'screen' ? 'SCREEN STREAM' : 'CAMERA LIVE')}
                </span>
              </div>
              
              <div className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-xs font-mono font-semibold rounded-full flex items-center gap-2 border border-slate-700/60 shadow pointer-events-none">
                <div className={`w-2 h-2 rounded-full ${faceDetected || isSimulating ? 'bg-emerald-400' : 'bg-red-500'}`} />
                <span className="text-slate-200">
                  {faceDetected || isSimulating ? `TRACKING (${faces?.length || 1})` : 'NO TARGET'}
                </span>
              </div>

              {isCapturing && onStopCapture && (
                <button
                  onClick={onStopCapture}
                  className="px-2.5 py-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  title="Stop Capture"
                >
                  <span className="w-1.5 h-1.5 rounded-sm bg-white" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Video Element */}
      <video 
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isMirrored && !isSimulating ? 'transform scale-x-[-1]' : 'transform-none'} ${isCapturing ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
      />

      {/* Target & Tactical HUD Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none ${(isCapturing || isSimulating) ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Inactive Standby Screen */}
      {!isCapturing && !isSimulating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-20">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-4 shadow-xl text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
            {sourceType === 'screen' ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            {sourceType === 'screen' 
              ? 'Screen Share Mode: Google Meet & Video Calls' 
              : 'Webcam Mode: Direct Biometric Feed'}
          </h3>

          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {sourceType === 'screen'
              ? 'Share a Google Meet tab, Zoom window, or desktop display. VeyLance detects and verifies participant faces in real-time directly from the video stream!'
              : 'Direct candidate camera inspection for identity assurance, liveness validation, and deepfake anomaly scoring.'}
          </p>

          <div className="flex items-center gap-3">
            {onStartCapture && (
              <button
                onClick={onStartCapture}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {sourceType === 'screen' ? 'Share Screen & Start' : 'Start Camera Session'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subtle bottom info bar */}
      <div className="absolute bottom-2 right-3 z-30 pointer-events-none text-[10px] font-mono text-slate-500 opacity-70">
        ORIENTATION: {isMirrored && !isSimulating ? 'MIRRORED (USER CAMERA)' : 'DIRECT UNMIRRORED'}
      </div>
    </div>
  );
};
