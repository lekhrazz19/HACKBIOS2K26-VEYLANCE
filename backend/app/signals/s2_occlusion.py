import numpy as np
import time
from app.models import SignalResult

class S2OcclusionDetector:
    def __init__(self, drift_threshold: float = 0.15):
        self.prev_landmarks = None
        self.drift_threshold = drift_threshold
        self.last_ipd_drift = 0.0

    def process(self, landmarks: np.ndarray) -> SignalResult:
        if landmarks is None or len(landmarks) < 468:
            return SignalResult(
                signal='S2', score=0.0, confidence=0.0, status='NORMAL',
                reason='No landmarks', timestamp=time.time()
            )
        
        current = landmarks
        score = 0.0
        reason = "Stable"
        status = 'NORMAL'
        
        if self.prev_landmarks is not None:
            ipd = np.linalg.norm(current[33][:2] - current[263][:2])
            if ipd > 1e-6:
                nose_disp = np.linalg.norm(current[1][:2] - self.prev_landmarks[1][:2])
                le_disp = np.linalg.norm(current[33][:2] - self.prev_landmarks[33][:2])
                re_disp = np.linalg.norm(current[263][:2] - self.prev_landmarks[263][:2])
                
                avg_disp = (nose_disp + le_disp + re_disp) / 3.0
                normalized_drift = avg_disp / ipd
                self.last_ipd_drift = float(normalized_drift)
                
                if normalized_drift > self.drift_threshold:
                    score = min(1.0, normalized_drift * 2.0)
                    reason = f"Drift {normalized_drift:.2f} > {self.drift_threshold}"
                    if score > 0.7:
                        status = 'ALERT'
                    else:
                        status = 'WARNING'
            
        self.prev_landmarks = current.copy()
        return SignalResult(
            signal='S2', score=float(score), confidence=0.9, status=status,
            reason=reason, timestamp=time.time()
        )

    def get_occlusion_zones(self, landmarks: np.ndarray, frame_shape: tuple) -> list[dict]:
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
            pts = landmarks[indices]
            z_coords = pts[:, 2]
            
            # 1. Low visibility (z-coordinate anomaly for occlusion/cut)
            # In Mediapipe, z is relative to face center. Usually -0.05 to +0.05.
            # If standard deviation of Z is suspiciously low -> flat mask/2D face
            z_var = np.var(z_coords)
            
            # Proportion of anomalies
            z_mean = np.mean(z_coords)
            anomalies = np.sum(np.abs(z_coords - z_mean) > 0.05)
            anomaly_ratio = anomalies / len(indices)
            
            score = anomaly_ratio
            if z_var < 1e-6:
                score = max(score, 0.8) # Extremely flat = likely deepfake/2D
                
            status = 'ALERT' if score > 0.5 else ('WARNING' if score > 0.2 else 'NORMAL')
            results.append({
                'zone': name,
                'score': float(score),
                'status': status
            })
            
        return results
