import React, { useState, useEffect } from 'react';
import { VideoSourceType } from '../hooks/useWebcam';
import { SimulationScenario } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface StatusBarProps {
  isConnected: boolean;
  isCapturing: boolean;
  isAudioActive?: boolean;
  sourceType?: VideoSourceType;
  onSelectSource?: (source: VideoSourceType) => void;
  onStart: () => void;
  onStop: () => void;
  audioRms?: number;
  s5Correlation?: number;
  isSimulating?: boolean;
  activeScenario?: SimulationScenario;
  onToggleSimulation?: () => void;
  onSelectScenario?: (sc: SimulationScenario) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  isConnected, 
  isCapturing, 
  isAudioActive, 
  sourceType = 'camera',
  onSelectSource,
  onStart, 
  onStop,
  audioRms,
  s5Correlation,
  isSimulating = false,
  activeScenario = 'baseline',
  onToggleSimulation,
  onSelectScenario
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });

  const scenarioLabels: Record<SimulationScenario, string> = {
    baseline: 'Normal Baseline (Clean)',
    occlusion_warp: '3-Finger Occlusion Warp (S2)',
    robotic_blink: 'Robotic Eye Blink Attack (S4)',
    seam_blur: 'Seam & Texture Blur (S1/S3)',
    av_desync: 'Audio-Visual Desync (S5)'
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-700/80 px-6 py-3.5 flex flex-col gap-3 sticky top-0 z-40 shadow-xl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Brand & Connection State */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 tracking-tight">
                  VeyLance
                </h1>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  SENTINEL AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Real-time Biometric & Deepfake Forensic Intelligence</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 hidden sm:block" />

          {/* Connection status pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : (isSimulating ? 'bg-indigo-400' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]')}`} />
            <span className="text-xs font-mono font-medium text-slate-300">
              {isSimulating ? 'SIMULATION MODE (ACTIVE)' : (isConnected ? 'ONLINE / WS READY' : 'STANDBY')}
            </span>
          </div>
        </div>

        {/* Live Audio Visualizer */}
        <div className="hidden md:flex items-center">
          <AudioVisualizer 
            audioRms={audioRms} 
            isAudioActive={isAudioActive || isSimulating} 
            s5Correlation={s5Correlation} 
          />
        </div>

        {/* Action Controls & Source Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Simulation Attack Toggle */}
          {onToggleSimulation && (
            <button
              onClick={onToggleSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isSimulating
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title="Toggle in-browser synthetic deepfake simulator for testing"
            >
              <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
              <span>SIMULATOR</span>
            </button>
          )}

          {/* Scenario Selector Dropdown (When Simulating) */}
          {isSimulating && onSelectScenario && (
            <select
              value={activeScenario}
              onChange={(e) => onSelectScenario(e.target.value as SimulationScenario)}
              className="bg-slate-950 border border-indigo-500/50 rounded-xl px-2.5 py-1.5 text-xs font-mono text-indigo-200 outline-none cursor-pointer focus:border-indigo-400"
            >
              {(Object.keys(scenarioLabels) as SimulationScenario[]).map(sc => (
                <option key={sc} value={sc}>
                  {scenarioLabels[sc]}
                </option>
              ))}
            </select>
          )}

          {/* Source Selector Segmented Control (Webcam vs Screen Share) */}
          {!isSimulating && (
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-700/80 flex items-center shadow-inner">
              <button
                onClick={() => onSelectSource && onSelectSource('camera')}
                disabled={isCapturing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sourceType === 'camera'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
                }`}
                title="Inspect webcam video directly"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Webcam</span>
              </button>

              <button
                onClick={() => onSelectSource && onSelectSource('screen')}
                disabled={isCapturing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sourceType === 'screen'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
                }`}
                title="Share Google Meet, Zoom or Browser tab"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Screen Share</span>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1 py-0.2 rounded font-mono">
                  MEET
                </span>
              </button>
            </div>
          )}

          {/* Primary Start / Stop Session Button */}
          {!isCapturing ? (
            <button 
              onClick={onStart}
              disabled={!isConnected && !isSimulating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>{sourceType === 'screen' ? 'Start Screen' : 'Start Camera'}</span>
            </button>
          ) : (
            <button 
              onClick={onStop}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Sub-header telemetry ribbon */}
      <div className="flex flex-wrap justify-between items-center bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800/80 gap-2">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">SYS_TIME:</span>
            <span className="text-slate-200 font-semibold">{timeString}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">INPUT_SOURCE:</span>
            <span className={isSimulating ? 'text-indigo-400 font-bold' : (sourceType === 'screen' ? 'text-indigo-400 font-bold' : 'text-blue-400 font-bold')}>
              {isSimulating ? `SIMULATION (${activeScenario.toUpperCase()})` : (sourceType === 'screen' ? 'SCREEN (GOOGLE MEET / ZOOM)' : 'LOCAL WEBCAM')}
            </span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">ENGINE_CADENCE:</span>
            <span className="text-emerald-400 font-bold">5 FPS (REAL-TIME)</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">AUDIO_SYNC:</span>
            <span className={isAudioActive || isSimulating ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {isAudioActive || isSimulating ? "ACTIVE (S5 FORENSICS)" : "STANDBY"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-slate-400">EPHEMERAL RAM BUFFERING (ZERO-DISK PRIVACY)</span>
        </div>
      </div>
    </header>
  );
};
