import pytest
import numpy as np
import time

from app.models import SignalResult
from app.signals.s1_boundary import S1BoundaryDetector
from app.signals.s2_occlusion import S2OcclusionDetector
from app.signals.s3_texture import S3TextureDetector
from app.signals.s4_blink import S4BlinkDetector
from app.signals.s5_avsync import S5AVSyncDetector
from app.signals.heatmap import HeatmapGenerator
from app.face.head_pose import HeadPoseEstimator
from app.challenge.engine import ChallengeEngine


def generate_mock_landmarks(h=480, w=640, yaw_offset=0.0):
    """Generate 468 plausible normalized face landmarks for unit testing."""
    landmarks = np.zeros((468, 3), dtype=np.float32)
    # Centers around (0.5, 0.5)
    center_x, center_y = 0.5 + yaw_offset, 0.5
    for i in range(468):
        angle = (2.0 * np.pi * i) / 468.0
        r = 0.15 + (i % 5) * 0.01
        landmarks[i, 0] = center_x + r * np.cos(angle)
        landmarks[i, 1] = center_y + r * np.sin(angle)
        landmarks[i, 2] = -0.05 + 0.1 * np.cos(angle * 2)

    # Set canonical landmark anchors specifically
    landmarks[1] = [center_x, center_y + 0.02, 0.0]        # Nose tip
    landmarks[152] = [center_x, center_y + 0.16, -0.02]    # Chin
    landmarks[33] = [center_x - 0.08, center_y - 0.04, -0.01]  # Left eye outer corner
    landmarks[263] = [center_x + 0.08, center_y - 0.04, -0.01] # Right eye outer corner
    landmarks[61] = [center_x - 0.05, center_y + 0.08, -0.01]  # Left mouth corner
    landmarks[291] = [center_x + 0.05, center_y + 0.08, -0.01] # Right mouth corner

    # Left eye contour: [33, 160, 158, 133, 153, 144]
    landmarks[160] = [center_x - 0.06, center_y - 0.055, 0.0]
    landmarks[158] = [center_x - 0.04, center_y - 0.055, 0.0]
    landmarks[133] = [center_x - 0.03, center_y - 0.04, 0.0]
    landmarks[153] = [center_x - 0.04, center_y - 0.025, 0.0]
    landmarks[144] = [center_x - 0.06, center_y - 0.025, 0.0]

    # Right eye contour: [362, 385, 387, 263, 373, 380]
    landmarks[362] = [center_x + 0.03, center_y - 0.04, 0.0]
    landmarks[385] = [center_x + 0.04, center_y - 0.055, 0.0]
    landmarks[387] = [center_x + 0.06, center_y - 0.055, 0.0]
    landmarks[373] = [center_x + 0.06, center_y - 0.025, 0.0]
    landmarks[380] = [center_x + 0.04, center_y - 0.025, 0.0]

    return landmarks


def generate_mock_face_hull(h=480, w=640):
    """Generate a convex polygon representing the face perimeter in pixels."""
    cx, cy = w // 2, h // 2
    r_x, r_y = 100, 130
    points = []
    for theta in np.linspace(0, 2 * np.pi, 20, endpoint=False):
        px = int(cx + r_x * np.cos(theta))
        py = int(cy + r_y * np.sin(theta))
        points.append([px, py])
    return np.array(points, dtype=np.int32)


# ============================================================================
# S1 Boundary Detector Tests
# ============================================================================

def test_s1_boundary_detector_basic():
    detector = S1BoundaryDetector()
    frame = np.full((480, 640, 3), 180, dtype=np.uint8)
    # Add skin color inside face
    cv2_hull = generate_mock_face_hull()
    landmarks = generate_mock_landmarks()

    result = detector.process(frame, landmarks, cv2_hull)
    assert isinstance(result, SignalResult)
    assert result.signal == 'S1'
    assert 0.0 <= result.score <= 1.0
    assert result.status in ['NORMAL', 'WARNING', 'ALERT']
    assert len(result.reason) > 0


def test_s1_boundary_detector_edge_cases():
    detector = S1BoundaryDetector()
    # None inputs
    res_none = detector.process(None, None, None)
    assert res_none.score == 0.0
    assert res_none.status == 'NORMAL'

    # Empty frame
    empty_frame = np.zeros((0, 0, 3), dtype=np.uint8)
    res_empty = detector.process(empty_frame, None, np.array([]))
    assert res_empty.score == 0.0


# ============================================================================
# S2 Occlusion & 3-Finger Test Physics Tests
# ============================================================================

def test_s2_occlusion_detector_basic():
    detector = S2OcclusionDetector()
    landmarks = generate_mock_landmarks()

    result = detector.process(landmarks, ts=time.time())
    assert isinstance(result, SignalResult)
    assert result.signal == 'S2'
    assert 0.0 <= result.score <= 1.0
    assert result.status in ['NORMAL', 'WARNING', 'ALERT']


def test_s2_occlusion_3finger_warp_detection():
    detector = S2OcclusionDetector()
    t0 = time.time()
    l1 = generate_mock_landmarks()
    detector.process(l1, ts=t0)

    # Simulate 3-finger test hand occlusion causing acute triangle warp
    l2 = l1.copy()
    l2[1] += [0.09, 0.08, 0.0]  # Distort nose position violently relative to eyes
    result = detector.process(l2, ts=t0 + 0.05)

    assert result.score > 0.0
    assert "Warp" in result.reason or "Drift" in result.reason


def test_s2_occlusion_zones():
    detector = S2OcclusionDetector()
    landmarks = generate_mock_landmarks()
    zones = detector.get_occlusion_zones(landmarks, frame_shape=(480, 640))

    assert len(zones) == 5
    zone_names = {z['zone'] for z in zones}
    assert 'Forehead' in zone_names
    assert 'Left Eye' in zone_names
    assert 'Right Eye' in zone_names
    assert 'Nose' in zone_names
    assert 'Mouth/Chin' in zone_names


# ============================================================================
# S3 Texture Detector Tests
# ============================================================================

def test_s3_texture_detector():
    detector = S3TextureDetector()
    frame = np.full((480, 640, 3), 160, dtype=np.uint8)
    # Add natural subtle pixel variation
    noise = np.random.normal(0, 15, frame.shape).astype(np.int16)
    frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    landmarks = generate_mock_landmarks()

    result = detector.process(frame, landmarks)
    assert isinstance(result, SignalResult)
    assert result.signal == 'S3'
    assert 0.0 <= result.score <= 1.0
    assert result.status in ['NORMAL', 'WARNING', 'ALERT']


# ============================================================================
# S4 Blink Detector Tests
# ============================================================================

def test_s4_blink_detector():
    detector = S4BlinkDetector()
    landmarks = generate_mock_landmarks()

    result = detector.process(landmarks, ts=time.time())
    assert isinstance(result, SignalResult)
    assert result.signal == 'S4'
    assert 0.0 <= result.score <= 1.0
    assert detector.current_ear > 0.0


# ============================================================================
# S5 Audio-Visual Sync Detector Tests
# ============================================================================

def test_s5_avsync_silent_state():
    detector = S5AVSyncDetector()
    landmarks = generate_mock_landmarks()
    # In silence (listening), should not penalize trust score
    result = detector.process(landmarks, audio_rms=0.005, ts=time.time())
    assert isinstance(result, SignalResult)
    assert result.score == 0.0
    assert result.status == 'NORMAL'


# ============================================================================
# HeadPoseEstimator & ChallengeEngine Tests
# ============================================================================

def test_head_pose_estimator():
    estimator = HeadPoseEstimator()
    landmarks = generate_mock_landmarks()
    pose = estimator.estimate(landmarks, frame_shape=(480, 640))

    assert pose is not None
    pitch, yaw, roll = pose
    assert isinstance(pitch, float)
    assert isinstance(yaw, float)
    assert isinstance(roll, float)


def test_challenge_engine_turn_head_verification():
    engine = ChallengeEngine()
    # Force TURN_HEAD challenge
    from app.models import ChallengeState
    engine.active_challenge = ChallengeState(type='TURN_HEAD', status='PENDING', remaining_seconds=10.0)
    engine.challenge_start_time = time.time()

    # Frontal face (should not pass immediately)
    l_frontal = generate_mock_landmarks(yaw_offset=0.0)
    passed, boost = engine.verify(l_frontal)
    assert not passed

    # Turned face (should pass)
    l_turned = generate_mock_landmarks(yaw_offset=0.08)
    passed, boost = engine.verify(l_turned)
    assert passed
    assert boost > 0.0


# ============================================================================
# HeatmapGenerator Tests
# ============================================================================

def test_heatmap_generator():
    generator = HeatmapGenerator()
    frame = np.full((480, 640, 3), 180, dtype=np.uint8)
    landmarks = generate_mock_landmarks()
    hull = generate_mock_face_hull()

    grid = generator.generate(frame, landmarks, hull)
    assert len(grid) == 20
    assert len(grid[0]) == 20
    for row in grid:
        for val in row:
            assert 0.0 <= val <= 1.0
