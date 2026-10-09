import React, { useState, useEffect } from 'react';

interface AudioVisualizerProps {
  audioRms?: number;
  isAudioActive?: boolean;
  s5Correlation?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRms = 0,
  isAudioActive = false,
  s5Correlation
}) => {
  const [smoothRms, setSmoothRms] = useState(0);

  useEffect(() => {
    // Smooth decay filter for natural visual meter
    setSmoothRms(prev => {
      const target = isAudioActive ? audioRms : 0;
      return target > prev ? target : prev * 0.85 + target * 0.15;
    });
  }, [audioRms, isAudioActive]);

  const numBars = 14;
  // Generate pseudo-spectral equalizer bars modulated by RMS
  const bars = Array.from({ length: numBars }, (_, i) => {
    if (!isAudioActive || smoothRms < 0.02) {
      return 6; // standby height px
    }
    const centerFactor = 1.0 - Math.abs((i - numBars / 2) / (numBars / 2)) * 0.4;
    const wave = Math.sin(i * 0.8 + Date.now() * 0.01) * 0.25 + 0.75;
    const height = Math.min(100, Math.max(8, smoothRms * 130 * centerFactor * wave));
    return Math.round(height);
  });

  const isSpeaking = smoothRms > 0.05;
  const isDesync = s5Correlation !== undefined && isSpeaking && s5Correlation < 0.35;

  return (
    <div className="flex items-center gap-3 bg-slate-950/70 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono shadow-inner">
      {/* Mic icon with speaking indicator */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className={`w-3.5 h-3.5 ${isSpeaking ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {isSpeaking && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-[10px] text-slate-400 uppercase font-semibold">
          AUDIO
        </span>
      </div>

      {/* Dynamic Equalizer Bars */}
      <div className="flex items-end gap-1 h-5 w-24">
        {bars.map((height, i) => {
          let barBg = 'bg-cyan-500/80';
          if (height > 65) barBg = 'bg-amber-400';
          if (height > 85) barBg = 'bg-red-400';
          if (!isSpeaking) barBg = 'bg-slate-700/50';

          return (
            <div
              key={i}
              className={`w-1 rounded-xs transition-all duration-75 ${barBg}`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* S5 AV Sync Correlation Badge */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
        <span className="text-[10px] text-slate-500">S5 SYNC:</span>
        {isDesync ? (
          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.2 rounded animate-pulse">
            DESYNC
          </span>
        ) : (
          <span className={`text-[10px] font-bold ${isSpeaking ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isSpeaking && s5Correlation !== undefined ? `${(s5Correlation * 100).toFixed(0)}%` : 'LOCK'}
          </span>
        )}
      </div>
    </div>
  );
};
