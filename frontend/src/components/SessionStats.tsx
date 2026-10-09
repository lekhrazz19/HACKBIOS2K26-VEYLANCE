import React, { useState, useEffect } from 'react';
import { DashboardState, RiskLevel, AuditLogEvent, AuditReportSummary, SignalName } from '../types';
import { AuditReportModal } from './AuditReportModal';

interface SessionStatsProps {
  dashboardState: DashboardState | null;
  sessionKey?: string;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ dashboardState, sessionKey }) => {
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [alertsTriggered, setAlertsTriggered] = useState(0);
  const [events, setEvents] = useState<AuditLogEvent[]>([]);
  const [lastRisk, setLastRisk] = useState<RiskLevel | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [sessionStartTime] = useState(() => new Date().toLocaleTimeString());
  const [sessionDurationSec, setSessionDurationSec] = useState(0);

  useEffect(() => {
    setFramesAnalyzed(0);
    setAlertsTriggered(0);
    setEvents([]);
    setSessionDurationSec(0);
  }, [sessionKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDurationSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (dashboardState) {
      setFramesAnalyzed(prev => prev + 1);
      
      if (dashboardState.risk_level === 'ALERT' && lastRisk !== 'ALERT') {
        setAlertsTriggered(prev => prev + 1);
      }
      
      if (dashboardState.risk_level !== lastRisk) {
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        let sev: 'info' | 'warning' | 'alert' = 'info';
        if (dashboardState.risk_level === 'ALERT') sev = 'alert';
        else if (dashboardState.risk_level === 'WARNING') sev = 'warning';

        const newEvent: AuditLogEvent = {
          timestamp: timeString,
          type: `RISK_STATE_${dashboardState.risk_level}`,
          severity: sev,
          details: dashboardState.alert ? dashboardState.alert.message : `Trust index transition to ${dashboardState.risk_level}`,
          trustScore: dashboardState.trust_score
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 10));
        setLastRisk(dashboardState.risk_level);
      }
    }
  }, [dashboardState, lastRisk]);

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH_TRUST': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'WARNING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'ALERT': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

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
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-xl flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center border-b border-slate-700/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"></span>
            <h3 className="text-base font-bold text-white tracking-wide">Session Intelligence & Audit</h3>
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Forensic Audit</span>
          </button>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 flex flex-col items-center">
            <span className="text-slate-500 text-[10px] font-mono uppercase">Frames</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5">{framesAnalyzed}</span>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 flex flex-col items-center">
            <span className="text-slate-500 text-[10px] font-mono uppercase">Alerts</span>
            <span className={`text-lg font-mono font-bold mt-0.5 ${alertsTriggered > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {alertsTriggered}
            </span>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 flex flex-col items-center">
            <span className="text-slate-500 text-[10px] font-mono uppercase">Duration</span>
            <span className="text-lg font-mono font-bold text-cyan-400 mt-0.5">{sessionDurationSec}s</span>
          </div>
        </div>

        {/* Live Risk Timeline */}
        <div>
          <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
            <span>Incident & Risk Transition Log</span>
            <span className="text-slate-600">LIVE FEED</span>
          </h4>
          <div className="flex flex-col gap-1.5">
            {events.map((entry, i) => (
              <div key={i} className="flex justify-between items-center text-xs font-mono bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{entry.timestamp}</span>
                  <span className="text-slate-300 font-semibold">{entry.type}</span>
                </div>
                <span className={`px-2 py-0.2 rounded border text-[10px] font-bold ${getRiskColor(entry.type.replace('RISK_STATE_', '') as RiskLevel)}`}>
                  {entry.trustScore.toFixed(0)}%
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-slate-500 text-xs italic text-center py-3 bg-slate-950/40 rounded-lg border border-slate-800/50">
                Session active — no risk transitions logged
              </div>
            )}
          </div>
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
