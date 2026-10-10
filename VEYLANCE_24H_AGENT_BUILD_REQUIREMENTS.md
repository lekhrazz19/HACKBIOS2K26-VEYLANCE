VEYLANCE — 24-HOUR AGENT BUILD REQUIREMENTS
==============================================

PROJECT
-------
VeyLance / Interview Sentinel MVP

BUILD WINDOW
------------
24 hours

TEAM
----
4 people / parallel agents

PRIMARY OBJECTIVE
-----------------
Build a stable local-first continuous identity assurance MVP that:

Webcam / Video
-> OpenCV Capture
-> MediaPipe Face Detection / Landmarks
-> S1 Boundary / Blending Anomaly
-> S2 Occlusion / Landmark Instability
-> S4 Blink / Temporal Eye Behavior
-> Signal Normalization
-> EWMA Fusion
-> Trust Score 0-100
-> Risk State
-> Live Dashboard
-> Explainable Alert
-> Progressive Challenge
-> Verify / Recover / Escalate


==================================================
1. HARD 24-HOUR SCOPE
==================================================

MUST BUILD
----------
[ ] Camera/video input
[ ] OpenCV capture
[ ] MediaPipe face tracking/landmarks
[ ] S1
[ ] S2
[ ] S4
[ ] Signal normalization
[ ] EWMA fusion
[ ] Trust score
[ ] Risk state
[ ] FastAPI backend
[ ] WebSocket live state
[ ] React/Vite/TypeScript dashboard
[ ] Explainable alerts
[ ] Basic progressive challenge
[ ] Evaluation harness
[ ] Tests
[ ] Demo fallback
[ ] README

DO NOT BUILD IN MVP
-------------------
[ ] Full enterprise cloud architecture
[ ] Kubernetes
[ ] Microservices
[ ] Zoom integration
[ ] Microsoft Teams integration
[ ] Google Meet integration
[ ] Production SSO
[ ] Device fingerprinting
[ ] SIEM integrations
[ ] Voice biometrics
[ ] Full C2PA implementation
[ ] Large CNN training
[ ] Custom deepfake model training
[ ] Mobile app
[ ] Native desktop app
[ ] Distributed queues
[ ] Production database cluster


==================================================
2. TECH STACK
==================================================

BACKEND
-------
Python 3.10+
FastAPI
Uvicorn
OpenCV
MediaPipe
NumPy
Pydantic
pytest
pytest-asyncio
pandas (recommended)

FRONTEND
--------
React
Vite
TypeScript
Tailwind CSS
lucide-react
recharts (only if needed)

COMMUNICATION
-------------
WebSocket

PACKAGE MANAGEMENT
------------------
pip + venv
npm

VERSION CONTROL
---------------
Git

DATABASE
--------
No database required for MVP.
Use in-memory session state + optional JSONL telemetry.

IMPORTANT
---------
Do not add dependencies unless they have a concrete MVP use.


==================================================
3. BACKEND REQUIREMENTS.TXT
==================================================

Create backend/requirements.txt:

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

Optional only if actually used:
scipy
matplotlib


==================================================
4. PROJECT STRUCTURE
==================================================

veylance/
  backend/
    app/
      main.py
      config.py
      schemas.py
      websocket.py
      capture/
        camera.py
        video.py
      face/
        tracker.py
        landmarks.py
      signals/
        base.py
        s1_boundary.py
        s2_occlusion.py
        s4_temporal.py
      fusion/
        ewma.py
        trust.py
        risk.py
      challenge/
        challenge.py
      evaluation/
        metrics.py
        runner.py
    tests/
      test_s1.py
      test_s2.py
      test_s4.py
      test_fusion.py
      test_api.py
      test_integration.py
    requirements.txt

  frontend/
    src/
      components/
        CameraPanel.tsx
        TrustScore.tsx
        SignalCard.tsx
        AlertPanel.tsx
        Timeline.tsx
        ChallengePanel.tsx
      hooks/
        useVeyLanceSocket.ts
      types/
        veylance.ts
      App.tsx
      main.tsx
    package.json
    vite.config.ts

  evaluation/
    fixtures/
    results/
    README.md

  demo/
    scenarios.md
    backup/

  docs/
    architecture.md
    api.md
    limitations.md

  .gitignore
  README.md
  start.sh


==================================================
5. SIGNAL CONTRACT
==================================================

Every detection module MUST return:

{
  "signal": "S1",
  "score": 0.0,
  "confidence": 0.0,
  "status": "NORMAL",
  "reason": "Human-readable explanation",
  "timestamp": 0.0
}

Allowed signal names:
S1
S2
S4

Score:
0.0 = low suspicion
1.0 = high suspicion

Confidence:
0.0 = low confidence
1.0 = high confidence

Status:
NORMAL
WARNING
ALERT


==================================================
6. DASHBOARD STATE CONTRACT
==================================================

Backend sends:

{
  "timestamp": 0.0,
  "session_id": "demo-session",
  "face_detected": true,
  "trust_score": 84.0,
  "risk_level": "HIGH_TRUST",
  "signals": [],
  "alert": null,
  "challenge": null
}

Frontend must be able to render this without knowing internal detector implementation.


==================================================
7. S1 REQUIREMENTS
==================================================

NAME
----
Boundary / Blending Anomaly

GOAL
----
Detect suspicious visual discontinuity or abnormal boundary behavior around the tracked face region.

MVP APPROACH
------------
Use lightweight image/ROI/landmark/temporal consistency features.

Do NOT train a new neural network.

REQUIRED OUTPUT
---------------
[ ] score
[ ] confidence
[ ] status
[ ] reason

REQUIREMENTS
------------
[ ] Works on normal webcam input
[ ] Handles temporary face loss
[ ] Score bounded 0-1
[ ] Noise smoothed
[ ] Human-readable reason
[ ] Unit tests


==================================================
8. S2 REQUIREMENTS
==================================================

NAME
----
Occlusion / Landmark Instability

GOAL
----
Detect unusual occlusion or unstable facial landmarks.

INPUTS
------
MediaPipe landmarks
Landmark visibility/presence
Frame-to-frame landmark displacement
Face bounding-box stability

REQUIREMENTS
------------
[ ] Track landmark stability
[ ] Detect abnormal displacement
[ ] Detect partial obstruction
[ ] Handle temporary tracking loss
[ ] Normalize score
[ ] Return confidence
[ ] Return explanation
[ ] Unit tests


==================================================
9. S4 REQUIREMENTS
==================================================

NAME
----
Blink / Temporal Eye Behavior

GOAL
----
Detect abnormal temporal eye behavior instead of making decisions from a single frame.

INPUTS
------
Eye landmarks
Eye geometry/EAR or equivalent
Blink events
Temporal history

REQUIREMENTS
------------
[ ] Maintain history
[ ] Detect blink events
[ ] Avoid single-frame alerts
[ ] Apply smoothing
[ ] Handle missing landmarks
[ ] Normalize score
[ ] Return confidence
[ ] Return explanation
[ ] Unit tests


==================================================
10. FUSION
==================================================

Use temporal smoothing.

Recommended method:
EWMA

Formula:
S_t = alpha * X_t + (1-alpha) * S_(t-1)

Starting alpha:
0.25

Make alpha configurable.

Do not let one noisy frame cause an immediate fraud verdict.


==================================================
11. TRUST SCORE
==================================================

Concept:

Trust = 100 * (1 - fused_suspicion)

Clamp to:
0 <= Trust <= 100

Suggested initial states:

70-100 = HIGH_TRUST
40-69  = WARNING
0-39   = ALERT

These are engineering defaults, NOT scientifically validated thresholds.

Make them configurable.


==================================================
12. RISK STATES
==================================================

HIGH_TRUST
----------
Continue monitoring.

WARNING
-------
Display warning.
Increase event logging.
Continue observation.

ALERT
-----
Display alert.
Trigger challenge.
Increase verification requirement.


==================================================
13. PROGRESSIVE CHALLENGE
==================================================

Flow:

ALERT
-> Challenge Requested
-> User performs instructed action
-> Verification
-> RECOVER or ESCALATE

Allowed MVP challenges:
[ ] Turn head left/right
[ ] Blink
[ ] Hold neutral face
[ ] Follow simple on-screen instruction

Do not represent the challenge as cryptographically strong identity proof.


==================================================
14. FASTAPI
==================================================

Minimum endpoints:

GET /
GET /health
GET /api/status
POST /api/session/start
POST /api/session/stop
POST /api/challenge/start
POST /api/challenge/verify
WS /ws

Health response:

{
  "status": "ok"
}

Use WebSocket for live state.
Do NOT create an HTTP request for every camera frame.


==================================================
15. CAMERA ARCHITECTURE
==================================================

One capture loop only:

Camera
-> Frame
-> Preprocess
-> Face Tracking
-> S1/S2/S4
-> Fusion
-> DashboardState
-> WebSocket

Do not create separate camera loops per signal.


==================================================
16. FRAME PROCESSING
==================================================

Starting configuration:

TARGET_FPS=15
CAMERA_INDEX=0
FRAME_WIDTH=1280
FRAME_HEIGHT=720

If CPU is weak:
[ ] Reduce resolution
[ ] Reduce processing FPS
[ ] Reduce expensive operations

Preserve stability over raw FPS.


==================================================
17. SESSION MANAGEMENT
==================================================

Each demo has a session.

Example:

{
  "session_id": "20261009-001",
  "started_at": 0.0,
  "status": "ACTIVE"
}

Track:
[ ] Start time
[ ] Latest trust score
[ ] Signal history
[ ] Alerts
[ ] Challenges
[ ] End time

Use in-memory state for MVP.


==================================================
18. FRONTEND
==================================================

Use:
React
Vite
TypeScript
Tailwind CSS

Required components:

CameraPanel
TrustScore
SignalCard
AlertPanel
Timeline
ChallengePanel

Dashboard must show:
[ ] Live camera
[ ] Face/landmarks
[ ] Trust score
[ ] Risk level
[ ] S1
[ ] S2
[ ] S4
[ ] Alert
[ ] Timeline
[ ] Challenge


==================================================
19. UI STATES
==================================================

HIGH TRUST
----------
Trust: 85
Status: HIGH TRUST

WARNING
-------
Trust: 56
Status: WARNING

ALERT
-----
Trust: 28
Status: ALERT

Do not use color alone. Always display text.


==================================================
20. EXPLAINABILITY
==================================================

Every alert must answer:

1. What happened?
2. Which signal detected it?
3. How severe is it?
4. What happens next?

Example:

ALERT

Reason:
Elevated visual boundary inconsistency

Signals:
S1: 0.82
S2: 0.68

Action:
Progressive verification challenge


==================================================
21. EVALUATION
==================================================

Create:

python -m evaluation.runner --input evaluation/fixtures

Output:
evaluation/results/

Metrics when reliable labels exist:
[ ] TP
[ ] TN
[ ] FP
[ ] FN
[ ] Precision
[ ] Recall
[ ] F1
[ ] FPR
[ ] FNR

Always measure where possible:
[ ] Average latency
[ ] P95 latency
[ ] FPS

If labels do not exist, do not invent classification metrics.


==================================================
22. TESTING
==================================================

UNIT:
[ ] test_s1.py
[ ] test_s2.py
[ ] test_s4.py
[ ] test_fusion.py

Test:
[ ] Score range
[ ] Confidence range
[ ] Missing face
[ ] Empty history
[ ] Thresholds
[ ] EWMA
[ ] Trust conversion

API:
[ ] /
[ ] /health
[ ] session start
[ ] session stop
[ ] challenge start
[ ] challenge verify

INTEGRATION:
Input
-> Face
-> S1/S2/S4
-> Fusion
-> Trust
-> DashboardState


==================================================
23. ERROR HANDLING
==================================================

System must not crash because:
[ ] Camera unavailable
[ ] Face temporarily missing
[ ] Landmarks missing
[ ] Signal fails
[ ] WebSocket disconnects
[ ] Frontend reloads
[ ] Challenge expires

Principle:

Signal failure != System failure

A failed signal should produce a safe degraded state.


==================================================
24. LOGGING
==================================================

Use Python logging.

Levels:
DEBUG
INFO
WARNING
ERROR

Log:
[ ] Session start/stop
[ ] Camera state
[ ] Face loss
[ ] Signal warnings
[ ] Alerts
[ ] Challenge events
[ ] Exceptions
[ ] Performance metrics

Do not log raw webcam video unnecessarily.


==================================================
25. PRIVACY
==================================================

MVP is local-first.

[ ] No webcam upload to external APIs
[ ] No cloud processing required
[ ] No raw video storage by default
[ ] Store only necessary derived telemetry
[ ] Document data handling


==================================================
26. PERFORMANCE TARGETS
==================================================

Engineering targets:

Camera:
720p

Processing:
~10-15 FPS

State update:
Ideally <250 ms end-to-end

If hardware cannot meet targets:
[ ] Reduce resolution
[ ] Reduce processing FPS
[ ] Optimize expensive operations
[ ] Preserve stability


==================================================
27. DEMO
==================================================

SCENARIO A — GENUINE
--------------------
Stable user
-> Stable signals
-> HIGH TRUST

SCENARIO B — SUSPICIOUS
-----------------------
Controlled suspicious event
-> Signal elevation
-> Fusion
-> Trust decreases
-> ALERT

SCENARIO C — CHALLENGE
----------------------
ALERT
-> CHALLENGE
-> Verification
-> RECOVER / ESCALATE


==================================================
28. FALLBACK
==================================================

Prepare:
[ ] Live demo
[ ] Controlled local test clip
[ ] Recorded successful run
[ ] Screenshots
[ ] Evaluation output

Never fabricate a live result.


==================================================
29. FOUR AGENTS
==================================================

AGENT 1 — CORE/BACKEND
----------------------
Own:
camera/
face/
schemas.py
main.py
websocket.py
session management
integration

Deliver:
[ ] Camera
[ ] MediaPipe
[ ] API
[ ] WebSocket
[ ] Session state
[ ] Integration


AGENT 2 — DETECTION
-------------------
Own:
signals/base.py
signals/s1_boundary.py
signals/s2_occlusion.py

Deliver:
[ ] S1
[ ] S2
[ ] SignalResult compliance
[ ] Tests
[ ] Explainability


AGENT 3 — TEMPORAL/AI
---------------------
Own:
signals/s4_temporal.py
fusion/
challenge/
evaluation/

Deliver:
[ ] S4
[ ] EWMA
[ ] Trust score
[ ] Risk state
[ ] Challenge logic
[ ] Evaluation


AGENT 4 — FRONTEND/PRODUCT
---------------------------
Own:
frontend/
demo/
docs/

Deliver:
[ ] Dashboard
[ ] Live state
[ ] Signal cards
[ ] Trust score
[ ] Alert panel
[ ] Timeline
[ ] Challenge UI
[ ] Demo flow


==================================================
30. AGENT RULES
==================================================

Every agent MUST:
[ ] Follow shared schema
[ ] Keep interfaces stable
[ ] Write tests
[ ] Document owned module
[ ] Commit frequently
[ ] Avoid unnecessary dependencies
[ ] Avoid modifying another agent's module without coordination
[ ] Never block integration with experimental code

STOP FEATURE DEVELOPMENT when:
[ ] Module works
[ ] Tests pass
[ ] Contract is satisfied
[ ] Documentation exists

Then help with integration/bugs.


==================================================
31. 24-HOUR EXECUTION
==================================================

H0-H1
-----
Agent 1: repository, environment, camera, MediaPipe, API skeleton
Agent 2: signal interfaces, S1, S2 baseline
Agent 3: S4, fusion, trust baseline
Agent 4: React/Vite, dashboard, WebSocket client

H1-H3
-----
Parallel implementation.
Goal: all major modules exist.

H3-H6
-----
Integration.
Goal:
LIVE CAMERA
-> SIGNALS
-> FUSION
-> TRUST
-> DASHBOARD

H6-H9
-----
Testing.
Goal:
stable normal session + controlled suspicious scenario

H9-H12
------
Hardening.
Goal:
reliable MVP

H12
---
SCOPE FREEZE.
No major new features.

H12-H15
-------
Add challenge/verification/recovery only if core is stable.

H15-H18
-------
Demo engineering.

H18-H20
-------
Full validation.

H20-H22
-------
Presentation and evidence.

H22-H24
-------
Final freeze.


==================================================
32. ENVIRONMENT
==================================================

Create .env.example:

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

Do not hardcode these values throughout the application.


==================================================
33. STARTUP
==================================================

Backend:

cd backend
python -m venv .venv

Linux/macOS:
source .venv/bin/activate

Windows:
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

Frontend:

cd frontend
npm install
npm run dev

Also provide start.sh for convenient local launch.


==================================================
34. README
==================================================

README must contain:

[ ] Overview
[ ] Architecture
[ ] Features
[ ] Tech stack
[ ] Installation
[ ] Startup
[ ] API
[ ] WebSocket
[ ] Signal definitions
[ ] Trust score
[ ] Evaluation
[ ] Demo
[ ] Limitations
[ ] Privacy
[ ] Roadmap


==================================================
35. SECURITY / CLAIMS
==================================================

DO NOT CLAIM:
"100% deepfake detection"
"Fraud proven"
"Identity guaranteed"

USE:
"risk signal"
"suspicious behavior"
"continuous identity assurance"
"progressive verification"

The MVP is a risk assessment and verification-assistance system, not absolute proof of identity or fraud.


==================================================
36. NON-FUNCTIONAL REQUIREMENTS
==================================================

Reliability:
[ ] No fatal crash during 10-minute demo
[ ] Graceful face loss
[ ] Graceful camera failure
[ ] WebSocket reconnect

Explainability:
[ ] Every warning/alert has a reason

Maintainability:
[ ] Typed frontend
[ ] Pydantic models
[ ] Small modules
[ ] No giant monolithic file
[ ] Config separated from logic

Reproducibility:
[ ] New machine can follow README and launch MVP


==================================================
37. ACCEPTANCE TEST
==================================================

The build is accepted only if:

[ ] Application launches locally
[ ] Webcam works
[ ] Face tracking works
[ ] S1 works
[ ] S2 works
[ ] S4 works
[ ] Fusion works
[ ] Trust score updates
[ ] Dashboard receives live state
[ ] Alerts appear
[ ] Challenge can trigger
[ ] Challenge result displays
[ ] Logs are generated
[ ] Tests pass
[ ] Evaluation runs
[ ] Backup demo exists
[ ] README is complete


==================================================
38. PRIORITY ORDER
==================================================

P0:
Camera
Face tracking
S1
S2
S4
Fusion
Trust
Dashboard

P1:
Alerts
Evaluation
Challenge

P2:
Timeline
UI polish
Extra visualizations

P3:
Everything else


==================================================
39. FINAL AGENT INSTRUCTION
==================================================

Build the smallest reliable system that satisfies:

REAL PERSON
-> CONTINUOUS MONITORING
-> MULTI-SIGNAL ANALYSIS
-> RISK FUSION
-> TRUST SCORE
-> EXPLAINABLE ALERT
-> PROGRESSIVE VERIFICATION
-> RECOVERY / ESCALATION

Optimize for:
WORKING
MEASURABLE
EXPLAINABLE
DEMONSTRABLE
REPRODUCIBLE

Do not optimize for the largest architecture.

The 24-hour MVP succeeds when a judge can see the complete loop working and the team can explain exactly what is implemented, how it was evaluated, and what remains future work.
