import numpy as np
import time
from typing import Optional, List
from app.models import SignalResult

class S2OcclusionDetector:
    """
    S2: Occlusion & Landmark Stability Signal.
    Automates the physical principles of the "3-Finger Test" across every frame:
    
    Components:
    A. IPD-Normalized Rigid Anchor Drift: Measures frame-over-frame jitter of rigid facial bones.
    B. Presence-Loss: Sustained disappearance of face tracking (> 0.6s) indicates proxy substitution.
    C. Z-Depth Flatness: Detects 2D printed photograph or screen video replays.
    D. Rigid Triangle Distortion (3-Finger Physics): Tracks deformation of rigid facial triangles
       when hands, fingers, or objects pass across the facial plane (causing generative face-swaps to warp).
    
    Score: 0.0 = Stable genuine human geometry, 1.0 = Unstable / Synthetic occlusion distortion.
    """

    PRESENCE_LOSS_SECS = 0.6
    DRIFT_THRESHOLD = 0.18
    RISE_RATE = 0.8
    DECAY = 0.03

    def __init__(self):
        self.prev_landmarks: Optional[np.ndarray] = None
        self.prev_triangle_ratio: Optional[float] = None
        self.last_seen_ts: Optional[float] = None
        self.score: float = 0.0
        self.last_ipd_drift: float = 0.0
        self.last_triangle_warp: float = 0.0
        self._component_a: float = 0.0
        self._component_b: float = 0.0
        self._component_c: float = 0.0
        self._component_d: float = 0.0

    def process(self, landmarks: Optional[np.ndarray], ts: Optional[float] = None) -> SignalResult:
        now = ts if ts is not None else time.time()

        # Component B: Presence Loss (No Face Tracked)
        if landmarks is None or len(landmarks) < 468:
            if self.last_seen_ts is not None:
                lost_secs = now - self.last_seen_ts
                if lost_secs > self.PRESENCE_LOSS_SECS:
                    self._component_b = min(1.0, (lost_secs - self.PRESENCE_LOSS_SECS) * self.RISE_RATE)
                else:
                    self._component_b = 0.0
            self.score = float(np.clip(self._component_b, 0.0, 1.0))
            self.prev_landmarks = None
            self.prev_triangle_ratio = None

            status = 'ALERT' if self.score > 0.6 else ('WARNING' if self.score > 0.2 else 'NORMAL')
            return SignalResult(
                signal='S2',
                score=float(self.score),
                confidence=0.85,
                status=status,
                reason=f"Face absent {(now - self.last_seen_ts):.1f}s | PresenceLoss: {self._component_b:.2f}" if self.last_seen_ts else "No face detected",
                timestamp=now
            )

        # Face is present
        self.last_seen_ts = now
        self._component_b = max(0.0, self._component_b - self.DECAY)

        self._component_a = 0.0
        self._component_d = 0.0

        if self.prev_landmarks is not None:
            try:
                # Inter-pupillary distance (left eye corner 33 to right eye corner 263)
                ipd = float(np.linalg.norm(landmarks[33, :2] - landmarks[263, :2]))
                if ipd > 1e-5:
                    # Component A: IPD-normalized anchor displacement
                    nose_disp = np.linalg.norm(landmarks[1, :2] - self.prev_landmarks[1, :2])
                    le_disp = np.linalg.norm(landmarks[33, :2] - self.prev_landmarks[33, :2])
                    re_disp = np.linalg.norm(landmarks[263, :2] - self.prev_landmarks[263, :2])
                    avg_disp = (nose_disp + le_disp + re_disp) / 3.0
                    normalized_drift = float(avg_disp / ipd)
                    self.last_ipd_drift = normalized_drift

                    # Webcams introduce 0.04-0.12 baseline jitter; flag when drift > 0.18
                    if normalized_drift > self.DRIFT_THRESHOLD:
                        self._component_a = min(1.0, (normalized_drift - self.DRIFT_THRESHOLD) * 3.0)

                    # Component D: Automated 3-Finger Occlusion Physics (Rigid Triangle Aspect Ratio)
                    # Measures distance from nose tip (1) to each eye corner relative to IPD
                    dist_nose_left = np.linalg.norm(landmarks[1, :2] - landmarks[33, :2])
                    dist_nose_right = np.linalg.norm(landmarks[1, :2] - landmarks[263, :2])
                    triangle_ratio = float((dist_nose_left + 1e-6) / (dist_nose_right + 1e-6))

                    if self.prev_triangle_ratio is not None:
                        ratio_delta = abs(triangle_ratio - self.prev_triangle_ratio)
                        self.last_triangle_warp = ratio_delta
                        # In real human movement, triangle ratio shifts smoothly (< 0.12 per frame)
                        # Hand occlusion causes severe landmark snapping / deepfake mask collapse (> 0.20)
                        if ratio_delta > 0.18:
                            self._component_d = min(1.0, (ratio_delta - 0.18) * 3.5)

                    self.prev_triangle_ratio = triangle_ratio

            except (IndexError, ValueError):
                pass

        # Component C: Z-Depth Flatness (2D Paper / Screen replay)
        self._component_c = 0.0
        try:
            z_coords = landmarks[:, 2]
            z_var = float(np.var(z_coords))
            if z_var < 0.00003:
                self._component_c = 0.85  # Completely flat 2D surface
            elif z_var < 0.00009:
                self._component_c = min(0.60, (0.00009 - z_var) / 0.00009 * 0.60)
        except (IndexError, ValueError):
            pass

        self.prev_landmarks = landmarks.copy()

        # Combined multi-factor occlusion score:
        # 35% Jitter drift + 25% 3-finger triangle warp + 25% presence loss + 15% 2D flatness
        combined = (
            0.35 * self._component_a +
            0.25 * self._component_d +
            0.25 * self._component_b +
            0.15 * self._component_c
        )
        self.score = float(np.clip(combined, 0.0, 1.0))

        status = 'ALERT' if self.score > 0.60 else ('WARNING' if self.score > 0.25 else 'NORMAL')
        reason = (
            f"Drift: {self.last_ipd_drift:.2f} | "
            f"Warp: {self.last_triangle_warp:.2f} | "
            f"Depth: {self._component_c:.2f} | "
            f"Presence: {self._component_b:.2f}"
        )

        return SignalResult(
            signal='S2',
            score=float(self.score),
            confidence=0.90,
            status=status,
            reason=reason,
            timestamp=now
        )

    def get_occlusion_zones(self, landmarks: np.ndarray, frame_shape: tuple) -> List[dict]:
        """Per-zone face occlusion scoring using landmark z-depth variance analysis."""
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
            anomaly_ratio = float(anomalies / len(valid_indices))
            score = anomaly_ratio
            if z_var < 1e-6:
                score = max(score, 0.8)
            status = 'ALERT' if score > 0.50 else ('WARNING' if score > 0.20 else 'NORMAL')
            results.append({'zone': name, 'score': float(score), 'status': status})

        return results
