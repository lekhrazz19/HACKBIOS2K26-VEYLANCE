import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardState } from '../types';

interface UseWebSocketResult {
  isConnected: boolean;
  dashboardState: DashboardState | null;
  sendFrame: (frame: Blob | ArrayBuffer) => void;
  error: string | null;
}

export function useWebSocket(): UseWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl = '';
      if (import.meta.env.DEV) {
        wsUrl = 'ws://localhost:5173/ws';
      } else {
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0;
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        
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

  const sendFrame = useCallback((frame: Blob | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(frame);
    }
  }, []);

  return { isConnected, dashboardState, sendFrame, error };
}
