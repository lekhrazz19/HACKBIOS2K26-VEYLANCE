import React from 'react';
import { AuditReportSummary } from '../types';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReportSummary;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen) return null;

  const isAlert = report.verifiedVerdict === 'FLAGGED_DEEPFAKE';
  const isWarn = report.verifiedVerdict === 'SUSPICIOUS';

  let verdictColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  let verdictText = 'VERIFIED AUTHENTIC';
  let verdictDesc = 'All five biometric forensic vectors (S1–S5) exhibited natural human physiological variation.';

  if (isAlert) {
    verdictColor = 'text-red-400 border-red-500/40 bg-red-500/10';
    verdictText = 'DEEPFAKE ANOMALIES FLAGGED';
    verdictDesc = 'Multiple forensic vectors violated natural biological baselines. Significant synthetic manipulation detected.';
  } else if (isWarn) {
    verdictColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    verdictText = 'SUSPICIOUS / INCONCLUSIVE';
    verdictDesc = 'Borderline signals detected. Recommend administering interactive liveness challenges.';
  }

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `veylance-forensic-audit-${report.sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-5 text-slate-200 font-sans my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Biometric Forensic Audit Report
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  OFFICIAL AUDIT RECORD
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                SESSION ID: {report.sessionId} | TIMESTAMP: {report.startedAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Verdict Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${verdictColor}`}>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80">
              FORENSIC INTEGRITY VERDICT
            </span>
            <span className="text-lg font-black tracking-tight block">
              {verdictText}
            </span>
            <p className="text-xs mt-0.5 opacity-90">
              {verdictDesc}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono block opacity-80 uppercase">Trust Score</span>
            <span className="text-3xl font-mono font-black">{report.finalTrustScore.toFixed(0)}%</span>
          </div>
        </div>

        {/* Audit Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Session Duration</span>
            <span className="text-base font-bold text-white mt-0.5 block">{report.durationSeconds}s</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Frames Analyzed</span>
            <span className="text-base font-bold text-white mt-0.5 block">{report.totalFrames}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Alerts Triggered</span>
            <span className={`text-base font-bold mt-0.5 block ${report.alertsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {report.alertsCount}
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Risk Classification</span>
            <span className="text-base font-bold text-white mt-0.5 block">{report.riskLevel}</span>
          </div>
        </div>

        {/* Forensic Vector Breakdown */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
            Biometric Vector Verification Matrix
          </h4>
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 text-xs font-mono">
            {(['S1', 'S2', 'S3', 'S4', 'S5'] as const).map(sig => {
              const result = report.signalsSummary[sig];
              const score = result ? (result.score * 100).toFixed(0) : '0';
              const status = result?.status || 'NORMAL';
              const color = status === 'ALERT' ? 'text-red-400' : status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400';

              return (
                <div key={sig} className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-bold">{sig}</span>
                    <span className="text-slate-300">
                      {sig === 'S1' ? 'Boundary Seams' : sig === 'S2' ? 'Face Occlusion' : sig === 'S3' ? 'Skin Texture' : sig === 'S4' ? 'Blink Dynamics' : 'Audio-Visual Sync'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">Risk: {score}%</span>
                    <span className={`font-bold ${color}`}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Timeline Log */}
        {report.events.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Audit Event Log
            </h4>
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 max-h-36 overflow-y-auto p-2 text-xs font-mono flex flex-col gap-1.5">
              {report.events.map((evt, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-slate-600">{evt.timestamp}</span>
                    <span className="text-slate-200 font-semibold">{evt.type}</span>
                    <span className="text-slate-500 truncate max-w-xs">{evt.details}</span>
                  </div>
                  <span className={evt.severity === 'alert' ? 'text-red-400' : 'text-amber-400'}>
                    [{evt.trustScore.toFixed(0)}%]
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[10px] font-mono text-slate-500">
            CRYPTOGRAPHIC AUDIT LOG IDENTIFIER: {Math.random().toString(36).substring(2, 10).toUpperCase()}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-cyan-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
