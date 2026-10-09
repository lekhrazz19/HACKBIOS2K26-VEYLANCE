import React, { useEffect, useRef } from 'react';
import { FaceBox } from '../types';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  faceDetected: boolean;
  faces?: FaceBox[];
}

export const WebcamView: React.FC<WebcamViewProps> = ({ videoRef, isCapturing, faceDetected, faces }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!faces) return;
    
    faces.forEach(face => {
      const x = face.x * canvas.width;
      const y = face.y * canvas.height;
      const w = face.w * canvas.width;
      const h = face.h * canvas.height;
      
      if (face.is_primary) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        const len = 20;
        ctx.beginPath();
        ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
        ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
        ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
        ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
        ctx.stroke();
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = '12px sans-serif';
        ctx.fillText('ANALYZING', x, y - 5);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.fillText(`FACE #${face.id}`, x, y - 5);
      }
    });
  }, [faces]);

  return (
    <div className="relative w-full aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl flex items-center justify-center">
      <video 
        ref={videoRef}
        className={`w-full h-full object-cover transform scale-x-[-1] ${isCapturing ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none transform scale-x-[-1] ${isCapturing && faces ? 'animate-pulse opacity-100' : 'opacity-0'}`}
      />
      
      {!isCapturing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-lg font-medium">Camera Offline</span>
        </div>
      )}

      {isCapturing && (
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="px-3 py-1 bg-slate-900/80 backdrop-blur text-xs font-semibold rounded-full flex items-center gap-2 border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-slate-200">Camera Active</span>
          </div>
          
          <div className="px-3 py-1 bg-slate-900/80 backdrop-blur text-xs font-semibold rounded-full flex items-center gap-2 border border-slate-700/50">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-slate-200">{faceDetected ? 'Face Detected' : 'No Face'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
