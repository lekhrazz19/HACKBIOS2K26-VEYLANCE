VEYLANCE — SUBMISSION DEPLOYMENT REQUIREMENTS
================================================

OBJECTIVE
---------
Produce a public HTTPS URL judges can open and use from their own laptop.

RECOMMENDED:
Platform: Render
Deployment: One Dockerized full-stack web service
Frontend: React/Vite/TypeScript
Backend: FastAPI + WebSocket
CV/ML: OpenCV + MediaPipe + NumPy
Storage: In-memory + optional JSONL
Database: None

CRITICAL:
A cloud server cannot access the judge's laptop webcam through cv2.VideoCapture(0).

DEPLOYED FLOW:
Browser Camera
-> getUserMedia()
-> JPEG Frames
-> WSS WebSocket
-> FastAPI
-> OpenCV Decode
-> MediaPipe
-> S1/S2/S4
-> Fusion
-> Trust Score
-> DashboardState
-> WebSocket
-> React Dashboard


==================================================
1. ONE-SERVICE DEPLOYMENT
==================================================

Use one public Docker service.

GitHub
-> Render
-> Docker
-> FastAPI + built React
-> HTTPS/WSS

Benefits:
[ ] One URL
[ ] No CORS
[ ] One deployment
[ ] Easier debugging
[ ] Faster hackathon delivery


==================================================
2. PRODUCTION CAMERA
==================================================

Frontend MUST use:

navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user"
  },
  audio: false
})

Production MUST NOT depend on:

cv2.VideoCapture(0)

Local mode may still support OpenCV camera.


==================================================
3. FRAME STREAM
==================================================

Starting target:

Resolution: 640x480
FPS: 5
JPEG quality: 50
Transport: WebSocket binary JPEG

If stable:
Increase to 8-10 FPS.

Do NOT stream 1080p continuously.


==================================================
4. WEBSOCKET
==================================================

Endpoint:

WS /ws

Production URL:

wss://<domain>/ws

Dynamic frontend logic:

https + wss
http + ws

Do not hardcode domain.


==================================================
5. BACKEND PIPELINE
==================================================

receive_bytes()
-> cv2.imdecode()
-> MediaPipe
-> S1/S2/S4
-> Fusion
-> Trust
-> DashboardState
-> send_json()

Do not save every frame.


==================================================
6. FASTAPI ENDPOINTS
==================================================

GET /
GET /health
GET /api/status

POST /api/session/start
POST /api/session/stop

POST /api/challenge/start
POST /api/challenge/verify

WS /ws


==================================================
7. STATIC FRONTEND
==================================================

Build:

frontend/dist/

FastAPI serves it.

GET /
-> frontend/dist/index.html

/assets
-> frontend/dist/assets

This gives one public URL.


==================================================
8. DOCKERFILE
==================================================

Use multi-stage Docker build.

Frontend stage:
node:22-alpine

Backend stage:
python:3.11-slim

Install required Linux packages for OpenCV/MediaPipe.

Backend starts with:

uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}

Production server MUST bind to:
0.0.0.0


==================================================
9. PYTHON
==================================================

Pin Python 3.11.

Create:

.python-version

Contents:

3.11

If exact patch version is required by dependencies, pin it.


==================================================
10. RENDER
==================================================

Create:

render.yaml

Recommended:

services:
  - type: web
    name: veylance
    runtime: docker
    plan: free
    healthCheckPath: /health
    envVars:
      - key: APP_ENV
        value: production
      - key: CAMERA_MODE
        value: browser
      - key: TARGET_FPS
        value: "5"
      - key: FRAME_WIDTH
        value: "640"
      - key: FRAME_HEIGHT
        value: "480"
      - key: JPEG_QUALITY
        value: "50"
      - key: EWMA_ALPHA
        value: "0.25"
      - key: TRUST_HIGH_THRESHOLD
        value: "70"
      - key: TRUST_WARNING_THRESHOLD
        value: "40"


==================================================
11. ENVIRONMENT
==================================================

Production:

APP_ENV=production
CAMERA_MODE=browser
TARGET_FPS=5
FRAME_WIDTH=640
FRAME_HEIGHT=480
JPEG_QUALITY=50

EWMA_ALPHA=0.25
TRUST_HIGH_THRESHOLD=70
TRUST_WARNING_THRESHOLD=40

Do not expose secrets in frontend.


==================================================
12. HEALTH
==================================================

GET /health

Expected:

{
  "status": "ok",
  "service": "veylance",
  "version": "0.1.0"
}

Use /health as deployment health check.


==================================================
13. STORAGE
==================================================

No database required.

Use:
[ ] In-memory session state
[ ] Optional JSONL logs

Do not depend on local persistent files.

Do not store raw video.

Do not require persistent disk.


==================================================
14. MODEL ASSETS
==================================================

Do not depend on runtime internet downloads for required model assets.

If a model/asset is needed:
[ ] Include in build
OR
[ ] Use package-supported bundled asset

Runtime must work without an unexpected model download.


==================================================
15. CORS
==================================================

If frontend/backend are same origin:

No CORS required.

For local split development only:
Allow localhost:5173.


==================================================
16. LOCAL / PRODUCTION
==================================================

LOCAL:

CAMERA_MODE=local

May use:
cv2.VideoCapture(0)

PRODUCTION:

CAMERA_MODE=browser

Must use:
getUserMedia()
-> WebSocket
-> backend


==================================================
17. DEPLOYMENT TESTS
==================================================

[ ] Public page loads
[ ] HTTPS works
[ ] Camera permission works
[ ] Camera preview works
[ ] WebSocket connects
[ ] WSS works
[ ] S1 works
[ ] S2 works
[ ] S4 works
[ ] Trust score works
[ ] Alert works
[ ] Challenge works
[ ] Recovery works
[ ] 5-minute stability
[ ] 10-minute stability
[ ] Fresh browser test
[ ] Second laptop test


==================================================
18. AGENT DEPLOYMENT OWNERSHIP
==================================================

AGENT 1 — BACKEND
-----------------
[ ] Browser-frame WebSocket
[ ] JPEG decode
[ ] Remove production VideoCapture dependency
[ ] /health
[ ] Static frontend serving
[ ] Production config
[ ] Docker

AGENT 2 — DETECTION
-------------------
[ ] S1 accepts decoded frames
[ ] S2 accepts decoded frames
[ ] No local camera access
[ ] Optimize frame processing
[ ] Missing-frame handling

AGENT 3 — FUSION
----------------
[ ] Session-safe fusion
[ ] No cross-user state
[ ] Challenge API
[ ] Non-blocking evaluation

AGENT 4 — FRONTEND
------------------
[ ] getUserMedia
[ ] WebSocket
[ ] JPEG frame encoding
[ ] FPS limiter
[ ] Connection state
[ ] Camera permission state
[ ] Reconnect state
[ ] Stop Camera
[ ] Production testing


==================================================
19. DEPLOYMENT TIMELINE
==================================================

H0-H6:
Core MVP

H6-H9:
Browser camera + WebSocket

H9-H12:
Local browser end-to-end

H12:
Scope freeze

H12-H15:
Docker

H15-H16:
FIRST PUBLIC DEPLOYMENT

H16-H18:
Fix production bugs

H18-H19:
Fresh-browser tests

H19-H20:
Second-laptop tests

H20-H21:
Final demo

H21-H22:
README/screenshots/submission

H22-H23:
Final production smoke test

H23-H24:
Freeze deployment


==================================================
20. FINAL SMOKE TEST
==================================================

OPEN PUBLIC URL
-> HTTPS LOADS
-> CLICK START
-> ALLOW CAMERA
-> CAMERA PREVIEW
-> WSS CONNECTED
-> FACE DETECTED
-> S1/S2/S4 ACTIVE
-> TRUST UPDATES
-> SUSPICIOUS SCENARIO
-> TRUST DROPS
-> ALERT
-> CHALLENGE
-> VERIFICATION
-> RECOVERY/ESCALATION
-> STOP CAMERA


==================================================
21. SUBMISSION PACKAGE
==================================================

[ ] GitHub repository
[ ] Public HTTPS URL
[ ] README
[ ] Architecture diagram
[ ] Tech stack
[ ] Demo instructions
[ ] Evaluation results
[ ] Limitations
[ ] Privacy statement
[ ] Backup demo/video

README must contain:

## Live Demo

https://<your-render-domain>


==================================================
22. JUDGE INSTRUCTIONS
==================================================

Keep instructions under 30 seconds:

1. Open live URL.
2. Click Start Verification.
3. Allow camera.
4. Keep face visible.
5. Observe trust score.
6. Trigger provided test scenario.
7. Observe alert.
8. Complete challenge.


==================================================
23. FALLBACK
==================================================

BACKUP 1:
Localhost

BACKUP 2:
Second cloud deployment, e.g. Railway

BACKUP 3:
Validated recorded demo

Never fabricate results.


==================================================
24. FINAL ACCEPTANCE
==================================================

Deployment is DONE only when:

[ ] Public HTTPS URL
[ ] Fresh browser works
[ ] Camera works
[ ] WSS works
[ ] Backend receives frames
[ ] Face detection works
[ ] S1 works
[ ] S2 works
[ ] S4 works
[ ] Fusion works
[ ] Trust updates
[ ] Alert works
[ ] Challenge works
[ ] Recovery/escalation works
[ ] Stop Camera works
[ ] No raw video persistence
[ ] /health works
[ ] README contains URL
[ ] Backup exists


==================================================
25. FINAL RULE
==================================================

DO NOT WAIT UNTIL H20 TO DEPLOY.

First public deployment:
H15-H16

The remaining time is for fixing real browser/HTTPS/WebSocket/container problems.

A localhost-only MVP is NOT submission-ready.


==================================================
26. FINAL ARCHITECTURE
==================================================

JUDGE
 |
 v
React Dashboard
 |
getUserMedia()
 |
Browser Camera
 |
JPEG Frames
 |
WSS /ws
 |
FastAPI
 |
OpenCV Decode
 |
MediaPipe
 |
+----+----+
|    |    |
S1   S2   S4
+----+----+
 |
EWMA Fusion
 |
Trust Score
 |
Risk State
 |
+----+----+
|         |
Alert    Normal
 |
Challenge
 |
Verify
 |
Recover / Escalate

ALL INSIDE ONE DOCKER SERVICE ON RENDER.


==================================================
27. DEPLOYMENT PHILOSOPHY
==================================================

ONE URL
ONE CONTAINER
ONE REPOSITORY
ONE DEPLOYMENT
ONE WEBSOCKET
NO DATABASE
NO CLOUD ML API
NO RAW VIDEO STORAGE
NO COMPLEX INFRASTRUCTURE
