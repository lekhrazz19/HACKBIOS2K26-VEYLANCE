import React, { useState, useEffect } from 'react';
import { AlertInfo } from '../types';

interface AlertPanelProps {
  alert: AlertInfo | null;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alert }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(false);
  }, [alert]);

  if (!alert || isDismissed) return null;

  let borderColor = 'border-amber-500/40 bg-zinc-900 text-amber-200';
  let severityTag = 'Warning';

  if (alert.severity === 'critical' || alert.severity === 'high') {
    borderColor = 'border-rose-500/40 bg-zinc-900 text-rose-200';
    severityTag = 'Anomaly';
  }

  return (
    <div className={`fixed top-14 right-6 z-50 max-w-sm w-full border rounded-lg p-3 shadow-xl backdrop-blur-md flex items-start justify-between gap-3 text-xs font-sans ${borderColor}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'critical' || alert.severity === 'high' ? 'bg-rose-400' : 'bg-amber-400'}`} />
          <span className="font-semibold text-zinc-100">
            [{severityTag}] {alert.type}
          </span>
        </div>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          {alert.message}
        </p>
        {alert.signals && alert.signals.length > 0 && (
          <span className="text-[10px] text-zinc-500 font-mono">
            Vectors: {alert.signals.join(', ')}
          </span>
        )}
      </div>

      <button 
        onClick={() => setIsDismissed(true)}
        className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-colors cursor-pointer shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
