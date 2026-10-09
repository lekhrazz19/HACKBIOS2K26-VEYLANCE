import React from 'react';
import { TelemetryData } from '../types';

interface TelemetryBarProps {
  telemetry?: TelemetryData;
  faceCount?: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, faceCount }) => {
  const earColor = telemetry 
    ? (telemetry.ear > 0.20 ? 'text-emerald-400' : 'text-amber-400') 
    : 'text-slate-400';
    
  const blinkColor = telemetry 
    ? (telemetry.blink_rate >= 10 && telemetry.blink_rate <= 26 ? 'text-emerald-400' : 'text-amber-400') 
    : 'text-slate-400';

  const formatVal = (val?: number, toFixed: number = 3) => val !== undefined ? val.toFixed(toFixed) : '--';

  const totalFaces = faceCount !== undefined 
    ? faceCount 
    : (telemetry?.faces_count !== undefined ? telemetry.faces_count : 0);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 flex flex-row items-center justify-between w-full overflow-x-auto gap-3 sm:gap-6 shadow-md text-xs">
      {/* Target Subject Count */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Targets</span>
          <span className="font-mono text-sm font-bold text-white">
            {totalFaces > 0 ? `${totalFaces} Detected` : 'Standby'}
          </span>
        </div>
      </div>

      <div className="w-px h-7 bg-slate-800 shrink-0" />

      {/* EAR Eye Aspect Ratio */}
      <div className="flex flex-col shrink-0">
        <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">EAR (Blink)</span>
        <span className={`font-mono text-sm font-bold ${earColor}`}>{formatVal(telemetry?.ear)}</span>
      </div>

      <div className="w-px h-7 bg-slate-800 shrink-0" />

      {/* Blink Cadence */}
      <div className="flex flex-col shrink-0">
        <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Blink Frequency</span>
        <span className={`font-mono text-sm font-bold ${blinkColor}`}>
          {formatVal(telemetry?.blink_rate, 1)} / min
        </span>
      </div>

      <div className="w-px h-7 bg-slate-800 shrink-0" />

      {/* Laplacian Texture Variance */}
      <div className="flex flex-col shrink-0">
        <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Skin Texture (LapVar)</span>
        <span className="font-mono text-sm font-bold text-slate-100">
          {formatVal(telemetry?.laplacian_var, 0)}
        </span>
      </div>

      <div className="w-px h-7 bg-slate-800 shrink-0" />

      {/* IPD Drift */}
      <div className="flex flex-col shrink-0">
        <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">IPD Stability</span>
        <span className="font-mono text-sm font-bold text-slate-100">{formatVal(telemetry?.ipd_drift, 3)}</span>
      </div>

      <div className="w-px h-7 bg-slate-800 shrink-0" />

      {/* Instant vs Smoothed Risk */}
      <div className="flex flex-col shrink-0">
        <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Fused Risk Index</span>
        <span className={`font-mono text-sm font-bold ${telemetry && telemetry.smoothed_risk > 0.4 ? 'text-red-400' : 'text-emerald-400'}`}>
          {telemetry ? `${(telemetry.smoothed_risk * 100).toFixed(0)}%` : '--'}
        </span>
      </div>
    </div>
  );
};
