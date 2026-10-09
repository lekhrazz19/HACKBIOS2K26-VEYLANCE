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

  let bgClass = 'bg-blue-900/80 border-blue-500 text-blue-100';
  let pulseClass = '';

  if (alert.severity === 'medium') {
    bgClass = 'bg-yellow-900/80 border-yellow-500 text-yellow-100';
  } else if (alert.severity === 'high') {
    bgClass = 'bg-orange-900/80 border-orange-500 text-orange-100';
  } else if (alert.severity === 'critical') {
    bgClass = 'bg-red-900/90 border-red-500 text-red-100';
    pulseClass = 'animate-pulse';
  }

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl border p-4 rounded-lg shadow-xl flex justify-between items-start z-40 backdrop-blur-sm ${bgClass} ${pulseClass}`}>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-lg uppercase tracking-wider">{alert.type}</h3>
        <p className="text-sm">{alert.message}</p>
        {alert.signals && alert.signals.length > 0 && (
          <p className="text-xs opacity-80 mt-1">Signals: {alert.signals.join(', ')}</p>
        )}
      </div>
      <button 
        onClick={() => setIsDismissed(true)}
        className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
