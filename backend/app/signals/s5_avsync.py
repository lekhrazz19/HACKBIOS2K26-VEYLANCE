import time
import numpy as np
from collections import deque
from typing import Optional
from app.models import SignalResult

# MediaPipe lip landmark indices
LIP_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]

class S5AVSyncDetector:
    """
    S5: Audio/Visual Synchronization Signal.
    Detects mismatches between lip movement and audio loudness.
    Deepfakes often have poor lip-sync, synthesized voice dubbing, or mismatched audio.
    
    Sensible Judgement Logic:
    1. Voice / Speech Activity Detection (VAD):
       - If audio is quiet (< 0.012 RMS) and lips are still (< 0.0025 px), user is listening/silent.
       - Silent / listening state is normal human behavior, NOT desynchronization. Score = 0.0.
    2. Multi-lag Cross-Correlation:
       - Checks lags (-1, 0, +1 frame, approx ±100ms) to accommodate network/WebSocket camera buffer delay.
    3. True Desync Anomaly Detection:
       - High continuous speech audio with motionless lips (voice dubbing).
       - Exaggerated lip flapping with absolute silence (avatar dubbing mismatch).
    """
    
    WINDOW_SECS = 2.0
    MIN_SAMPLES = 5
    SILENCE_RMS_THRESHOLD = 0.014
    QUIET_LIP_THRESHOLD = 0.0025
    
    def __init__(self):
        self._history = deque()  # (ts, lip_motion, audio_rms)
        self._prev_lip_pts = None
        self.last_correlation = 1.0
        self.is_active = False  # becomes True when audio_rms is provided
    
    def process(self, landmarks: np.ndarray, audio_rms: Optional[float], ts: float) -> SignalResult:
        now = ts
        
        # If no audio feed, gracefully deactivate — do NOT penalize trust score
        if audio_rms is None:
            self.is_active = False
            return SignalResult(
                signal='S5',
                score=0.0,
                confidence=0.0,
                status='NORMAL',
                reason='Audio inactive (Video-only mode)',
                timestamp=now
            )
        
        self.is_active = True
        
        # Compute normalized lip motion
        lip_motion = 0.0
        if landmarks is not None and len(landmarks) > max(LIP_INDICES):
            lip_pts = landmarks[LIP_INDICES, :2]  # (N, 2) xy only
            if self._prev_lip_pts is not None:
                displacements = np.linalg.norm(lip_pts - self._prev_lip_pts, axis=1)
                lip_motion = float(np.mean(displacements))
            self._prev_lip_pts = lip_pts.copy()
        
        # Store in sliding window
        self._history.append((now, lip_motion, float(audio_rms)))
        
        # Prune old entries
        while self._history and now - self._history[0][0] > self.WINDOW_SECS:
            self._history.popleft()
        
        if len(self._history) < self.MIN_SAMPLES:
            return SignalResult(
                signal='S5',
                score=0.0,
                confidence=0.1,
                status='NORMAL',
                reason=f'Sync calibrating ({len(self._history)}/{self.MIN_SAMPLES} samples)',
                timestamp=now
            )
        
        motions = np.array([h[1] for h in self._history])
        audios  = np.array([h[2] for h in self._history])
        
        mean_motion = float(np.mean(motions))
        mean_audio  = float(np.mean(audios))
        std_motion  = float(np.std(motions))
        std_audio   = float(np.std(audios))
        
        # 1. QUIET / LISTENING STATE:
        # If neither significant speech nor large lip movement is happening, the user is listening
        if mean_audio < self.SILENCE_RMS_THRESHOLD and mean_motion < self.QUIET_LIP_THRESHOLD:
            self.last_correlation = 1.0
            return SignalResult(
                signal='S5',
                score=0.0,
                confidence=0.75,
                status='NORMAL',
                reason=f'Listening state (Quiet) | AudioRMS: {audio_rms:.3f}',
                timestamp=now
            )
        
        # 2. SEVERE ANOMALY DETECTION:
        # A) Continuous speech audio with motionless lips (Voice dubbing / spoofing)
        if mean_audio > 0.035 and mean_motion < 0.0012:
            self.last_correlation = 0.0
            return SignalResult(
                signal='S5',
                score=0.85,
                confidence=0.85,
                status='ALERT',
                reason=f'Voice dubbing detected (Speech loud but lips motionless: {mean_motion*1000:.1f}px)',
                timestamp=now
            )
            
        # B) Heavy lip motion with dead silence (Avatar playback mismatch)
        if mean_motion > 0.008 and mean_audio < 0.005:
            self.last_correlation = 0.0
            return SignalResult(
                signal='S5',
                score=0.75,
                confidence=0.80,
                status='ALERT',
                reason=f'Silent avatar anomaly (Lips moving rapidly without voice audio)',
                timestamp=now
            )
        
        # 3. MULTI-LAG CROSS-CORRELATION:
        # Account for typical webcam capture / transmission delay (lags of -1, 0, +1 frames)
        best_corr = -1.0
        if std_motion > 1e-5 and std_audio > 1e-5:
            # lag = 0
            corr_0 = float(np.corrcoef(motions, audios)[0, 1])
            best_corr = max(best_corr, corr_0)
            
            # lag = 1 (audio leads motion by 1 sample)
            if len(motions) > 4:
                corr_1 = float(np.corrcoef(motions[1:], audios[:-1])[0, 1])
                best_corr = max(best_corr, corr_1)
                
            # lag = -1 (motion leads audio by 1 sample)
            if len(motions) > 4:
                corr_m1 = float(np.corrcoef(motions[:-1], audios[1:])[0, 1])
                best_corr = max(best_corr, corr_m1)
        else:
            best_corr = 0.8  # Inconclusive variation, treat as benign
            
        best_corr = float(np.clip(best_corr, -1.0, 1.0))
        self.last_correlation = best_corr
        
        # Score calculation:
        # High correlation (> 0.25) during speech is good human sync -> score near 0.0
        # Correlation <= 0.0 indicates negative or random sync -> score higher
        if best_corr >= 0.25:
            score = 0.0
        elif best_corr >= 0.0:
            score = float((0.25 - best_corr) / 0.25 * 0.40)  # Gentle 0.0 to 0.40
        else:
            # Negative correlation
            score = float(0.40 + min(0.60, abs(best_corr) * 0.60))
            
        score = float(np.clip(score, 0.0, 1.0))
        confidence = min(0.92, 0.4 + 0.5 * (len(self._history) / 15.0))
        
        status = 'NORMAL'
        if score >= 0.65:
            status = 'ALERT'
        elif score >= 0.35:
            status = 'WARNING'
            
        label = 'In-sync speech' if score < 0.35 else ('Minor delay / desync' if score < 0.65 else 'Lip-sync mismatch')
        reason = f'Corr: {best_corr:.2f} | LipMotion: {lip_motion*1000:.1f}px | AudioRMS: {audio_rms:.3f} — {label}'
        
        return SignalResult(
            signal='S5',
            score=float(score),
            confidence=float(confidence),
            status=status,
            reason=reason,
            timestamp=now
        )

