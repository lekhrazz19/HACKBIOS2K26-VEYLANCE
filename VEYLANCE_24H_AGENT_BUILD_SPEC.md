# VEYLANCE — 24-HOUR AGENT BUILD SPECIFICATION
## Technical Stack + Requirements + Implementation Contract

**Project:** VeyLance / Interview Sentinel MVP  
**Build Window:** 24 hours  
**Team:** 4 people / parallel agents  
**Primary objective:** Build a stable local-first continuous identity assurance MVP that detects suspicious visual/temporal behavior, fuses signals into a trust score, explains risk, and demonstrates a progressive verification challenge.

---

# 1. HARD 24-HOUR SCOPE

## MUST BUILD

```text
Webcam / Video
      ↓
OpenCV Capture
      ↓
MediaPipe Face Detection / Landmarks
      ↓
S1 Visual Boundary / Blending Anomaly
S2 Occlusion / Landmark Instability
S4 Blink / Temporal Eye Behavior
      ↓
Signal Normalization
      ↓
EWMA Fusion
      ↓
Trust Score 0–100
      ↓
Risk State
      ↓
Live Dashboard
      ↓
Explainable Alert
      ↓
Challenge
      ↓
Verify / Recover / Escalate
```

## DO NOT BUILD IN THE 24-HOUR MVP

- Full enterprise cloud architecture
- Kubernetes deployment
- Microservices
- Zoom integration
- Microsoft Teams integration
- Google Meet integration
- Production authentication/SSO
- Device fingerprinting
- SIEM integrations
- Voice biometrics
- Full C2PA implementation
- Large CNN training
- Custom deepfake model training
- Mobile application
- Native desktop application
- Distributed queues
- Production database cluster

These may appear in the roadmap, but they must not block the MVP.

---

# 2. RECOMMENDED TECH STACK

## Runtime

| Layer | Technology | Requirement |
|---|---|---|
| Language | Python | 3.10+ |
| Frontend | React + Vite + TypeScript | Recommended |
| Styling | Tailwind CSS | Recommended |
| Camera | OpenCV | Required |
| Face landmarks | MediaPipe | Required |
| Numerical processing | NumPy | Required |
| Temporal processing | Python standard library + NumPy | Required |
| Backend API | FastAPI | Recommended |
| Real-time transport | WebSocket | Recommended |
| Validation | Pydantic | Required if FastAPI used |
| Testing | pytest | Required |
| Data analysis | pandas | Recommended |
| Visualization/evaluation | matplotlib | Optional |
| Package management | pip + venv | Required |
| Version control | Git | Required |

## Frontend

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- Native WebSocket client
- Recharts only if charts are required

Avoid unnecessary UI frameworks.

## Backend

Use:

- FastAPI
- Uvicorn
- Pydantic
- WebSocket
- OpenCV
- MediaPipe
- NumPy

## Testing

Use:

- pytest
- pytest-asyncio if async tests are required

---

# 3. WHY THIS STACK

The stack is intentionally small.

The agent must optimize for:

1. Fast implementation
2. Local execution
3. Low integration complexity
4. Explainability
5. Easy debugging
6. Easy demo setup
7. No dependency on cloud infrastructure

The MVP should run on one developer machine.

---

# 4. PYTHON REQUIREMENTS

Create:

```text
backend/requirements.txt
```

Recommended baseline:

```text
fastapi
uvicorn[standard]
opencv-python
mediapipe
numpy
pydantic
python-multipart
pytest
pytest-asyncio
pandas
```

Optional only if actually used:

```text
scipy
matplotlib
```

Do not add packages simply because they might be useful.

Every dependency must have a concrete use in the MVP.

---

# 5. FRONTEND REQUIREMENTS

Create a Vite React TypeScript application.

Recommended packages:

```text
react
react-dom
typescript
vite
tailwindcss
lucide-react
recharts
```

Only retain `recharts` if charts are implemented.

The frontend must remain lightweight.

---

# 6. PROJECT STRUCTURE

Use:

```text
veylance/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── schemas.py
│   │   ├── websocket.py
│   │   │
│   │   ├── capture/
│   │   │   ├── camera.py
│   │   │   └── video.py
│   │   │
│   │   ├── face/
│   │   │   ├── tracker.py
│   │   │   └── landmarks.py
│   │   │
│   │   ├── signals/
│   │   │   ├── base.py
│   │   │   ├── s1_boundary.py
│   │   │   ├── s2_occlusion.py
│   │   │   └── s4_temporal.py
│   │   │
│   │   ├── fusion/
│   │   │   ├── ewma.py
│   │   │   ├── trust.py
│   │   │   └── risk.py
│   │   │
│   │   ├── challenge/
│   │   │   └── challenge.py
│   │   │
│   │   └── evaluation/
│   │       ├── metrics.py
│   │       └── runner.py
│   │
│   ├── tests/
│   │   ├── test_s1.py
│   │   ├── test_s2.py
│   │   ├── test_s4.py
│   │   ├── test_fusion.py
│   │   ├── test_api.py
│   │   └── test_integration.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraPanel.tsx
│   │   │   ├── TrustScore.tsx
│   │   │   ├── SignalCard.tsx
│   │   │   ├── AlertPanel.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── ChallengePanel.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useVeyLanceSocket.ts
│   │   │
│   │   ├── types/
│   │   │   └── veylance.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── evaluation/
│   ├── fixtures/
│   ├── results/
│   └── README.md
│
├── demo/
│   ├── scenarios.md
│   └── backup/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── limitations.md
│
├── .gitignore
├── README.md
└── start.sh
```

---

# 7. CORE DATA CONTRACT

Every detection module must return the same structure.

## SignalResult

```json
{
  "signal": "S1",
  "score": 0.0,
  "confidence": 0.0,
  "status": "NORMAL",
  "reason": "Human-readable explanation",
  "timestamp": 0.0
}
```

## Constraints

### signal

Allowed:

```text
S1
S2
S4
```

### score

```text
0.0 = low suspicion
1.0 = high suspicion
```

### confidence

```text
0.0 = low confidence
1.0 = high confidence
```

### status

Allowed:

```text
NORMAL
WARNING
ALERT
```

---

# 8. DASHBOARD STATE CONTRACT

Backend should send a unified state object.

```json
{
  "timestamp": 0.0,
  "session_id": "demo-session",
  "face_detected": true,
  "trust_score": 84.0,
  "risk_level": "HIGH_TRUST",
  "signals": [
    {
      "signal": "S1",
      "score": 0.12,
      "confidence": 0.91,
      "status": "NORMAL",
      "reason": "No significant boundary anomaly",
      "timestamp": 0.0
    },
    {
      "signal": "S2",
      "score": 0.16,
      "confidence": 0.88,
      "status": "NORMAL",
      "reason": "Landmark stability within baseline",
      "timestamp": 0.0
    },
    {
      "signal": "S4",
      "score": 0.08,
      "confidence": 0.84,
      "status": "NORMAL",
      "reason": "Temporal eye behavior within expected range",
      "timestamp": 0.0
    }
  ],
  "alert": null,
  "challenge": null
}
```

---

# 9. SIGNAL S1 — BOUNDARY / BLENDING ANOMALY

## Goal

Detect suspicious visual discontinuity or abnormal boundary behavior around the tracked face region.

## MVP Implementation

The implementation must be computationally lightweight.

Possible inputs:

- Face bounding box
- Face ROI
- Landmark boundary
- Local image consistency
- Edge/texture discontinuity
- Temporal consistency

Do not train a new neural network.

## Required Output

```text
score
confidence
status
reason
```

## Example

```json
{
  "signal": "S1",
  "score": 0.72,
  "confidence": 0.81,
  "status": "WARNING",
  "reason": "Elevated visual boundary inconsistency"
}
```

## Requirements

- [ ] Works on normal webcam input
- [ ] Does not crash if face is temporarily lost
- [ ] Score remains bounded to `0–1`
- [ ] Noise is smoothed
- [ ] Reason is human-readable

---

# 10. SIGNAL S2 — OCCLUSION / LANDMARK INSTABILITY

## Goal

Detect unusual occlusion or unstable facial landmarks.

## Inputs

- MediaPipe landmarks
- Landmark visibility/presence
- Frame-to-frame landmark displacement
- Face bounding-box stability

## Requirements

- [ ] Track landmark stability
- [ ] Detect abnormal displacement
- [ ] Detect partial face obstruction
- [ ] Handle temporary tracking loss
- [ ] Normalize score
- [ ] Return confidence
- [ ] Return explanation

Example:

```json
{
  "signal": "S2",
  "score": 0.66,
  "confidence": 0.86,
  "status": "WARNING",
  "reason": "Abnormal landmark instability detected"
}
```

---

# 11. SIGNAL S4 — BLINK / TEMPORAL EYE BEHAVIOR

## Goal

Detect abnormal temporal eye behavior rather than making decisions from a single frame.

## Inputs

- Eye landmarks
- Eye aspect ratio or equivalent geometric measure
- Blink events
- Temporal history

## Requirements

- [ ] Maintain temporal history
- [ ] Detect blink events
- [ ] Avoid single-frame alerts
- [ ] Apply smoothing
- [ ] Handle missing landmarks
- [ ] Return normalized suspicion score
- [ ] Return confidence
- [ ] Return explanation

Example:

```json
{
  "signal": "S4",
  "score": 0.61,
  "confidence": 0.78,
  "status": "WARNING",
  "reason": "Temporal eye behavior deviates from recent baseline"
}
```

---

# 12. FUSION ENGINE

## Principle

Do not allow one noisy frame to cause an immediate fraud verdict.

Use temporal smoothing.

Recommended:

```text
EWMA
```

Formula:

```text
S_t = αX_t + (1-α)S_(t-1)
```

Start with a configurable alpha, for example:

```text
alpha = 0.25
```

Tune using evaluation data.

---

# 13. TRUST SCORE

Convert fused suspicion into a trust score.

Conceptually:

```text
Trust = 100 × (1 - fused_suspicion)
```

Clamp:

```text
0 ≤ Trust ≤ 100
```

Suggested states:

```text
70–100 → HIGH_TRUST
40–69  → WARNING
0–39   → ALERT
```

These are initial thresholds, not validated scientific thresholds.

The agent must make them configurable.

---

# 14. RISK STATES

Use:

```text
HIGH_TRUST
WARNING
ALERT
```

Recommended behavior:

### HIGH_TRUST

- No alert
- Continue monitoring

### WARNING

- Display warning
- Increase event logging
- Continue observation

### ALERT

- Display alert
- Trigger challenge
- Increase verification requirement

---

# 15. PROGRESSIVE CHALLENGE

The challenge layer must be simple.

Example:

```text
ALERT
  ↓
Challenge Requested
  ↓
User performs simple instructed action
  ↓
Verification result
  ↓
RECOVER or ESCALATE
```

For MVP, the challenge can be:

- Turn head left/right
- Blink
- Hold neutral face
- Follow an on-screen instruction

The challenge must not be represented as cryptographically strong identity proof.

It is a progressive verification step.

---

# 16. CHALLENGE STATE

Example:

```json
{
  "challenge_id": "c1",
  "type": "TURN_HEAD",
  "status": "PENDING",
  "instruction": "Turn your head slowly to the right",
  "started_at": 0.0,
  "completed_at": null,
  "result": null
}
```

Possible result:

```text
PASSED
FAILED
EXPIRED
```

---

# 17. FASTAPI API

Minimum API:

```text
GET /
GET /health
GET /api/status
POST /api/session/start
POST /api/session/stop
POST /api/challenge/start
POST /api/challenge/verify
WS /ws
```

## Health

`GET /health`

Response:

```json
{
  "status": "ok"
}
```

## WebSocket

`WS /ws`

Purpose:

- Send live DashboardState
- Receive challenge/control events if required

Do not create a REST endpoint for every frame.

Use WebSocket for live state.

---

# 18. CAMERA ARCHITECTURE

Use one capture loop.

```text
Camera
  ↓
Frame
  ↓
Preprocess
  ↓
Face Tracking
  ↓
Signals
  ↓
Fusion
  ↓
DashboardState
  ↓
WebSocket
```

Do not create separate camera capture loops for each signal.

This prevents unnecessary resource usage and inconsistent frames.

---

# 19. FRAME PROCESSING

Recommended MVP behavior:

- Process camera continuously
- Allow configurable processing FPS
- Do not process every frame if CPU becomes a bottleneck
- Maintain temporal state between processed frames

Configuration:

```text
TARGET_FPS=15
CAMERA_INDEX=0
FRAME_WIDTH=1280
FRAME_HEIGHT=720
```

The implementation should degrade gracefully on slower machines.

---

# 20. SESSION MANAGEMENT

Each demo should have a session.

Example:

```json
{
  "session_id": "20261009-001",
  "started_at": 0.0,
  "status": "ACTIVE"
}
```

Session should maintain:

- Start time
- Latest trust score
- Signal history
- Alerts
- Challenges
- End time

For MVP, in-memory storage is sufficient.

Do not add PostgreSQL unless there is a clear requirement.

---

# 21. DATABASE REQUIREMENT

## MVP

**No database required.**

Use:

```text
Python in-memory state
+
optional JSON/JSONL event log
```

Optional event file:

```text
evaluation/results/session_YYYYMMDD_HHMMSS.jsonl
```

Database can be listed as a future production component.

---

# 22. FRONTEND DASHBOARD

## Required Layout

```text
┌──────────────────────────────────────────────┐
│ VEYLANCE                     SESSION: ACTIVE │
├──────────────────────┬───────────────────────┤
│                      │ TRUST SCORE            │
│   LIVE CAMERA        │       84              │
│                      │ HIGH TRUST             │
│   FACE/LANDMARKS     ├───────────────────────┤
│                      │ SIGNALS                │
│                      │ S1  NORMAL             │
│                      │ S2  NORMAL             │
│                      │ S4  NORMAL             │
├──────────────────────┴───────────────────────┤
│ EVENT / ALERT TIMELINE                        │
├──────────────────────────────────────────────┤
│ CHALLENGE / VERIFICATION                     │
└──────────────────────────────────────────────┘
```

---

# 23. FRONTEND STATES

The UI must visibly distinguish:

## HIGH TRUST

```text
Trust: 85
Status: HIGH TRUST
```

## WARNING

```text
Trust: 56
Status: WARNING
```

## ALERT

```text
Trust: 28
Status: ALERT
```

Do not rely only on color. Always include text labels.

---

# 24. EXPLAINABILITY

Every alert must answer:

1. What happened?
2. Which signal detected it?
3. How severe is it?
4. What should the system do next?

Example:

```text
ALERT

Reason:
Elevated visual boundary inconsistency

Contributing signals:
S1: 0.82
S2: 0.68

Recommended action:
Progressive verification challenge
```

---

# 25. EVALUATION HARNESS

Build a reproducible evaluation script.

Example:

```bash
python -m evaluation.runner --input evaluation/fixtures
```

It should produce:

```text
evaluation/results/
```

Metrics:

```text
TP
TN
FP
FN
Precision
Recall
F1
FPR
FNR
Average latency
P95 latency
FPS
```

Only calculate classification metrics if the dataset contains reliable labels.

If labels do not exist, report operational metrics instead.

---

# 26. TESTING REQUIREMENTS

## Unit Tests

Required:

```text
test_s1.py
test_s2.py
test_s4.py
test_fusion.py
```

Test:

- Score range
- Confidence range
- Missing face behavior
- Empty history behavior
- Threshold logic
- EWMA behavior
- Trust conversion

## API Tests

Test:

- `/`
- `/health`
- session start
- session stop
- challenge start
- challenge verification

## Integration Test

Must verify:

```text
Input
 ↓
Face
 ↓
S1/S2/S4
 ↓
Fusion
 ↓
Trust
 ↓
DashboardState
```

---

# 27. ERROR HANDLING

The system must not crash because:

- Camera is unavailable
- Face is temporarily missing
- Landmarks are missing
- A signal fails
- WebSocket disconnects
- Frontend reloads
- Challenge expires

Recommended principle:

```text
Signal failure ≠ System failure
```

A failed signal should return a safe degraded state.

---

# 28. LOGGING

Use Python logging.

Levels:

```text
DEBUG
INFO
WARNING
ERROR
```

Log:

- Session start/stop
- Camera state
- Face detection loss
- Signal warnings
- Alerts
- Challenge start/result
- Exceptions
- Performance metrics

Do not log sensitive raw video unnecessarily.

---

# 29. PRIVACY REQUIREMENTS

MVP should be local-first.

Requirements:

- [ ] Do not upload webcam frames to external APIs
- [ ] Do not require cloud processing
- [ ] Do not store raw video by default
- [ ] Store only derived telemetry needed for evaluation
- [ ] Document data handling

---

# 30. PERFORMANCE TARGETS

These are engineering targets, not scientific claims.

Target:

```text
Camera: 720p
Processing: ~10–15 FPS
Dashboard: responsive
End-to-end state update: ideally <250 ms
```

If hardware cannot meet these values:

- Reduce processing resolution
- Reduce processing FPS
- Reduce expensive operations
- Preserve stability over raw FPS

---

# 31. DEMO REQUIREMENTS

The demo must have three scenarios.

## Scenario A — Genuine

```text
Stable user
↓
Stable signals
↓
HIGH TRUST
```

## Scenario B — Suspicious

```text
Controlled suspicious event
↓
Signal elevation
↓
Fusion
↓
Trust decreases
↓
ALERT
```

## Scenario C — Challenge

```text
ALERT
↓
CHALLENGE
↓
Verification
↓
RECOVER / ESCALATE
```

---

# 32. DEMO FALLBACK

Before presentation, prepare:

```text
1. Live demo
2. Controlled local test clip
3. Recorded successful run
4. Screenshots
5. Evaluation output
```

Never fabricate a live result.

If the live attack rig fails, use the validated backup.

---

# 33. FOUR-PERSON AGENT ASSIGNMENT

## Agent 1 — Core / Backend

Own:

```text
camera/
face/
schemas.py
main.py
websocket.py
session management
integration
```

Deliver:

- [ ] Working camera pipeline
- [ ] MediaPipe integration
- [ ] WebSocket
- [ ] API
- [ ] Session state
- [ ] Integration

---

## Agent 2 — Detection

Own:

```text
signals/s1_boundary.py
signals/s2_occlusion.py
signals/base.py
```

Deliver:

- [ ] S1
- [ ] S2
- [ ] SignalResult compliance
- [ ] Unit tests
- [ ] Explainable reasons

---

## Agent 3 — Temporal / AI

Own:

```text
signals/s4_temporal.py
fusion/
challenge/
evaluation/
```

Deliver:

- [ ] S4
- [ ] EWMA
- [ ] Trust score
- [ ] Risk state
- [ ] Challenge logic
- [ ] Evaluation

---

## Agent 4 — Frontend / Product

Own:

```text
frontend/
demo/
docs/
```

Deliver:

- [ ] Dashboard
- [ ] Live state
- [ ] Signal cards
- [ ] Trust score
- [ ] Alert panel
- [ ] Timeline
- [ ] Challenge UI
- [ ] Demo flow

---

# 34. AGENT INTEGRATION RULES

Every agent must:

1. Follow the shared schema.
2. Avoid changing another agent's module without coordination.
3. Keep interfaces stable.
4. Write tests for owned functionality.
5. Provide a minimal README for their module.
6. Commit working code frequently.
7. Avoid introducing unnecessary dependencies.
8. Never block integration with experimental code.

---

# 35. 24-HOUR AGENT EXECUTION PLAN

## H0–H1

### Agent 1

- [ ] Repository
- [ ] Environment
- [ ] Camera test
- [ ] MediaPipe test
- [ ] API skeleton

### Agent 2

- [ ] Signal interfaces
- [ ] S1 baseline
- [ ] S2 baseline

### Agent 3

- [ ] S4 baseline
- [ ] Fusion baseline
- [ ] Trust model

### Agent 4

- [ ] React/Vite setup
- [ ] Dashboard skeleton
- [ ] WebSocket client

---

## H1–H3

Parallel implementation.

Goal:

```text
Every major module exists.
```

---

## H3–H6

Integration.

Goal:

```text
LIVE CAMERA
↓
SIGNALS
↓
FUSION
↓
TRUST
↓
DASHBOARD
```

---

## H6–H9

Testing.

Goal:

```text
Stable normal session
+
Controlled suspicious scenario
```

---

## H9–H12

Hardening.

Goal:

```text
Reliable MVP
```

---

## H12

### SCOPE FREEZE

No major new feature.

---

## H12–H15

Add:

```text
Challenge
Verification
Recovery/Escalation
```

only if core is stable.

---

## H15–H18

Demo engineering.

---

## H18–H20

Full validation.

---

## H20–H22

Presentation + evidence.

---

## H22–H24

Final freeze.

---

# 36. ENVIRONMENT VARIABLES

Create `.env.example`.

```text
APP_ENV=development
HOST=127.0.0.1
PORT=8000

CAMERA_INDEX=0
FRAME_WIDTH=1280
FRAME_HEIGHT=720
TARGET_FPS=15

EWMA_ALPHA=0.25

TRUST_HIGH_THRESHOLD=70
TRUST_WARNING_THRESHOLD=40
```

Do not hardcode configurable values throughout the codebase.

---

# 37. STARTUP COMMANDS

## Backend

```bash
cd backend

python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 38. ROOT START SCRIPT

Provide:

```text
start.sh
```

It should:

1. Verify Python
2. Verify dependencies
3. Start backend
4. Start frontend if configured
5. Print URLs

Do not make the startup script excessively complex.

---

# 39. README REQUIREMENTS

README must contain:

- Project overview
- Architecture
- Features
- Tech stack
- Installation
- Startup
- API
- WebSocket
- Signal definitions
- Trust score
- Evaluation
- Demo
- Limitations
- Privacy
- Roadmap

---

# 40. SECURITY / CLAIMS REQUIREMENTS

The system must not claim:

```text
"100% deepfake detection"
"Fraud proven"
"Identity guaranteed"
```

Use:

```text
"risk signal"
"suspicious behavior"
"continuous identity assurance"
"progressive verification"
```

The system should explicitly state that the MVP provides risk assessment and verification assistance, not absolute proof of identity or fraud.

---

# 41. NON-FUNCTIONAL REQUIREMENTS

## Reliability

- No fatal crash during a 10-minute demo
- Graceful face loss
- Graceful camera failure
- Graceful WebSocket reconnect

## Explainability

Every warning/alert must have a reason.

## Maintainability

- Typed frontend
- Pydantic backend models
- Small modules
- No giant monolithic file
- Configuration separated from logic

## Reproducibility

A new machine should be able to follow README instructions and launch the MVP.

---

# 42. ACCEPTANCE TEST

The build is accepted only if all are true:

- [ ] Application launches locally
- [ ] Webcam works
- [ ] Face tracking works
- [ ] S1 produces valid output
- [ ] S2 produces valid output
- [ ] S4 produces valid output
- [ ] Fusion works
- [ ] Trust score updates
- [ ] Dashboard receives live state
- [ ] Alerts appear
- [ ] Challenge can be triggered
- [ ] Challenge result is displayed
- [ ] Logs are generated
- [ ] Tests pass
- [ ] Evaluation script runs
- [ ] Backup demo exists
- [ ] README is complete

---

# 43. AGENT STOP CONDITIONS

An agent must stop adding features when:

```text
A. Their assigned module works
B. Tests pass
C. Integration contract is satisfied
D. Documentation exists
```

Then help with integration, testing, or bug fixing.

Do not spend remaining time inventing features.

---

# 44. PRIORITY ORDER

If time becomes limited:

## Priority 1

```text
Camera
Face tracking
S1
S2
S4
Fusion
Trust
Dashboard
```

## Priority 2

```text
Alerts
Evaluation
Challenge
```

## Priority 3

```text
Timeline
Polish
Extra visualizations
```

## Priority 4

Everything else.

---

# 45. FINAL AGENT INSTRUCTION

Build the smallest reliable system that satisfies this:

```text
REAL PERSON
   ↓
CONTINUOUS MONITORING
   ↓
MULTI-SIGNAL ANALYSIS
   ↓
RISK FUSION
   ↓
TRUST SCORE
   ↓
EXPLAINABLE ALERT
   ↓
PROGRESSIVE VERIFICATION
   ↓
RECOVERY / ESCALATION
```

Do not optimize for the largest architecture.

Optimize for:

```text
WORKING
MEASURABLE
EXPLAINABLE
DEMONSTRABLE
REPRODUCIBLE
```

The 24-hour MVP succeeds when a judge can see the complete loop working and the team can explain exactly what is implemented, how it was evaluated, and what remains future work.
