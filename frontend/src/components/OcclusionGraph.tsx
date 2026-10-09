import React from 'react';
import { OcclusionZone } from '../types';

interface OcclusionGraphProps {
  occlusionZones?: OcclusionZone[];
}

export const OcclusionGraph: React.FC<OcclusionGraphProps> = ({ occlusionZones }) => {
  const SIZE = 300;
  const CENTER = SIZE / 2;
  const RADIUS = 100;
  
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
  let values = Array(numAxes).fill(0.1);
  if (occlusionZones && occlusionZones.length > 0) {
    // Map scores to the fixed zone order to ensure correct polygon shape
    values = zones.map(zoneName => {
      const found = occlusionZones.find(z => z.zone === zoneName);
      return found ? Math.max(0.01, Math.min(1, found.score)) : 0.1;
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold text-white mb-4">Face Zone Analysis</h3>
      
      <svg width={SIZE} height={SIZE}>
        {/* Background Grid Circles */}
        {gridCircles.map((r, i) => (
          <circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * r}
            fill="none"
            stroke="#4B5563"
            strokeWidth="1"
            strokeDasharray={i === gridCircles.length - 1 ? "" : "4 4"}
          />
        ))}

        {/* Axes and Labels */}
        {zones.map((zone, i) => {
          const pt = getPoint(1.0, i);
          const labelPt = getPoint(1.25, i);
          return (
            <g key={zone}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={pt.x}
                y2={pt.y}
                stroke="#4B5563"
                strokeWidth="1"
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                fill="#9CA3AF"
                fontSize="12"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {zone}
              </text>
            </g>
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={getPointsString(values)}
          fill="rgba(239, 68, 68, 0.3)"
          stroke="#ef4444"
          strokeWidth="2"
        />
        
        {/* Data Points */}
        {values.map((val, i) => {
          const pt = getPoint(val, i);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="#ef4444"
            />
          );
        })}
      </svg>
    </div>
  );
};
