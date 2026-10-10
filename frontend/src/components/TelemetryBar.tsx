import React, { useState } from 'react';
import { TelemetryData } from '../types';

interface TelemetryBarProps {
  telemetry?: TelemetryData;
  faceCount?: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, faceCount }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    if (isWarningRisk) return `${pct} (Moderate)`;
    return `${pct} (Low)`;
  };

  const getRiskColor = () => {
    if (riskScore === undefined) return 'text-zinc-400';
    if (isHighRisk) return 'text-rose-400';
    if (isWarningRisk) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        {/* Metric 1: Subject */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-sans">Subject:</span>
          <span className="font-mono text-zinc-200 font-medium">
            {totalFaces > 0 ? `${totalFaces} Detected` : 'Standby'}
          </span>
        </div>

        <div className="hidden sm:block h-3.5 w-px bg-zinc-800" />

        {/* Metric 2: Eye Ratio */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-sans">Eye Ratio:</span>
          <span className={`font-mono font-medium ${telemetry && telemetry.ear > 0.20 ? 'text-zinc-200' : 'text-amber-400'}`}>
            {telemetry?.ear !== undefined ? telemetry.ear.toFixed(2) : '--'}
          </span>
        </div>

        <div className="hidden sm:block h-3.5 w-px bg-zinc-800" />

        {/* Metric 3: Blink Rate */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-sans">Blink Rate:</span>
          <span className="font-mono text-zinc-200 font-medium">
            {telemetry?.blink_rate !== undefined ? `${telemetry.blink_rate.toFixed(0)}/min` : '--'}
          </span>
        </div>

        <div className="hidden sm:block h-3.5 w-px bg-zinc-800" />

        {/* Metric 4: Risk Level */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-sans">Risk Level:</span>
          <span className={`font-mono font-medium ${getRiskColor()}`}>
            {getRiskLabel()}
          </span>
        </div>
      </div>

      {/* Advanced Telemetry Popover / Inline Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowAdvanced(prev => !prev)}
          className="text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 text-[11px] font-sans transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Advanced Telemetry</span>
          <svg className={`w-3 h-3 text-zinc-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="absolute right-0 top-8 z-30 bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-xl w-64 flex flex-col gap-2 text-xs">
            <div className="text-[11px] font-medium text-zinc-400 border-b border-zinc-800 pb-1.5">
              Secondary Biometrics
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Laplacian Texture:</span>
              <span className="font-mono text-zinc-200">
                {telemetry?.laplacian_var !== undefined ? telemetry.laplacian_var.toFixed(0) : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">IPD Drift Stability:</span>
              <span className="font-mono text-zinc-200">
                {telemetry?.ipd_drift !== undefined ? telemetry.ipd_drift.toFixed(3) : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Blink Regularity (CV):</span>
              <span className="font-mono text-zinc-200">
                {telemetry?.blink_cv !== undefined ? telemetry.blink_cv.toFixed(2) : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Avg Blink Duration:</span>
              <span className="font-mono text-zinc-200">
                {telemetry?.avg_duration_ms !== undefined ? `${telemetry.avg_duration_ms.toFixed(0)} ms` : '--'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
