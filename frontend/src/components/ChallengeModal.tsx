import React from 'react';
import { ChallengeState } from '../types';

interface ChallengeModalProps {
  challenge: ChallengeState | null;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({ challenge }) => {
  if (!challenge) return null;

  let content = null;

  if (challenge.status === 'PENDING') {
    let instruction = '';
    switch (challenge.type) {
      case 'BLINK':
        instruction = 'Please blink naturally 2 to 3 times';
        break;
      case 'TURN_HEAD':
        instruction = 'Slowly turn head to the side, then return to center';
        break;
      case 'HOLD_NEUTRAL':
        instruction = 'Hold still with a neutral expression for 3 seconds';
        break;
      default:
        instruction = 'Please complete the physical liveness verification';
    }

    const progressPct = Math.max(0, Math.min(100, (challenge.remaining_seconds / 10) * 100));

    content = (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Interactive Liveness Challenge</span>
          <span className="text-xs font-mono text-zinc-300">{Math.ceil(challenge.remaining_seconds)}s remaining</span>
        </div>

        <h2 className="text-base font-semibold text-zinc-100">{instruction}</h2>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-zinc-200 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    );
  } else if (challenge.status === 'PASSED') {
    content = (
      <div className="flex items-center gap-3 text-emerald-400">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Verification Passed</h2>
          <p className="text-xs text-zinc-400">Biometric liveness challenge completed successfully.</p>
        </div>
      </div>
    );
  } else if (challenge.status === 'FAILED' || challenge.status === 'EXPIRED') {
    content = (
      <div className="flex items-center gap-3 text-rose-400">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            {challenge.status === 'EXPIRED' ? 'Verification Expired' : 'Verification Failed'}
          </h2>
          <p className="text-xs text-zinc-400">Liveness verification was not satisfied within the allotted time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg shadow-2xl max-w-md w-full">
        {content}
      </div>
    </div>
  );
};
