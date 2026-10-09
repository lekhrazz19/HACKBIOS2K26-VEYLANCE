# VEYLANCE — 24-Hour MVP Team Work Plan
## 4-Person Execution Plan

**Project:** VeyLance / Interview Sentinel  
**Duration:** 24 Hours  
**Team Size:** 4 People  
**Primary Goal:** Deliver a stable, demonstrable MVP for continuous identity assurance during remote interactions.

---

## Current Execution Status (Live Snapshot)

- **Current Milestone:** **H0–H1 Completed** -> **Entering H1–H3 (Parallel Development Phase)**
- **Remote Git Repository:** `https://github.com/lekhrazz19/HACKBIOS2K26-VEYLANCE.git` (Branch: `main`)
- **Repo Hygiene Policy:** Strict public minimalism. GitHub repository contains **only** clean deliverables and `README.md`. All internal planning, build specifications, and research documents are preserved locally in `local_specs/`.
- **Environment & Customizations Active:** Obra Superpowers (`brainstorming`, `using-superpowers`, `writing-plans`, `executing-plans`, `systematic-debugging`, `test-driven-development`) and Dietrich Gebert Ponytail suite (`ponytail`, `ponytail-review`, `ponytail-audit`).
- **Core Architecture Ingestion Decision:** **Dual-Mode Video Ingestion**
  - *Mode A (Local OpenCV):* Fast local camera capture and headless video testing.
  - *Mode B (Browser WebSocket Stream):* React captures `navigator.mediaDevices.getUserMedia()` and streams JPEG frames over WSS to FastAPI. This enables single-container cloud deployment on Render/Docker so judges can run VeyLance from their own laptops.

---

# 1. MVP Goal

The 24-hour MVP should demonstrate:

```text
Live Camera
    ↓
Face Tracking
    ↓
S1 + S2 + S4 Detection Signals
    ↓
Signal Fusion
    ↓
Trust Score
    ↓
Explainable Alert
    ↓
Progressive Challenge
    ↓
Verification / Recovery / Escalation
```

The objective is **not** to build the complete enterprise Interview Sentinel platform in 24 hours.

The objective is to build a reliable core system that a judge can see working end-to-end.

---

# 2. Team Structure

| Person | Role | Primary Ownership |
|---|---|---|
| **Person 1** | Core / Backend Lead | Camera/input → face tracking → pipeline integration |
| **Person 2** | Detection Engineer | S1 + S2 visual anomaly detection |
| **Person 3** | Temporal / AI Engineer | S4 + fusion + trust score + evaluation |
| **Person 4** | Frontend / Product Lead | Dashboard + alerts + challenge flow + demo |

---

# 3. Person 1 — Core / Backend Lead

## Primary Responsibility

Own the complete processing pipeline and integration between all detection modules.

## Tasks

### Input & Processing

- [ ] Webcam/video input
- [ ] OpenCV capture
- [ ] MediaPipe integration
- [ ] Frame processing loop
- [ ] FPS measurement
- [ ] Frame timestamping
- [ ] Graceful camera failure handling

### Pipeline Integration

- [ ] Define signal interface
- [ ] Connect S1
- [ ] Connect S2
- [ ] Connect S4
- [ ] Connect fusion engine
- [ ] Send results to dashboard
- [ ] Logging
- [ ] Error handling

### Performance

- [ ] Measure average FPS
- [ ] Measure processing latency
- [ ] Identify bottlenecks
- [ ] Prevent unnecessary frame processing
- [ ] Ensure dashboard does not block detection

## Definition of Done

- [ ] Camera starts reliably
- [ ] Face tracking works
- [ ] All available signals can be called
- [ ] Fusion receives valid signal results
- [ ] Dashboard receives live state
- [ ] System can run continuously without crashing

---

# 4. Person 2 — Detection Engineer

## Primary Responsibility

Own visual anomaly detection.

## S1 — Boundary / Blending Anomaly

- [ ] Implement/verify S1
- [ ] Normalize score to `0–1`
- [ ] Add confidence
- [ ] Define normal behavior
- [ ] Define suspicious behavior
- [ ] Generate human-readable reason
- [ ] Test with controlled cases

## S2 — Occlusion / Landmark Instability

- [ ] Implement/verify S2
- [ ] Track landmark stability
- [ ] Detect abnormal occlusion
- [ ] Normalize score to `0–1`
- [ ] Add confidence
- [ ] Generate human-readable reason
- [ ] Test with controlled cases

## Testing

- [ ] Normal face
- [ ] Head movement
- [ ] Partial occlusion
- [ ] Lighting variation
- [ ] Camera movement
- [ ] Controlled suspicious media/test clip

## Definition of Done

- [ ] S1 produces valid output
- [ ] S2 produces valid output
- [ ] Scores are normalized
- [ ] Confidence is available
- [ ] Reasons are explainable
- [ ] Unit tests pass

---

# 5. Person 3 — Temporal / AI Engineer

## Primary Responsibility

Own temporal behavior, signal fusion, trust scoring and evaluation.

## S4 — Blink / Temporal Eye Behavior

- [ ] Implement/verify S4
- [ ] Track temporal eye behavior
- [ ] Avoid reacting to a single frame
- [ ] Apply temporal smoothing
- [ ] Normalize score to `0–1`
- [ ] Add confidence
- [ ] Generate explanation

## Fusion

Combine:

```text
S1 ─┐
S2 ─┼──> EWMA / FUSION ──> TRUST SCORE
S4 ─┘
```

Tasks:

- [ ] Implement EWMA
- [ ] Combine signal scores
- [ ] Weight signals
- [ ] Prevent one noisy frame from causing an alert
- [ ] Produce stable trust score
- [ ] Add status thresholds

## Suggested Trust Thresholds

```text
70–100  → HIGH TRUST
40–69   → WARNING
0–39    → ALERT
```

These are starting thresholds and should be tuned against the evaluation data.

## Evaluation

Where the available corpus permits:

- [ ] TP
- [ ] TN
- [ ] FP
- [ ] FN
- [ ] Precision
- [ ] Recall
- [ ] F1
- [ ] False Positive Rate
- [ ] False Negative Rate
- [ ] Average latency
- [ ] P95 latency
- [ ] FPS

## Definition of Done

- [ ] S4 works
- [ ] Fusion works
- [ ] Trust score is stable
- [ ] Thresholds are configurable
- [ ] Evaluation results are reproducible
- [ ] No accuracy claims are made without evidence

---

# 6. Person 4 — Frontend / Product Lead

## Primary Responsibility

Own everything the judge sees.

## Dashboard

- [ ] Live camera view
- [ ] Face/landmark visualization
- [ ] Trust score
- [ ] S1 indicator
- [ ] S2 indicator
- [ ] S4 indicator
- [ ] Alert panel
- [ ] Timeline/history
- [ ] Current system status

## Explainability

Display:

```text
TRUST SCORE: 82

STATUS: HIGH TRUST

Signals:
S1  → Normal
S2  → Normal
S4  → Normal
```

For suspicious behavior:

```text
TRUST SCORE: 31

STATUS: ALERT

Reasons:
• Visual boundary anomaly
• Landmark instability
• Temporal behavior deviation
```

## Challenge Flow

Implement:

```text
Alert
  ↓
Progressive Challenge
  ↓
Verification
  ↓
Recover / Escalate
```

## Demo Preparation

- [ ] Create demo states
- [ ] Create clean demo flow
- [ ] Prepare backup recording
- [ ] Prepare screenshots
- [ ] Prepare architecture visuals
- [ ] Prepare presentation visuals

## Definition of Done

- [ ] Dashboard works during live demo
- [ ] Trust score updates
- [ ] Signals are visible
- [ ] Alerts are understandable
- [ ] Challenge flow works
- [ ] UI does not crash the core pipeline

---

# 7. Shared Signal Contract

All four team members must agree on the data contract before development.

## SignalResult

```json
{
  "signal": "S1",
  "score": 0.0,
  "confidence": 0.0,
  "status": "NORMAL",
  "reason": "Human-readable explanation",
  "timestamp": "2026-10-09T10:00:00"
}
```

## Fields

| Field | Meaning |
|---|---|
| `signal` | S1, S2 or S4 |
| `score` | Suspicion score from 0 to 1 |
| `confidence` | Confidence from 0 to 1 |
| `status` | NORMAL / WARNING / ALERT |
| `reason` | Explainable reason |
| `timestamp` | Event timestamp |

---

# 8. Score Convention

Use one consistent polarity across the project.

```text
0.0 → Low suspicion
1.0 → High suspicion
```

Trust score:

```text
100 → High trust
0   → Low trust
```

Example:

```text
S1 = 0.10
S2 = 0.15
S4 = 0.08

↓ Fusion

Trust = 91
Status = HIGH TRUST
```

Suspicious example:

```text
S1 = 0.82
S2 = 0.71
S4 = 0.68

↓ Fusion

Trust = 29
Status = ALERT
```

---

# 9. 24-Hour Timeline

## H0–H1 — Team Setup [COMPLETED]

### Everyone

- [x] Freeze MVP scope (S1 Boundary + S2 Occlusion + S4 Blink/EAR + EWMA Fusion + Progressive Challenge)
- [x] Assign ownership across 4 roles (Core, Detection, Temporal/AI, Frontend/Product)
- [x] Create Git branches and initialize repository (`lekhrazz19/HACKBIOS2K26-VEYLANCE`)
- [x] Craft production README.md (Ponytail minimalism, zero emojis) and push to `origin/main`
- [x] Establish repository policy: Only clean code and README on GitHub; internal specs isolated in `local_specs/`
- [x] Agree on data contracts (`SignalResult`, `TrustState`, WebSocket frame JSON schema)
- [x] Establish agent skills (`superpowers`, `ponytail`, `brainstorming`) for structured execution
- [x] Select Dual-Mode video ingestion model (Browser WebSocket + OpenCV fallback)

### Deliverable

A frozen scope, locked architecture contract, public GitHub repository setup, and clean execution baseline.

---

# 10. H1–H3 — Parallel Development [IN PROGRESS]

## Person 1 — Core / Backend Lead
- [ ] Scaffold `backend/` directory structure (`app/api`, `app/core`, `app/detection`, `app/fusion`, `app/pipeline`, `tests`)
- [ ] Create `requirements.txt` (`fastapi`, `uvicorn[standard]`, `mediapipe`, `opencv-python-headless`, `numpy`, `websockets`, `pydantic`, `pytest`)
- [ ] Build MediaPipe Face Mesh worker (`app/pipeline/face_mesh.py`) extracting 468 landmark points and bounding box
- [ ] Implement FastAPI WebSocket route `/ws/stream` to receive binary JPEG frames, decode via OpenCV, pass through pipeline, and return telemetry JSON
- [ ] Implement local OpenCV test script (`scripts/test_webcam.py`) for offline debugging

## Person 2 — Detection Engineer
- [ ] Implement S1: Visual Boundary & Blending Anomaly (`app/detection/s1_boundary.py`)
  - Laplacian gradient variance along face convex hull perimeter
  - HSV color histogram correlation between face mask and outer neck/collar region
  - Normalize output to `[0.0, 1.0]`
- [ ] Implement S2: Occlusion & Landmark Instability (`app/detection/s2_occlusion.py`)
  - Inter-frame Euclidean drift on rigid anchors (nose bridge 1, eye corners 33, 263) normalized by inter-pupillary distance (IPD)
  - Occlusion detection threshold when landmark confidence collapses
  - Normalize output to `[0.0, 1.0]`
- [ ] Write unit tests (`tests/test_s1_s2.py`) with synthetic landmark coordinates

## Person 3 — Temporal / AI Engineer
- [ ] Implement S4: Temporal Eye Behavior & Blink Cadence (`app/detection/s4_temporal.py`)
  - Real-time Eye Aspect Ratio (EAR) computation across left/right eye contours
  - Sliding temporal window (30-second window) tracking blink duration (100–400ms) and frequency (12–20 blinks/min)
  - Anomaly scoring for prolonged eye freezing or robotic blink cadences `[0.0, 1.0]`
- [ ] Implement EWMA Fusion Engine (`app/fusion/ewma.py`)
  - Configurable dynamic weights: Risk = w1*S1 + w2*S2 + w4*S4
  - EWMA smoothing: Trust_t = alpha * (100 - Risk_t) + (1 - alpha) * Trust_{t-1}
- [ ] Implement Risk State Machine (`app/fusion/state_machine.py`) with hysteresis:
  - `VERIFIED` (85-100), `EVALUATING` (65-84), `SUSPICIOUS` (40-64), `CRITICAL` (<40)
- [ ] Write unit tests (`tests/test_s4_fusion.py`)

## Person 4 — Frontend / Product Lead
- [ ] Scaffold `frontend/` project with Vite + React 18 + TypeScript + Tailwind CSS
- [ ] Implement `useCameraStream` hook using `navigator.mediaDevices.getUserMedia()` capturing frames at 25-30 FPS
- [ ] Implement WebSocket transport streaming frames to backend and receiving telemetry JSON
- [ ] Build Auditor HUD layout:
  - Video feed canvas with toggleable MediaPipe landmark mesh overlay
  - Circular animated Trust Score Gauge (color-coded by state: Green, Amber, Orange, Red)
  - Telemetry cards for S1, S2, and S4 with live metric progress bars
  - Alert stream logging anomaly events
- [ ] Design Challenge Modal for progressive verification (Head turn, Blink challenge, Screen flash)

---

# 11. H3–H6 — FIRST INTEGRATION

Target:

```text
Camera
   ↓
Face Tracking
   ↓
S1 + S2 + S4
   ↓
Fusion
   ↓
Trust Score
   ↓
Dashboard
```

## Integration Checklist

- [ ] Camera works
- [ ] Face detected
- [ ] S1 returns result
- [ ] S2 returns result
- [ ] S4 returns result
- [ ] Fusion returns score
- [ ] Dashboard receives score
- [ ] No fatal exceptions

## Critical Milestone

By H6, the team should have a basic end-to-end MVP.

---

# 12. H6–H9 — Testing & Evaluation

## Normal Conditions

- [ ] Normal face
- [ ] Normal blinking
- [ ] Normal head movement
- [ ] Different lighting
- [ ] Different camera distance

## Stress Conditions

- [ ] Head movement
- [ ] Partial occlusion
- [ ] Lighting changes
- [ ] Camera movement
- [ ] Temporary tracking loss
- [ ] Controlled suspicious media/test clip

## Metrics

- [ ] FPS
- [ ] Average latency
- [ ] P95 latency
- [ ] False positives
- [ ] False negatives
- [ ] Precision
- [ ] Recall
- [ ] F1

---

# 13. H9–H12 — Hardening

Everyone focuses on reliability.

## Checklist

- [ ] Fix crashes
- [ ] Fix tracking failures
- [ ] Tune thresholds
- [ ] Improve signal stability
- [ ] Improve dashboard readability
- [ ] Improve alert explanations
- [ ] Remove unstable functionality
- [ ] Clean logs
- [ ] Test clean startup
- [ ] Test clean shutdown

---

# 14. H12 — SCOPE FREEZE

## Absolute Rule

After H12, **do not start major new architecture**.

Allowed:

- [ ] Bug fixes
- [ ] Threshold tuning
- [ ] UI polish
- [ ] Evaluation
- [ ] Demo reliability
- [ ] Documentation
- [ ] Presentation work

Not allowed unless the MVP is already completely stable:

- [ ] Major architecture rewrite
- [ ] New ML pipeline
- [ ] Kubernetes deployment
- [ ] Full cloud migration
- [ ] Complex third-party integrations
- [ ] Large new feature

---

# 15. H12–H15 — Interview Sentinel Layer

If the core MVP is stable, add the progressive verification layer.

```text
Suspicious Event
       ↓
Risk Increase
       ↓
Alert
       ↓
Progressive Challenge
       ↓
Verification
       ↓
Recover / Escalate
```

## Ownership

### Person 1

- [ ] Integrate challenge events into core pipeline
- [ ] Manage session state

### Person 2

- [ ] Validate suspicious visual conditions
- [ ] Provide signal explanations

### Person 3

- [ ] Implement risk escalation
- [ ] Implement challenge trigger logic
- [ ] Implement recovery logic

### Person 4

- [ ] Challenge UI
- [ ] Alert UI
- [ ] Recovery UI
- [ ] Escalation UI

---

# 16. H15–H18 — Demo Engineering

## Demo Scenario 1 — Genuine User

```text
Real Person
    ↓
Stable Signals
    ↓
Trust Remains High
    ↓
No Alert
```

Expected result:

```text
Trust ≈ HIGH
Status = NORMAL
```

---

## Demo Scenario 2 — Suspicious Event

```text
Suspicious Event
    ↓
S1/S2/S4 Change
    ↓
Fusion Reacts
    ↓
Trust Decreases
    ↓
Explainable Alert
```

Expected result:

```text
Trust decreases
Status = ALERT/WARNING
Reasons are visible
```

---

## Demo Scenario 3 — Challenge

```text
Alert
 ↓
Challenge
 ↓
User Verification
 ↓
Trust Recovery / Escalation
```

The challenge should demonstrate that VeyLance is not merely producing a binary "deepfake / not deepfake" output.

---

# 17. H18–H20 — Final Validation

Run the complete system from a clean start.

## Core

- [ ] Camera starts
- [ ] Face tracking works
- [ ] S1 works
- [ ] S2 works
- [ ] S4 works
- [ ] Fusion works
- [ ] Trust score updates

## Dashboard

- [ ] Dashboard starts
- [ ] Live camera visible
- [ ] Signal states update
- [ ] Trust score updates
- [ ] Alerts work
- [ ] Timeline works

## Challenge

- [ ] Challenge triggers
- [ ] Verification works
- [ ] Recovery/escalation works

## Performance

- [ ] FPS measured
- [ ] Latency measured
- [ ] No memory/resource issue during demo
- [ ] No recurring crashes

---

# 18. H20–H22 — Presentation & Evidence

## Person 1 — Architecture

Prepare:

- [ ] System architecture
- [ ] Processing pipeline
- [ ] Technology stack
- [ ] Data flow
- [ ] Deployment concept

## Person 2 — Detection

Prepare:

- [ ] S1 explanation
- [ ] S2 explanation
- [ ] Detection methodology
- [ ] Example suspicious conditions
- [ ] Limitations

## Person 3 — AI / Risk

Prepare:

- [ ] S4 explanation
- [ ] Fusion methodology
- [ ] EWMA
- [ ] Trust score
- [ ] Evaluation metrics
- [ ] Results

## Person 4 — Product / Demo

Prepare:

- [ ] Live dashboard
- [ ] User flow
- [ ] Alert experience
- [ ] Challenge flow
- [ ] Demo script
- [ ] Product screenshots

---

# 19. H22–H24 — FINAL FREEZE

No new features.

## Final Run

```text
CLEAN START
     ↓
LIVE DEMO
     ↓
GENUINE SCENARIO
     ↓
SUSPICIOUS SCENARIO
     ↓
ALERT
     ↓
CHALLENGE
     ↓
RECOVERY / ESCALATION
     ↓
METRICS
     ↓
BACKUP DEMO
```

## Final Checklist

### Code

- [ ] Main branch works
- [ ] No broken imports
- [ ] No debug crashes
- [ ] Configuration is documented
- [ ] Startup instructions work

### Detection

- [ ] S1 works
- [ ] S2 works
- [ ] S4 works
- [ ] Fusion works
- [ ] Trust score works

### UI

- [ ] Dashboard works
- [ ] Alerts work
- [ ] Challenge works
- [ ] UI is readable

### Evaluation

- [ ] Test results saved
- [ ] Metrics calculated
- [ ] Evidence available
- [ ] No fabricated numbers

### Presentation

- [ ] PPT finalized
- [ ] Architecture diagram finalized
- [ ] Demo script finalized
- [ ] Backup demo available
- [ ] Team knows speaking order

---

# 20. Git / Collaboration Rules

## Repository Structure

Suggested structure:

```text
veylance/
├── backend/
├── detection/
│   ├── s1/
│   ├── s2/
│   └── s4/
├── fusion/
├── dashboard/
├── evaluation/
├── tests/
├── docs/
├── demo/
├── requirements.txt
└── README.md
```

## Branches

```text
main
  │
  └── dev
       ├── feature/core
       ├── feature/detection
       ├── feature/fusion
       └── feature/dashboard
```

## Rules

- [ ] Never push broken code directly to `main`
- [ ] Commit frequently
- [ ] Keep commits focused
- [ ] Pull before starting major work
- [ ] Resolve conflicts immediately
- [ ] Integration owner reviews cross-module changes
- [ ] Every merged feature must be runnable

---

# 21. Integration Checkpoints

| Time | Required State |
|---|---|
| **H1** | Scope and contracts frozen |
| **H3** | Individual modules progressing |
| **H6** | End-to-end MVP |
| **H9** | Evaluation running |
| **H12** | Hardened MVP + scope freeze |
| **H15** | Challenge layer if stable |
| **H18** | Demo-ready system |
| **H20** | Final validation |
| **H22** | Presentation-ready |
| **H24** | Final submission |

---

# 22. Priority System

## P0 — MUST HAVE

- [ ] Camera/video input
- [ ] Face tracking
- [ ] S1
- [ ] S2
- [ ] S4
- [ ] Fusion
- [ ] Trust score
- [ ] Dashboard
- [ ] Alert state
- [ ] End-to-end demo

## P1 — SHOULD HAVE

- [ ] Progressive challenge
- [ ] Verification/recovery flow
- [ ] Evaluation metrics
- [ ] Timeline/history
- [ ] Better explainability
- [ ] Performance metrics

## P2 — NICE TO HAVE

- [ ] S5 A/V synchronization
- [ ] Additional visual signals
- [ ] Advanced analytics
- [ ] Better visualizations
- [ ] More attack scenarios

## P3 — FUTURE / ROADMAP

- [ ] CNN/deepfake models
- [ ] Device fingerprinting
- [ ] Enterprise integrations
- [ ] Zoom/Teams/Meet integration
- [ ] SIEM integration
- [ ] Cloud-scale deployment
- [ ] C2PA/provenance implementation
- [ ] Kubernetes infrastructure
- [ ] Full enterprise authentication ecosystem

---

# 23. Golden Demo

The ideal judging flow should be:

## Step 1 — Genuine Session

Show a normal user.

```text
Trust: HIGH
Status: NORMAL
```

## Step 2 — Explain Signals

Show:

```text
S1 → Normal
S2 → Normal
S4 → Normal
```

## Step 3 — Introduce Suspicious Event

Trigger a controlled test condition.

Show:

```text
S1 → Elevated
S2 → Elevated
S4 → Elevated
```

## Step 4 — Fusion

Show:

```text
Signals
   ↓
Fusion
   ↓
Trust drops
```

## Step 5 — Alert

Display:

```text
WARNING / ALERT
```

with explainable reasons.

## Step 6 — Challenge

Trigger:

```text
Progressive Verification Challenge
```

## Step 7 — Outcome

Demonstrate:

```text
Verified
   ↓
Recover Trust
```

or:

```text
Failed Verification
   ↓
Escalate
```

---

# 24. Failure / Fallback Plan

## If Live Attack Demo Fails

Do **not** fake the result.

Use:

- [ ] Previously validated recorded test clip
- [ ] Controlled replay
- [ ] Saved evaluation dataset
- [ ] Known-good demo scenario

The fallback must be prepared before the final presentation.

---

# 25. Important Technical Rules

1. Reliability is more important than feature count.
2. Measure before making performance claims.
3. Never fabricate accuracy.
4. Never describe a single signal as proof of fraud.
5. A suspicious signal indicates risk, not certainty.
6. Use multiple signals for stronger evidence.
7. Do not rewrite the core system after H12.
8. Do not add a CNN unless the existing MVP is already stable.
9. Keep the demo deterministic.
10. Clearly separate what is implemented today from future roadmap items.

---

# 26. Final Success Criteria

The project is considered successful when the team can demonstrate:

```text
LIVE INPUT
    ↓
FACE TRACKING
    ↓
S1 + S2 + S4
    ↓
FUSION
    ↓
TRUST SCORE
    ↓
EXPLAINABLE ALERT
    ↓
CHALLENGE
    ↓
HUMAN VERIFICATION
    ↓
RECOVERY / ESCALATION
    ↓
MEASURED EVIDENCE
```

The most important outcome is not the number of features.

It is a **stable, explainable, measurable end-to-end demonstration**.

---

# 27. Four-Person Dependency Map

```text
                    PERSON 2
                 S1 + S2 Detection
                       │
                       │
                       ▼
PERSON 1 ─────────► INTEGRATION ◄───────── PERSON 3
CORE / BACKEND          │                S4 + FUSION
                       │
                       ▼
                  PERSON 4
              DASHBOARD / PRODUCT
```

## Ownership Summary

**Person 1**
> Makes the system run.

**Person 2**
> Makes the visual detection work.

**Person 3**
> Makes the system reason about risk.

**Person 4**
> Makes the result understandable to the judge.

Together:

> **Detect → Explain → Alert → Challenge → Verify → Escalate**
