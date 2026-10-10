import React, { useState } from 'react';
import { HeatmapPanel } from './HeatmapPanel';
import { OcclusionGraph } from './OcclusionGraph';
import { OcclusionZone } from '../types';

interface SpatialAnalyticsProps {
  heatmap?: number[][];
  occlusionZones?: OcclusionZone[];
}

export const SpatialAnalytics: React.FC<SpatialAnalyticsProps> = ({ heatmap, occlusionZones }) => {
  const [activeTab, setActiveTab] = useState<'occlusion' | 'heatmap'>('occlusion');

  return (
    <div className="h-full flex flex-col justify-between p-3.5 bg-[#12151c]/90 border border-[#222734] rounded-lg w-full overflow-hidden shadow-xs">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-[#222734] pb-2 mb-1 shrink-0">
        <div className="flex items-center gap-1 bg-[#181c26] p-0.5 rounded border border-[#222734]">
          <button
            onClick={() => setActiveTab('occlusion')}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'occlusion'
                ? 'bg-[#1e2330] text-zinc-100 shadow-xs'
                : 'text-slate-400 hover:text-zinc-200'
            }`}
          >
            Occlusion Radar
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-[#1e2330] text-zinc-100 shadow-xs'
                : 'text-slate-400 hover:text-zinc-200'
            }`}
          >
            Heatmap
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500">
          {activeTab === 'occlusion' ? '5 Zones' : '20x20 Grid'}
        </span>
      </div>

      {/* Tab Content Container Locked with min-h-0 */}
      <div className="flex-1 flex flex-col justify-between min-h-0 w-full overflow-hidden">
        {activeTab === 'occlusion' ? (
          <OcclusionGraph occlusionZones={occlusionZones} />
        ) : (
          <HeatmapPanel heatmap={heatmap} />
        )}
      </div>
    </div>
  );
};
