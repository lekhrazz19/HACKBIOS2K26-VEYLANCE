import numpy as np
import time
from typing import Optional, List
from app.models import SignalResult

class S2OcclusionDetector:
    """
    S2: Occlusion / Landmark Stability Signal.
    Combines three sub-signals:
    A. IPD-normalized landmark drift (jitter across frames)
    B. Presence-loss: face disappeared for > 0.6s → suspicious substitution
    C. Z-depth flatness: suspiciously 2D face structure
    
    Score: 0.0 = stable real face, 1.0 = unstable / suspicious
    """
    
    PRESENCE_LOSS_SECS = 0.6   # From veylance engine config
    DRIFT_THRESHOLD = 0.15     # Original drift threshold
    RISE_RATE = 0.8            # How fast score rises after loss
    DECAY = 0.03               # How fast score decays when stable
    
    def __init__(self):
        self.prev_landmarks = None
        self.last_seen_ts: Optional[float] = None
        self.score = 0.0
        self.last_ipd_drift = 0.0
        self._component_a = 0.0
        self._component_b = 0.0
        self._component_c = 0.0
    
    def process(self, landmarks: Optional[np.ndarray], ts: Optional[float] = None) -> SignalResult:
        now = ts if ts is not None else time.time()
        
        # --- Component B: Presence-Loss ---
        if landmarks is None or len(landmarks) < 468:
            # Face not detected
            if self.last_seen_ts is not None:
                lost_secs = now - self.last_seen_ts
                if lost_secs > self.PRESENCE_LOSS_SECS:
                    self._component_b = min(1.0, (lost_secs - self.PRESENCE_LOSS_SECS) * self.RISE_RATE)
                else:
                    self._component_b = 0.0
            # Total score when no face
            self.score = float(np.clip(self._component_b, 0.0, 1.0))
            self.prev_landmarks = None
            
            status = 'ALERT' if self.score > 0.6 else ('WARNING' if self.score > 0.2 else 'NORMAL')
            return SignalResult(
                signal='S2',
                score=float(self.score),
                confidence=0.85,
                status=status,
                reason=f'Face absent {(now - self.last_seen_ts):.1f}s | PresenceLoss: {self._component_b:.2f}' if self.last_seen_ts else 'No face detected',
                timestamp=now
            )
        
        # Face is present
        self.last_seen_ts = now
        self._component_b = max(0.0, self._component_b - self.DECAY)
        
        # --- Component A: IPD-normalized drift ---
        self._component_a = 0.0
        if self.prev_landmarks is not None:
            try:
                ipd = np.linalg.norm(landmarks[33, :2] - landmarks[263, :2])
                if ipd > 1e-6:
                    nose_disp = np.linalg.norm(landmarks[1, :2] - self.prev_landmarks[1, :2])
                    le_disp = np.linalg.norm(landmarks[33, :2] - self.prev_landmarks[33, :2])
                    re_disp = np.linalg.norm(landmarks[263, :2] - self.prev_landmarks[263, :2])
                    avg_disp = (nose_disp + le_disp + re_disp) / 3.0
                    normalized_drift = float(avg_disp / ipd)
                    self.last_ipd_drift = normalized_drift
                    # Base camera sensor noise can cause 0.05-0.12 drift. Threshold at 0.18.
                    if normalized_drift > 0.18:
                        self._component_a = min(1.0, (normalized_drift - 0.18) * 3.0)
            except (IndexError, ValueError):
                pass
        
        # --- Component C: Z-depth flatness ---
        self._component_c = 0.0
        try:
            z_coords = landmarks[:, 2]
            z_var = float(np.var(z_coords))
            # Real faces on 2D webcams typically yield z_var between 0.00015 and 0.0008.
            # Only flag flat 2D image replays/paper prints where z_var < 0.00005.
            if z_var < 0.00003:
                self._component_c = 0.85  # Completely flat 2D surface
            elif z_var < 0.00009:
                self._component_c = min(0.60, (0.00009 - z_var) / 0.00009 * 0.60)
            else:
                self._component_c = 0.0
        except (IndexError, ValueError):
            pass
        
        self.prev_landmarks = landmarks.copy()
        
        # Combined score
        combined = 0.45 * self._component_a + 0.35 * self._component_b + 0.20 * self._component_c
        self.score = float(np.clip(combined, 0.0, 1.0))
        
        status = 'ALERT' if self.score > 0.6 else ('WARNING' if self.score > 0.2 else 'NORMAL')
        reason = (f'Drift: {self.last_ipd_drift:.3f} | '
                  f'Presence: {self._component_b:.2f} | '
                  f'Depth: {self._component_c:.2f} | '
                  f'Combined: {self.score:.2f}')
        
        return SignalResult(
            signal='S2',
            score=float(self.score),
            confidence=0.90,
            status=status,
            reason=reason,
            timestamp=now
        )
    
    def get_occlusion_zones(self, landmarks: np.ndarray, frame_shape: tuple) -> List[dict]:
        """Per-zone face occlusion scoring using landmark z-depth analysis."""
        if landmarks is None or len(landmarks) < 468:
            return []
            
        zones = {
            'Forehead': [10, 109, 338, 151, 337, 108],
            'Left Eye': [33, 7, 163, 144, 145, 153, 154, 155, 133],
            'Right Eye': [362, 382, 381, 380, 374, 373, 390, 249, 263],
            'Nose': [1, 2, 5, 4, 195, 197, 6, 168, 8],
            'Mouth/Chin': [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308]
        }
        
        results = []
        for name, indices in zones.items():
            valid_indices = [i for i in indices if i < len(landmarks)]
            if not valid_indices:
                results.append({'zone': name, 'score': 0.0, 'status': 'NORMAL'})
                continue
            pts = landmarks[valid_indices]
            z_coords = pts[:, 2]
            z_var = np.var(z_coords)
            z_mean = np.mean(z_coords)
            anomalies = np.sum(np.abs(z_coords - z_mean) > 0.05)
            anomaly_ratio = anomalies / len(valid_indices)
            score = anomaly_ratio
            if z_var < 1e-6:
                score = max(score, 0.8)
            status = 'ALERT' if score > 0.5 else ('WARNING' if score > 0.2 else 'NORMAL')
            results.append({'zone': name, 'score': float(score), 'status': status})
        
        return results
