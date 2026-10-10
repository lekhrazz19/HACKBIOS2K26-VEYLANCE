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
    setSmoothRms(prev => {
      const target = isAudioActive ? audioRms : 0;
      return target > prev ? target : prev * 0.85 + target * 0.15;
    });
  }, [audioRms, isAudioActive]);

  const numBars = 10;
  const bars = Array.from({ length: numBars }, (_, i) => {
    if (!isAudioActive || smoothRms < 0.02) {
      return 4;
    }
    const centerFactor = 1.0 - Math.abs((i - numBars / 2) / (numBars / 2)) * 0.35;
    const wave = Math.sin(i * 0.8 + Date.now() * 0.01) * 0.2 + 0.8;
    const height = Math.min(100, Math.max(8, smoothRms * 120 * centerFactor * wave));
    return Math.round(height);
  });

  const isSpeaking = smoothRms > 0.05;
  const isDesync = s5Correlation !== undefined && isSpeaking && s5Correlation < 0.35;

  return (
    <div className="flex items-center gap-3 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800 text-xs">
      {/* Audio Activity */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
        <span className="text-zinc-400 font-sans text-[11px]">Audio</span>
      </div>

      {/* Discrete Level Meter Bars */}
      <div className="flex items-end gap-0.5 h-3.5 w-16">
        {bars.map((height, i) => {
          let barBg = 'bg-zinc-500';
          if (isSpeaking) {
            barBg = height > 80 ? 'bg-amber-400' : 'bg-emerald-400';
          }
          return (
            <div
              key={i}
              className={`w-1 rounded-none transition-all duration-75 ${barBg}`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* S5 AV Sync Correlation */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-[11px]">
        <span className="text-zinc-500 font-sans">Sync:</span>
        {isDesync ? (
          <span className="font-mono text-rose-400 font-medium">
            Desync
          </span>
        ) : (
          <span className={`font-mono font-medium ${isSpeaking ? 'text-zinc-200' : 'text-zinc-500'}`}>
            {isSpeaking && s5Correlation !== undefined ? `${(s5Correlation * 100).toFixed(0)}%` : 'Lock'}
          </span>
        )}
      </div>
    </div>
  );
};
