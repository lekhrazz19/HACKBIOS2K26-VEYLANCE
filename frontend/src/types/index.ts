export type SignalName = 'S1' | 'S2' | 'S4';
export type SignalStatus = 'NORMAL' | 'WARNING' | 'ALERT';
export type RiskLevel = 'HIGH_TRUST' | 'WARNING' | 'ALERT';
export type ChallengeType = 'TURN_HEAD' | 'BLINK' | 'HOLD_NEUTRAL';
export type ChallengeStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'EXPIRED';

export interface SignalResult {
  signal: SignalName;
  score: number;
  confidence: number;
  status: SignalStatus;
  reason: string;
  timestamp: number;
}

export interface AlertInfo {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  signals: string[];
}

export interface ChallengeState {
  type: ChallengeType;
  status: ChallengeStatus;
  remaining_seconds: number;
}

export interface TelemetryData {
  ear: number;
  blink_rate: number;
  blink_cv: number;
  avg_duration_ms: number;
  laplacian_var: number;
  color_corr: number;
  ipd_drift: number;
  instant_risk: number;
  smoothed_risk: number;
  faces_count: number;
}

export interface FaceBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  is_primary: boolean;
}

export interface OcclusionZone {
  zone: string;
  score: number;
  status: string;
}

export interface DashboardState {
  timestamp: number;
  session_id: string;
  face_detected: boolean;
  trust_score: number;
  risk_level: RiskLevel;
  signals: SignalResult[];
  alert: AlertInfo | null;
  challenge: ChallengeState | null;
  faces?: FaceBox[];
  occlusion_zones?: OcclusionZone[];
  heatmap?: number[][];
  telemetry?: TelemetryData;
}
