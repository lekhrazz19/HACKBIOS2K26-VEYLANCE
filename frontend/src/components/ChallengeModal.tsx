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
        instruction = 'Please blink naturally 2-3 times';
        break;
      case 'TURN_HEAD':
        instruction = 'Please slowly turn your head to the side and back';
        break;
      case 'HOLD_NEUTRAL':
        instruction = 'Please hold still with a neutral expression for 3 seconds';
        break;
      default:
        instruction = 'Please complete the challenge';
    }

    content = (
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">{instruction}</h2>
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#334155" strokeWidth="8" fill="transparent" />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              stroke="#3b82f6" 
              strokeWidth="8" 
              fill="transparent"
              strokeDasharray="283"
              strokeDashoffset={283 - (challenge.remaining_seconds / 10) * 283} // assuming 10s max
              className="transition-all duration-1000 linear"
            />
          </svg>
          <span className="text-4xl font-bold text-white">{Math.ceil(challenge.remaining_seconds)}</span>
        </div>
      </div>
    );
  } else if (challenge.status === 'PASSED') {
    content = (
      <div className="flex flex-col items-center text-green-500">
        <svg className="w-32 h-32 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <h2 className="text-3xl font-bold">Passed</h2>
      </div>
    );
  } else if (challenge.status === 'FAILED' || challenge.status === 'EXPIRED') {
    content = (
      <div className="flex flex-col items-center text-red-500">
        <svg className="w-32 h-32 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <h2 className="text-3xl font-bold">{challenge.status === 'EXPIRED' ? 'Expired' : 'Failed'}</h2>
      </div>
    );
  }

  // Hide PASSED/FAILED/EXPIRED if it's not pending after a short delay (controlled by parent state ideally, but we show it here as long as it's active)
  
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full">
        {content}
      </div>
    </div>
  );
};
