# VeyLance Cyber-Forensics Mission Control — Frontend Specification

**Date:** 2026-10-10  
**Status:** Approved for Implementation  
**Target:** Frontend Architecture (`frontend/src/`)  
**Backend Constraint:** Zero modifications to `backend/` — all existing WebSocket protocols, payloads, and endpoints remain strictly untouched.

---

## 1. System Overview & Vision

VeyLance is a real-time biometric and deepfake forensic engine designed for live high-stakes video interviews and meetings (Google Meet, Zoom, WebRTC). 

The goal of this specification is to elevate the VeyLance frontend into an ultra-premium, cyber-forensics mission control dashboard featuring:
1. **Sleek Glassmorphism & Cyber Aesthetics:** High-contrast dark mode, custom typography (`Plus Jakarta Sans` & `JetBrains Mono`), neon telemetry accents (cyan, emerald, amber, crimson), animated HUD scanlines, and glow rings.
2. **Interactive Simulation / Demo Mode:** An in-browser synthetic deepfake test simulator allowing users/judges to test and demonstrate biometric anomalies (3-finger occlusion, robotic blink rate, seam blur, audio desync) without requiring a physical camera or live deepfake feed.
3. **Multi-Source Ingestion:** Seamless switching between direct **Webcam**, **Screen Share** (Google Meet / Zoom tab inspection with multi-participant face tracking), and **Simulation Mode**.
4. **Enhanced Biometric HUD:** Live video HUD with toggleable tactical layers (Targeting Brackets, Landmark Mesh Points, Coordinate Grid, Integrity Badges).
5. **Real-time Audio Visualizer:** Dynamic speech amplitude waveform synchronized with the S5 Audio-Visual sync detector.
6. **Comprehensive Forensic Suite:**
   - **EWMA Trust Gauge** with animated arc, risk level badge, and confidence metrics.
   - **Multi-Signal Forensic Vectors (S1–S5)** with metric pills, sparklines, and attack explanations.
   - **20×20 Anomaly Heatmap** with Thermal, Turbo, and Cyber palettes, plus zone hover inspector.
   - **Face Zone Occlusion Polar Radar** with animated sweep line and 5 facial zone axes.
   - **S4 Blink Dynamics & EAR Baseline** gauge with IBI regularity and duration metrics.
7. **Forensic Audit & Report Export:** Session event logging and printable/exportable forensic incident audit report.
8. **Interactive Active Challenges:** Challenge engine modal (Turn Head, Blink, Hold Neutral) with animated circular countdown and verification feedback.

---

## 2. Architecture & Component Hierarchy

```
frontend/src/
├── index.html                 # Google Fonts (Plus Jakarta Sans, JetBrains Mono), meta tags, favicon
├── index.css                  # Tailored design system tokens, glow utilities, cyber scrollbars, animations
├── main.tsx                   # App bootstrap
├── types/index.ts             # Strict TypeScript definitions for dashboard state, telemetry, signals, simulation
├── hooks/
│   ├── useWebSocket.ts        # Resilient WebSocket connection with automatic reconnect and audio RMS streaming
│   ├── useWebcam.ts           # MediaStream handling: Webcam, Screen Capture (Meet/Zoom), mirroring control
│   ├── useAudio.ts            # Web Audio API RMS analyzer
│   └── useSimulation.ts       # Synthetic deepfake attack scenarios generator (clean, occlusion, blink, texture, desync)
├── components/
│   ├── StatusBar.tsx          # Top mission-control header: clock, source selector, simulation toggle, start/stop, audio meter
│   ├── TelemetryBar.tsx       # Real-time high-density telemetry ribbon (targets, EAR, blink rate, LapVar, IPD, risk index)
│   ├── WebcamView.tsx         # Video viewport with tactical HUD, corner brackets, target labels, source switch overlay
│   ├── HUDOverlay.tsx         # Toggleable HUD layers (landmark points, targeting grid, participant tags)
│   ├── AudioVisualizer.tsx    # Live animated audio waveform / RMS meter
│   ├── TrustGauge.tsx         # Circular EWMA trust score gauge with smooth transition and metrics grid
│   ├── SignalCards.tsx        # S1–S5 forensic cards with sparklines, status pills, and expandable vulnerability details
│   ├── HeatmapPanel.tsx       # 20×20 forensic anomaly heatmap with palettes (Thermal/Turbo/Cyber) and anatomical zone inspector
│   ├── OcclusionGraph.tsx     # 5-axis polar occlusion radar with animated sweep and partial occlusion alert
│   ├── BlinkRatePanel.tsx     # S4 eye aspect ratio (EAR) gauge, blink cadence, IBI regularity, and duration metrics
│   ├── SessionStats.tsx       # Session analytics: frames analyzed, alerts count, risk transition history, export button
│   ├── AuditReportModal.tsx   # Comprehensive forensic audit modal with printable report and JSON export
│   ├── ChallengeModal.tsx     # Active biometric challenge modal with countdown timer and visual verification
│   └── AlertPanel.tsx         # High-priority alert banner with dismissibility and severity animations
└── App.tsx                    # Main Mission Control layout assembling all forensic layers
```

---

## 3. Detailed Component Specifications

### 3.1 Styling & Typography (`index.html`, `index.css`)
- **Fonts:** Load `Plus Jakarta Sans` for clean, modern headings and UI text, and `JetBrains Mono` for all numbers, telemetry readouts, status codes, and timestamps.
- **Glassmorphism:** `bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl`.
- **Cyber Accents:**
  - High Trust / Normal: Emerald `#10b981` / Cyan `#06b6d4`
  - Warning / Suspicious: Amber `#f59e0b`
  - Alert / Deepfake: Crimson `#ef4444` / Rose `#f43f5e`
  - Primary Sentinel Blue: `#3b82f6` to `#6366f1`
- **Subtle HUD Scanline:** High-tech background grid pattern with subtle gradient radial lighting.

### 3.2 Simulation / Demo Engine (`useSimulation.ts`)
Allows instant demonstration of deepfake detection capabilities without a physical camera:
- Preset 1: **Normal Authentic Subject** (Trust 96%, Normal EAR 0.28, Blinks 16/min, Low Risk)
- Preset 2: **3-Finger Hand Occlusion Attack (S2)** (Rapid nose/mesh warp, Occlusion radar alerts, Trust drops to 42%)
- Preset 3: **Robotic Low-Blink Attack (S4)** (Blink rate drops to 3/min, robotic IBI CV < 0.15, Alert triggers)
- Preset 4: **Boundary Blur & Texture Anomaly (S1 + S3)** (Laplacian variance drops, seam score spikes to 0.88, Alert triggers)
- Preset 5: **Audio-Visual Desync (S5)** (Voice active without lip movement correlation, S5 correlation drops to 0.12)
- Synthetic canvas animation renders a procedural animated face avatar to simulate video feeds when camera is unavailable.

### 3.3 Enhanced Tactical Video Viewport (`WebcamView.tsx`)
- High-definition viewport supporting both direct camera (mirrored) and Google Meet screen share (unmirrored).
- Primary subject targeting box with tactical corner brackets, crosshairs, and live integrity readout.
- Secondary participant detection badges for Google Meet / Zoom gallery view.
- HUD toggle buttons: Toggle Grid, Toggle Landmark Dots, Fullscreen view.

### 3.4 Live Audio Waveform (`AudioVisualizer.tsx`)
- Compact real-time audio amplitude bar graph displaying candidate microphone RMS levels.
- Visual indicator showing S5 Audio-Visual synchronization status (Synchronized vs Desync Suspected).

### 3.5 Forensic Audit Report Modal (`AuditReportModal.tsx`)
- Generates a full cryptographic-style forensic inspection summary:
  - Session ID, Start Time, Duration, Frames Analyzed
  - Overall Trust Score & Final Verification Verdict (Verified Authentic / Suspicious / Deepfake Flagged)
  - Full Signal breakdown (S1 Boundary, S2 Occlusion, S3 Texture, S4 Blink, S5 AV Sync)
  - Telemetry snapshots (EAR, Blink Rate, IPD Drift, Laplacian Variance)
  - Log of all alert events and challenge test results
  - "Print / Save PDF" and "Download JSON Report" actions.

---

## 4. Backend Safety Guarantee
All changes are strictly isolated to `frontend/`:
- `backend/app/main.py`, `backend/app/signals/*`, `backend/app/face/*`, `backend/app/fusion/*`, `backend/app/challenge/*` remain 100% unaltered.
- WebSocket payloads received by the frontend match `DashboardState` schema exactly.
- Frame transmission to `/ws` maintains standard binary JPEG blobs or JSON envelope with `audio_rms`.

---

## 5. Implementation Phases
1. **Phase 1: Design Tokens & Typography** (`index.html`, `index.css`)
2. **Phase 2: Types & Simulation Engine** (`types/index.ts`, `hooks/useSimulation.ts`, `hooks/useWebSocket.ts`)
3. **Phase 3: Tactical Video Viewport & Audio Visualizer** (`WebcamView.tsx`, `AudioVisualizer.tsx`)
4. **Phase 4: Biometric & Forensic Inspection Suite** (`TrustGauge.tsx`, `SignalCards.tsx`, `BlinkRatePanel.tsx`, `HeatmapPanel.tsx`, `OcclusionGraph.tsx`, `TelemetryBar.tsx`)
5. **Phase 5: Incident Audit Report & Mission Control Assembly** (`AuditReportModal.tsx`, `SessionStats.tsx`, `StatusBar.tsx`, `App.tsx`)
6. **Phase 6: Build Verification & End-to-End Validation** (`npm run build`, smoke test)
