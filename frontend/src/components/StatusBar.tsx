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
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });

  const scenarioLabels: Record<SimulationScenario, string> = {
    baseline: 'Normal Baseline (Clean)',
    occlusion_warp: '3-Finger Occlusion Warp (S2)',
    robotic_blink: 'Robotic Eye Blink Attack (S4)',
    seam_blur: 'Seam & Texture Blur (S1/S3)',
    av_desync: 'Audio-Visual Desync (S5)'
  };

  const getStatusIndicator = () => {
    if (isSimulating) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-zinc-300 font-medium">Simulation</span>
        </div>
      );
    }
    if (isConnected) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-300 font-medium">Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        <span className="text-zinc-400 font-medium">Standby</span>
      </div>
    );
  };

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-800/80 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      {/* Left: Brandmark "VeyLance Sentinel" + Status indicator dot */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">
            VeyLance
          </span>
          <span className="text-[10px] font-medium bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/60">
            Sentinel
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800" />

        {getStatusIndicator()}
      </div>

      {/* Center: Clean input switch pill [Webcam | Screen Share] + active session button */}
      <div className="flex items-center gap-2">
        {/* Source Selector */}
        {!isSimulating && (
          <div className="bg-zinc-900 p-0.5 rounded border border-zinc-800 flex items-center">
            <button
              onClick={() => onSelectSource && onSelectSource('camera')}
              disabled={isCapturing}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                sourceType === 'camera'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 disabled:opacity-40'
              }`}
            >
              Webcam
            </button>

            <button
              onClick={() => onSelectSource && onSelectSource('screen')}
              disabled={isCapturing}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                sourceType === 'screen'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 disabled:opacity-40'
              }`}
            >
              Screen Share
            </button>
          </div>
        )}

        {/* Primary Action Button */}
        {!isCapturing ? (
          <button 
            onClick={onStart}
            disabled={!isConnected && !isSimulating}
            className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-xs rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            {sourceType === 'screen' ? 'Start Screen' : 'Start Camera'}
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded transition-colors cursor-pointer"
          >
            Stop
          </button>
        )}

        {/* Simulator Toggle & Selector */}
        {onToggleSimulation && (
          <button
            onClick={onToggleSimulation}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors border cursor-pointer ${
              isSimulating
                ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-zinc-800'
            }`}
            title="Toggle simulator"
          >
            Sim
          </button>
        )}

        {isSimulating && onSelectScenario && (
          <select
            value={activeScenario}
            onChange={(e) => onSelectScenario(e.target.value as SimulationScenario)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs outline-none cursor-pointer"
          >
            {(Object.keys(scenarioLabels) as SimulationScenario[]).map(sc => (
              <option key={sc} value={sc}>
                {scenarioLabels[sc]}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right: Audio Sync badge (condensed) + live time readout */}
      <div className="flex items-center gap-3">
        <AudioVisualizer 
          audioRms={audioRms} 
          isAudioActive={isAudioActive || isSimulating} 
          s5Correlation={s5Correlation} 
        />

        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-xs font-mono text-zinc-400">
          <span>{timeString}</span>
        </div>
      </div>
    </header>
  );
};
