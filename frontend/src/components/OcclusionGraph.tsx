import React from 'react';
import { OcclusionZone } from '../types';

interface OcclusionGraphProps {
  occlusionZones?: OcclusionZone[];
}

export const OcclusionGraph: React.FC<OcclusionGraphProps> = ({ occlusionZones }) => {
  const SIZE = 320;
  const CENTER = SIZE / 2;
  const RADIUS = 105;
  
  const zones = ["Forehead", "Right Eye", "Mouth/Chin", "Left Eye", "Nose"];
  const numAxes = zones.length;
  const angleStep = (Math.PI * 2) / numAxes;
  
  // -PI/2 is the top (Forehead)
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

  const gridCircles = [0.25, 0.5, 0.75, 1.0];
  
  // Default values if no zones
  let values = Array(numAxes).fill(0.08);
  if (occlusionZones && occlusionZones.length > 0) {
    values = zones.map(zoneName => {
      const found = occlusionZones.find(z => z.zone === zoneName);
      return found ? Math.max(0.05, Math.min(1.0, found.score)) : 0.08;
    });
  }

  // Check if any zone is heavily occluded (> 0.5)
  const hasOcclusion = values.some(v => v > 0.45);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-xl flex flex-col items-center justify-between">
      <div className="w-full flex justify-between items-center border-b border-slate-700/70 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Face Zone Occlusion Radar
          </h3>
        </div>
        <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
          hasOcclusion 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {hasOcclusion ? 'PARTIAL OCCLUSION DETECTED' : 'ALL ZONES CLEAR'}
        </span>
      </div>
      
      <div className="relative my-2">
        <svg width={SIZE} height={SIZE} className="overflow-visible">
          {/* Subtle concentric grid circles */}
          {gridCircles.map((r, i) => (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS * r}
              fill={i === gridCircles.length - 1 ? "rgba(15, 23, 42, 0.6)" : "transparent"}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray={i === gridCircles.length - 1 ? "" : "3 3"}
            />
          ))}

          {/* Radar sweep lines & labels */}
          {zones.map((zone, i) => {
            const pt = getPoint(1.0, i);
            const labelPt = getPoint(1.22, i);
            return (
              <g key={zone}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={pt.x}
                  y2={pt.y}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  fill="#94A3B8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {zone}
                </text>
              </g>
            );
          })}

          {/* Shaded Data Polygon */}
          <polygon
            points={getPointsString(values)}
            fill={hasOcclusion ? "rgba(245, 158, 11, 0.25)" : "rgba(6, 182, 212, 0.2)"}
            stroke={hasOcclusion ? "#f59e0b" : "#06b6d4"}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          
          {/* Active Data Points */}
          {values.map((val, i) => {
            const pt = getPoint(val, i);
            const isWarn = val > 0.45;
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isWarn ? 5 : 3.5}
                fill={isWarn ? "#ef4444" : "#06b6d4"}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Zone telemetry badges */}
      <div className="w-full grid grid-cols-5 gap-1.5 pt-3 border-t border-slate-700/60 text-center">
        {zones.map((z, idx) => {
          const score = values[idx];
          const isBad = score > 0.45;
          return (
            <div key={z} className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-700/50 flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-400 truncate max-w-full">{z}</span>
              <span className={`text-[11px] font-mono font-bold mt-0.5 ${isBad ? 'text-amber-400' : 'text-emerald-400'}`}>
                {Math.round(score * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
