import React, { useState, useEffect } from 'react';
import { RiskLevel, SignalResult, TelemetryData } from '../types';

interface IntegrityOcularPanelProps {
  trustScore: number;
  riskLevel: RiskLevel;
  signals?: SignalResult[];
  faceDetected?: boolean;
  telemetry?: TelemetryData;
}

export const IntegrityOcularPanel: React.FC<IntegrityOcularPanelProps> = ({ 
  trustScore, 
  riskLevel, 
  signals = [], 
  faceDetected = false,
  telemetry 
}) => {
  // Session tracking timer
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    let interval: number | null = null;
    if (faceDetected) {
      interval = window.setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [faceDetected]);

  const formatSessionTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine State Color & Badge
  let badgeText = 'Verified';
  let badgeClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
  let scoreColor = 'text-emerald-400';

  if (!faceDetected && trustScore === 100) {
    badgeText = 'Standby';
    badgeClass = 'text-slate-400 bg-[#181c26] border-[#222734]';
    scoreColor = 'text-zinc-100';
  } else if (riskLevel === 'WARNING') {
    badgeText = 'Warning';
    badgeClass = 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    scoreColor = 'text-amber-400';
  } else if (riskLevel === 'ALERT') {
    badgeText = 'Flagged';
    badgeClass = 'text-rose-400 bg-rose-950/40 border-rose-800/40';
    scoreColor = 'text-rose-400';
  }

  // Model Confidence calculation across active signals
  const highestConfidence = signals.length > 0
    ? Math.max(...signals.map(s => s.confidence)) * 100
    : 98.2;
  const confidenceLevel = highestConfidence >= 85 ? 'High' : highestConfidence >= 60 ? 'Moderate' : 'Low';

  // S4 Ocular Signal extraction
  const s4Signal = signals.find(s => s.signal === 'S4');
  const isCalibrating = s4Signal?.reason.includes('Calibrating') || (s4Signal && s4Signal.confidence < 0.35);

  const ear = telemetry?.ear ?? 0;
  const blinkRate = telemetry?.blink_rate ?? 0;
  const blinkCv = telemetry?.blink_cv ?? 0;
  const avgDur = telemetry?.avg_duration_ms ?? 0;

  // Status interpretations
  const earStatus = ear > 0.18 ? 'Open' : 'Closing';

  let rateInterpretation = 'Human Normal';
  if (isCalibrating) rateInterpretation = 'Calibrating';
  else if (blinkRate < 8) rateInterpretation = 'Outlier';
  else if (blinkRate > 26) rateInterpretation = 'Robotic';

  let regularityInterpretation = 'Natural';
  if (isCalibrating) regularityInterpretation = 'Calibrating';
  else if (blinkCv < 0.25) regularityInterpretation = 'Synthetic Periodicity';
  else if (blinkCv > 1.4) regularityInterpretation = 'Irregular';

  let durationInterpretation = '120-380ms Normal';
  if (isCalibrating) durationInterpretation = 'Calibrating';
  else if (avgDur < 120) durationInterpretation = 'Too Brief';
  else if (avgDur > 380) durationInterpretation = 'Too Prolonged';

  // Diagnostic Footer Message
  const getDiagnosticMessage = () => {
    if (!faceDetected && trustScore === 100) {
      return 'Awaiting Target: Align face within video boundaries to initialize identity verification.';
    }
    if (riskLevel === 'ALERT') {
      return 'Critical Anomaly: Synthetic blink signature or high-frequency texture drop flagged. High deepfake probability.';
    }
    if (riskLevel === 'WARNING') {
      return 'Attention: Unnatural blink periodicity or facial boundary drift detected. Administer challenge if persists.';
    }
    return 'Status Nominal: Consistent ocular dynamics and facial surface stability across active frames.';
  };

  return (
    <div className="bg-[#12151c]/90 rounded-lg border border-[#222734] flex flex-col justify-between w-full h-full overflow-hidden shadow-xs">
      {/* Top Header Strip */}
      <div className="px-3.5 pt-2.5 pb-2 flex justify-between items-center border-b border-[#222734]">
        <span className="text-xs font-medium text-zinc-200">Identity Authenticity & Dynamics</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* Main Two-Column Diagnostics Section */}
      <div className="px-3.5 py-2.5 flex flex-row items-stretch gap-4 flex-1 min-h-0">
        {/* Left Column (Score & Trust Index, w-2/5) */}
        <div className="w-2/5 flex flex-col justify-between pr-3 border-r border-[#222734]">
          <div>
            <span className="text-[11px] text-slate-400 font-sans block">Authenticity Index</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-4xl font-mono font-bold tracking-tight ${scoreColor}`}>
                {Math.round(trustScore)}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-1.5 border-t border-[#222734]/70 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-sans">Confidence</span>
              <span className="text-zinc-200 text-[11px] font-medium">
                {confidenceLevel} ({highestConfidence.toFixed(1)}%)
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-sans">Active Duration</span>
              <span className="text-zinc-200 text-[11px] font-medium">
                {formatSessionTime(sessionSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Ocular Dynamics Grid, w-3/5) */}
        <div className="w-3/5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {/* 1. Eye Ratio (EAR) */}
          <div className="flex flex-col justify-between p-1.5 rounded bg-[#181c26]/60 border border-[#222734]/50">
            <span className="text-[10px] text-slate-400 font-sans">Eye Ratio (EAR)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-mono text-sm font-semibold text-zinc-100">
                {telemetry ? ear.toFixed(2) : '0.00'}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                earStatus === 'Open'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  : 'text-amber-400 bg-amber-950/40 border-amber-800/40'
              }`}>
                {earStatus}
              </span>
            </div>
          </div>

          {/* 2. Blink Frequency */}
          <div className="flex flex-col justify-between p-1.5 rounded bg-[#181c26]/60 border border-[#222734]/50">
            <span className="text-[10px] text-slate-400 font-sans">Blink Rate</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-mono text-sm font-semibold text-zinc-100">
                {telemetry && !isCalibrating ? `${blinkRate.toFixed(1)}/min` : '0.0/min'}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                rateInterpretation === 'Human Normal'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  : 'text-amber-400 bg-amber-950/40 border-amber-800/40'
              }`}>
                {rateInterpretation}
              </span>
            </div>
          </div>

          {/* 3. Regularity (IBI CV) */}
          <div className="flex flex-col justify-between p-1.5 rounded bg-[#181c26]/60 border border-[#222734]/50">
            <span className="text-[10px] text-slate-400 font-sans">Regularity (IBI CV)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-mono text-sm font-semibold text-zinc-100">
                {telemetry ? blinkCv.toFixed(2) : '0.00'}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                regularityInterpretation === 'Natural'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  : 'text-rose-400 bg-rose-950/40 border-rose-800/40'
              }`}>
                {regularityInterpretation}
              </span>
            </div>
          </div>

          {/* 4. Blink Duration */}
          <div className="flex flex-col justify-between p-1.5 rounded bg-[#181c26]/60 border border-[#222734]/50">
            <span className="text-[10px] text-slate-400 font-sans">Blink Duration</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-mono text-sm font-semibold text-zinc-100">
                {telemetry ? `${avgDur.toFixed(0)}ms` : '0ms'}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                durationInterpretation === '120-380ms Normal'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  : 'text-amber-400 bg-amber-950/40 border-amber-800/40'
              }`}>
                {durationInterpretation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Diagnostic Footer (Needful Insight Strip) */}
      <div className="px-3.5 py-2 bg-[#181c26]/80 border-t border-[#222734] flex items-center gap-2 text-xs">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          riskLevel === 'ALERT'
            ? 'bg-rose-400'
            : riskLevel === 'WARNING'
            ? 'bg-amber-400'
            : !faceDetected
            ? 'bg-zinc-500'
            : 'bg-emerald-400'
        }`} />
        <p className="text-[11px] text-slate-300 font-sans leading-tight truncate">
          {getDiagnosticMessage()}
        </p>
      </div>
    </div>
  );
};
