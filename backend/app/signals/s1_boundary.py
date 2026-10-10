import cv2
import numpy as np
import time
from app.models import SignalResult

class S1BoundaryDetector:
    def __init__(self):
        self.last_lap_var = 0.0
        self.last_color_corr = 0.0
        self._lap_baseline = None
        self._baseline_alpha = 0.05  # Slow-moving baseline

    def process(self, frame: np.ndarray, landmarks: np.ndarray, face_hull: np.ndarray) -> SignalResult:
        if frame is None or face_hull is None or len(face_hull) == 0:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.0, status='NORMAL',
                reason='No face data', timestamp=time.time()
            )
        
        # Create face interior mask
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillConvexPoly(mask, face_hull, 255)
        kernel = np.ones((5,5), np.uint8)
        interior_mask = cv2.erode(mask, kernel, iterations=3)
        boundary_mask = cv2.subtract(mask, interior_mask)

        # Compute Laplacian on FULL frame, then mask it
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian_full = cv2.Laplacian(gray, cv2.CV_64F)

        # Only sample pixels inside the face interior
        interior_pixels = laplacian_full[interior_mask > 0]
        if len(interior_pixels) < 100:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.0, status='NORMAL',
                reason='Face area too small', timestamp=time.time()
            )
        lap_var = float(np.var(interior_pixels))

        if self._lap_baseline is None:
            self._lap_baseline = max(40.0, lap_var)
        else:
            self._lap_baseline = (1 - self._baseline_alpha) * self._lap_baseline + self._baseline_alpha * lap_var

        # Normalize relative to baseline
        baseline_val = max(30.0, self._lap_baseline)
        lap_normalized = lap_var / baseline_val

        # Suspicious only when face is drastically smoother than baseline (< 0.35 indicates plastic GAN texture)
        lap_score = max(0.0, min(1.0, (0.35 - lap_normalized) / 0.25)) if lap_normalized < 0.35 else 0.0

        # Check counts before comparing
        n_interior = cv2.countNonZero(interior_mask)
        n_boundary = cv2.countNonZero(boundary_mask)
        if n_interior < 200 or n_boundary < 50:
            color_correlation = 0.85
        else:
            hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hist_interior = cv2.calcHist([hsv_frame], [0, 1], interior_mask, [24, 24], [0, 180, 0, 256])
            hist_boundary = cv2.calcHist([hsv_frame], [0, 1], boundary_mask, [24, 24], [0, 180, 0, 256])
            cv2.normalize(hist_interior, hist_interior, 0, 1, cv2.NORM_MINMAX)
            cv2.normalize(hist_boundary, hist_boundary, 0, 1, cv2.NORM_MINMAX)
            color_correlation = cv2.compareHist(hist_interior, hist_boundary, cv2.HISTCMP_CORREL)
            color_correlation = max(0.0, min(1.0, color_correlation))

        self.last_lap_var = float(lap_var)
        self.last_color_corr = float(color_correlation)

        # Base camera calibration: real faces under room lighting have HSV correlation ~0.4-0.8.
        # Only penalize if boundary has severe seam discontinuity (< 0.30)
        color_score = max(0.0, min(1.0, (0.30 - color_correlation) / 0.25)) if color_correlation < 0.30 else 0.0
        score = 0.50 * lap_score + 0.50 * color_score
        score = float(np.clip(score, 0.0, 1.0))
        
        status = 'NORMAL'
        if score > 0.65:
            status = 'ALERT'
        elif score > 0.35:
            status = 'WARNING'
            
        reason = f'LapVar: {lap_var:.0f} (base: {self._lap_baseline:.0f}) | ColCorr: {color_correlation:.2f} | LapNorm: {lap_normalized:.2f}'
            
        return SignalResult(
            signal='S1', score=score, confidence=0.8, status=status,
            reason=reason,
            timestamp=time.time()
        )
