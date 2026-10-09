import time
import numpy as np
from typing import Optional, Tuple
from app.models import ChallengeState

class ChallengeEngine:
    def __init__(self):
        self.active_challenge = None
        self.challenge_start_time = 0
        self.timeout = 10.0
        self.low_trust_start = 0
        self.trigger_duration = 5.0
        self.initial_nose_x = None
        self.neutral_start = 0

    def check_trigger(self, trust_score: float) -> Optional[ChallengeState]:
        now = time.time()
        
        if self.active_challenge is not None:
            elapsed = now - self.challenge_start_time
            if elapsed > self.timeout and self.active_challenge.status == 'PENDING':
                self.active_challenge.status = 'EXPIRED'
                self.active_challenge.remaining_seconds = 0.0
            else:
                self.active_challenge.remaining_seconds = max(0.0, self.timeout - elapsed)
            return self.active_challenge

        if trust_score < 40:
            if self.low_trust_start == 0:
                self.low_trust_start = now
            elif now - self.low_trust_start >= self.trigger_duration:
                self.active_challenge = ChallengeState(
                    type='TURN_HEAD',
                    status='PENDING',
                    remaining_seconds=self.timeout
                )
                self.challenge_start_time = now
                self.initial_nose_x = None
                self.low_trust_start = 0
        else:
            self.low_trust_start = 0
            
        return self.active_challenge

    def verify(self, landmarks: np.ndarray, is_blink: bool = False) -> Tuple[bool, float]:
        if self.active_challenge is None or self.active_challenge.status != 'PENDING':
            return False, 0.0
            
        passed = False
        now = time.time()
        
        if self.active_challenge.type == 'BLINK':
            if is_blink:
                passed = True
        elif self.active_challenge.type == 'TURN_HEAD':
            if landmarks is not None and len(landmarks) > 1:
                nose_x = landmarks[1][0]
                if self.initial_nose_x is None:
                    self.initial_nose_x = nose_x
                elif abs(nose_x - self.initial_nose_x) > 0.05:
                    passed = True
        elif self.active_challenge.type == 'HOLD_NEUTRAL':
            if self.neutral_start == 0:
                self.neutral_start = now
            elif now - self.neutral_start > 3.0:
                passed = True
                
        if passed:
            self.active_challenge.status = 'PASSED'
            self.active_challenge = None
            return True, 20.0
            
        return False, 0.0
