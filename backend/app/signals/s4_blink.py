import numpy as np
import time
from collections import deque
from app.models import SignalResult

class S4BlinkDetector:
    """
    S4: Eye Blink & Temporal Physiology Signal.
    
    Detects deepfakes via eye closure dynamics and blink frequency anomalies.
    Includes:
    - Adaptive personal open-eye EAR baseline calibration.
    - Warmup / calibration period (15s) so new sessions don't trigger false alerts.
    - Physiological blink duration (80ms - 450ms) and EAR asymmetry validation.
    """
    
    WARMUP_SECS = 15.0  # Grace period for session start to learn baseline
    
    def __init__(self):
        self.blink_events = deque()
        self.in_blink = False
        self.current_ear = 0.0
        self.open_ear_baseline = 0.28  # Running baseline for open eyes
        self.blink_rate = 0.0
        self.regularity_cv = 0.0
        self.avg_blink_duration_ms = 0.0
        self.observation_time = 0.0
        self.calibrated = False
        
        self.start_time = None
        self.current_blink_ears = []
        self.deepfake_probability = 0.0
        self.ibi_history = []
        self._prev_blink_count = 0

    def _calculate_ear(self, landmarks):
        # MediaPipe eye landmarks:
        # Left eye: [33, 160, 158, 133, 153, 144]
        # Right eye: [362, 385, 387, 263, 373, 380]
        
        def eye_aspect_ratio(eye_pts):
            p2_p6 = np.linalg.norm(eye_pts[1, :2] - eye_pts[5, :2])
            p3_p5 = np.linalg.norm(eye_pts[2, :2] - eye_pts[4, :2])
            p1_p4 = np.linalg.norm(eye_pts[0, :2] - eye_pts[3, :2])
            
            if p1_p4 < 1e-6:
                return 0.0
            return float((p2_p6 + p3_p5) / (2.0 * p1_p4))

        left_eye_indices = [33, 160, 158, 133, 153, 144]
        right_eye_indices = [362, 385, 387, 263, 373, 380]
        
        left_eye = landmarks[left_eye_indices]
        right_eye = landmarks[right_eye_indices]
        
        ear_left = eye_aspect_ratio(left_eye)
        ear_right = eye_aspect_ratio(right_eye)
        
        return (ear_left + ear_right) / 2.0

    def process(self, landmarks: np.ndarray) -> SignalResult:
        current_time = time.time()
        if self.start_time is None:
            self.start_time = current_time
            
        self.observation_time = current_time - self.start_time
        
        # Remove old blink events > 35s ago
        while self.blink_events and current_time - self.blink_events[0]['timestamp'] > 35.0:
            self.blink_events.popleft()
            
        self.current_ear = self._calculate_ear(landmarks)
        
        # Update running open-eye baseline when eyes appear open (0.18 <= EAR <= 0.42 and not in blink)
        if not self.in_blink and 0.18 <= self.current_ear <= 0.45:
            # Smoothly adapt to user's natural open-eye ratio
            self.open_ear_baseline = 0.96 * self.open_ear_baseline + 0.04 * self.current_ear
        
        # Dynamic blink threshold relative to user's open-eye baseline:
        # A true blink occurs when EAR drops to ~72% of open-eye resting state, capped sensibly.
        blink_thresh = min(0.23, max(0.16, self.open_ear_baseline * 0.72))
        
        # Blink State Machine
        if self.current_ear < blink_thresh:
            if not self.in_blink:
                self.in_blink = True
                self.current_blink_ears = []
            self.current_blink_ears.append((current_time, self.current_ear))
        else:
            if self.in_blink:
                self.in_blink = False
                if len(self.current_blink_ears) > 0:
                    t_start = self.current_blink_ears[0][0]
                    t_end = current_time
                    duration_s = t_end - t_start
                    duration_ms = duration_s * 1000.0
                    
                    # Physiological blink duration: 75ms to 450ms
                    if 75.0 <= duration_ms <= 450.0:
                        min_ear = min([e[1] for e in self.current_blink_ears])
                        min_idx = np.argmin([e[1] for e in self.current_blink_ears])
                        t_min = self.current_blink_ears[min_idx][0]
                        
                        closure_time = max(0.001, t_min - t_start)
                        opening_time = max(0.001, t_end - t_min)
                        
                        closure_speed = (blink_thresh - min_ear) / closure_time
                        opening_speed = (blink_thresh - min_ear) / opening_time
                        
                        asymmetry_ratio = closure_speed / opening_speed if opening_speed > 0 else 1.0
                        
                        self.blink_events.append({
                            'timestamp': t_start,
                            'duration_ms': duration_ms,
                            'min_ear': min_ear,
                            'asymmetry_ratio': asymmetry_ratio
                        })

        blinks_in_window = len(self.blink_events)
        window_duration = min(30.0, max(1.0, self.observation_time))
        self.blink_rate = (blinks_in_window / window_duration) * 60.0

        # WARMUP / CALIBRATION PERIOD:
        # Wait at least 15 seconds or until at least 2 natural blinks occur before judging
        if self.observation_time < self.WARMUP_SECS and blinks_in_window < 2:
            self.calibrated = False
            warmup_progress = min(1.0, self.observation_time / self.WARMUP_SECS)
            reason = f"Calibrating baseline ({self.observation_time:.1f}s / {self.WARMUP_SECS:.0f}s) | Base EAR: {self.open_ear_baseline:.3f} | Blinks: {blinks_in_window}"
            
            self.deepfake_probability = 0.0
            return SignalResult(
                signal='S4',
                score=0.0,
                confidence=float(0.15 + 0.25 * warmup_progress),
                status='NORMAL',
                reason=reason,
                timestamp=float(current_time)
            )

        self.calibrated = True

        # 1. Rate Score (Normal human rate: 10 - 24 blinks/min)
        rate_score = 0.0
        if self.observation_time >= 20.0:
            if self.blink_rate < 8:
                # Progressively penalize complete absence of blinks only after sufficient observation
                rate_score = max(0.0, min(1.0, (8 - self.blink_rate) / 8.0))
            elif self.blink_rate > 26:
                rate_score = max(0.0, min(1.0, (self.blink_rate - 26) / 20.0))
        elif self.observation_time >= 15.0 and blinks_in_window < 1:
            rate_score = 0.35  # Mild warning if no blinks yet at 15-20s

        # 2. Regularity Score (CV)
        regularity_score = 0.0
        self.regularity_cv = 0.0
        if blinks_in_window >= 4:
            timestamps = [b['timestamp'] for b in self.blink_events]
            intervals = np.diff(timestamps)
            if len(intervals) > 0 and np.mean(intervals) > 0:
                self.regularity_cv = float(np.std(intervals) / np.mean(intervals))
                if self.regularity_cv < 0.25:
                    regularity_score = max(0.0, min(1.0, (0.25 - self.regularity_cv) / 0.15))
                elif self.regularity_cv > 1.4:
                    regularity_score = max(0.0, min(1.0, (self.regularity_cv - 1.4) / 0.8))

        # 3. Duration Distribution Score
        duration_score = 0.0
        self.avg_blink_duration_ms = 0.0
        if blinks_in_window >= 3:
            durations = [b['duration_ms'] for b in self.blink_events]
            mean_dur = float(np.mean(durations))
            std_dur = float(np.std(durations))
            self.avg_blink_duration_ms = mean_dur
            
            std_score = 0.0
            if std_dur < 25:
                std_score = max(0.0, min(1.0, (25 - std_dur) / 20.0))
                
            mean_score = 0.0
            if mean_dur < 120:
                mean_score = max(0.0, min(1.0, (120 - mean_dur) / 60.0))
            elif mean_dur > 380:
                mean_score = max(0.0, min(1.0, (mean_dur - 380) / 150.0))
                
            duration_score = max(std_score, mean_score)

        # 4. EAR Dynamics Score
        dynamics_score = 0.0
        if blinks_in_window >= 2:
            avg_asym = float(np.mean([b['asymmetry_ratio'] for b in self.blink_events]))
            if avg_asym < 1.1:
                dynamics_score = max(0.0, min(1.0, (1.1 - avg_asym) / 0.3))
            elif avg_asym > 2.8:
                dynamics_score = max(0.0, min(1.0, (avg_asym - 2.8) / 1.0))

        # Total Weighted Score
        if blinks_in_window >= 3:
            score = (rate_score * 0.30) + (regularity_score * 0.35) + (duration_score * 0.20) + (dynamics_score * 0.15)
        else:
            score = rate_score * 0.5  # Softened score if few blinks observed

        score = float(np.clip(score, 0.0, 1.0))
        confidence = min(0.95, 0.3 + 0.65 * (min(30.0, self.observation_time) / 30.0))

        status = 'NORMAL'
        if score >= 0.65:
            status = 'ALERT'
        elif score >= 0.35:
            status = 'WARNING'

        avg_asym = float(np.mean([b['asymmetry_ratio'] for b in self.blink_events])) if blinks_in_window > 0 else 0.0
        if blinks_in_window >= 3:
            if score < 0.35:
                reason = f"Rate: {self.blink_rate:.1f}/min | CV: {self.regularity_cv:.2f} | AvgDur: {self.avg_blink_duration_ms:.0f}ms | Base: {self.open_ear_baseline:.3f} — Human pattern"
            else:
                reason = f"Rate: {self.blink_rate:.1f}/min | CV: {self.regularity_cv:.2f} | AvgDur: {self.avg_blink_duration_ms:.0f}ms — Synthetic pattern anomaly"
        else:
            reason = f"Rate: {self.blink_rate:.1f}/min | Blinks: {blinks_in_window} | Base: {self.open_ear_baseline:.3f} — Natural observation window"

        self.deepfake_probability = float(score)
        self.ibi_history = []
        if len(self.blink_events) >= 2:
            timestamps = [b['timestamp'] for b in self.blink_events]
            intervals = np.diff(timestamps)
            self.ibi_history = intervals[-10:].tolist()

        return SignalResult(
            signal='S4',
            score=float(score),
            confidence=float(confidence),
            status=status,
            reason=reason,
            timestamp=float(current_time)
        )

