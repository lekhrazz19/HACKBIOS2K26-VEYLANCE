import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface HeatmapPanelProps {
  heatmap?: number[][];
}

type ColorPalette = 'thermal' | 'turbo' | 'cyber';
type ViewMode = 'smooth' | 'grid' | 'contour';

export const HeatmapPanel: React.FC<HeatmapPanelProps> = ({ heatmap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [palette, setPalette] = useState<ColorPalette>('thermal');
  const [viewMode, setViewMode] = useState<ViewMode>('smooth');
  const [showWireframe, setShowWireframe] = useState(true);
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    score: number;
    zone: string;
    diagnosis: string;
    pixelX: number;
    pixelY: number;
  } | null>(null);

  // Fallback 20x20 nominal grid if no data
  const gridData = useMemo(() => {
    if (heatmap && heatmap.length > 0 && heatmap[0].length > 0) {
      return heatmap;
    }
    // Return empty 20x20
    return Array.from({ length: 20 }, () => Array(20).fill(0.0));
  }, [heatmap]);

  const rows = gridData.length;
  const cols = gridData[0]?.length || 20;

  // Compute functional forensic metrics
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
      if (nx < 0.15 || nx > 0.85 || ny < 0.1 || ny > 0.88) return 'Boundary Margin';
      if (ny < 0.28) return 'Forehead';
      if (ny < 0.50 && nx < 0.45) return 'Left Orbit (Eye)';
      if (ny < 0.50 && nx > 0.55) return 'Right Orbit (Eye)';
      if (ny >= 0.32 && ny < 0.65 && nx >= 0.40 && nx <= 0.60) return 'Nose & Midface';
      if (ny >= 0.50 && ny < 0.75 && nx < 0.38) return 'Left Cheek';
      if (ny >= 0.50 && ny < 0.75 && nx > 0.62) return 'Right Cheek';
      if (ny >= 0.65 && ny < 0.85) return 'Perioral (Mouth)';
      return 'Mandible / Chin';
    };

    return {
      peakScore: maxScore,
      peakZone: getZoneName(maxR, maxC),
      meanScore,
      suspectPct,
      hasActiveFace: validCount > 0,
      activeCells: validCount
    };
  }, [gridData, rows, cols]);

  // Color mapping formulas
  const getColorRGB = useCallback((score: number, pal: ColorPalette): [number, number, number] => {
    const s = Math.max(0.0, Math.min(1.0, score));

    if (pal === 'thermal') {
      // Forensic Thermal: Dark Slate (15, 23, 42) -> Deep Blue (30, 64, 175) -> Cyan (6, 182, 212) -> Emerald (16, 185, 129) -> Amber (245, 158, 11) -> Crimson (239, 68, 68)
      if (s < 0.15) {
        const t = s / 0.15;
        return [
          Math.round(15 + t * (20 - 15)),
          Math.round(23 + t * (50 - 23)),
          Math.round(42 + t * (120 - 42))
        ];
      } else if (s < 0.35) {
        const t = (s - 0.15) / 0.20;
        return [
          Math.round(20 + t * (6 - 20)),
          Math.round(50 + t * (182 - 50)),
          Math.round(120 + t * (212 - 120))
        ];
      } else if (s < 0.55) {
        const t = (s - 0.35) / 0.20;
        return [
          Math.round(6 + t * (16 - 6)),
          Math.round(182 + t * (185 - 182)),
          Math.round(212 + t * (129 - 212))
        ];
      } else if (s < 0.75) {
        const t = (s - 0.55) / 0.20;
        return [
          Math.round(16 + t * (245 - 16)),
          Math.round(185 + t * (158 - 185)),
          Math.round(129 + t * (11 - 129))
        ];
      } else {
        const t = (s - 0.75) / 0.25;
        return [
          Math.round(245 + t * (239 - 245)),
          Math.round(158 + t * (68 - 158)),
          Math.round(11 + t * (68 - 11))
        ];
      }
    } else if (pal === 'turbo') {
      // Turbo: Jet / Perceptual Spectrum (Indigo -> Teal -> Green -> Yellow -> Orange -> Crimson)
      if (s < 0.25) {
        const t = s / 0.25;
        return [Math.round(48 + t * (16 - 48)), Math.round(18 + t * (185 - 18)), Math.round(120 + t * (129 - 120))];
      } else if (s < 0.5) {
        const t = (s - 0.25) / 0.25;
        return [Math.round(16 + t * (234 - 16)), Math.round(185 + t * (179 - 185)), Math.round(129 + t * (8 - 129))];
      } else if (s < 0.75) {
        const t = (s - 0.5) / 0.25;
        return [Math.round(234 + t * (249 - 234)), Math.round(179 + t * (115 - 179)), Math.round(8 + t * (22 - 8))];
      } else {
        const t = (s - 0.75) / 0.25;
        return [Math.round(249 + t * (220 - 249)), Math.round(115 + t * (38 - 115)), Math.round(22 + t * (38 - 22))];
      }
    } else {
      // Cyber Neon: Midnight (15, 12, 41) -> Electric Cyan (0, 245, 255) -> Neon Lime (57, 255, 20) -> Bright Magenta (255, 0, 128)
      if (s < 0.33) {
        const t = s / 0.33;
        return [Math.round(15 + t * (0 - 15)), Math.round(12 + t * (245 - 12)), Math.round(41 + t * (255 - 41))];
      } else if (s < 0.66) {
        const t = (s - 0.33) / 0.33;
        return [Math.round(0 + t * (57 - 0)), Math.round(245 + t * (255 - 245)), Math.round(255 + t * (20 - 255))];
      } else {
        const t = (s - 0.66) / 0.34;
        return [Math.round(57 + t * (255 - 57)), Math.round(255 + t * (0 - 255)), Math.round(20 + t * (128 - 20))];
      }
    }
  }, []);

  // Main high-res canvas renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    if (!metrics.hasActiveFace) {
      // Idle state aesthetic
      ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < width; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
      }
      ctx.setLineDash([]);
      return;
    }

    if (viewMode === 'smooth') {
      // 1. Offscreen low-res buffer for bilinear/bicubic sampling
      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(cols, rows);
        let ptr = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const val = gridData[r][c];
            const [red, green, blue] = getColorRGB(val, palette);
            const alpha = val < 0.02 ? 30 : Math.round(180 + val * 75);
            imgData.data[ptr++] = red;
            imgData.data[ptr++] = green;
            imgData.data[ptr++] = blue;
            imgData.data[ptr++] = alpha;
          }
        }
        offCtx.putImageData(imgData, 0, 0);

        // Render with high quality bilinear/bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, width, height);
      }

      // Subtle high-tech radial glow around high risk points
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = gridData[r][c];
          if (val > 0.6) {
            const px = (c + 0.5) * (width / cols);
            const py = (r + 0.5) * (height / rows);
            const rad = (width / cols) * 1.5;
            const grad = ctx.createRadialGradient(px, py, 2, px, py, rad);
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

    } else if (viewMode === 'grid') {
      // 2. High-Tech Precision Grid with rounded cells & glow
      const cellW = width / cols;
      const cellH = height / rows;
      const pad = 1.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = gridData[r][c];
          const px = c * cellW + pad;
          const py = r * cellH + pad;
          const pw = cellW - pad * 2;
          const ph = cellH - pad * 2;

          const [red, green, blue] = getColorRGB(val, palette);
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fillRect(px, py, pw, ph);

          if (val > 0.5) {
            // Anomaly warning dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px + pw / 2, py + ph / 2, Math.max(1.5, pw * 0.15), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

    } else if (viewMode === 'contour') {
      // 3. Contour Isobars
      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(cols, rows);
        let ptr = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const val = gridData[r][c];
            // Step quantized isobars
            const quantized = Math.floor(val * 8) / 8;
            const [red, green, blue] = getColorRGB(quantized, palette);
            imgData.data[ptr++] = red;
            imgData.data[ptr++] = green;
            imgData.data[ptr++] = blue;
            imgData.data[ptr++] = 230;
          }
        }
        offCtx.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(offscreen, 0, 0, width, height);
      }
    }

    // High-tech subtle grid lines overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const stepX = width / cols;
    const stepY = height / rows;
    for (let i = 0; i <= cols; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i * stepX, 0); ctx.lineTo(i * stepX, height); ctx.stroke();
    }
    for (let j = 0; j <= rows; j += 4) {
      ctx.beginPath();
      ctx.moveTo(0, j * stepY); ctx.lineTo(width, j * stepY); ctx.stroke();
    }

  }, [gridData, rows, cols, palette, viewMode, getColorRGB, metrics.hasActiveFace]);

  // Handle canvas mouse move for interactive inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !metrics.hasActiveFace) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const normY = Math.max(0, Math.min(1, clientY / rect.height));

    const cellCol = Math.floor(normX * cols);
    const cellRow = Math.floor(normY * rows);

    const safeCol = Math.min(cols - 1, Math.max(0, cellCol));
    const safeRow = Math.min(rows - 1, Math.max(0, cellRow));

    const score = gridData[safeRow][safeCol];

    const getZone = (r: number, c: number) => {
      const ny = r / rows;
      const nx = c / cols;
      if (nx < 0.15 || nx > 0.85 || ny < 0.1 || ny > 0.88) return 'Boundary Margin';
      if (ny < 0.28) return 'Forehead (Frontal)';
      if (ny < 0.50 && nx < 0.45) return 'Left Orbit (Eye)';
      if (ny < 0.50 && nx > 0.55) return 'Right Orbit (Eye)';
      if (ny >= 0.32 && ny < 0.65 && nx >= 0.40 && nx <= 0.60) return 'Nasal Region';
      if (ny >= 0.50 && ny < 0.75 && nx < 0.38) return 'Left Malar (Cheek)';
      if (ny >= 0.50 && ny < 0.75 && nx > 0.62) return 'Right Malar (Cheek)';
      if (ny >= 0.65 && ny < 0.85) return 'Perioral Complex (Mouth)';
      return 'Mandible / Chin';
    };

    let diag = "Authentic natural skin micro-texture";
    if (score > 0.75) {
      diag = "High-confidence synthetic GAN artifact / boundary seam";
    } else if (score > 0.45) {
      diag = "Elevated blur or color divergence gradient";
    }

    setHoverData({
      x: safeCol,
      y: safeRow,
      score,
      zone: getZone(safeRow, safeCol),
      diagnosis: diag,
      pixelX: clientX,
      pixelY: clientY
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Export high-res PNG snapshot of heatmap
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `veylance-heatmap-forensics-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div 
      ref={containerRef}
      className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-xl flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Forensic Anomaly Heatmap
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                HD 400px MATRIX
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Spatial biometric texture, GAN smoothing & boundary seam analysis
            </p>
          </div>
        </div>

        {/* View mode & Palette pills */}
        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="bg-slate-900/80 p-0.5 rounded-lg border border-slate-700 flex text-xs font-medium">
            <button
              onClick={() => setViewMode('smooth')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'smooth'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Continuous high-resolution thermal gradient"
            >
              HD Smooth
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Precision cell telemetry matrix"
            >
              Matrix
            </button>
            <button
              onClick={() => setViewMode('contour')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'contour'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Isobar gradient contours"
            >
              Isobar
            </button>
          </div>

          {/* Palette selector */}
          <select
            value={palette}
            onChange={(e) => setPalette(e.target.value as ColorPalette)}
            className="bg-slate-900/80 text-xs text-slate-300 border border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
          >
            <option value="thermal">Forensic Thermal</option>
            <option value="turbo">Spectral Turbo</option>
            <option value="cyber">Cyber Neon</option>
          </select>
        </div>
      </div>

      {/* Main Heatmap Visual Area */}
      <div className="relative flex justify-center items-center bg-slate-950 rounded-xl overflow-hidden border border-slate-700/80 p-2 shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="rounded-lg cursor-crosshair max-w-full aspect-square"
          style={{ width: '400px', height: '400px' }}
        />

        {/* Anatomical Face Mesh Wireframe Overlay */}
        {showWireframe && metrics.hasActiveFace && (
          <svg 
            width={400} 
            height={400} 
            className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 hover:opacity-75 transition-opacity"
            viewBox="0 0 400 400"
          >
            {/* Outer Head Contour */}
            <path
              d="M 200,45 C 315,45 355,140 355,230 C 355,325 270,365 200,365 C 130,365 45,325 45,230 C 45,140 85,45 200,45 Z"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Eye Orbits */}
            <ellipse cx="140" cy="170" rx="36" ry="18" fill="none" stroke="#06b6d4" strokeWidth="1" />
            <ellipse cx="260" cy="170" rx="36" ry="18" fill="none" stroke="#06b6d4" strokeWidth="1" />
            {/* Eyebrows */}
            <path d="M 105,145 Q 140,135 175,148" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
            <path d="M 225,148 Q 260,135 295,145" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
            {/* Nose Bridge and Tip */}
            <path d="M 200,160 L 200,240 M 180,245 Q 200,255 220,245" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
            {/* Lips / Mouth */}
            <path d="M 155,290 Q 200,280 245,290 Q 200,320 155,290 Z" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
            {/* Center Axis Grid */}
            <line x1="200" y1="45" x2="200" y2="365" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" strokeDasharray="2 3" />
            <line x1="45" y1="170" x2="355" y2="170" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" strokeDasharray="2 3" />
          </svg>
        )}

        {/* Live Interactive Cursor Tooltip */}
        {hoverData && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 rounded-lg p-2.5 text-xs shadow-2xl transition-all font-mono"
            style={{
              left: Math.min(270, Math.max(10, hoverData.pixelX + 15)),
              top: Math.min(290, Math.max(10, hoverData.pixelY - 30))
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1 mb-1">
              <span className="text-cyan-400 font-bold">{hoverData.zone}</span>
              <span className="text-slate-400 text-[10px]">[{hoverData.x}, {hoverData.y}]</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400">Risk Score:</span>
              <span className={`font-bold ${hoverData.score > 0.6 ? 'text-red-400' : hoverData.score > 0.35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(hoverData.score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-[10px] text-slate-300 italic max-w-[190px]">
              {hoverData.diagnosis}
            </div>
          </div>
        )}

        {/* Top-Right Quick Toggles */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`p-1.5 rounded-md text-xs backdrop-blur-md border transition-all ${
              showWireframe
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Facial Anatomical Wireframe"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded-md text-xs bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md"
            title="Download Forensic Heatmap Image"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Color Legend Bar */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-lg px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            0.0 Safe
          </span>
          <div className="flex-1 mx-3 h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-500 to-red-600 border border-slate-700/50" />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            1.0 Anomaly
          </span>
        </div>
      </div>

      {/* Functional Biometric Readouts */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400">Peak Anomaly</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-base font-mono font-bold ${metrics.peakScore > 0.6 ? 'text-red-400' : 'text-emerald-400'}`}>
              {(metrics.peakScore * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[80px]" title={metrics.peakZone}>
              {metrics.peakZone}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400">Mean Face Risk</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-base font-mono font-bold ${metrics.meanScore > 0.4 ? 'text-amber-400' : 'text-blue-400'}`}>
              {(metrics.meanScore * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">baseline</span>
          </div>
        </div>

        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60 flex flex-col">
          <span className="text-[10px] uppercase font-mono text-slate-400">Area of Concern</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-base font-mono font-bold ${metrics.suspectPct > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
              {metrics.suspectPct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">face area</span>
          </div>
        </div>
      </div>
    </div>
  );
};
