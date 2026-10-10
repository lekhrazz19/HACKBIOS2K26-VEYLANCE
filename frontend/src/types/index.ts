export type SignalName = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
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
  hf_ratio?: number;
  lbp_entropy?: number;
  instant_risk: number;
  smoothed_risk: number;
  faces_count: number;
  audio_rms?: number;
  s5_correlation?: number;
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

export type SimulationScenario = 
  | 'baseline' 
  | 'occlusion_warp' 
  | 'robotic_blink' 
  | 'seam_blur' 
  | 'av_desync';

export interface AuditLogEvent {
  timestamp: string;
  type: string;
  severity: 'info' | 'warning' | 'alert' | 'critical';
  details: string;
  trustScore: number;
}

export interface AuditReportSummary {
  sessionId: string;
  startedAt: string;
  durationSeconds: number;
  totalFrames: number;
  finalTrustScore: number;
  riskLevel: RiskLevel;
  verifiedVerdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'FLAGGED_DEEPFAKE';
  signalsSummary: Partial<Record<SignalName, { score: number; status: SignalStatus; reason: string }>>;
  alertsCount: number;
  events: AuditLogEvent[];
}
