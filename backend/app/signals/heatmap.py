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
    GRID = 20
    
    def generate(self, frame_bgr: np.ndarray, landmarks: np.ndarray, face_hull: np.ndarray) -> List[List[float]]:
        # Return empty 20x20 grid if no data
        empty = [[0.0]*self.GRID for _ in range(self.GRID)]
        if frame_bgr is None or landmarks is None or face_hull is None:
            return empty
        
        h, w = frame_bgr.shape[:2]
        x, y, bw, bh = cv2.boundingRect(face_hull)
        x, y = max(0, x), max(0, y)
        bw = min(bw, w - x)
        bh = min(bh, h - y)
        if bw <= 0 or bh <= 0:
            return empty
        
        # Pixel dimensions per cell
        cell_w = bw / self.GRID
        cell_h = bh / self.GRID
        
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        
        # Landmark pixel coords
        lm_px = (landmarks[:, :2] * [w, h]).astype(int)
        
        grid = []
        for row in range(self.GRID):
            row_scores = []
            for col in range(self.GRID):
                cx = int(x + col * cell_w)
                cy = int(y + row * cell_h)
                cw = max(1, int(cell_w))
                ch = max(1, int(cell_h))
                
                patch_lap = lap[cy:cy+ch, cx:cx+cw]
                patch_hsv = hsv[cy:cy+ch, cx:cx+cw]
                
                if patch_lap.size == 0:
                    row_scores.append(0.0)
                    continue
                
                # 1. Laplacian score (low variance = suspicious)
                lap_var = float(np.var(patch_lap))
                lap_score = 1.0 - min(1.0, lap_var / 500.0)  # 0=sharp(good), 1=blurry(bad)
                
                # 2. Saturation deviation
                sat = patch_hsv[:, :, 1].astype(float)
                sat_dev = float(np.std(sat)) / 128.0
                sat_score = min(1.0, sat_dev * 2.0)  # high deviation = artifact
                # Actually: unnatural uniform saturation is suspicious too
                sat_mean = float(np.mean(sat))
                sat_score = abs(sat_mean - 80.0) / 80.0  # centered around typical skin sat
                sat_score = min(1.0, sat_score)
                
                # 3. Landmark density in cell
                in_cell = ((lm_px[:, 0] >= cx) & (lm_px[:, 0] < cx+cw) &
                           (lm_px[:, 1] >= cy) & (lm_px[:, 1] < cy+ch))
                density = min(1.0, float(in_cell.sum()) / 3.0)  # 3+ landmarks = well-covered
                landmark_score = 1.0 - density  # no landmarks = uncertain = slight risk
                
                cell_score = 0.5 * lap_score + 0.3 * sat_score + 0.2 * landmark_score
                row_scores.append(float(np.clip(cell_score, 0.0, 1.0)))
            grid.append(row_scores)
        
        return grid
