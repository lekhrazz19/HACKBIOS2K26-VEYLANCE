import cv2
import numpy as np
from typing import Optional, Tuple

class HeadPoseEstimator:
    """
    3D Head Pose Estimator using MediaPipe 3D landmark geometry.
    Computes Pitch, Yaw, and Roll angles (in degrees) to power
    interactive liveness challenges (e.g. Turn head left/right, Nod up/down).
    """

    # Canonical 3D facial model points (approximate millimeters)
    MODEL_POINTS_3D = np.array([
        (0.0, 0.0, 0.0),          # Nose tip (index 1)
        (0.0, -330.0, -65.0),     # Chin (index 152)
        (-225.0, 170.0, -135.0),  # Left eye outer corner (index 33)
        (225.0, 170.0, -135.0),   # Right eye outer corner (index 263)
        (-150.0, -150.0, -125.0), # Left mouth corner (index 61)
        (150.0, -150.0, -125.0)   # Right mouth corner (index 291)
    ], dtype=np.float64)

    LANDMARK_INDICES = [1, 152, 33, 263, 61, 291]

    def __init__(self):
        self.last_pitch: float = 0.0
        self.last_yaw: float = 0.0
        self.last_roll: float = 0.0

    def estimate(
        self,
        landmarks: np.ndarray,
        frame_shape: Tuple[int, int]
    ) -> Optional[Tuple[float, float, float]]:
        """
        Estimate (pitch, yaw, roll) in degrees from MediaPipe landmarks.
        frame_shape: (height, width)
        landmarks: (N, 3) normalized coordinates in [0.0, 1.0]
        """
        if landmarks is None or len(landmarks) < 468:
            return None

        h, w = frame_shape[:2]
        if h <= 0 or w <= 0:
            return None

        try:
            # 2D pixel coordinates for the 6 canonical anchor landmarks
            image_points = np.array([
                (landmarks[idx][0] * w, landmarks[idx][1] * h)
                for idx in self.LANDMARK_INDICES
            ], dtype=np.float64)

            # Approximate camera intrinsic matrix (pinhole model)
            focal_length = float(w)
            center = (float(w / 2.0), float(h / 2.0))
            camera_matrix = np.array([
                [focal_length, 0.0, center[0]],
                [0.0, focal_length, center[1]],
                [0.0, 0.0, 1.0]
            ], dtype=np.float64)

            dist_coeffs = np.zeros((4, 1), dtype=np.float64)  # Assume zero lens distortion

            # Solve Perspective-n-Point
            success, rvec, tvec = cv2.solvePnP(
                self.MODEL_POINTS_3D,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_EPNP
            )

            if not success:
                # Fallback to direct geometric ratio
                return self._geometric_fallback(landmarks)

            # Convert rotation vector to rotation matrix
            rmat, _ = cv2.Rodrigues(rvec)

            # Compute Euler angles from rotation matrix
            sy = np.sqrt(rmat[0, 0] * rmat[0, 0] + rmat[1, 0] * rmat[1, 0])
            singular = sy < 1e-6

            if not singular:
                pitch = np.arctan2(rmat[2, 1], rmat[2, 2])
                yaw = np.arctan2(-rmat[2, 0], sy)
                roll = np.arctan2(rmat[1, 0], rmat[0, 0])
            else:
                pitch = np.arctan2(-rmat[1, 2], rmat[1, 1])
                yaw = np.arctan2(-rmat[2, 0], sy)
                roll = 0.0

            # Convert radians to degrees
            pitch_deg = float(np.degrees(pitch))
            yaw_deg = float(np.degrees(yaw))
            roll_deg = float(np.degrees(roll))

            self.last_pitch = pitch_deg
            self.last_yaw = yaw_deg
            self.last_roll = roll_deg

            return (pitch_deg, yaw_deg, roll_deg)

        except Exception:
            return self._geometric_fallback(landmarks)

    def _geometric_fallback(self, landmarks: np.ndarray) -> Tuple[float, float, float]:
        """
        Fast robust fallback using anchor relative distances when PnP fails.
        """
        try:
            # Nose tip
            nose_x, nose_y = landmarks[1][0], landmarks[1][1]
            # Left and right eye corners
            lex, ley = landmarks[33][0], landmarks[33][1]
            rex, rey = landmarks[263][0], landmarks[263][1]

            ipd = np.sqrt((rex - lex) ** 2 + (rey - ley) ** 2)
            if ipd < 1e-5:
                return (0.0, 0.0, 0.0)

            mid_x = (lex + rex) / 2.0
            mid_y = (ley + rey) / 2.0

            # Yaw: asymmetry between nose and midpoint of eyes normalized by IPD
            yaw_ratio = (nose_x - mid_x) / ipd
            yaw_deg = float(np.clip(yaw_ratio * 75.0, -90.0, 90.0))

            # Pitch: nose elevation relative to eye baseline
            pitch_ratio = (nose_y - mid_y) / ipd
            pitch_deg = float(np.clip((pitch_ratio - 0.45) * 60.0, -90.0, 90.0))

            # Roll: angle of eye line
            roll_rad = np.arctan2(rey - ley, rex - lex)
            roll_deg = float(np.degrees(roll_rad))

            self.last_pitch = pitch_deg
            self.last_yaw = yaw_deg
            self.last_roll = roll_deg

            return (pitch_deg, yaw_deg, roll_deg)
        except Exception:
            return (0.0, 0.0, 0.0)

    def is_turned(self, direction: str = 'any', min_yaw_deg: float = 20.0) -> bool:
        """
        Check if the head is turned past min_yaw_deg.
        direction: 'left' (positive yaw in mirror view), 'right' (negative), or 'any'.
        """
        if direction == 'left':
            return self.last_yaw < -min_yaw_deg or self.last_yaw > min_yaw_deg
        elif direction == 'right':
            return abs(self.last_yaw) >= min_yaw_deg
        return abs(self.last_yaw) >= min_yaw_deg
