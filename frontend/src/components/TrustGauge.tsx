import React, { useState, useEffect } from 'react';
import { RiskLevel, SignalResult } from '../types';

interface TrustGaugeProps {
  trustScore: number;
  riskLevel: RiskLevel;
  signals?: SignalResult[];
  faceDetected?: boolean;
}

export const TrustGauge: React.FC<TrustGaugeProps> = ({ trustScore, riskLevel, signals = [], faceDetected = false }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trustScore / 100) * circumference;

  let color = '#22c55e'; // GREEN
  let text = 'HIGH TRUST';
  if (riskLevel === 'WARNING') {
    color = '#eab308'; // YELLOW
    text = 'WARNING';
  } else if (riskLevel === 'ALERT') {
    color = '#ef4444'; // RED
    text = 'ALERT';
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

  // Confidence
  const highestConfidence = signals.length > 0 
    ? Math.max(...signals.map(s => s.confidence)) * 100
    : 100;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl shadow-lg border border-slate-700 w-full">
      <h2 className="text-xl font-semibold text-slate-200 mb-4">Integrity Score</h2>
      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#1e293b"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-white">{Math.round(trustScore)}</span>
        </div>
      </div>
      
      <div className="mt-6 w-full border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700/50">
          <span className="text-slate-400 text-xs">Trust Score</span>
          <span className="text-white font-mono font-semibold">{trustScore.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700/50">
          <span className="text-slate-400 text-xs">Risk Level</span>
          <span className="font-mono font-semibold" style={{ color }}>{text}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700/50">
          <span className="text-slate-400 text-xs">Confidence</span>
          <span className="text-white font-mono font-semibold">{highestConfidence.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2">
          <span className="text-slate-400 text-xs">Session</span>
          <span className="text-white font-mono font-semibold">{formatTime(sessionSeconds)}</span>
        </div>
      </div>
    </div>
  );
};
