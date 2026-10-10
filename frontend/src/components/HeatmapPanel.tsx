import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface HeatmapPanelProps {
  heatmap?: number[][];
}

type ColorPalette = 'thermal' | 'spectral';

export const HeatmapPanel: React.FC<HeatmapPanelProps> = ({ heatmap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [palette, setPalette] = useState<ColorPalette>('thermal');
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    score: number;
    zone: string;
    pixelX: number;
    pixelY: number;
  } | null>(null);

  const gridData = useMemo(() => {
    if (heatmap && heatmap.length > 0 && heatmap[0].length > 0) {
      return heatmap;
    }
    return Array.from({ length: 20 }, () => Array(20).fill(0.0));
  }, [heatmap]);

  const rows = gridData.length;
  const cols = gridData[0]?.length || 20;

  const metrics = useMemo(() => {
    let maxScore = 0.0;
    let maxR = 0;
    let maxC = 0;
    let sumScore = 0.0;
    let validCount = 0;
    let suspectCount = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = gridData[r][c];
        if (val > 0.01) {
          sumScore += val;
          validCount++;
          if (val > 0.50) suspectCount++;
        }
        if (val > maxScore) {
          maxScore = val;
          maxR = r;
          maxC = c;
        }
      }
    }

    const meanScore = validCount > 0 ? sumScore / validCount : 0.0;
    const suspectPct = validCount > 0 ? (suspectCount / validCount) * 100 : 0.0;

    const getZoneName = (r: number, c: number) => {
      const ny = r / rows;
      const nx = c / cols;
      if (nx < 0.15 || nx > 0.85 || ny < 0.1 || ny > 0.88) return 'Boundary';
      if (ny < 0.28) return 'Forehead';
      if (ny < 0.50 && nx < 0.45) return 'L-Orbit';
      if (ny < 0.50 && nx > 0.55) return 'R-Orbit';
      if (ny >= 0.32 && ny < 0.65 && nx >= 0.40 && nx <= 0.60) return 'Midface';
      if (ny >= 0.50 && ny < 0.75 && nx < 0.38) return 'L-Cheek';
      if (ny >= 0.50 && ny < 0.75 && nx > 0.62) return 'R-Cheek';
      if (ny >= 0.65 && ny < 0.85) return 'Mouth';
      return 'Chin';
    };

    return {
      peakScore: maxScore,
      peakZone: getZoneName(maxR, maxC),
      meanScore,
      suspectPct,
    };
  }, [gridData, rows, cols]);

  const getColorRGB = useCallback((score: number, pal: ColorPalette): [number, number, number] => {
    const s = Math.max(0.0, Math.min(1.0, score));

    if (pal === 'thermal') {
      if (s < 0.20) {
        const t = s / 0.20;
        return [
          Math.round(24 + t * (30 - 24)),
          Math.round(24 + t * (58 - 24)),
          Math.round(27 + t * (138 - 27))
        ];
      } else if (s < 0.45) {
        const t = (s - 0.20) / 0.25;
        return [
          Math.round(30 + t * (16 - 30)),
          Math.round(58 + t * (185 - 58)),
          Math.round(138 + t * (129 - 138))
        ];
      } else if (s < 0.70) {
        const t = (s - 0.45) / 0.25;
        return [
          Math.round(16 + t * (245 - 16)),
          Math.round(185 + t * (158 - 185)),
          Math.round(129 + t * (11 - 129))
        ];
      } else {
        const t = (s - 0.70) / 0.30;
        return [
          Math.round(245 + t * (244 - 245)),
          Math.round(158 + t * (63 - 158)),
          Math.round(11 + t * (94 - 11))
        ];
      }
    } else {
      const r = Math.round(s * 220 + 20);
      const g = Math.round((1 - Math.abs(s - 0.5) * 2) * 180 + 30);
      const b = Math.round((1 - s) * 200 + 30);
      return [r, g, b];
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal resolution buffer
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = gridData[r][c];
        const [red, green, blue] = getColorRGB(val, palette);
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }, [gridData, rows, cols, palette, getColorRGB]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const col = Math.floor((x / rect.width) * cols);
    const row = Math.floor((y / rect.height) * rows);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      const score = gridData[row][col];
      const getZoneName = (r: number, c: number) => {
        const ny = r / rows;
        const nx = c / cols;
        if (nx < 0.15 || nx > 0.85 || ny < 0.1 || ny > 0.88) return 'Boundary';
        if (ny < 0.28) return 'Forehead';
        if (ny < 0.50 && nx < 0.45) return 'L-Orbit';
        if (ny < 0.50 && nx > 0.55) return 'R-Orbit';
        if (ny >= 0.32 && ny < 0.65 && nx >= 0.40 && nx <= 0.60) return 'Midface';
        if (ny >= 0.50 && ny < 0.75 && nx < 0.38) return 'L-Cheek';
        if (ny >= 0.50 && ny < 0.75 && nx > 0.62) return 'R-Cheek';
        if (ny >= 0.65 && ny < 0.85) return 'Mouth';
        return 'Chin';
      };

      setHoverData({
        x: col,
        y: row,
        score,
        zone: getZoneName(row, col),
        pixelX: x,
        pixelY: y
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col justify-between min-h-0 w-full overflow-hidden">
      {/* Palette switch & Caption toolbar (shrink-0) */}
      <div className="flex items-center justify-between text-xs pb-1 shrink-0">
        <span className="text-zinc-500 font-sans text-[11px]">GAN texture anomaly matrix</span>
        <select
          value={palette}
          onChange={(e) => setPalette(e.target.value as ColorPalette)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded px-1.5 py-0.5 text-[10px] outline-none cursor-pointer"
        >
          <option value="thermal">Thermal</option>
          <option value="spectral">Spectral</option>
        </select>
      </div>

      {/* Locked Canvas Wrapper */}
      <div className="relative w-full flex-1 min-h-0 overflow-hidden flex items-center justify-center py-0.5">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="rounded cursor-crosshair border border-zinc-800/80 max-h-[170px] w-full h-full object-contain block"
          style={{ width: '100%', height: '100%', maxHeight: '170px', objectFit: 'contain' }}
        />

        {/* Clean key-value tooltip */}
        {hoverData && (
          <div 
            className="absolute z-20 pointer-events-none bg-zinc-900/95 border border-zinc-700/80 rounded px-2 py-1 text-xs shadow-lg font-mono flex flex-col gap-0.5"
            style={{
              left: Math.min(140, Math.max(10, hoverData.pixelX + 10)),
              top: Math.min(110, Math.max(10, hoverData.pixelY - 10))
            }}
          >
            <div className="flex items-center justify-between gap-2 text-zinc-300 text-[10px]">
              <span className="font-sans font-medium text-zinc-200">{hoverData.zone}</span>
              <span className="text-zinc-500">[{hoverData.x},{hoverData.y}]</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-zinc-500 font-sans">Score:</span>
              <span className={hoverData.score > 0.5 ? 'text-rose-400' : 'text-emerald-400'}>
                {(hoverData.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Readouts (shrink-0) */}
      <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60 mt-1 shrink-0 text-[11px] font-mono text-center">
        <div className="flex items-center gap-1 text-zinc-400">
          <span className="font-sans text-zinc-500 text-[10px]">Peak</span>
          <span className="text-zinc-200 font-semibold">
            {(metrics.peakScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <span className="font-sans text-zinc-500 text-[10px]">Zone</span>
          <span className="text-zinc-200 font-semibold">
            {metrics.peakZone}
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <span className="font-sans text-zinc-500 text-[10px]">Mean</span>
          <span className="text-zinc-200 font-semibold">
            {(metrics.meanScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <span className="font-sans text-zinc-500 text-[10px]">Area</span>
          <span className="text-zinc-200 font-semibold">
            {metrics.suspectPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
