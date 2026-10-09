import React from 'react';
import { TelemetryData, SignalResult } from '../types';

interface Props {
  telemetry?: TelemetryData;
  s4Signal?: SignalResult;
}

export const BlinkRatePanel: React.FC<Props> = ({ telemetry, s4Signal }) => {
  if (!telemetry || !s4Signal) {
    return (
      <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 animate-pulse h-64 flex items-center justify-center">
        <span className="text-slate-500 font-mono">WAITING FOR S4 TELEMETRY...</span>
      </div>
    );
  }

  const { ear, blink_rate, blink_cv, avg_duration_ms } = telemetry;
  
  // EAR coloring
  const earColor = ear > 0.21 ? 'text-green-400' : 'text-red-500';
  
  // Blink rate gauge calculation
  // Let's cap max gauge at 30
  const ratePercent = Math.min(100, Math.max(0, (blink_rate / 30) * 100));
  let rateColor = 'bg-green-500';
  if (blink_rate < 12) rateColor = 'bg-red-500';
  else if (blink_rate > 20) rateColor = 'bg-orange-500';

  // Deepfake Risk %
  const riskPercent = Math.round(s4Signal.score * 100);
  let riskColor = 'text-green-400';
  if (riskPercent > 65) riskColor = 'text-red-500';
  else if (riskPercent > 35) riskColor = 'text-orange-400';

  // IBI Label
  let cvLabel = "Natural variation";
  if (blink_cv < 0.3) cvLabel = "Too regular (Robotic)";
  else if (blink_cv > 1.3) cvLabel = "Highly irregular";

  // Duration Label
  let durLabel = "Normal";
  if (avg_duration_ms < 150) durLabel = "Too brief";
  else if (avg_duration_ms > 350) durLabel = "Too prolonged";

  return (
    <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 font-mono text-slate-300 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          S4 Blink Analytics
        </h3>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase">Deepfake Risk</div>
          <div className={`text-2xl font-bold ${riskColor}`}>{riskPercent}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* EAR */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-500 uppercase mb-1">Current EAR</div>
          <div className={`text-3xl font-bold ${earColor}`}>
            {ear.toFixed(3)}
          </div>
        </div>

        {/* Blink Rate Gauge */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <div className="text-xs text-slate-500 uppercase">Blink Rate</div>
            <div className="text-xl font-bold text-slate-100">{blink_rate.toFixed(1)} <span className="text-sm text-slate-500">/ min</span></div>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${rateColor}`} 
              style={{ width: `${ratePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0</span>
            <span>12 (min)</span>
            <span>20 (max)</span>
            <span>30+</span>
          </div>
        </div>

        {/* IBI Regularity */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-500 uppercase mb-1">IBI Regularity (CV)</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-blue-400">{blink_cv.toFixed(2)}</div>
          </div>
          <div className="text-xs text-slate-400 mt-1">{cvLabel}</div>
        </div>

        {/* Avg Duration */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-500 uppercase mb-1">Avg Duration</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-purple-400">{avg_duration_ms.toFixed(0)}<span className="text-sm">ms</span></div>
          </div>
          <div className="text-xs text-slate-400 mt-1">{durLabel}</div>
        </div>
      </div>
    </div>
  );
};
