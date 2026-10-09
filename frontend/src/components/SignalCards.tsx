import React, { useState, useEffect } from 'react';
import { SignalResult, TelemetryData } from '../types';

interface SignalCardsProps {
  signals: SignalResult[];
  telemetry?: TelemetryData;
}

const SIGNAL_METADATA: Record<string, { title: string; attackVector: string; method: string }> = {
  'S1': {
    title: 'Boundary & Seam Control',
    attackVector: 'Face-swapping seams & Poisson blending discontinuities',
    method: 'Calculates high-order color & gradient differential along outer convex hull'
  },
  'S2': {
    title: 'Face Occlusion & 3-Finger Warp',
    attackVector: 'Hand-face interactions & temporal mesh jitter',
    method: 'Measures affine eye-nose triangle area strain & landmark displacement'
  },
  'S3': {
    title: 'Skin Texture & High-Freq FFT',
    attackVector: 'Generative smoothing & synthetic plastic skin artifacts',
    method: 'Laplacian variance & Local Binary Patterns (LBP) micro-frequency distribution'
  },
  'S4': {
    title: 'Blink Dynamics & EAR Baseline',
    attackVector: 'Robotic periodicity, suppressed blinks, or unnatural eye-closure dynamics',
    method: 'Adaptive Eye Aspect Ratio (EAR) calibration & Inter-Blink Interval (IBI) CV'
  },
  'S5': {
    title: 'Audio-Visual Lip Synchronization',
    attackVector: 'Voice cloning, dubbing lag, and generative lip desync',
    method: 'Cross-correlation between acoustic RMS energy and perioral vertical opening'
  },
};

const SignalCard: React.FC<{ signal: SignalResult }> = ({ signal }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_METADATA[signal.signal] || {
    title: signal.signal,
    attackVector: 'Biometric anomaly detection',
    method: 'Real-time statistical verification'
  };

  let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  
  if (signal.status === 'WARNING') {
    statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    barColor = 'bg-gradient-to-r from-amber-500 to-yellow-400';
  } else if (signal.status === 'ALERT') {
    statusColor = 'text-red-400 bg-red-500/10 border-red-500/30';
    barColor = 'bg-gradient-to-r from-red-500 to-rose-400';
  }

  // Parse reason string
  const [metricsPart, textPart] = signal.reason.split(' — ');
  const metrics = metricsPart ? metricsPart.split(' | ') : [];
  
  // Sparkline history
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, signal.score];
      if (next.length > 8) return next.slice(next.length - 8);
      return next;
    });
  }, [signal.score, signal.timestamp]);

  return (
    <div className="p-3.5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/70 shadow-md hover:border-slate-600 transition-all flex flex-col gap-2 group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            {signal.signal}
          </span>
          <span className="font-semibold text-sm text-slate-100">
            {meta.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-mono">
            CONF {(signal.confidence * 100).toFixed(0)}%
          </span>
          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${statusColor}`}>
            {signal.status}
          </span>
        </div>
      </div>
      
      {/* Progress risk bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-800">
        <div 
          className={`h-full ${barColor} transition-all duration-300 rounded-full`} 
          style={{ width: `${Math.max(2, Math.min(100, signal.score * 100))}%` }}
        />
      </div>
      
      <div className="flex justify-between items-end gap-2">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {metrics.map((m, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-950/80 text-[11px] font-mono rounded text-slate-300 border border-slate-800">
                  {m}
                </span>
              ))}
            </div>
          )}
          <span className="text-xs text-slate-400 truncate" title={textPart || signal.reason}>
            {textPart || signal.reason}
          </span>
        </div>
        
        {/* Sparkline */}
        <div className="flex items-end gap-1 h-7 ml-2 shrink-0 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
          {[...Array(Math.max(0, 8 - history.length))].map((_, i) => (
            <div key={`empty-${i}`} className="w-1.5 bg-slate-800 rounded-t h-full opacity-30" />
          ))}
          {history.map((h, i) => (
            <div 
              key={`hist-${i}`} 
              className={`w-1.5 rounded-t transition-all ${h > 0.6 ? 'bg-red-400' : h > 0.35 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
              style={{ height: `${Math.max(15, h * 100)}%` }}
            />
          ))}
        </div>
      </div>

      {/* Expandable Attack Physics Info Toggle */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center justify-between pt-1 border-t border-slate-800/80 transition-colors cursor-pointer text-left font-mono"
      >
        <span>FORENSIC VECTOR INTELLIGENCE</span>
        <svg className={`w-3.5 h-3.5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 text-[11px] flex flex-col gap-1.5 text-slate-300 animate-fadeIn">
          <div>
            <span className="text-slate-500 uppercase font-mono text-[9px] block">Guarded Attack Vector:</span>
            <p className="text-slate-200">{meta.attackVector}</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-mono text-[9px] block">Detection Physics:</span>
            <p className="text-slate-400 leading-relaxed">{meta.method}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const SignalCards: React.FC<SignalCardsProps> = ({ signals }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          Multi-Signal Forensic Vectors
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {signals.length} ACTIVE PIPELINES
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 w-full">
        {signals.map((signal) => (
          <SignalCard key={signal.signal} signal={signal} />
        ))}
        
        {signals.length === 0 && (
          <div className="text-slate-500 text-center py-6 italic border border-slate-700/60 border-dashed rounded-xl bg-slate-900/40 text-xs">
            Awaiting active face stream to evaluate biometric signals S1-S5
          </div>
        )}
      </div>
    </div>
  );
};
