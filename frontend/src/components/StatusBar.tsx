import React, { useState, useEffect } from 'react';

interface StatusBarProps {
  isConnected: boolean;
  isCapturing: boolean;
  isAudioActive?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isConnected, isCapturing, isAudioActive, onStart, onStop }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="w-full bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            VeyLance
          </h1>
          <div className="h-6 w-px bg-slate-600 mx-2" />
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-slate-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div>
          {!isCapturing ? (
            <button 
              onClick={onStart}
              disabled={!isConnected}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Session
            </button>
          ) : (
            <button 
              onClick={onStop}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Session
            </button>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">SYS_TIME:</span>
            <span className="text-slate-300">{timeString}</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">VERSION:</span>
            <span className="text-slate-300">v0.1.0</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">FPS:</span>
            <span className="text-slate-300 text-green-400">TARGET: 5fps</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">AUDIO_SYNC:</span>
            <span className={isAudioActive ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {isAudioActive ? "ENABLED (S5)" : "STANDBY"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 opacity-70">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>FRAMES PROCESSED EPHEMERALLY IN RAM</span>
        </div>
      </div>
    </div>
  );
};
