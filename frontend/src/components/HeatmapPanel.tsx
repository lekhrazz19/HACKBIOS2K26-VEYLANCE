import React from 'react';

interface HeatmapPanelProps {
  heatmap?: number[][];
}

export const HeatmapPanel: React.FC<HeatmapPanelProps> = ({ heatmap }) => {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const SVG_SIZE = GRID_SIZE * CELL_SIZE; // 400

  const interpolateColor = (score: number) => {
    // 0.0 -> #1e40af (dark blue), 0.5 -> #f59e0b (amber), 1.0 -> #dc2626 (red)
    if (score < 0.5) {
      // Interpolate between dark blue (30, 64, 175) and amber (245, 158, 11)
      const ratio = score * 2; // 0 to 1
      const r = Math.round(30 + ratio * (245 - 30));
      const g = Math.round(64 + ratio * (158 - 64));
      const b = Math.round(175 + ratio * (11 - 175));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Interpolate between amber (245, 158, 11) and red (220, 38, 38)
      const ratio = (score - 0.5) * 2; // 0 to 1
      const r = Math.round(245 + ratio * (220 - 245));
      const g = Math.round(158 + ratio * (38 - 158));
      const b = Math.round(11 + ratio * (38 - 11));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-white mb-1">Anomaly Heatmap</h3>
      <p className="text-sm text-gray-400 mb-4">20×20 cell risk grid | Blue=Safe, Red=Suspicious</p>
      
      <svg width={SVG_SIZE} height={SVG_SIZE} className="border border-gray-600 rounded">
        {(!heatmap || heatmap.length === 0) ? (
          <rect width={SVG_SIZE} height={SVG_SIZE} fill="#374151" />
        ) : (
          heatmap.map((row, y) => (
            row.map((score, x) => (
              <rect
                key={`${x}-${y}`}
                x={x * CELL_SIZE}
                y={y * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={interpolateColor(score)}
              />
            ))
          ))
        )}
        
        {/* Face Silhouette Outline */}
        <path
          d="M 200,50 C 300,50 350,150 350,250 C 350,350 250,380 200,380 C 150,380 50,350 50,250 C 50,150 100,50 200,50 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
};
