import React, { useState, useEffect } from 'react';
import { RiskLevel, SignalResult } from '../types';

interface TrustGaugeProps {
  trustScore: number;
  riskLevel: RiskLevel;
  signals?: SignalResult[];
  faceDetected?: boolean;
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ trustScore, riskLevel, signals = [], faceDetected = false }) => {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, trustScore)) / 100) * circumference;

  let color = '#10b981'; // EMERALD
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let text = 'HIGH TRUST';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  if (riskLevel === 'WARNING') {
    color = '#f59e0b'; // AMBER
    glowColor = 'rgba(245, 158, 11, 0.4)';
    text = 'WARNING';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (riskLevel === 'ALERT') {
    color = '#ef4444'; // RED
    glowColor = 'rgba(239, 68, 68, 0.4)';
    text = 'ALERT';
    badgeBg = 'bg-red-500/10 text-red-400 border-red-500/30';
  }

  // Session timer
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    if (faceDetected && !timerStarted) {
      setTimerStarted(true);
    }
  }, [faceDetected, timerStarted]);

  useEffect(() => {
    if (timerStarted) {
      const interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerStarted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const highestConfidence = signals.length > 0 
    ? Math.max(...signals.map(s => s.confidence)) * 100
    : 100;

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/80 w-full relative overflow-hidden">
      <div className="w-full flex justify-between items-center border-b border-slate-700/70 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <h2 className="text-base font-bold text-slate-100 tracking-wide">Identity Trust Engine</h2>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
          {text}
        </span>
      </div>

      <div className="relative w-[210px] h-[210px] flex items-center justify-center my-1">
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md" viewBox="0 0 200 200">
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#1e293b"
            strokeWidth="14"
            fill="transparent"
          />
          {/* Subtle tick ring */}
          <circle
            cx="100"
            cy="100"
            r={radius - 12}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="1"
            strokeDasharray="3 6"
            fill="transparent"
          />
          {/* Main animated value arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={color}
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>

        {/* Center readouts */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400">AUTHENTICITY</span>
          <div className="flex items-baseline">
            <span className="text-5xl font-mono font-black text-white tracking-tighter">
              {Math.round(trustScore)}
            </span>
            <span className="text-xl font-mono text-slate-400 font-bold ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5">EWMA FUSED SCORE</span>
        </div>
      </div>
      
      {/* Metrics matrix */}
      <div className="mt-4 w-full border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/60 text-xs">
        <div className="grid grid-cols-2 divide-x divide-slate-700/50 border-b border-slate-700/50">
          <div className="p-2.5 flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Raw Score</span>
            <span className="text-white font-mono font-bold text-sm mt-0.5">{trustScore.toFixed(1)} / 100</span>
          </div>
          <div className="p-2.5 flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Confidence</span>
            <span className="text-emerald-400 font-mono font-bold text-sm mt-0.5">{highestConfidence.toFixed(0)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-700/50">
          <div className="p-2.5 flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Assessment</span>
            <span className="font-mono font-bold text-sm mt-0.5" style={{ color }}>{text}</span>
          </div>
          <div className="p-2.5 flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Session Time</span>
            <span className="text-white font-mono font-bold text-sm mt-0.5">{formatTime(sessionSeconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
