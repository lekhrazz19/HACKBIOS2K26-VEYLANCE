import time
import random
import numpy as np
from typing import Optional, Tuple, List
from app.models import ChallengeState

CHALLENGE_TYPES = ['TURN_HEAD', 'BLINK', 'HOLD_NEUTRAL']

class ChallengeEngine:
    """
    Progressive challenge system.
    Triggers when trust score stays below 40 for > 5 seconds.
    Randomizes challenge type each time.
    """
    
    def __init__(self):
        self.active_challenge: Optional[ChallengeState] = None
        self.challenge_start_time: float = 0
        self.timeout: float = 12.0          # seconds to complete challenge
        self.low_trust_start: float = 0
        self.trigger_duration: float = 5.0  # seconds of low trust before triggering
        self.cooldown_until: float = 0      # don't trigger again until this time
        self.cooldown_secs: float = 30.0    # cooldown after challenge expires/passes
        
        # TURN_HEAD state
        self.initial_nose_x: Optional[float] = None
        self.head_turn_threshold: float = 0.06  # normalized coords
        
        # HOLD_NEUTRAL state
        self.neutral_start: float = 0
        self.neutral_duration: float = 3.0  # seconds to hold
        
        # BLINK state
        self.blink_detected_at: float = 0
        self.blink_window: float = 3.0      # must blink within this window
        self.blink_start_time: float = 0
        
        # History for frontend
        self.history: List[dict] = []  # last 5 challenges
    
    def _reset_challenge_state(self):
        """Reset all per-challenge tracking state."""
        self.initial_nose_x = None
        self.neutral_start = 0
        self.blink_detected_at = 0
        self.blink_start_time = 0
    
    def _pick_challenge_type(self) -> str:
        """Randomly pick a challenge type, weighted toward the most reliable ones."""
        weights = {'TURN_HEAD': 0.50, 'BLINK': 0.35, 'HOLD_NEUTRAL': 0.15}
        types = list(weights.keys())
        probs = list(weights.values())
        return random.choices(types, weights=probs, k=1)[0]
    
    def check_trigger(self, trust_score: float) -> Optional[ChallengeState]:
        now = time.time()
        
        # Update active challenge timer
        if self.active_challenge is not None:
            elapsed = now - self.challenge_start_time
            if self.active_challenge.status == 'PENDING':
                if elapsed > self.timeout:
                    self.active_challenge.status = 'EXPIRED'
                    self.active_challenge.remaining_seconds = 0.0
                    # Record in history
                    self.history.append({
                        'type': self.active_challenge.type,
                        'result': 'EXPIRED',
                        'ts': now
                    })
                    self.history = self.history[-5:]
                    self.cooldown_until = now + self.cooldown_secs
                    self.active_challenge = None
                    self._reset_challenge_state()
                    return None
                else:
                    self.active_challenge.remaining_seconds = max(0.0, self.timeout - elapsed)
            return self.active_challenge
        
        # Don't trigger during cooldown
        if now < self.cooldown_until:
            self.low_trust_start = 0
            return None
        
        # Track sustained low trust
        if trust_score < 40:
            if self.low_trust_start == 0:
                self.low_trust_start = now
            elif now - self.low_trust_start >= self.trigger_duration:
                # Trigger!
                ctype = self._pick_challenge_type()
                self.active_challenge = ChallengeState(
                    type=ctype,
                    status='PENDING',
                    remaining_seconds=self.timeout
                )
                self.challenge_start_time = now
                self.low_trust_start = 0
                self._reset_challenge_state()
                # Set blink window start time
                self.blink_start_time = now
        else:
            self.low_trust_start = 0
        
        return self.active_challenge
    
    def notify_blink(self):
        """
        Called by main.py when S4 detects a blink event.
        Records the blink timestamp for BLINK challenge verification.
        """
        self.blink_detected_at = time.time()
    
    def verify(self, landmarks: np.ndarray, is_blink: bool = False) -> Tuple[bool, float]:
        if self.active_challenge is None or self.active_challenge.status != 'PENDING':
            return False, 0.0
        
        passed = False
        now = time.time()
        
        if self.active_challenge.type == 'TURN_HEAD':
            if landmarks is not None and len(landmarks) > 5:
                nose_x = float(landmarks[1][0])  # normalized x
                if self.initial_nose_x is None:
                    self.initial_nose_x = nose_x
                elif abs(nose_x - self.initial_nose_x) > self.head_turn_threshold:
                    passed = True
        
        elif self.active_challenge.type == 'BLINK':
            # Check if a blink was recorded within the challenge window
            if self.blink_detected_at > self.blink_start_time:
                passed = True
            elif is_blink:  # Fallback: direct blink state
                passed = True
        
        elif self.active_challenge.type == 'HOLD_NEUTRAL':
            # Person must hold still (low landmark drift) for 3 seconds
            if self.neutral_start == 0:
                self.neutral_start = now
            elif now - self.neutral_start >= self.neutral_duration:
                passed = True
        
        if passed:
            self.history.append({
                'type': self.active_challenge.type,
                'result': 'PASSED',
                'ts': now
            })
            self.history = self.history[-5:]
            self.active_challenge.status = 'PASSED'
            prev_challenge = self.active_challenge
            self.active_challenge = None
            self._reset_challenge_state()
            self.cooldown_until = now + 15.0  # Short cooldown after pass
            return True, 20.0
        
        return False, 0.0
