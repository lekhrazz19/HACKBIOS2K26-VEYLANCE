import React from 'react';
import { TelemetryData, SignalResult } from '../types';

interface Props {
  telemetry?: TelemetryData;
  s4Signal?: SignalResult;
}

export const BlinkRatePanel: React.FC<Props> = ({ telemetry, s4Signal }) => {
  if (!telemetry || !s4Signal) {
    return (
      <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80 h-36 flex items-center justify-center text-xs text-zinc-500 font-sans">
        Awaiting eye telemetry...
      </div>
    );
  }

  const { ear, blink_rate, blink_cv, avg_duration_ms } = telemetry;
  const isCalibrating = s4Signal.reason.includes('Calibrating') || s4Signal.confidence < 0.35;

  // IBI status
  let intervalStatus = "Natural";
  if (isCalibrating) intervalStatus = "Calibrating";
  else if (blink_cv < 0.25) intervalStatus = "Robotic / Too regular";
  else if (blink_cv > 1.4) intervalStatus = "Irregular";

  // Duration status
  let durationStatus = "Normal";
  if (isCalibrating) durationStatus = "Calibrating";
  else if (avg_duration_ms < 120) durationStatus = "Too brief";
  else if (avg_duration_ms > 380) durationStatus = "Too prolonged";

  const isRiskAlert = s4Signal.score > 0.65;
  const isRiskWarn = s4Signal.score > 0.35 && s4Signal.score <= 0.65;

  const getRiskColor = () => {
    if (isRiskAlert) return 'text-rose-400';
    if (isRiskWarn) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80 text-zinc-300 flex flex-col gap-2.5">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <span className="text-xs font-medium text-zinc-300">
          Eye Blink Dynamics (S4)
        </span>
        <span className={`text-xs font-mono font-medium ${isCalibrating ? 'text-zinc-400' : getRiskColor()}`}>
          {isCalibrating ? 'Calibrating' : `${Math.round(s4Signal.score * 100)}% Risk`}
        </span>
      </div>

      {/* Structured, Tabular Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-500 font-sans">Eye Aspect Ratio:</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-zinc-100 font-medium">{ear.toFixed(2)}</span>
            <span className="text-[10px] text-zinc-500 font-sans">{ear > 0.18 ? 'Open' : 'Closing'}</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-500 font-sans">Blink Frequency:</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-zinc-100 font-medium">
              {isCalibrating ? '--' : `${blink_rate.toFixed(0)}/min`}
            </span>
            <span className="text-[10px] text-zinc-500 font-sans">
              {blink_rate >= 10 && blink_rate <= 26 ? 'Normal' : 'Outlier'}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-500 font-sans">Duration:</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-zinc-100 font-medium">
              {avg_duration_ms.toFixed(0)} ms
            </span>
            <span className={`text-[10px] font-sans ${durationStatus === 'Normal' ? 'text-zinc-500' : 'text-amber-400'}`}>
              {durationStatus}
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/80 p-2.5 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-500 font-sans">Interval Regularity:</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-zinc-100 font-medium">
              {blink_cv.toFixed(2)}
            </span>
            <span className={`text-[10px] font-sans ${intervalStatus === 'Natural' ? 'text-zinc-500' : 'text-amber-400'}`}>
              {intervalStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
