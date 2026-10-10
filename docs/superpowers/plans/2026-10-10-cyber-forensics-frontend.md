# Cyber-Forensics Mission Control Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an ultra-premium, cyber-forensics mission control frontend for VeyLance with glassmorphism styling, synthetic deepfake demo simulator, tactical video HUD overlays, live audio visualizer, forensic audit reporting, and interactive challenges—keeping the backend 100% intact.

**Architecture:** A modern React 18 + Vite + Tailwind frontend featuring real-time WebSocket communication, Web Audio API analysis, WebRTC camera/screen capture, client-side synthetic anomaly simulation, and SVG/Canvas-based biometric visualizations.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Vite, Web Audio API, HTML5 Canvas, SVG.

## Global Constraints

- Backend Safety: 0 modifications to `backend/` files.
- Build Safety: `npm run build` in `frontend/` must pass cleanly without TypeScript or linting errors.
- Visual Excellence: Premium dark cyber theme, Plus Jakarta Sans & JetBrains Mono typography, smooth glassmorphism, responsive layout.

---

### Task 1: Cyber-Forensics Design System & Typography

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: Global Google Fonts (`Plus Jakarta Sans` & `JetBrains Mono`), cyber scanline background utility, custom neon glow tokens, and smooth scrollbar styles.

- [ ] **Step 1: Update `frontend/index.html`**
Import Google Fonts (`Plus Jakarta Sans:wght@400;500;600;700;800;900` and `JetBrains Mono:wght@400;500;600;700;800`), set descriptive title "VeyLance | Biometric & Deepfake Sentinel AI", and add biometric SVG favicon.

- [ ] **Step 2: Update `frontend/src/index.css`**
Define font families, cyber neon glow utilities (`glow-cyan`, `glow-emerald`, `glow-crimson`), animated pulse gradients, scanline overlay, and custom dark scrollbars.

- [ ] **Step 3: Verify build**
Run `cd frontend && npm run build` to verify Tailwind v4 and CSS compilation.

- [ ] **Step 4: Commit**
```bash
git add frontend/index.html frontend/src/index.css
git commit -m "feat(ui): add cyber-forensics typography, neon tokens, and styling"
```

---

### Task 2: Types & Synthetic Simulation Engine

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/useSimulation.ts`

**Interfaces:**
- Consumes: `DashboardState`, `SignalResult`, `TelemetryData` types.
- Produces: `SimulationScenario` type and `useSimulation()` hook providing mock attack presets (3-finger occlusion, robotic blink, seam blur, audio desync) and frame generation.

- [ ] **Step 1: Expand `frontend/src/types/index.ts`**
Add types for `SimulationScenario` ('baseline' | 'occlusion_warp' | 'robotic_blink' | 'seam_blur' | 'av_desync'), audit report records, and extended telemetry fields.

- [ ] **Step 2: Create `frontend/src/hooks/useSimulation.ts`**
Implement the simulation hook that generates realistic procedural telemetry, signals, heatmap matrices, and occlusion values for all 5 preset scenarios with toggleable running state.

- [ ] **Step 3: Verify build**
Run `cd frontend && npm run build` to verify types and hook compilation.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/types/index.ts frontend/src/hooks/useSimulation.ts
git commit -m "feat(sim): add deepfake simulation engine and extended types"
```

---

### Task 3: Live Audio Visualizer & Level Meter

**Files:**
- Create: `frontend/src/components/AudioVisualizer.tsx`

**Interfaces:**
- Consumes: `audioRMS?: number`, `isAudioActive: boolean`, `s5Correlation?: number`.
- Produces: Real-time animated audio waveform equalizer bars and S5 sync status badge.

- [ ] **Step 1: Create `frontend/src/components/AudioVisualizer.tsx`**
Build dynamic 12-bar equalizer with frequency decay, RMS amplitude metering, and AV correlation lock badge.

- [ ] **Step 2: Verify build**
Run `cd frontend && npm run build` to ensure no errors.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/AudioVisualizer.tsx
git commit -m "feat(audio): add real-time audio waveform and S5 sync meter"
```

---

### Task 4: Interactive Video Viewport with HUD Overlays

**Files:**
- Modify: `frontend/src/components/WebcamView.tsx`

**Interfaces:**
- Consumes: `videoRef`, `isCapturing`, `faces`, `trustScore`, `riskLevel`, `sourceType`, `isMirrored`, `isSimulating`.
- Produces: High-tech HUD targeting frame, toggleable mesh/crosshair layer, Google Meet multi-participant tags, and interactive source selector.

- [ ] **Step 1: Enhance `frontend/src/components/WebcamView.tsx`**
Add HUD targeting bracket canvas rendering, simulated animated procedural face fallback when simulating or camera off, HUD toggle controls (grid, corners, badges), and full-screen button.

- [ ] **Step 2: Verify build**
Run `cd frontend && npm run build`.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/WebcamView.tsx
git commit -m "feat(viewport): add tactical biometric HUD and multi-participant overlay"
```

---

### Task 5: Biometric & Forensic Inspection Suite

**Files:**
- Modify: `frontend/src/components/TrustGauge.tsx`
- Modify: `frontend/src/components/SignalCards.tsx`
- Modify: `frontend/src/components/BlinkRatePanel.tsx`
- Modify: `frontend/src/components/HeatmapPanel.tsx`
- Modify: `frontend/src/components/OcclusionGraph.tsx`
- Modify: `frontend/src/components/TelemetryBar.tsx`

**Interfaces:**
- Consumes: `DashboardState`, `signals`, `telemetry`, `heatmap`, `occlusion_zones`.
- Produces: Polished biometric widgets with glassmorphism cards, micro-animations, interactive hover tools, and radar sweep.

- [ ] **Step 1: Enhance `TrustGauge.tsx`**
Add dynamic color-shifting gradients, pulse glow rings, session time readout, and responsive layout.

- [ ] **Step 2: Enhance `SignalCards.tsx`**
Add expandable vulnerability descriptions (explaining S1-S5 deepfake attack physics), animated sparklines, and confidence badges.

- [ ] **Step 3: Enhance `BlinkRatePanel.tsx`**
Refine EAR gauge and IBI regularity cards with clean indicators and benchmark labels.

- [ ] **Step 4: Enhance `HeatmapPanel.tsx` and `OcclusionGraph.tsx`**
Refine canvas rendering, coordinate hover tooltip, and polar radar sweep animation.

- [ ] **Step 5: Enhance `TelemetryBar.tsx`**
Ensure high-density telemetry items align cleanly with responsive typography and icons.

- [ ] **Step 6: Verify build**
Run `cd frontend && npm run build`.

- [ ] **Step 7: Commit**
```bash
git add frontend/src/components/
git commit -m "feat(forensics): elevate biometric analytics suite with glassmorphism and animations"
```

---

### Task 6: Forensic Audit Incident Report & Export Modal

**Files:**
- Create: `frontend/src/components/AuditReportModal.tsx`
- Modify: `frontend/src/components/SessionStats.tsx`

**Interfaces:**
- Consumes: `dashboardState`, `sessionKey`, session event logs.
- Produces: Printable / downloadable cryptographic-style forensic audit incident report.

- [ ] **Step 1: Create `frontend/src/components/AuditReportModal.tsx`**
Build modal displaying complete forensic audit summary: Session ID, duration, risk verdict, signal results, telemetry values, and export buttons (JSON / Print).

- [ ] **Step 2: Update `frontend/src/components/SessionStats.tsx`**
Add trigger button for Audit Report Modal, frame counter, alert history log, and session reset.

- [ ] **Step 3: Verify build**
Run `cd frontend && npm run build`.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/AuditReportModal.tsx frontend/src/components/SessionStats.tsx
git commit -m "feat(audit): add forensic audit report generation and export modal"
```

---

### Task 7: Mission Control Assembly

**Files:**
- Modify: `frontend/src/components/StatusBar.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Assembles all components, hooks (`useWebSocket`, `useWebcam`, `useAudio`, `useSimulation`), source switching, and active challenge handling.

- [ ] **Step 1: Update `frontend/src/components/StatusBar.tsx`**
Integrate live audio visualizer, simulation mode toggle, quick attack preset selector, and session controls.

- [ ] **Step 2: Update `frontend/src/App.tsx`**
Wire simulation engine seamlessly with live WebSocket stream, provide seamless fallback when server is idle, and assemble mission control grid layout.

- [ ] **Step 3: Verify build**
Run `cd frontend && npm run build`.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/StatusBar.tsx frontend/src/App.tsx
git commit -m "feat(app): assemble complete cyber-forensics mission control dashboard"
```

---

### Task 8: Production Build Verification & Validation

**Files:**
- All frontend files

- [ ] **Step 1: Full production build test**
Run `cd frontend && npm run build` and ensure zero errors or warnings.

- [ ] **Step 2: Verify git status**
Ensure `backend/` remains completely clean and uncommitted changes are staged properly.

- [ ] **Step 3: Final verification commit**
```bash
git status
```
