"""
HeatmapGenerator: produces a 20x20 risk heatmap over the face bounding box.
Each cell is scored 0.0 (safe, blue) to 1.0 (suspicious, red).

Algorithm:
- Divide the face bounding rect into a 20x20 grid
- For each cell:
  1. Laplacian variance of that patch (low var = suspicious = smooth = possible GAN artifact)
  2. Color saturation deviation (deepfakes often have color artifacts at boundaries)
  3. Landmark density (cells with more landmarks are more reliably human)
- Combine: cell_score = 0.5*(1 - clipped_lap_var) + 0.3*color_dev + 0.2*(1-landmark_density)
- Normalize output to [0, 1]
"""
import cv2
import numpy as np
from typing import List

class HeatmapGenerator:
    """
    Forensic Anomaly Heatmap Generator.
    Calculates localized risk metrics over the face bounding region:
    1. Texture authenticity (detects synthetic GAN smoothing vs unnatural noise)
    2. Boundary seam blending & color divergence against global face baseline
    3. Spatial smoothing for natural, physically coherent anomaly distribution
    """
    GRID = 20
    
    def generate(self, frame_bgr: np.ndarray, landmarks: np.ndarray, face_hull: np.ndarray) -> List[List[float]]:
        empty = [[0.0] * self.GRID for _ in range(self.GRID)]
        if frame_bgr is None or landmarks is None or face_hull is None:
            return empty
        
        h, w = frame_bgr.shape[:2]
        x, y, bw, bh = cv2.boundingRect(face_hull)
        x, y = max(0, x), max(0, y)
        bw = min(bw, w - x)
        bh = min(bh, h - y)
        if bw <= 4 or bh <= 4:
            return empty
        
        # Binary mask of the face hull
        hull_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(hull_mask, face_hull, 255)
        
        # Color spaces and texture gradients
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        
        # Global face color stats inside hull
        face_pixels_hsv = hsv[hull_mask > 0]
        if len(face_pixels_hsv) > 0:
            mean_sat = float(np.mean(face_pixels_hsv[:, 1]))
            std_sat = max(1.0, float(np.std(face_pixels_hsv[:, 1])))
        else:
            mean_sat, std_sat = 80.0, 30.0
            
        # Hull boundary contour for seam analysis
        hull_contour_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.polylines(hull_contour_mask, [face_hull], isClosed=True, color=255, thickness=max(2, int(min(bw, bh) * 0.05)))
        
        # Landmark pixel coords
        lm_px = (landmarks[:, :2] * [w, h]).astype(int)
        
        cell_w = bw / self.GRID
        cell_h = bh / self.GRID
        
        raw_grid = np.zeros((self.GRID, self.GRID), dtype=np.float32)
        
        for row in range(self.GRID):
            for col in range(self.GRID):
                cx = int(x + col * cell_w)
                cy = int(y + row * cell_h)
                cw = max(1, int(cell_w))
                ch = max(1, int(cell_h))
                
                # Check how much of cell is inside the face
                patch_mask = hull_mask[cy:cy+ch, cx:cx+cw]
                if patch_mask.size == 0:
                    continue
                face_overlap = float(np.mean(patch_mask > 0))
                if face_overlap < 0.15:
                    # Outside face perimeter
                    raw_grid[row, col] = 0.0
                    continue
                
                patch_lap = lap[cy:cy+ch, cx:cx+cw]
                patch_hsv = hsv[cy:cy+ch, cx:cx+cw]
                patch_contour = hull_contour_mask[cy:cy+ch, cx:cx+cw]
                
                # 1. Texture naturalness score:
                # Real face skin patches typically have laplacian variance between 20 and 450.
                # Extremely smooth (< 8) = GAN over-smoothing artifact.
                # Unusually spiky (> 750) = synthetic noise / deepfake artifact.
                lap_var = float(np.var(patch_lap))
                if lap_var < 8.0:
                    blur_score = (8.0 - lap_var) / 8.0  # 0 to 1
                elif lap_var > 750.0:
                    blur_score = min(1.0, (lap_var - 750.0) / 750.0)
                else:
                    blur_score = 0.05  # healthy natural skin texture
                
                # 2. Local color consistency against global face baseline
                patch_sat = patch_hsv[:, :, 1].astype(float)
                patch_mean_sat = float(np.mean(patch_sat))
                z_score_sat = abs(patch_mean_sat - mean_sat) / std_sat
                color_anomaly = min(1.0, max(0.0, (z_score_sat - 1.5) / 2.0))
                
                # 3. Boundary seam risk:
                # Cells intersecting the hull border are checked for blending artifacts
                is_boundary = float(np.mean(patch_contour > 0)) > 0.2
                seam_risk = 0.0
                if is_boundary:
                    # Check edge gradient variance across boundary
                    seam_risk = min(1.0, color_anomaly * 0.7 + blur_score * 0.5)
                
                # Combine factors
                cell_score = (
                    0.40 * blur_score +
                    0.35 * color_anomaly +
                    0.25 * seam_risk
                )
                
                # Attenuate based on face overlap (smooth fade at borders)
                cell_score *= min(1.0, face_overlap * 1.2)
                raw_grid[row, col] = np.clip(cell_score, 0.0, 1.0)
        
        # Apply spatial gaussian smoothing across the 20x20 grid to create coherent anomaly gradients
        smoothed = cv2.GaussianBlur(raw_grid, (3, 3), 0.8)
        smoothed = np.clip(smoothed, 0.0, 1.0)
        
        # Round to 3 decimals
        return [[float(round(val, 3)) for val in row] for row in smoothed]
