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
  onStartCapture, 
  isMirrored = true,
  isSimulating = false,
  activeScenario = 'baseline'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Main Clean Face Canvas Renderer
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

    // Synthetic Avatar Renderer (when simulating and no webcam)
    if (isSimulating && !isCapturing) {
      const time = Date.now() * 0.003;
      const cx = w * 0.5 + Math.sin(time * 0.6) * 12;
      const cy = h * 0.46 + Math.cos(time * 0.4) * 8;
      const faceR = 125;

      // Clean neutral avatar backdrop
      ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, faceR * 0.85, faceR * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Facial contour line
      ctx.strokeStyle = riskLevel === 'ALERT' ? 'rgba(244, 63, 94, 0.6)' : 'rgba(113, 113, 122, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, faceR * 0.85, faceR * 1.15, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eyes
      const eyeOffset = 46;
      const eyeY = cy - 22;
      const isBlinking = activeScenario === 'robotic_blink' ? false : Math.sin(time * 3) > 0.85;

      ctx.fillStyle = riskLevel === 'ALERT' ? '#f43f5e' : '#a1a1aa';
      ctx.beginPath();
      ctx.ellipse(cx - eyeOffset, eyeY, 12, isBlinking ? 2 : 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx + eyeOffset, eyeY, 12, isBlinking ? 2 : 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      const mouthY = cy + 58;
      const mouthWidth = activeScenario === 'av_desync' ? 30 + Math.sin(time * 8) * 8 : 24;
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, mouthWidth, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Occlusion Hand Simulation
      if (activeScenario === 'occlusion_warp') {
        const handX = cx + Math.sin(time * 2) * 20;
        const handY = cy + 20 + Math.cos(time * 2) * 15;
        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        for (let f = -1; f <= 1; f++) {
          ctx.beginPath();
          ctx.roundRect(handX + f * 18 - 8, handY - 45, 16, 65, 4);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#f43f5e';
        ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Occlusion shear detected', handX - 70, handY + 45);
      }
    }

    // Clean Rectangular Target Outlines
    const effectiveFaces = faces && faces.length > 0 
      ? faces 
      : (isSimulating ? [{ id: 0, x: 0.28, y: 0.18, w: 0.44, h: 0.58, is_primary: true }] : []);

    effectiveFaces.forEach((face) => {
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
        // Primary Subject: Clean 1px Box
        const isAlert = riskLevel === 'ALERT';
        const isWarn = riskLevel === 'WARNING';
        const strokeColor = isAlert ? '#f43f5e' : (isWarn ? '#f59e0b' : '#10b981');
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        
        // Minimal Top Badge
        const tagText = isSimulating 
          ? `Subject [Simulated]` 
          : `Subject #${face.id + 1} (${Math.round(trustScore)}%)`;
        ctx.font = '500 11px "JetBrains Mono", monospace';
        const tagWidth = ctx.measureText(tagText).width + 12;
        
        ctx.fillStyle = '#18181b';
        ctx.fillRect(drawX, Math.max(0, drawY - 20), tagWidth, 20);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, Math.max(0, drawY - 20), tagWidth, 20);
        
        ctx.fillStyle = strokeColor;
        ctx.fillText(tagText, drawX + 6, Math.max(0, drawY - 20) + 14);

      } else {
        // Secondary Subject: Low-contrast dashed box
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(drawX, drawY, drawW, drawH);
        ctx.setLineDash([]);
        
        const secText = `Subject #${face.id + 1}`;
        ctx.font = '500 10px "JetBrains Mono", monospace';
        const secWidth = ctx.measureText(secText).width + 8;
        
        ctx.fillStyle = '#18181b';
        ctx.fillRect(drawX, Math.max(0, drawY - 18), secWidth, 18);
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText(secText, drawX + 4, Math.max(0, drawY - 18) + 12);
      }
    });
  }, [faces, isCapturing, isSimulating, activeScenario, trustScore, riskLevel, isMirrored]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-[#0c0e12] rounded-lg overflow-hidden border border-[#222734] flex flex-col justify-between shadow-xs"
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Stream Status Dot */}
        {(isCapturing || isSimulating) && (
          <div className="flex items-center gap-2 bg-[#12151c]/90 border border-[#222734] px-2.5 py-1 rounded-md text-xs font-sans">
            <span className={`w-1.5 h-1.5 rounded-full ${faceDetected || isSimulating ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="text-zinc-200 font-medium">
              {faceDetected || isSimulating ? `Tracking (${faces?.length || 1})` : 'Searching'}
            </span>
          </div>
        )}

        <div className="ml-auto pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded bg-[#12151c]/90 border border-[#222734] hover:border-[#32394c] text-xs transition-colors cursor-pointer ${isFullscreen ? 'text-zinc-100' : 'text-slate-400 hover:text-zinc-200'}`}
            title={isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Video Element */}
      <video 
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-200 ${isMirrored && !isSimulating ? 'transform scale-x-[-1]' : 'transform-none'} ${isCapturing ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
      />

      {/* Clean Target Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none ${(isCapturing || isSimulating) ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Restrained Standby Screen */}
      {!isCapturing && !isSimulating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 z-20">
          <div className="max-w-xs flex flex-col items-center">
            <h3 className="text-sm font-medium text-zinc-200 mb-1">
              Select video source to start inspection
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              {sourceType === 'screen' ? 'Capture screen stream or application window' : 'Capture local webcam video feed'}
            </p>

            {onStartCapture && (
              <button
                onClick={onStartCapture}
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                {sourceType === 'screen' ? 'Start Screen Inspection' : 'Start Camera Inspection'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
