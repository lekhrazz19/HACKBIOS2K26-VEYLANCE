import React, { useState, useEffect } from 'react';
import { DashboardState, RiskLevel } from '../types';

interface SessionStatsProps {
  dashboardState: DashboardState | null;
}

interface RiskLogEntry {
  level: RiskLevel;
  time: string;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ dashboardState }) => {
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [alertsTriggered, setAlertsTriggered] = useState(0);
  const [riskHistory, setRiskHistory] = useState<RiskLogEntry[]>([]);
  const [lastRisk, setLastRisk] = useState<RiskLevel | null>(null);

  useEffect(() => {
    if (dashboardState) {
      setFramesAnalyzed(prev => prev + 1);
      
      if (dashboardState.alert) {
        // Simple way to count: increment if timestamp is new, but for simplicity we'll just increment when alert is present and changes 
        // Actually, let's keep it simple: just count how many times risk was ALERT
      }
      
      if (dashboardState.risk_level === 'ALERT' && lastRisk !== 'ALERT') {
        setAlertsTriggered(prev => prev + 1);
      }
      
      if (dashboardState.risk_level !== lastRisk) {
        setRiskHistory(prev => {
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const next = [{ level: dashboardState.risk_level, time: timeString }, ...prev];
          return next.slice(0, 5); // Keep last 5
        });
        setLastRisk(dashboardState.risk_level);
      }
    }
  }, [dashboardState]);

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH_TRUST': return 'text-green-400';
      case 'WARNING': return 'text-yellow-400';
      case 'ALERT': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mt-4 w-full">
      <h3 className="text-slate-200 font-semibold mb-3 border-b border-slate-700 pb-2">Session Analytics</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 flex flex-col items-center">
          <span className="text-slate-400 text-xs mb-1">Frames</span>
          <span className="text-xl font-mono text-white">{framesAnalyzed}</span>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 flex flex-col items-center">
          <span className="text-slate-400 text-xs mb-1">Alerts</span>
          <span className="text-xl font-mono text-red-400">{alertsTriggered}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
           <span className="text-slate-400 text-xs">Total Blinks</span>
           <span className="text-lg font-mono text-white">
             {dashboardState?.telemetry?.blink_rate ? Math.floor(dashboardState.telemetry.blink_rate) : '--'}
           </span>
        </div>
      </div>

      <div>
        <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Risk History</h4>
        <div className="flex flex-col gap-1.5">
          {riskHistory.map((entry, i) => (
            <div key={i} className="flex justify-between items-center text-sm font-mono bg-slate-900/30 px-2 py-1 rounded">
              <span className="text-slate-500">{entry.time}</span>
              <span className={getRiskColor(entry.level)}>{entry.level}</span>
            </div>
          ))}
          {riskHistory.length === 0 && (
            <div className="text-slate-500 text-xs italic text-center py-2">No changes yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
