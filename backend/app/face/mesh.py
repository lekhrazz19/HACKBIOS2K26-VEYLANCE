import cv2
import numpy as np
import mediapipe as mp
from app.models import FaceBox

class FaceMeshProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=5,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def process(self, frame: np.ndarray):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
            
        landmarks = []
        for lm in results.multi_face_landmarks[0].landmark:
            landmarks.append([lm.x, lm.y, lm.z])
        return np.array(landmarks)
        
    def process_all(self, frame: np.ndarray):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return []
            
        all_landmarks = []
        for face_landmarks in results.multi_face_landmarks:
            landmarks = []
            for lm in face_landmarks.landmark:
                landmarks.append([lm.x, lm.y, lm.z])
            all_landmarks.append(np.array(landmarks))
        return all_landmarks

    def get_all_face_boxes(self, all_landmarks_list, frame_shape) -> list:
        h, w = frame_shape[:2]
        boxes = []
        areas = []
        
        for idx, landmarks in enumerate(all_landmarks_list):
            xs = [lm[0] for lm in landmarks]
            ys = [lm[1] for lm in landmarks]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            
            box_w = max_x - min_x
            box_h = max_y - min_y
            area = box_w * box_h
            
            boxes.append({
                'id': idx,
                'x': min_x,
                'y': min_y,
                'w': box_w,
                'h': box_h,
                'area': area
            })
            areas.append(area)
            
        if not boxes:
            return []
            
        primary_idx = int(np.argmax(areas))
        
        face_boxes = []
        for i, b in enumerate(boxes):
            face_boxes.append(FaceBox(
                id=b['id'],
                x=b['x'],
                y=b['y'],
                w=b['w'],
                h=b['h'],
                is_primary=(i == primary_idx)
            ))
            
        return face_boxes
        
    def get_face_hull(self, landmarks: np.ndarray, frame_shape: tuple) -> np.ndarray:
        h, w = frame_shape[:2]
        points = []
        for lm in landmarks:
            points.append([int(lm[0] * w), int(lm[1] * h)])
        points = np.array(points, dtype=np.int32)
        hull = cv2.convexHull(points)
        return hull

    def __del__(self):
        self.face_mesh.close()
