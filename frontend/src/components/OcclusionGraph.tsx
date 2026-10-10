import React from 'react';
import { OcclusionZone } from '../types';

interface OcclusionGraphProps {
  occlusionZones?: OcclusionZone[];
}

export const OcclusionGraph: React.FC<OcclusionGraphProps> = ({ occlusionZones }) => {
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const RADIUS = 74; // Scales to ~80% of the available 200px SVG space
  
  const zones = ["Forehead", "Right Eye", "Mouth/Chin", "Left Eye", "Nose"];
  const numAxes = zones.length;
  const angleStep = (Math.PI * 2) / numAxes;
  
  const getPoint = (value: number, index: number) => {
    const r = RADIUS * value;
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle)
    };
  };

  const getPointsString = (values: number[]) => {
    return values.map((val, i) => {
      const pt = getPoint(val, i);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  const gridCircles = [0.33, 0.66, 1.0];
  
  let values = Array(numAxes).fill(0.08);
  if (occlusionZones && occlusionZones.length > 0) {
    values = zones.map(zoneName => {
      const found = occlusionZones.find(z => z.zone === zoneName);
      return found ? Math.max(0.05, Math.min(1.0, found.score)) : 0.08;
    });
  }

  const hasOcclusion = values.some(v => v > 0.45);

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 w-full overflow-hidden">
      {/* Top micro status indicator (shrink-0) */}
      <div className="flex justify-between items-center text-xs pb-1 shrink-0">
        <span className="text-slate-400 font-sans text-[11px]">Multi-zone occlusion radar</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
          hasOcclusion 
            ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' 
            : 'text-slate-400 bg-[#181c26] border-[#222734]'
        }`}>
          {hasOcclusion ? 'Occluded' : 'Clear'}
        </span>
      </div>
      
      {/* Proportionally Scaled SVG container with explicit containment */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden py-0.5">
        <svg 
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-[170px] aspect-square block overflow-hidden"
        >
          {/* Concentric grid circles */}
          {gridCircles.map((r, i) => (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS * r}
              fill="transparent"
              stroke="#222734"
              strokeWidth="1"
            />
          ))}

          {/* Radar axes & labels */}
          {zones.map((zone, i) => {
            const pt = getPoint(1.0, i);
            const labelPt = getPoint(1.18, i);
            return (
              <g key={zone}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={pt.x}
                  y2={pt.y}
                  stroke="#222734"
                  strokeWidth="1"
                />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontWeight="500"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {zone === "Right Eye" ? "R-Eye" : zone === "Left Eye" ? "L-Eye" : zone === "Mouth/Chin" ? "Mouth" : zone}
                </text>
              </g>
            );
          })}

          {/* Data Polygon */}
          <polygon
            points={getPointsString(values)}
            fill={hasOcclusion ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)"}
            stroke={hasOcclusion ? "#f43f5e" : "#10b981"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {values.map((val, i) => {
            const pt = getPoint(val, i);
            const isWarn = val > 0.45;
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isWarn ? 3 : 2}
                fill={isWarn ? "#f43f5e" : "#10b981"}
              />
            );
          })}
        </svg>
      </div>

      {/* 5 zone metrics chips placed directly beneath (shrink-0) */}
      <div className="flex justify-between items-center pt-2 border-t border-[#222734]/70 mt-1 shrink-0">
        {zones.map((z, idx) => {
          const score = values[idx];
          const isBad = score > 0.45;
          const label = z === "Right Eye" ? "R-Eye" : z === "Left Eye" ? "L-Eye" : z === "Mouth/Chin" ? "Mouth" : z;
          return (
            <div key={z} className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <span className="font-sans text-slate-500">{label}</span>
              <span className={`font-semibold ${isBad ? 'text-rose-400' : 'text-zinc-200'}`}>
                {Math.round(score * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
