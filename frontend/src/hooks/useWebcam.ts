import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebcamResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  error: string | null;
  hasPermission: boolean;
}

export function useWebcam(onFrame: (blob: Blob) => void): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    return () => {
      stopCapture();
    };
  }, []);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
        setError(null);
        
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 640;
          canvas.height = 480;
          
          captureIntervalRef.current = window.setInterval(() => {
            if (videoRef.current && canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                  if (blob) {
                    onFrame(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }
          }, 200); // 5 FPS
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to access webcam');
      setHasPermission(false);
    }
  };

  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current !== null) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  }, []);

  return { videoRef, isCapturing, startCapture, stopCapture, error, hasPermission };
}
