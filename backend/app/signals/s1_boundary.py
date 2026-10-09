import cv2
import numpy as np
import time
from app.models import SignalResult

class S1BoundaryDetector:
    """
    S1: Mask-Boundary Seam & Compositing Anomaly Detector.
    
    Detects real-time face-swap / deepfake boundaries by evaluating:
    1. Adaptive perimeter margin scaling (proportional to face bounding box size).
    2. Edge gradient discontinuity (Sobel / Laplacian magnitude cliff along the boundary ring).
    3. Chromatic & HSV color distribution divergence between inner face and outer collar.
    
    Output: Normalized metric [0.0, 1.0]. 0.0 = Natural human boundary, 1.0 = Synthetic seam detected.
    """

    def __init__(self):
        self.last_lap_var: float = 0.0
        self.last_color_corr: float = 0.0
        self.last_gradient_disparity: float = 0.0
        self._lap_baseline = None
        self._baseline_alpha: float = 0.05  # Slow-moving temporal baseline

    def process(self, frame: np.ndarray, landmarks: np.ndarray, face_hull: np.ndarray) -> SignalResult:
        now = time.time()
        if frame is None or face_hull is None or len(face_hull) < 3:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.0, status='NORMAL',
                reason='No face boundary data', timestamp=now
            )

        h, w = frame.shape[:2]
        x, y, bw, bh = cv2.boundingRect(face_hull)
        if bw < 25 or bh < 25:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.1, status='NORMAL',
                reason='Face bounding box too small for boundary resolution', timestamp=now
            )

        # 1. Compute adaptive boundary margin (proportional to face scale)
        margin = max(2, min(8, int(min(bw, bh) * 0.045)))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (margin * 2 + 1, margin * 2 + 1))

        # Full face polygon mask
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(mask, face_hull, 255)

        # Inner face mask (eroded by adaptive margin)
        interior_mask = cv2.erode(mask, kernel, iterations=1)
        # Boundary seam ring (the perimeter band of the face)
        boundary_mask = cv2.subtract(mask, interior_mask)
        # Outer collar mask (immediately outside the face boundary, e.g. neck/hair transition)
        outer_dilated = cv2.dilate(mask, kernel, iterations=1)
        outer_collar_mask = cv2.subtract(outer_dilated, mask)

        n_interior = cv2.countNonZero(interior_mask)
        n_boundary = cv2.countNonZero(boundary_mask)

        if n_interior < 100 or n_boundary < 30:
            return SignalResult(
                signal='S1', score=0.0, confidence=0.2, status='NORMAL',
                reason='Insufficient interior pixel coverage', timestamp=now
            )

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 2. Laplacian Variance (evaluates GAN smoothness vs natural dermal detail)
        laplacian_full = cv2.Laplacian(gray, cv2.CV_64F)
        interior_pixels = laplacian_full[interior_mask > 0]
        lap_var = float(np.var(interior_pixels)) if len(interior_pixels) > 0 else 40.0

        if self._lap_baseline is None:
            self._lap_baseline = max(35.0, lap_var)
        else:
            self._lap_baseline = (1.0 - self._baseline_alpha) * self._lap_baseline + self._baseline_alpha * lap_var

        baseline_val = max(25.0, self._lap_baseline)
        lap_normalized = lap_var / baseline_val

        # Suspicious if face interior is unnaturally flat/smooth (< 0.35 baseline)
        lap_score = max(0.0, min(1.0, (0.35 - lap_normalized) / 0.25)) if lap_normalized < 0.35 else 0.0

        # 3. Boundary Gradient Discontinuity
        # Deepfake compositing introduces an unnatural gradient jump between inner rim and outer collar
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(sobel_x ** 2 + sobel_y ** 2)

        inner_grad = grad_mag[boundary_mask > 0]
        outer_grad = grad_mag[outer_collar_mask > 0]

        mean_inner = float(np.mean(inner_grad)) if len(inner_grad) > 0 else 10.0
        mean_outer = float(np.mean(outer_grad)) if len(outer_grad) > 0 else 10.0

        # Gradient jump ratio: high ratio indicates sharp alpha-blending cut line
        grad_disparity = abs(mean_inner - mean_outer) / max(10.0, (mean_inner + mean_outer) / 2.0)
        self.last_gradient_disparity = float(grad_disparity)

        # Gradient disparity score: real skin transitions are gradual (< 0.70 disparity)
        grad_score = max(0.0, min(1.0, (grad_disparity - 0.70) / 0.80)) if grad_disparity > 0.70 else 0.0

        # 4. HSV Color Distribution Divergence (Face vs Boundary Collar)
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hist_interior = cv2.calcHist([hsv_frame], [0, 1], interior_mask, [24, 24], [0, 180, 0, 256])
        hist_boundary = cv2.calcHist([hsv_frame], [0, 1], boundary_mask, [24, 24], [0, 180, 0, 256])
        cv2.normalize(hist_interior, hist_interior, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_boundary, hist_boundary, 0, 1, cv2.NORM_MINMAX)
        color_correlation = float(cv2.compareHist(hist_interior, hist_boundary, cv2.HISTCMP_CORREL))
        color_correlation = max(0.0, min(1.0, color_correlation))

        self.last_lap_var = float(lap_var)
        self.last_color_corr = float(color_correlation)

        # Color mismatch score: severe divergence (< 0.30) flags swapped mask
        color_score = max(0.0, min(1.0, (0.32 - color_correlation) / 0.25)) if color_correlation < 0.32 else 0.0

        # 5. Composite Score Calculation
        # Triangulate interior smoothness (40%), boundary gradient discontinuity (35%), color drift (25%)
        score = 0.40 * lap_score + 0.35 * grad_score + 0.25 * color_score
        score = float(np.clip(score, 0.0, 1.0))

        confidence = 0.85
        status = 'NORMAL'
        if score > 0.60:
            status = 'ALERT'
        elif score > 0.30:
            status = 'WARNING'

        reason = (
            f"LapVar: {lap_var:.0f} (base: {self._lap_baseline:.0f}) | "
            f"ColCorr: {color_correlation:.2f} | "
            f"GradCliff: {grad_disparity:.2f}"
        )

        return SignalResult(
            signal='S1',
            score=score,
            confidence=confidence,
            status=status,
            reason=reason,
            timestamp=now
        )
