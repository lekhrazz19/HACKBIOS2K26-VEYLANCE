import React, { useEffect, useRef } from 'react';
import { FaceBox } from '../types';
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
  isMirrored = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!faces || faces.length === 0 || !isCapturing) return;
    
    faces.forEach((face) => {
      // 1. Calculate square framing
      const cx = face.x + face.w / 2;
      const cy = face.y + face.h / 2;
      const squareSize = Math.max(face.w, face.h) * 1.25;
      
      const sqX = Math.max(0.01, cx - squareSize / 2);
      const sqY = Math.max(0.01, cy - squareSize / 2);
      const sqW = Math.min(0.98 - sqX, squareSize);
      const sqH = Math.min(0.98 - sqY, squareSize);
      
      // 2. Coordinate mirroring:
      // If camera mode (mirrored), flip X: (1.0 - (sqX + sqW)) * canvas.width
      // If screen share mode (unmirrored), preserve natural X: sqX * canvas.width
      const drawX = isMirrored 
        ? (1.0 - (sqX + sqW)) * canvas.width 
        : sqX * canvas.width;
      const drawY = sqY * canvas.height;
      const drawW = sqW * canvas.width;
      const drawH = sqH * canvas.height;
      
      if (face.is_primary) {
        // === PRIMARY TARGET (ACTIVE VERIFICATION) ===
        const isAlert = riskLevel === 'ALERT';
        const isWarn = riskLevel === 'WARNING';
        const primaryColor = isAlert ? '#ef4444' : (isWarn ? '#f59e0b' : '#06b6d4');
        const fillColor = isAlert ? 'rgba(239, 68, 68, 0.10)' : (isWarn ? 'rgba(245, 158, 11, 0.10)' : 'rgba(6, 182, 212, 0.10)');
        
        // Semi-transparent target fill
        ctx.fillStyle = fillColor;
        ctx.fillRect(drawX, drawY, drawW, drawH);
        
        // Square perimeter
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        
        // High-contrast corner targeting brackets
        const cornerLen = Math.min(30, drawW * 0.22);
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(drawX, drawY + cornerLen);
        ctx.lineTo(drawX, drawY);
        ctx.lineTo(drawX + cornerLen, drawY);
        // Top-right
        ctx.moveTo(drawX + drawW - cornerLen, drawY);
        ctx.lineTo(drawX + drawW, drawY);
        ctx.lineTo(drawX + drawW, drawY + cornerLen);
        // Bottom-right
        ctx.moveTo(drawX + drawW, drawY + drawH - cornerLen);
        ctx.lineTo(drawX + drawW, drawY + drawH);
        ctx.lineTo(drawX + drawW - cornerLen, drawY + drawH);
        // Bottom-left
        ctx.moveTo(drawX + cornerLen, drawY + drawH);
        ctx.lineTo(drawX, drawY + drawH);
        ctx.lineTo(drawX, drawY + drawH - cornerLen);
        ctx.stroke();
        
        // Central targeting crosshair tick marks
        const centerCross = 10;
        const midX = drawX + drawW / 2;
        const midY = drawY + drawH / 2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX - centerCross, midY); ctx.lineTo(midX + centerCross, midY);
        ctx.moveTo(midX, midY - centerCross); ctx.lineTo(midX, midY + centerCross);
        ctx.stroke();

        // Top Header Badge
        const tagText = `ACTIVE TARGET: SUBJECT #${face.id + 1}`;
        ctx.font = 'bold 12px monospace';
        const tagWidth = ctx.measureText(tagText).width + 16;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(drawX, Math.max(0, drawY - 26), tagWidth, 22);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, Math.max(0, drawY - 26), tagWidth, 22);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(tagText, drawX + 8, Math.max(0, drawY - 26) + 15);
        
        // Bottom Authenticity & Integrity Badge
        const integrityText = `INTEGRITY: ${Math.round(trustScore)}% [${riskLevel}]`;
        ctx.font = 'bold 11px monospace';
        const intWidth = ctx.measureText(integrityText).width + 16;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(drawX, drawY + drawH + 4, intWidth, 22);
        ctx.strokeStyle = primaryColor;
        ctx.strokeRect(drawX, drawY + drawH + 4, intWidth, 22);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(integrityText, drawX + 8, drawY + drawH + 19);

      } else {
        // === SECONDARY SUBJECTS (OTHER PARTICIPANTS IN GOOGLE MEET / FRAME) ===
        const secColor = 'rgba(245, 158, 11, 0.75)';
        ctx.strokeStyle = secColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.setLineDash([]);
        
        // Label
        const secText = `SUBJECT #${face.id + 1} [UNVERIFIED]`;
        ctx.font = '10px monospace';
        const secWidth = ctx.measureText(secText).width + 12;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(drawX, Math.max(0, drawY - 20), secWidth, 18);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(secText, drawX + 6, Math.max(0, drawY - 20) + 13);
      }
    });
  }, [faces, isCapturing, trustScore, riskLevel, isMirrored]);

  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl flex flex-col justify-between group">
      {/* Top Source Switcher Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Source Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
          <button
            onClick={() => onSelectSource && onSelectSource('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceType === 'camera'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceType === 'screen'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Screen Share</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 uppercase font-mono">
              Meet / Zoom
            </span>
          </button>
        </div>

        {/* Live Badges (when capturing) */}
        {isCapturing && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-xs font-mono font-semibold rounded-full flex items-center gap-2 border border-slate-700/60 shadow pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-slate-200">
                {sourceType === 'screen' ? 'SCREEN STREAM' : 'CAMERA LIVE'}
              </span>
            </div>
            
            <div className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-xs font-mono font-semibold rounded-full flex items-center gap-2 border border-slate-700/60 shadow pointer-events-none">
              <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span className="text-slate-200">
                {faceDetected ? `TRACKING (${faces?.length || 1})` : 'NO FACE DETECTED'}
              </span>
            </div>

            {faces && faces.length > 1 && (
              <div className="px-3 py-1 bg-amber-500/20 backdrop-blur-md text-xs font-mono font-bold rounded-full flex items-center gap-2 border border-amber-500/50 text-amber-300 shadow pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>MEET: {faces.length} PARTICIPANTS</span>
              </div>
            )}

            {onStopCapture && (
              <button
                onClick={onStopCapture}
                className="px-2.5 py-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition-all pointer-events-auto"
                title="Stop Capture"
              >
                <span className="w-1.5 h-1.5 rounded-sm bg-white" />
                <span>Stop</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Video Element */}
      <video 
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isMirrored ? 'transform scale-x-[-1]' : 'transform-none'} ${isCapturing ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
      />

      {/* Target Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none ${isCapturing && faces && faces.length > 0 ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Inactive Standby Screen */}
      {!isCapturing && (
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
              ? 'Share a Google Meet tab, Zoom window, or desktop display. VeyLance will detect and verify participant faces in real-time directly from the shared screen!'
              : 'Direct user camera inspection for identity assurance, liveness validation, and deepfake anomaly scoring.'}
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
      <div className="absolute bottom-2 right-3 z-30 pointer-events-none text-[10px] font-mono text-slate-500 opacity-60">
        ORIENTATION: {isMirrored ? 'MIRRORED (USER)' : 'DIRECT UNMIRRORED (SCREEN)'}
      </div>
    </div>
  );
};
