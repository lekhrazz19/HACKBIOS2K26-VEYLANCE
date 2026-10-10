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

  let verdictColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let verdictText = 'VERIFIED AUTHENTIC';
  let verdictDesc = 'All 5 biometric signals conformed to natural human baselines.';

  if (isAlert) {
    verdictColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    verdictText = 'ANOMALIES DETECTED';
    verdictDesc = 'Multiple signal baselines violated. Probable synthetic face manipulation.';
  } else if (isWarn) {
    verdictColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    verdictText = 'SUSPICIOUS / INCONCLUSIVE';
    verdictDesc = 'Borderline biometric indicators. Recommend physical interactive challenge.';
  }

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `veylance-audit-${report.sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 text-zinc-300 font-sans my-8">
        {/* Document Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Biometric Forensic Audit Record
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              ID: {report.sessionId} | Started: {report.startedAt}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Verdict Box */}
        <div className={`p-3.5 rounded border flex items-center justify-between gap-4 ${verdictColor}`}>
          <div>
            <span className="text-xs font-semibold tracking-wide block">
              {verdictText}
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              {verdictDesc}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-zinc-500 uppercase block font-mono">Trust Score</span>
            <span className="text-2xl font-mono font-bold text-zinc-100">{report.finalTrustScore.toFixed(0)}%</span>
          </div>
        </div>

        {/* Audit Metrics Table */}
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
            <span className="text-zinc-500 text-[11px] block font-sans">Duration</span>
            <span className="text-sm font-medium text-zinc-200 mt-0.5 block">{report.durationSeconds}s</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
            <span className="text-zinc-500 text-[11px] block font-sans">Frames</span>
            <span className="text-sm font-medium text-zinc-200 mt-0.5 block">{report.totalFrames}</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
            <span className="text-zinc-500 text-[11px] block font-sans">Anomalies</span>
            <span className={`text-sm font-medium mt-0.5 block ${report.alertsCount > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
              {report.alertsCount}
            </span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
            <span className="text-zinc-500 text-[11px] block font-sans">Risk Level</span>
            <span className="text-sm font-medium text-zinc-200 mt-0.5 block">{report.riskLevel}</span>
          </div>
        </div>

        {/* High-density Vector Table */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-zinc-400">
            Signal Vector Verification
          </span>
          <div className="bg-zinc-900/40 rounded border border-zinc-800 overflow-hidden divide-y divide-zinc-800 text-xs font-mono">
            {(['S1', 'S2', 'S3', 'S4', 'S5'] as const).map(sig => {
              const result = report.signalsSummary[sig];
              const score = result ? (result.score * 100).toFixed(0) : '0';
              const status = result?.status || 'NORMAL';
              const color = status === 'ALERT' ? 'text-rose-400' : status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400';

              return (
                <div key={sig} className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px] font-bold">{sig}</span>
                    <span className="text-zinc-300 font-sans text-xs">
                      {sig === 'S1' ? 'Boundary Seams' : sig === 'S2' ? 'Face Occlusion' : sig === 'S3' ? 'Skin Texture' : sig === 'S4' ? 'Blink Dynamics' : 'Lip-Voice Sync'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 text-[11px]">Score: {score}%</span>
                    <span className={`font-medium ${color}`}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discrete Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700/80 text-xs font-medium transition-colors cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700/80 text-xs font-medium transition-colors cursor-pointer"
            >
              Export JSON
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
