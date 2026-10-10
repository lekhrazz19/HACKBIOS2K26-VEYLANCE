import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardState, SimulationScenario, SignalResult, OcclusionZone, TelemetryData } from '../types';

export function useSimulation() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('baseline');
  const [simulatedState, setSimulatedState] = useState<DashboardState | null>(null);

  const timerRef = useRef<number | null>(null);
  const tickCountRef = useRef(0);

  const generateScenarioState = useCallback((scenario: SimulationScenario, tick: number): DashboardState => {
    const timestamp = Date.now();
    const nowSec = timestamp / 1000;

    // Helper to generate 20x20 heatmap
    const createHeatmap = (hotspots: { r: number; c: number; intensity: number; radius: number }[] = []) => {
      const grid: number[][] = Array.from({ length: 20 }, () => Array(20).fill(0.04));
      
      // Add natural subtle base face oval
      for (let r = 2; r < 18; r++) {
        for (let c = 3; c < 17; c++) {
          const dy = (r - 10) / 8;
          const dx = (c - 10) / 7;
          if (dx * dx + dy * dy <= 1.0) {
            grid[r][c] = 0.08 + Math.sin(r + tick * 0.1) * 0.03;
          }
        }
      }

      // Add hotspots
      hotspots.forEach(h => {
        for (let r = 0; r < 20; r++) {
          for (let c = 0; c < 20; c++) {
            const dist = Math.hypot(r - h.r, c - h.c);
            if (dist <= h.radius) {
              const weight = 1 - dist / h.radius;
              grid[r][c] = Math.min(1.0, grid[r][c] + h.intensity * weight);
            }
          }
        }
      });

      return grid;
    };

    let trust = 96.5;
    let riskLevel: 'HIGH_TRUST' | 'WARNING' | 'ALERT' = 'HIGH_TRUST';
    let s1Score = 0.08;
    let s2Score = 0.06;
    let s3Score = 0.09;
    let s4Score = 0.05;
    let s5Score = 0.08;
    
    let ear = 0.28 + Math.sin(tick * 0.5) * 0.04;
    let blinkRate = 16.5;
    let blinkCv = 0.55;
    let avgDur = 220;
    let lapVar = 185;
    let ipdDrift = 0.012;
    let audioRms = 0.25;
    let s5Corr = 0.88;

    let occlusionZones: OcclusionZone[] = [
      { zone: "Forehead", score: 0.06, status: "CLEAR" },
      { zone: "Right Eye", score: 0.07, status: "CLEAR" },
      { zone: "Nose", score: 0.08, status: "CLEAR" },
      { zone: "Left Eye", score: 0.06, status: "CLEAR" },
      { zone: "Mouth/Chin", score: 0.09, status: "CLEAR" }
    ];

    let heatmap = createHeatmap();
    let alert = null;

    if (scenario === 'baseline') {
      trust = 95.0 + Math.sin(tick * 0.2) * 2.5;
      riskLevel = 'HIGH_TRUST';
      // Occasional natural blink dip
      if (tick % 15 === 0) ear = 0.09;
    } else if (scenario === 'occlusion_warp') {
      trust = 34.0 + Math.sin(tick * 0.2) * 5.0;
      riskLevel = 'ALERT';
      s2Score = 0.88;
      ipdDrift = 0.095;
      occlusionZones = [
        { zone: "Forehead", score: 0.15, status: "CLEAR" },
        { zone: "Right Eye", score: 0.25, status: "PARTIAL" },
        { zone: "Nose", score: 0.92, status: "WARP_ALERT" },
        { zone: "Left Eye", score: 0.78, status: "OCCLUDED" },
        { zone: "Mouth/Chin", score: 0.84, status: "OCCLUDED" }
      ];
      heatmap = createHeatmap([
        { r: 9, c: 9, intensity: 0.95, radius: 4 },
        { r: 13, c: 11, intensity: 0.88, radius: 4 }
      ]);
      alert = {
        type: "3-Finger Hand Occlusion Warp",
        message: "Dynamic facial mesh deformation detected during hand-face interaction. Significant landmark shear in perioral & nasal zones.",
        severity: "critical" as const,
        signals: ["S2", "IPD_DRIFT"]
      };
    } else if (scenario === 'robotic_blink') {
      trust = 42.0 + Math.sin(tick * 0.2) * 4.0;
      riskLevel = 'ALERT';
      s4Score = 0.85;
      ear = 0.31; // Flat, glassy open stare
      blinkRate = 3.2; // Severely suppressed
      blinkCv = 0.08; // Robotic periodicity
      avgDur = 90;
      alert = {
        type: "Robotic Eye Blink Anomaly",
        message: "Abnormal blinking dynamics. Frequency is < 4 blinks/min with robotic IBI regularity indicative of neural synthetic replay.",
        severity: "high" as const,
        signals: ["S4"]
      };
    } else if (scenario === 'seam_blur') {
      trust = 28.5 + Math.sin(tick * 0.2) * 3.0;
      riskLevel = 'ALERT';
      s1Score = 0.94;
      s3Score = 0.86;
      lapVar = 32; // Over-smoothed texture
      heatmap = createHeatmap([
        { r: 3, c: 10, intensity: 0.90, radius: 5 },
        { r: 16, c: 10, intensity: 0.85, radius: 4 },
        { r: 10, c: 4, intensity: 0.88, radius: 4 },
        { r: 10, c: 16, intensity: 0.88, radius: 4 }
      ]);
      alert = {
        type: "Boundary Boundary & Texture Artifacts",
        message: "High-gradient boundary seams detected at face perimeter combined with unnatural low-frequency skin texture smoothing.",
        severity: "critical" as const,
        signals: ["S1", "S3"]
      };
    } else if (scenario === 'av_desync') {
      trust = 52.0 + Math.sin(tick * 0.2) * 4.0;
      riskLevel = 'WARNING';
      s5Score = 0.74;
      s5Corr = 0.12;
      audioRms = 0.65; // High speech
      alert = {
        type: "Audio-Visual Lip Desynchronization",
        message: "Pronounced lag between acoustic speech energy and mouth perioral landmark oscillation. Dubbing or voice clone suspect.",
        severity: "medium" as const,
        signals: ["S5"]
      };
    }

    const signals: SignalResult[] = [
      {
        signal: 'S1',
        score: s1Score,
        confidence: 0.94,
        status: s1Score > 0.6 ? 'ALERT' : s1Score > 0.3 ? 'WARNING' : 'NORMAL',
        reason: `Grad: ${(s1Score * 120).toFixed(0)} | Perimeter seam artifacts: ${(s1Score * 100).toFixed(0)}%`,
        timestamp
      },
      {
        signal: 'S2',
        score: s2Score,
        confidence: 0.92,
        status: s2Score > 0.6 ? 'ALERT' : s2Score > 0.3 ? 'WARNING' : 'NORMAL',
        reason: `Warp: ${(s2Score * 0.08).toFixed(3)} | Hand occlusion shear: ${(s2Score * 100).toFixed(0)}%`,
        timestamp
      },
      {
        signal: 'S3',
        score: s3Score,
        confidence: 0.90,
        status: s3Score > 0.6 ? 'ALERT' : s3Score > 0.3 ? 'WARNING' : 'NORMAL',
        reason: `LapVar: ${lapVar} | FFT High-Freq: ${(s3Score > 0.5 ? 0.12 : 0.48).toFixed(2)}`,
        timestamp
      },
      {
        signal: 'S4',
        score: s4Score,
        confidence: 0.96,
        status: s4Score > 0.6 ? 'ALERT' : s4Score > 0.3 ? 'WARNING' : 'NORMAL',
        reason: `Rate: ${blinkRate.toFixed(1)}/min | IBI CV: ${blinkCv.toFixed(2)} | Duration: ${avgDur}ms`,
        timestamp
      },
      {
        signal: 'S5',
        score: s5Score,
        confidence: 0.88,
        status: s5Score > 0.6 ? 'ALERT' : s5Score > 0.3 ? 'WARNING' : 'NORMAL',
        reason: `Corr: ${s5Corr.toFixed(2)} | Speech RMS: ${audioRms.toFixed(2)} | AV Sync Lag: ${(s5Score * 140).toFixed(0)}ms`,
        timestamp
      }
    ];

    const telemetry: TelemetryData = {
      ear,
      blink_rate: blinkRate,
      blink_cv: blinkCv,
      avg_duration_ms: avgDur,
      laplacian_var: lapVar,
      color_corr: 0.94,
      ipd_drift: ipdDrift,
      hf_ratio: s3Score > 0.5 ? 0.14 : 0.45,
      lbp_entropy: 4.8,
      instant_risk: (100 - trust) / 100,
      smoothed_risk: (100 - trust) / 100,
      faces_count: 1,
      audio_rms: audioRms,
      s5_correlation: s5Corr
    };

    return {
      timestamp,
      session_id: "SIM_" + scenario.toUpperCase() + "_" + Math.floor(nowSec),
      face_detected: true,
      trust_score: trust,
      risk_level: riskLevel,
      signals,
      alert,
      challenge: null,
      faces: [
        {
          id: 0,
          x: 0.28,
          y: 0.18,
          w: 0.44,
          h: 0.58,
          is_primary: true
        }
      ],
      occlusion_zones: occlusionZones,
      heatmap,
      telemetry
    };
  }, []);

  const startSimulation = useCallback((scenario: SimulationScenario = 'baseline') => {
    setActiveScenario(scenario);
    setIsSimulating(true);
    tickCountRef.current = 0;
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimulatedState(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isSimulating) {
      // 5 FPS update loop matching backend target cadence
      timerRef.current = window.setInterval(() => {
        tickCountRef.current += 1;
        const nextState = generateScenarioState(activeScenario, tickCountRef.current);
        setSimulatedState(nextState);
      }, 200);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [isSimulating, activeScenario, generateScenarioState]);

  return {
    isSimulating,
    activeScenario,
    startSimulation,
    stopSimulation,
    setActiveScenario,
    simulatedState
  };
}
