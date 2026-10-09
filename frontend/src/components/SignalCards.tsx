import React, { useState, useEffect } from 'react';
import { SignalResult, TelemetryData } from '../types';

interface SignalCardsProps {
  signals: SignalResult[];
  telemetry?: TelemetryData;
}

const SIGNAL_LABELS: Record<string, string> = {
  'S1': 'Boundary Control',
  'S2': 'Face Occlusion',
  'S3': 'Skin Texture',
  'S4': 'Blink Detection',
  'S5': 'Audio-Visual Sync',
};

const SignalCard: React.FC<{ signal: SignalResult }> = ({ signal }) => {
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
      if (next.length > 6) return next.slice(next.length - 6);
      return next;
    });
  }, [signal.score, signal.timestamp]);

  return (
    <div className="p-4 bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-md hover:border-slate-600/80 transition-all flex flex-col gap-2.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-cyan-300 border border-slate-600/60">
            {signal.signal}
          </span>
          <span className="font-semibold text-sm text-slate-100">
            {SIGNAL_LABELS[signal.signal] || signal.signal}
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
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex border border-slate-700/40">
        <div 
          className={`h-full ${barColor} transition-all duration-300 rounded-full`} 
          style={{ width: `${Math.max(2, Math.min(100, signal.score * 100))}%` }}
        />
      </div>
      
      <div className="flex justify-between items-end mt-1 gap-2">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {metrics.map((m, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-900/80 text-[11px] font-mono rounded text-slate-300 border border-slate-700/50">
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
        <div className="flex items-end gap-1 h-7 ml-3 shrink-0 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
          {[...Array(Math.max(0, 6 - history.length))].map((_, i) => (
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
    </div>
  );
};

export const SignalCards: React.FC<SignalCardsProps> = ({ signals }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Multi-Signal Forensic Vectors
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {signals.length} ACTIVE PIPELINES
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full">
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
