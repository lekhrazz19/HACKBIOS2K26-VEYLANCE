import numpy as np
import time
from collections import deque
from app.models import SignalResult

class S4BlinkDetector:
    def __init__(self):
        self.blink_events = deque()
        self.in_blink = False
        self.current_ear = 0.0
        self.blink_rate = 0.0
        self.regularity_cv = 0.0
        self.avg_blink_duration_ms = 0.0
        self.observation_time = 0.0
        
        self.start_time = None
        self.current_blink_ears = []

    def _calculate_ear(self, landmarks):
        # Left eye: [33, 160, 158, 133, 153, 144]
        # Right eye: [362, 385, 387, 263, 373, 380]
        
        def eye_aspect_ratio(eye_pts):
            p2_p6 = np.linalg.norm(eye_pts[1] - eye_pts[5])
            p3_p5 = np.linalg.norm(eye_pts[2] - eye_pts[4])
            p1_p4 = np.linalg.norm(eye_pts[0] - eye_pts[3])
            
            if p1_p4 == 0:
                return 0.0
            return (p2_p6 + p3_p5) / (2.0 * p1_p4)

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
        
        # Remove old blink events > 30s ago
        while self.blink_events and current_time - self.blink_events[0]['timestamp'] > 30.0:
            self.blink_events.popleft()
            
        self.current_ear = self._calculate_ear(landmarks)
        
        # Blink Detection
        if self.current_ear < 0.21:
            if not self.in_blink:
                self.in_blink = True
                self.current_blink_ears = []
            self.current_blink_ears.append((current_time, self.current_ear))
        else:
            if self.in_blink:
                self.in_blink = False
                if len(self.current_blink_ears) > 0:
                    t_start = self.current_blink_ears[0][0]
                    t_end = current_time # Approximate end time
                    duration_s = t_end - t_start
                    duration_ms = duration_s * 1000.0
                    
                    if 80.0 <= duration_ms <= 400.0:
                        min_ear = min([e[1] for e in self.current_blink_ears])
                        min_idx = np.argmin([e[1] for e in self.current_blink_ears])
                        t_min = self.current_blink_ears[min_idx][0]
                        
                        # Approximate closure and opening times
                        closure_time = max(0.001, t_min - t_start)
                        opening_time = max(0.001, t_end - t_min)
                        
                        closure_speed = (0.21 - min_ear) / closure_time
                        opening_speed = (0.21 - min_ear) / opening_time
                        
                        asymmetry_ratio = closure_speed / opening_speed if opening_speed > 0 else 1.0
                        
                        self.blink_events.append({
                            'timestamp': t_start,
                            'duration_ms': duration_ms,
                            'min_ear': min_ear,
                            'asymmetry_ratio': asymmetry_ratio
                        })

        # 1. Rate Score
        blinks_in_window = len(self.blink_events)
        window_duration = min(30.0, max(1.0, self.observation_time))
        self.blink_rate = (blinks_in_window / window_duration) * 60.0
        
        rate_score = 0.0
        if self.blink_rate < 12:
            rate_score = max(0.0, min(1.0, (12 - self.blink_rate) / 12.0))
        elif self.blink_rate > 20:
            rate_score = max(0.0, min(1.0, (self.blink_rate - 20) / 25.0))
            
        # 2. Regularity Score
        regularity_score = 0.0
        self.regularity_cv = 0.0
        if blinks_in_window >= 4:
            timestamps = [b['timestamp'] for b in self.blink_events]
            intervals = np.diff(timestamps)
            if len(intervals) > 0 and np.mean(intervals) > 0:
                self.regularity_cv = float(np.std(intervals) / np.mean(intervals))
                
                if self.regularity_cv < 0.3:
                    regularity_score = max(0.0, min(1.0, (0.3 - self.regularity_cv) / 0.15))
                elif self.regularity_cv > 1.3:
                    regularity_score = max(0.0, min(1.0, (self.regularity_cv - 1.3) / 0.7))
        elif self.observation_time > 10.0 and blinks_in_window < 2:
            regularity_score = 1.0
            
        # 3. Duration Distribution Score
        duration_score = 0.0
        self.avg_blink_duration_ms = 0.0
        if blinks_in_window >= 3:
            durations = [b['duration_ms'] for b in self.blink_events]
            mean_dur = float(np.mean(durations))
            std_dur = float(np.std(durations))
            self.avg_blink_duration_ms = mean_dur
            
            std_score = 0.0
            if std_dur < 30:
                std_score = max(0.0, min(1.0, (30 - std_dur) / 20.0))
                
            mean_score = 0.0
            if mean_dur < 150:
                mean_score = max(0.0, min(1.0, (150 - mean_dur) / 70.0))
            elif mean_dur > 350:
                mean_score = max(0.0, min(1.0, (mean_dur - 350) / 150.0))
                
            duration_score = max(std_score, mean_score)
            
        # 4. EAR Dynamics Score
        dynamics_score = 0.0
        if blinks_in_window >= 1:
            avg_asym = float(np.mean([b['asymmetry_ratio'] for b in self.blink_events]))
            if avg_asym < 1.2:
                dynamics_score = max(0.0, min(1.0, (1.2 - avg_asym) / 0.2))
            elif avg_asym > 2.5:
                dynamics_score = max(0.0, min(1.0, (avg_asym - 2.5) / 1.0))
                
        # Total Score
        if blinks_in_window >= 3:
            score = (rate_score * 0.30) + (regularity_score * 0.35) + (duration_score * 0.20) + (dynamics_score * 0.15)
        else:
            score = rate_score
            
        # Confidence
        confidence = min(0.95, 0.1 + 0.85 * (self.observation_time / 30.0))
        if blinks_in_window < 3:
            # Not enough data for full confidence
            pass

        # Status
        status = 'NORMAL'
        if score >= 0.65:
            status = 'ALERT'
        elif score >= 0.35:
            status = 'WARNING'
            
        # Reason
        avg_asym = float(np.mean([b['asymmetry_ratio'] for b in self.blink_events])) if blinks_in_window > 0 else 0.0
        if blinks_in_window >= 3:
            if score < 0.35:
                reason = f"Rate: {self.blink_rate:.1f}/min | CV: {self.regularity_cv:.2f} | AvgDur: {self.avg_blink_duration_ms:.0f}ms | Asymmetry: {avg_asym:.1f} — Normal human pattern"
            else:
                reason = f"Rate: {self.blink_rate:.1f}/min | CV: {self.regularity_cv:.2f} | AvgDur: {self.avg_blink_duration_ms:.0f}ms | Asymmetry: {avg_asym:.1f} — Robotic/synthetic pattern detected"
        else:
            reason = f"Rate: {self.blink_rate:.1f}/min | Insufficient blinks for analysis — Possible static/synthetic feed"

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
