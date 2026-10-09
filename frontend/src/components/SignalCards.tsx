import React, { useState, useEffect } from 'react';
import { SignalResult, TelemetryData } from '../types';

interface SignalCardsProps {
  signals: SignalResult[];
  telemetry?: TelemetryData;
}

const SIGNAL_LABELS: Record<string, string> = {
  'S1': 'Boundary Control',
  'S2': 'Face Occlusion',
  'S4': 'Blink Detection',
};

const SignalCard: React.FC<{ signal: SignalResult }> = ({ signal }) => {
  let statusColor = 'text-green-400 bg-green-400/20';
  let barColor = 'bg-green-500';
  
  if (signal.status === 'WARNING') {
    statusColor = 'text-yellow-400 bg-yellow-400/20';
    barColor = 'bg-yellow-500';
  } else if (signal.status === 'ALERT') {
    statusColor = 'text-red-400 bg-red-400/20';
    barColor = 'bg-red-500';
  }

  // Parse reason string
  const [metricsPart, textPart] = signal.reason.split(' — ');
  const metrics = metricsPart ? metricsPart.split(' | ') : [];
  
  // Sparkline history
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, signal.score];
      if (next.length > 5) return next.slice(next.length - 5);
      return next;
    });
  }, [signal.score, signal.timestamp]);

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-200 flex items-center gap-2">
          {signal.signal}: {SIGNAL_LABELS[signal.signal] || signal.signal}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono">
            [{(signal.confidence * 100).toFixed(0)}%]
          </span>
          <span className={`px-2 py-1 text-xs font-bold rounded ${statusColor}`}>
            {signal.status}
          </span>
        </div>
      </div>
      
      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-1 flex">
        <div 
          className={`h-full ${barColor} transition-all duration-300`} 
          style={{ width: `${Math.max(0, Math.min(100, signal.score * 100))}%` }}
        />
      </div>
      
      <div className="flex justify-between items-end mt-2">
        <div className="flex flex-col gap-1.5">
          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-slate-700 pb-2">
              {metrics.map((m, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-700 text-xs font-mono rounded text-slate-300">
                  {m}
                </span>
              ))}
            </div>
          )}
          <span className="text-xs text-slate-400">{textPart || signal.reason}</span>
        </div>
        
        <div className="flex items-end gap-0.5 h-8 ml-4 shrink-0">
          {[...Array(5 - history.length)].map((_, i) => (
            <div key={`empty-${i}`} className="w-1.5 bg-slate-700 rounded-t h-full opacity-20" />
          ))}
          {history.map((h, i) => (
            <div 
              key={`hist-${i}`} 
              className="w-1.5 bg-slate-500 rounded-t" 
              style={{ height: `${Math.max(10, h * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SignalCards: React.FC<SignalCardsProps> = ({ signals }) => {
  return (
    <div className="grid grid-cols-1 gap-4 mt-4 w-full">
      {signals.map((signal) => (
        <SignalCard key={signal.signal} signal={signal} />
      ))}
      
      {signals.length === 0 && (
        <div className="text-slate-500 text-center py-4 italic border border-slate-700 border-dashed rounded-xl">No signals active</div>
      )}
    </div>
  );
};
