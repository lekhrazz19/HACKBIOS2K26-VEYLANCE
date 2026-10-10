import React from 'react';
import { TelemetryData } from '../types';

interface VideoMetadataStripProps {
  telemetry?: TelemetryData;
  faceCount?: number;
}

export const VideoMetadataStrip: React.FC<VideoMetadataStripProps> = ({ telemetry, faceCount }) => {
  const totalFaces = faceCount !== undefined 
    ? faceCount 
    : (telemetry?.faces_count !== undefined ? telemetry.faces_count : 0);

  const riskScore = telemetry ? telemetry.smoothed_risk : undefined;
  const isHighRisk = riskScore !== undefined && riskScore > 0.4;
  const isWarningRisk = riskScore !== undefined && riskScore > 0.2 && riskScore <= 0.4;

  const getRiskLabel = () => {
    if (riskScore === undefined) return '--';
    const pct = `${(riskScore * 100).toFixed(0)}%`;
    if (isHighRisk) return `${pct} (High)`;
    if (isWarningRisk) return `${pct} (Warn)`;
    return `${pct} (Low)`;
  };

  const getRiskColor = () => {
    if (riskScore === undefined) return 'text-zinc-400';
    if (isHighRisk) return 'text-rose-400';
    if (isWarningRisk) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#12151c]/90 rounded-md border border-[#222734] text-xs w-full">
      <div className="flex items-center gap-5">
        {/* Metric 1: Target Status */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans text-xs">Target:</span>
          <span className="font-mono text-sm text-zinc-100 font-semibold">
            {totalFaces > 0 ? `${totalFaces} Detected` : 'Standby'}
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#222734]" />

        {/* Metric 2: Eye Ratio */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans text-xs">EAR:</span>
          <span className={`font-mono text-sm font-semibold ${telemetry && telemetry.ear > 0.20 ? 'text-zinc-100' : 'text-amber-400'}`}>
            {telemetry?.ear !== undefined ? `${telemetry.ear.toFixed(2)} (${telemetry.ear > 0.18 ? 'Open' : 'Closing'})` : '--'}
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#222734]" />

        {/* Metric 3: Blink Rate */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans text-xs">Blink Cadence:</span>
          <span className="font-mono text-sm text-zinc-100 font-semibold">
            {telemetry?.blink_rate !== undefined ? `${telemetry.blink_rate.toFixed(1)}/min` : '--'}
          </span>
        </div>
      </div>

      {/* Metric 4: Aggregate Risk Level */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-sans text-xs">Risk:</span>
        <span className={`font-mono text-sm font-semibold ${getRiskColor()}`}>
          {getRiskLabel()}
        </span>
      </div>
    </div>
  );
};
