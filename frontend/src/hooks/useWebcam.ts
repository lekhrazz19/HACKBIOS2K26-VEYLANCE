import { useState, useEffect, useRef, useCallback } from 'react';

export type VideoSourceType = 'camera' | 'screen';

interface UseWebcamResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
  sourceType: VideoSourceType;
  setSourceType: (type: VideoSourceType) => void;
  isMirrored: boolean;
  startCapture: (source?: VideoSourceType) => Promise<void>;
  stopCapture: () => void;
  switchSource: (newSource: VideoSourceType) => Promise<void>;
  error: string | null;
  hasPermission: boolean;
}

export function useWebcam(onFrame: (blob: Blob) => void): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  
  const [sourceType, setSourceType] = useState<VideoSourceType>('camera');
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Camera is mirrored for natural user perspective; Screen share (Google Meet) must NOT be mirrored
  const isMirrored = sourceType === 'camera';

  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    return () => {
      stopCapture();
    };
  }, []);

  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current !== null) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.onended = null;
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  }, []);

  const startCapture = useCallback(async (selectedSource?: VideoSourceType) => {
    const activeSource = selectedSource || sourceType;
    if (selectedSource && selectedSource !== sourceType) {
      setSourceType(selectedSource);
    }

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (captureIntervalRef.current !== null) {
        window.clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }

      let stream: MediaStream;

      if (!navigator?.mediaDevices) {
        throw new Error(
          'Media devices unavailable. Ensure you open via http://localhost:8000 or http://localhost:5173 (not a remote IP or 0.0.0.0) as browsers restrict camera/screen sharing to localhost or HTTPS.'
        );
      }

      if (activeSource === 'screen') {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error(
            'Screen sharing (getDisplayMedia) is not supported in this browser or disabled on insecure origins. Please use http://localhost:8000.'
          );
        }
        // Screen share mode: allows user to select Google Meet, Zoom, browser tab or window
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        });
      } else {
        if (!navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Webcam (getUserMedia) is not supported in this browser or disabled on insecure origins. Please use http://localhost:8000.'
          );
        }
        // Standard Web camera mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
      }

      // Handle user stopping screen share via native browser UI bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopCapture();
        };
      }

      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
        
        const canvas = canvasRef.current;
        if (canvas) {
          captureIntervalRef.current = window.setInterval(() => {
            const vid = videoRef.current;
            if (!vid || vid.readyState < 2) return;

            const vWidth = vid.videoWidth || 640;
            const vHeight = vid.videoHeight || 480;
            
            // Proportionally scale to max 640px dimension for fast real-time websocket inference
            const maxDim = 640;
            const scale = Math.min(maxDim / vWidth, maxDim / vHeight, 1.0);
            const targetW = Math.max(320, Math.round(vWidth * scale));
            const targetH = Math.max(240, Math.round(vHeight * scale));

            canvas.width = targetW;
            canvas.height = targetH;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(vid, 0, 0, targetW, targetH);
              canvas.toBlob((blob) => {
                if (blob) {
                  onFrame(blob);
                }
              }, 'image/jpeg', 0.55);
            }
          }, 200); // 5 FPS target cadence
        }
      }
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        setError('Screen sharing or camera permission was cancelled or denied');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to access video source');
      }
      setIsCapturing(false);
    }
  }, [sourceType, onFrame, stopCapture]);

  const switchSource = useCallback(async (newSource: VideoSourceType) => {
    setSourceType(newSource);
    if (isCapturing) {
      stopCapture();
      // Short delay before opening new media picker
      setTimeout(() => {
        startCapture(newSource);
      }, 100);
    }
  }, [isCapturing, stopCapture, startCapture]);

  return {
    videoRef,
    isCapturing,
    sourceType,
    setSourceType,
    isMirrored,
    startCapture,
    stopCapture,
    switchSource,
    error,
    hasPermission
  };
}
