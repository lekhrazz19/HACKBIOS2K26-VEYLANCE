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
  
  const isCalibrating = s4Signal.reason.includes('Calibrating') || s4Signal.confidence < 0.35;

  // Sensible EAR coloring: Open eyes (>0.18) are green; dipped in blink is amber
  const earColor = ear > 0.18 ? 'text-emerald-400' : 'text-amber-400';
  
  // Blink rate gauge calculation
  const ratePercent = Math.min(100, Math.max(0, (blink_rate / 30) * 100));
  let rateColor = 'bg-emerald-500';
  if (!isCalibrating) {
    if (blink_rate < 8) rateColor = 'bg-red-500';
    else if (blink_rate > 24) rateColor = 'bg-orange-500';
  } else {
    rateColor = 'bg-blue-500';
  }

  // Deepfake Risk %
  const riskPercent = Math.round(s4Signal.score * 100);
  let riskColor = 'text-emerald-400';
  if (riskPercent > 65) riskColor = 'text-red-500';
  else if (riskPercent > 35) riskColor = 'text-orange-400';

  // IBI Label
  let cvLabel = "Natural variation";
  if (isCalibrating) cvLabel = "Gathering sample blinks...";
  else if (blink_cv < 0.25) cvLabel = "Too regular (Robotic)";
  else if (blink_cv > 1.4) cvLabel = "Highly irregular";

  // Duration Label
  let durLabel = "Normal duration";
  if (isCalibrating) durLabel = "Baseline learning...";
  else if (avg_duration_ms < 120) durLabel = "Too brief";
  else if (avg_duration_ms > 380) durLabel = "Too prolonged";

  return (
    <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 font-mono text-slate-300 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            S4 Blink Liveness
          </h3>
          {isCalibrating && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
              CALIBRATING
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase">Deepfake Risk</div>
          <div className={`text-xl font-bold ${isCalibrating ? 'text-blue-400' : riskColor}`}>
            {isCalibrating ? 'CALIBRATING' : `${riskPercent}%`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* EAR */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 uppercase">Eye Aspect Ratio</span>
            <span className="text-[10px] text-slate-400">
              {ear > 0.18 ? 'OPEN' : 'CLOSING'}
            </span>
          </div>
          <div className={`text-2xl font-bold ${earColor}`}>
            {ear.toFixed(3)}
          </div>
        </div>

        {/* Blink Rate Gauge */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase">Blink Frequency</span>
            <span className="text-base font-bold text-slate-100">
              {isCalibrating ? (
                <span className="text-xs text-blue-400">observing...</span>
              ) : (
                `${blink_rate.toFixed(1)} / min`
              )}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${rateColor}`} 
              style={{ width: `${isCalibrating ? 40 : ratePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 mt-1">
            <span>0</span>
            <span>10</span>
            <span>22 (human)</span>
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
