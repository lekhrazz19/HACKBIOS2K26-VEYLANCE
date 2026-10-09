import cv2
import numpy as np
import time
from app.models import SignalResult

class S1BoundaryDetector:
    def __init__(self):
        self.last_lap_var = 0.0
        self.last_color_corr = 0.0

    def process(self, frame: np.ndarray, landmarks: np.ndarray, face_hull: np.ndarray) -> SignalResult:
        if frame is None or face_hull is None or len(face_hull) == 0:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.0, status='NORMAL',
                reason='No face data', timestamp=time.time()
            )
        
        x, y, w, h = cv2.boundingRect(face_hull)
        x, y = max(0, x), max(0, y)
        w, h = min(w, frame.shape[1] - x), min(h, frame.shape[0] - y)
        
        if w <= 0 or h <= 0:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.0, status='NORMAL',
                reason='Invalid face rect', timestamp=time.time()
            )

        face_roi = frame[y:y+h, x:x+w]
        
        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray_roi, cv2.CV_64F)
        lap_var = np.var(laplacian)
        lap_consistency = min(1.0, lap_var / 1000.0) 
        
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillConvexPoly(mask, face_hull, 255)
        
        kernel = np.ones((5,5), np.uint8)
        interior_mask = cv2.erode(mask, kernel, iterations=3)
        boundary_mask = cv2.subtract(mask, interior_mask)
        
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hist_interior = cv2.calcHist([hsv_frame], [0, 1], interior_mask, [50, 60], [0, 180, 0, 256])
        hist_boundary = cv2.calcHist([hsv_frame], [0, 1], boundary_mask, [50, 60], [0, 180, 0, 256])
        
        cv2.normalize(hist_interior, hist_interior, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_boundary, hist_boundary, 0, 1, cv2.NORM_MINMAX)
        
        color_correlation = cv2.compareHist(hist_interior, hist_boundary, cv2.HISTCMP_CORREL)
        color_correlation = max(0.0, color_correlation)
        
        self.last_lap_var = float(lap_var)
        self.last_color_corr = float(color_correlation)

        score = 0.5 * (1.0 - lap_consistency) + 0.5 * (1.0 - color_correlation)
        score = float(np.clip(score, 0.0, 1.0))
        
        status = 'NORMAL'
        if score > 0.7:
            status = 'ALERT'
        elif score > 0.4:
            status = 'WARNING'
            
        return SignalResult(
            signal='S1', score=score, confidence=0.8, status=status,
            reason=f'LapVar: {lap_var:.1f}, ColCorr: {color_correlation:.2f}',
            timestamp=time.time()
        )
