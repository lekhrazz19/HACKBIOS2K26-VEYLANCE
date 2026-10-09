from pydantic import BaseModel
from typing import Literal, Optional, List

class SignalResult(BaseModel):
    signal: Literal['S1', 'S2', 'S3', 'S4', 'S5']
    score: float
    confidence: float
    status: Literal['NORMAL', 'WARNING', 'ALERT']
    reason: str
    timestamp: float

class AlertInfo(BaseModel):
    type: str
    message: str
    severity: Literal['low', 'medium', 'high', 'critical']
    signals: List[str]

class ChallengeState(BaseModel):
    type: Literal['TURN_HEAD', 'BLINK', 'HOLD_NEUTRAL']
    status: Literal['PENDING', 'PASSED', 'FAILED', 'EXPIRED']
    remaining_seconds: float

class FaceBox(BaseModel):
    id: int
    x: float
    y: float
    w: float
    h: float
    is_primary: bool

class OcclusionZone(BaseModel):
    zone: str
    score: float
    status: str

class TelemetryData(BaseModel):
    ear: float
    blink_rate: float
    blink_cv: float
    avg_duration_ms: float
    laplacian_var: float
    color_corr: float
    ipd_drift: float
    hf_ratio: float = 0.0
    lbp_entropy: float = 0.0
    instant_risk: float
    smoothed_risk: float
    faces_count: int
    audio_rms: Optional[float] = None
    s5_correlation: Optional[float] = None

class DashboardState(BaseModel):
    timestamp: float
    session_id: str
    face_detected: bool
    trust_score: float
    risk_level: Literal['HIGH_TRUST', 'WARNING', 'ALERT']
    signals: List[SignalResult]
    alert: Optional[AlertInfo] = None
    challenge: Optional[ChallengeState] = None
    faces: List[FaceBox] = []
    faces_count: int = 0
    occlusion_zones: List[OcclusionZone] = []
    heatmap: List[List[float]] = []
    telemetry: Optional[TelemetryData] = None
