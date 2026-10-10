import React, { useState, useEffect } from 'react';
import { RiskLevel, SignalResult } from '../types';

interface TrustGaugeProps {
  trustScore: number;
  riskLevel: RiskLevel;
  signals?: SignalResult[];
  faceDetected?: boolean;
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ trustScore, riskLevel, signals = [], faceDetected = false }) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, trustScore)) / 100) * circumference;

  let strokeColor = '#10b981'; // Emerald
  let badgeText = 'Verified';
  let badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  if (riskLevel === 'WARNING') {
    strokeColor = '#f59e0b'; // Amber
    badgeText = 'Warning';
    badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (riskLevel === 'ALERT') {
    strokeColor = '#f43f5e'; // Rose
    badgeText = 'Flagged';
    badgeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
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
    <div className="flex flex-col p-4 bg-zinc-900/60 rounded-lg border border-zinc-800/80 w-full">
      <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-2.5 mb-3">
        <span className="text-xs font-medium text-zinc-300">Identity Integrity</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 py-1">
        {/* Clean, thin circular meter */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#27272a"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Value arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={strokeColor}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>

          {/* Center readouts */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-mono font-semibold text-zinc-100 tracking-tight">
              {Math.round(trustScore)}%
            </span>
          </div>
        </div>

        {/* Structured Key-Value Readouts */}
        <div className="flex-1 flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Authenticity:</span>
            <span className="font-mono text-zinc-200 font-medium">{Math.round(trustScore)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Model Confidence:</span>
            <span className="font-mono text-zinc-200">{highestConfidence.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Active Duration:</span>
            <span className="font-mono text-zinc-200">{formatTime(sessionSeconds)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">State:</span>
            <span className="font-medium" style={{ color: strokeColor }}>{badgeText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
