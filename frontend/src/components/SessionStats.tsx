import React, { useState, useEffect, useRef } from 'react';
import { DashboardState, RiskLevel, AuditLogEvent, AuditReportSummary, SignalName } from '../types';
import { AuditReportModal } from './AuditReportModal';

interface SessionStatsProps {
  dashboardState: DashboardState | null;
  sessionKey?: string;
  framesAnalyzed: number;
  alertsTriggered: number;
  sessionDurationSec: number;
  sessionStartTime: string;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ 
  dashboardState, 
  sessionKey,
  framesAnalyzed,
  alertsTriggered,
  sessionDurationSec,
  sessionStartTime
}) => {
  const [events, setEvents] = useState<AuditLogEvent[]>([]);
  const [lastRisk, setLastRisk] = useState<RiskLevel | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const lastEventTimeRef = useRef<number>(0);

  useEffect(() => {
    setEvents([]);
    setLastRisk(null);
  }, [sessionKey]);

  useEffect(() => {
    if (dashboardState) {
      const now = Date.now();
      
      // Debounce rapid repeated state changes within 1000ms
      if (dashboardState.risk_level !== lastRisk) {
        if (now - lastEventTimeRef.current >= 1000) {
          lastEventTimeRef.current = now;
          const dateObj = new Date(now);
          const timeString = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;
          
          let sev: 'info' | 'warning' | 'alert' = 'info';
          if (dashboardState.risk_level === 'ALERT') sev = 'alert';
          else if (dashboardState.risk_level === 'WARNING') sev = 'warning';

          const newEvent: AuditLogEvent = {
            timestamp: timeString,
            type: `STATE_${dashboardState.risk_level}`,
            severity: sev,
            details: dashboardState.alert ? dashboardState.alert.message : `Risk state changed to ${dashboardState.risk_level}`,
            trustScore: dashboardState.trust_score
          };

          // Strictly cap active rendered log items to latest 50 entries
          setEvents(prev => [newEvent, ...prev].slice(0, 50));
          setLastRisk(dashboardState.risk_level);
        }
      }
    }
  }, [dashboardState, lastRisk]);

  // Build report summary
  const signalsSummary: Partial<Record<SignalName, { score: number; status: any; reason: string }>> = {};
  if (dashboardState?.signals) {
    dashboardState.signals.forEach(s => {
      signalsSummary[s.signal] = {
        score: s.score,
        status: s.status,
        reason: s.reason
      };
    });
  }

  const currentRisk = dashboardState?.risk_level || 'HIGH_TRUST';
  const verdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'FLAGGED_DEEPFAKE' = 
    currentRisk === 'ALERT' ? 'FLAGGED_DEEPFAKE' : (currentRisk === 'WARNING' ? 'SUSPICIOUS' : 'AUTHENTIC');

  const reportSummary: AuditReportSummary = {
    sessionId: dashboardState?.session_id || `SES_${Date.now()}`,
    startedAt: sessionStartTime,
    durationSeconds: sessionDurationSec,
    totalFrames: framesAnalyzed,
    finalTrustScore: dashboardState?.trust_score ?? 100,
    riskLevel: currentRisk,
    verifiedVerdict: verdict,
    signalsSummary,
    alertsCount: alertsTriggered,
    events
  };

  return (
    <>
      <div className="h-full flex flex-col justify-between p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg w-full overflow-hidden">
        {/* Top bar: Title "Transition Log" + compact button "[Audit Report]" (shrink-0) */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-1 shrink-0">
          <span className="text-xs font-medium text-zinc-300">Transition Log</span>
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700/80 transition-colors cursor-pointer"
          >
            Audit Report
          </button>
        </div>

        {/* Log list: flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-800/60 */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-800/60 my-1 pr-1 font-mono text-xs">
          {events.length > 0 ? (
            events.map((entry, i) => {
              const isAlert = entry.severity === 'alert';
              const isWarn = entry.severity === 'warning';
              const statusText = isAlert ? 'FLAGGED' : isWarn ? 'WARN' : 'NORMAL';
              const statusColor = isAlert ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400';

              return (
                <div key={i} className="py-1.5 flex items-center justify-between text-zinc-400 hover:bg-zinc-900/30">
                  {/* Col 1: Timestamp */}
                  <span className="text-zinc-500 text-[11px] shrink-0">{entry.timestamp}</span>

                  {/* Col 2: State name */}
                  <span className="text-zinc-300 truncate max-w-[140px] px-2 text-[11px] font-medium">
                    {entry.type}
                  </span>

                  {/* Col 3: Score + Status */}
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                    <span className="text-zinc-400">{entry.trustScore.toFixed(0)}%</span>
                    <span className={`font-semibold ${statusColor}`}>{statusText}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center p-3 text-center text-zinc-600 text-xs font-sans">
              No state transitions logged
            </div>
          )}
        </div>
      </div>

      <AuditReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={reportSummary}
      />
    </>
  );
};
