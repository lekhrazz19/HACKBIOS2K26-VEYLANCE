import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardState } from '../types';

interface UseWebSocketResult {
  isConnected: boolean;
  dashboardState: DashboardState | null;
  sendFrame: (frame: Blob | ArrayBuffer) => void;
  setAudioGetter: (fn: () => number | null) => void;
  error: string | null;
  sessionKey: string;
}

export function useWebSocket(): UseWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(() => Date.now().toString());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const audioRmsGetterRef = useRef<(() => number | null) | null>(null);

  const setAudioGetter = useCallback((fn: () => number | null) => {
    audioRmsGetterRef.current = fn;
  }, []);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl = '';
      if (import.meta.env.VITE_WS_URL) {
        wsUrl = import.meta.env.VITE_WS_URL;
      } else if (import.meta.env.DEV) {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      } else {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0;
        setSessionKey(Date.now().toString());
        setDashboardState(null);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        setDashboardState(null);
        
        // Exponential backoff reconnect
        const backoff = [1000, 2000, 4000, 10000];
        const timeout = backoff[Math.min(retryCountRef.current, backoff.length - 1)];
        retryCountRef.current += 1;
        
        reconnectTimeoutRef.current = window.setTimeout(connect, timeout);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setError('Connection error');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setDashboardState(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendFrame = useCallback(async (frame: Blob | ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    const getter = audioRmsGetterRef.current;
    const rms = getter ? getter() : null;
    
    if (rms !== null) {
      // Send JSON envelope with audio
      const blob = frame instanceof Blob ? frame : new Blob([frame]);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        wsRef.current?.send(JSON.stringify({ frame: base64, audio_rms: rms }));
      };
      reader.readAsDataURL(blob);
    } else {
      // Send raw bytes (no audio)
      wsRef.current.send(frame);
    }
  }, []);

  return { isConnected, dashboardState, sendFrame, setAudioGetter, error, sessionKey };
}
