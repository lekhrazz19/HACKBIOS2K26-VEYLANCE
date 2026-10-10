import React, { useState } from 'react';
import { SignalResult, SignalName, TelemetryData } from '../types';

interface SignalCardsProps {
  signals: SignalResult[];
  telemetry?: TelemetryData;
}

interface SignalDefinition {
  signal: SignalName;
  title: string;
  attackVector: string;
  method: string;
}

const CANONICAL_SIGNALS: SignalDefinition[] = [
  {
    signal: 'S1',
    title: 'Seam & Boundary Differential',
    attackVector: 'Face-swapping seams & Poisson blending discontinuities',
    method: 'Calculates high-order color & gradient differential along outer convex hull'
  },
  {
    signal: 'S2',
    title: 'Occlusion & 3-Finger Warp',
    attackVector: 'Hand-face interactions & temporal mesh jitter',
    method: 'Measures affine eye-nose triangle area strain & landmark displacement'
  },
  {
    signal: 'S3',
    title: 'Skin Texture & High-Freq FFT',
    attackVector: 'Generative smoothing & synthetic plastic skin artifacts',
    method: 'Laplacian variance & Local Binary Patterns (LBP) micro-frequency distribution'
  },
  {
    signal: 'S4',
    title: 'Blink Dynamics & Cadence',
    attackVector: 'Robotic periodicity, suppressed blinks, or unnatural eye-closure dynamics',
    method: 'Adaptive Eye Aspect Ratio (EAR) calibration & Inter-Blink Interval (IBI) CV'
  },
  {
    signal: 'S5',
    title: 'Audio-Visual Lip Sync',
    attackVector: 'Voice cloning, dubbing lag, and generative lip desync',
    method: 'Cross-correlation between acoustic RMS energy and perioral vertical opening'
  },
];

export const SignalCards: React.FC<SignalCardsProps> = ({ signals }) => {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  const toggleExpand = (sig: string) => {
    setExpandedSignal(prev => prev === sig ? null : sig);
  };

  // Helper to extract clean concise primary metric from backend reason string
  const getPrimaryMetric = (sigName: SignalName, signal?: SignalResult) => {
    if (!signal) return '--';
    const raw = signal.reason || '';
    if (sigName === 'S1') {
      const match = raw.match(/LapVar:\s*([0-9.]+)/i);
      return match ? `${match[1]} LapVar` : `${(signal.score * 100).toFixed(0)}% Risk`;
    }
    if (sigName === 'S2') {
      const match = raw.match(/Drift:\s*([0-9.]+)/i);
      return match ? `${match[1]} Drift` : `${(signal.score * 100).toFixed(0)}% Risk`;
    }
    if (sigName === 'S3') {
      const match = raw.match(/HF:\s*([0-9.]+)/i);
      return match ? `${match[1]} HF` : `${(signal.score * 100).toFixed(0)}% Risk`;
    }
    if (sigName === 'S4') {
      const match = raw.match(/Rate:\s*([0-9.]+)\/min/i);
      if (match) return `${match[1]}/min`;
      if (raw.includes('Calibrating')) return 'Calibrating';
      return `${(signal.score * 100).toFixed(0)}% Risk`;
    }
    if (sigName === 'S5') {
      const match = raw.match(/Corr:\s*([0-9.]+)/i);
      return match ? `${match[1]} Corr` : `${(signal.score * 100).toFixed(0)}% Risk`;
    }
    return `${(signal.score * 100).toFixed(0)}%`;
  };

  const getStatusBadge = (signal?: SignalResult) => {
    if (!signal) {
      return (
        <span className="text-[11px] font-medium text-zinc-500 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded">
          Standby
        </span>
      );
    }
    if (signal.status === 'ALERT') {
      return (
        <span className="text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
          Flagged
        </span>
      );
    }
    if (signal.status === 'WARNING') {
      return (
        <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
          Warning
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
        Normal
      </span>
    );
  };

  return (
    <div className="bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-800/80 flex flex-col justify-between w-full h-full min-h-[265px]">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-xs font-medium text-zinc-300">Biometric Audit Signals</span>
        <span className="text-[11px] font-mono text-zinc-500">
          5 Pipelines Active
        </span>
      </div>

      {/* Permanent Structured 5-Row Table with Zero Text Clipping */}
      <div className="flex flex-col divide-y divide-zinc-800/80 flex-1 justify-between py-1">
        {CANONICAL_SIGNALS.map((def) => {
          const liveSignal = signals.find(s => s.signal === def.signal);
          const isExpanded = expandedSignal === def.signal;
          const primaryMetric = getPrimaryMetric(def.signal, liveSignal);
          const statusBadge = getStatusBadge(liveSignal);

          return (
            <div key={def.signal} className="py-2 px-1 flex flex-col justify-center">
              <div 
                onClick={() => toggleExpand(def.signal)}
                className="flex items-center justify-between gap-2 cursor-pointer select-none hover:text-zinc-200 transition-colors"
              >
                {/* Col 1: Tag pill (fixed w-10) */}
                <div className="w-10 shrink-0">
                  <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 text-center block">
                    {def.signal}
                  </span>
                </div>

                {/* Col 2: Title (flex-1) */}
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-sm font-medium text-zinc-200 truncate block">
                    {def.title}
                  </span>
                </div>

                {/* Col 3: Primary Metric Value (fixed w-28 text-right) */}
                <div className="w-28 shrink-0 text-right">
                  <span className="font-mono text-xs text-zinc-300 font-medium">
                    {primaryMetric}
                  </span>
                </div>

                {/* Col 4: Status Badge + Chevron (fixed w-24 text-right) */}
                <div className="w-24 shrink-0 flex items-center justify-end gap-1.5">
                  {statusBadge}
                  <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expandable Disclosure Drawer */}
              {isExpanded && (
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[11px] flex flex-col gap-1.5 text-zinc-400 mt-2">
                  {liveSignal?.reason && (
                    <div>
                      <span className="text-zinc-500 font-sans block mb-0.5">Audit Detail:</span>
                      <span className="text-zinc-300 font-mono break-all">{liveSignal.reason}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500 font-sans block mb-0.5">Target Attack Vector:</span>
                    <span className="text-zinc-300">{def.attackVector}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-sans block mb-0.5">Verification Physics:</span>
                    <span className="text-zinc-400">{def.method}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
