import React, { useEffect, useRef } from 'react';
import { FaceBox } from '../types';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  faceDetected: boolean;
  faces?: FaceBox[];
  trustScore?: number;
  riskLevel?: string;
}

export const WebcamView: React.FC<WebcamViewProps> = ({ 
  videoRef, 
  isCapturing, 
  faceDetected, 
  faces,
  trustScore = 100,
  riskLevel = 'HIGH_TRUST'
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
      // 1. Calculate a natural, well-proportioned square box framing the face
      // Given normalized coordinates face.x, face.y, face.w, face.h
      const cx = face.x + face.w / 2;
      const cy = face.y + face.h / 2;
      const squareSize = Math.max(face.w, face.h) * 1.25; // 25% padding for square framing
      
      const sqX = Math.max(0.01, cx - squareSize / 2);
      const sqY = Math.max(0.01, cy - squareSize / 2);
      const sqW = Math.min(0.98 - sqX, squareSize);
      const sqH = Math.min(0.98 - sqY, squareSize);
      
      // 2. Mirror coordinates horizontally in JavaScript so the canvas does NOT need CSS scale-x-[-1]
      // This ensures all text, labels, and badges render normally left-to-right!
      const mirroredX = (1.0 - (sqX + sqW)) * canvas.width;
      const drawY = sqY * canvas.height;
      const drawW = sqW * canvas.width;
      const drawH = sqH * canvas.height;
      
      if (face.is_primary) {
        // === PRIMARY TARGET (PERSON BEING ACTIVELY VERIFIED) ===
        const isAlert = riskLevel === 'ALERT';
        const isWarn = riskLevel === 'WARNING';
        const primaryColor = isAlert ? '#ef4444' : (isWarn ? '#f59e0b' : '#06b6d4');
        const fillColor = isAlert ? 'rgba(239, 68, 68, 0.08)' : (isWarn ? 'rgba(245, 158, 11, 0.08)' : 'rgba(6, 182, 212, 0.08)');
        
        // Semi-transparent target fill
        ctx.fillStyle = fillColor;
        ctx.fillRect(mirroredX, drawY, drawW, drawH);
        
        // Square perimeter
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(mirroredX, drawY, drawW, drawH);
        
        // High-contrast corner targeting brackets
        const cornerLen = Math.min(30, drawW * 0.22);
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(mirroredX, drawY + cornerLen);
        ctx.lineTo(mirroredX, drawY);
        ctx.lineTo(mirroredX + cornerLen, drawY);
        // Top-right
        ctx.moveTo(mirroredX + drawW - cornerLen, drawY);
        ctx.lineTo(mirroredX + drawW, drawY);
        ctx.lineTo(mirroredX + drawW, drawY + cornerLen);
        // Bottom-right
        ctx.moveTo(mirroredX + drawW, drawY + drawH - cornerLen);
        ctx.lineTo(mirroredX + drawW, drawY + drawH);
        ctx.lineTo(mirroredX + drawW - cornerLen, drawY + drawH);
        // Bottom-left
        ctx.moveTo(mirroredX + cornerLen, drawY + drawH);
        ctx.lineTo(mirroredX, drawY + drawH);
        ctx.lineTo(mirroredX, drawY + drawH - cornerLen);
        ctx.stroke();
        
        // Central targeting crosshair tick marks
        const centerCross = 10;
        const midX = mirroredX + drawW / 2;
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
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(mirroredX, Math.max(0, drawY - 26), tagWidth, 22);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(mirroredX, Math.max(0, drawY - 26), tagWidth, 22);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(tagText, mirroredX + 8, Math.max(0, drawY - 26) + 15);
        
        // Bottom Authenticity & Integrity Badge
        const integrityText = `AUTHENTICITY: ${Math.round(trustScore)}% [${riskLevel}]`;
        ctx.font = 'bold 11px monospace';
        const intWidth = ctx.measureText(integrityText).width + 16;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(mirroredX, drawY + drawH + 4, intWidth, 22);
        ctx.strokeStyle = primaryColor;
        ctx.strokeRect(mirroredX, drawY + drawH + 4, intWidth, 22);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(integrityText, mirroredX + 8, drawY + drawH + 19);

      } else {
        // === SECONDARY SUBJECTS (OTHER PEOPLE IN FRAME) ===
        // Muted amber / slate box to signal unverified secondary person
        const secColor = 'rgba(245, 158, 11, 0.7)';
        ctx.strokeStyle = secColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(mirroredX, drawY, drawW, drawH);
        ctx.setLineDash([]); // Reset
        
        // Label
        const secText = `SUBJECT #${face.id + 1} [UNVERIFIED]`;
        ctx.font = '10px monospace';
        const secWidth = ctx.measureText(secText).width + 12;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(mirroredX, Math.max(0, drawY - 20), secWidth, 18);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(secText, mirroredX + 6, Math.max(0, drawY - 20) + 13);
      }
    });
  }, [faces, isCapturing, trustScore, riskLevel]);

  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center">
      <video 
        ref={videoRef}
        className={`w-full h-full object-cover transform scale-x-[-1] ${isCapturing ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
      />
      {/* Target Canvas: Not CSS flipped so text and metrics render perfectly oriented */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none ${isCapturing && faces && faces.length > 0 ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {!isCapturing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-lg font-medium text-slate-400">Camera Feed Inactive</span>
          <span className="text-xs text-slate-600 mt-1">Start session to begin live identity assurance</span>
        </div>
      )}

      {isCapturing && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
          <div className="px-3 py-1 bg-slate-900/90 backdrop-blur text-xs font-mono font-semibold rounded-full flex items-center gap-2 border border-slate-700/60 shadow">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-200">LIVE FEED</span>
          </div>
          
          <div className="px-3 py-1 bg-slate-900/90 backdrop-blur text-xs font-mono font-semibold rounded-full flex items-center gap-2 border border-slate-700/60 shadow">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400' : 'bg-red-500'}`} />
            <span className="text-slate-200">
              {faceDetected ? `TARGET ACQUIRED (${faces?.length || 1})` : 'NO SUBJECT'}
            </span>
          </div>

          {faces && faces.length > 1 && (
            <div className="px-3 py-1 bg-amber-500/20 backdrop-blur text-xs font-mono font-bold rounded-full flex items-center gap-2 border border-amber-500/50 text-amber-300 shadow">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>MULTI-PERSON: {faces.length} DETECTED</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

