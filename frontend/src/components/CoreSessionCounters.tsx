import React from 'react';

interface CoreSessionCountersProps {
  framesAnalyzed: number;
  alertsTriggered: number;
  sessionDurationSec: number;
}

export const CoreSessionCounters: React.FC<CoreSessionCountersProps> = ({
  framesAnalyzed,
  alertsTriggered,
  sessionDurationSec,
}) => {
  return (
    <div className="h-full flex flex-col justify-between p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg w-full overflow-hidden">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-1 shrink-0">
        <span className="text-xs font-medium text-zinc-300">Session Counters</span>
        <span className="text-[10px] font-mono text-zinc-500">Live Cadence</span>
      </div>

      <div className="flex-1 flex flex-col justify-around py-1 min-h-0">
        {/* Row 1: Frames Ingested */}
        <div className="shrink-0 py-1.5 flex items-center justify-between border-b border-zinc-800/40">
          <div>
            <span className="text-[11px] text-zinc-400 font-sans block">Frames Ingested</span>
            <span className="text-[10px] text-zinc-500 font-sans block -mt-0.5">Continuous verification</span>
          </div>
          <span className="font-mono text-xl font-bold text-zinc-100">{framesAnalyzed}</span>
        </div>

        {/* Row 2: Biometric Anomalies */}
        <div className="shrink-0 py-1.5 flex items-center justify-between border-b border-zinc-800/40">
          <div>
            <span className="text-[11px] text-zinc-400 font-sans block">Biometric Anomalies</span>
            <span className="text-[10px] text-zinc-500 font-sans block -mt-0.5">State transitions flagged</span>
          </div>
          <span className={`font-mono text-xl font-bold ${alertsTriggered > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {alertsTriggered}
          </span>
        </div>

        {/* Row 3: Active Duration */}
        <div className="shrink-0 py-1.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-sans block">Active Duration</span>
            <span className="text-[10px] text-zinc-500 font-sans block -mt-0.5">Session runtime</span>
          </div>
          <span className="font-mono text-xl font-bold text-zinc-100">{sessionDurationSec}s</span>
        </div>
      </div>
    </div>
  );
};
