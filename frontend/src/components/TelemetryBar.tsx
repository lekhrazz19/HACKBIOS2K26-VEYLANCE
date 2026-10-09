import React from 'react';
import { TelemetryData } from '../types';

interface TelemetryBarProps {
  telemetry?: TelemetryData;
  faceCount?: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, faceCount }) => {
  const earColor = telemetry ? (telemetry.ear > 0.21 ? 'text-green-400' : 'text-red-400') : 'text-white';
  const blinkColor = telemetry ? (telemetry.blink_rate >= 12 && telemetry.blink_rate <= 20 ? 'text-green-400' : 'text-red-400') : 'text-white';

  const formatVal = (val?: number, toFixed: number = 3) => val !== undefined ? val.toFixed(toFixed) : '--';

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-row items-center justify-between w-full overflow-x-auto gap-4">
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider">EAR</span>
        <span className={`font-mono text-sm font-bold ${earColor}`}>{formatVal(telemetry?.ear)}</span>
      </div>
      <div className="w-px h-8 bg-slate-700 shrink-0" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider">Blink</span>
        <span className={`font-mono text-sm font-bold ${blinkColor}`}>{formatVal(telemetry?.blink_rate, 1)}/m</span>
      </div>
      <div className="w-px h-8 bg-slate-700 shrink-0" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider">LapVar</span>
        <span className="font-mono text-sm font-bold text-white">{formatVal(telemetry?.laplacian_var, 0)}</span>
      </div>
      <div className="w-px h-8 bg-slate-700 shrink-0" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider">IPD</span>
        <span className="font-mono text-sm font-bold text-white">{formatVal(telemetry?.ipd_drift)}</span>
      </div>
      <div className="w-px h-8 bg-slate-700 shrink-0" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider">Faces</span>
        <span className="font-mono text-sm font-bold text-white">{faceCount !== undefined ? faceCount : (telemetry?.faces_count !== undefined ? telemetry.faces_count : '--')}</span>
      </div>
    </div>
  );
};
