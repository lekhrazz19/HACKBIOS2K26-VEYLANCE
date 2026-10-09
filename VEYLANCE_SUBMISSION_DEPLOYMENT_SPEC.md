# VEYLANCE — SUBMISSION DEPLOYMENT SPECIFICATION
## 24-Hour Hackathon Deployment Plan

**Goal:** Produce a publicly accessible HTTPS URL that judges can open and use from their own laptop.

**Recommended platform:** Render  
**Deployment model:** One Dockerized full-stack web service  
**Frontend:** React/Vite/TypeScript, built into static assets  
**Backend:** FastAPI + WebSocket  
**ML/CV:** OpenCV + MediaPipe + NumPy  
**Runtime:** One container  
**Storage:** In-memory + optional JSONL logs  
**Database:** None for MVP

---

# 1. CRITICAL ARCHITECTURE CHANGE FOR DEPLOYMENT

## Current local architecture

The local MVP may currently use:

```text
Developer Laptop Webcam
        ↓
OpenCV VideoCapture
        ↓
Python Detection
```

This does NOT work as-is after deployment.

A cloud server cannot use the judge's laptop webcam through:

```python
cv2.VideoCapture(0)
```

because `0` refers to a camera attached to the server/container, not the judge's browser.

## Required deployed architecture

Use browser camera capture:

```text
Judge Laptop
    │
    │ HTTPS
    ▼
React Dashboard
    │
    │ navigator.mediaDevices.getUserMedia()
    ▼
Browser Camera
    │
    │ JPEG frames / binary WebSocket messages
    ▼
WSS
    │
    ▼
FastAPI WebSocket
    │
    ▼
OpenCV Decode
    │
    ▼
MediaPipe
    │
    ├── S1
    ├── S2
    └── S4
    │
    ▼
EWMA Fusion
    │
    ▼
Trust Score
    │
    ▼
DashboardState
    │
    ▼
WebSocket
    │
    ▼
React Dashboard
```

This is the most important deployment adaptation.

---

# 2. RECOMMENDED DEPLOYMENT

## Use ONE public service

Recommended:

```text
GitHub Repository
        ↓
Render
        ↓
Docker Build
        ↓
One Web Service
        ↓
HTTPS + WSS
        ↓
React + FastAPI
```

Why one service?

- Less configuration
- No CORS problems
- One URL for judges
- One deployment
- One environment
- Easier debugging
- Faster to finish within 24 hours
- Frontend and backend stay version-synchronized

Render supports Docker-based services and public WebSockets. Web services must listen on `0.0.0.0` and the assigned port. citeturn0search13turn0search4turn0search5

---

# 3. DEPLOYMENT URL

Final submission should look like:

```text
https://veylance.onrender.com
```

or the generated Render URL.

Optional later:

```text
https://demo.veylance.example
```

Do not waste hackathon time configuring a custom domain unless required.

---

# 4. REPOSITORY STRUCTURE

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
│   │   ├── capture/
│   │   │   ├── decoder.py
│   │   │   └── camera.py
│   │   ├── face/
│   │   │   ├── tracker.py
│   │   │   └── landmarks.py
│   │   ├── signals/
│   │   │   ├── base.py
│   │   │   ├── s1_boundary.py
│   │   │   ├── s2_occlusion.py
│   │   │   └── s4_temporal.py
│   │   ├── fusion/
│   │   │   ├── ewma.py
│   │   │   ├── trust.py
│   │   │   └── risk.py
│   │   ├── challenge/
│   │   │   └── challenge.py
│   │   └── evaluation/
│   │       ├── metrics.py
│   │       └── runner.py
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── demo/
│   ├── scenarios.md
│   └── backup/
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   └── limitations.md
│
├── Dockerfile
├── .dockerignore
├── .gitignore
├── render.yaml
├── README.md
└── start.sh
```

---

# 5. FRONTEND CAMERA IMPLEMENTATION

The frontend must request camera permission.

Use:

```javascript
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user"
  },
  audio: false
})
```

Never request microphone permission unless it is actually needed.

Render provides HTTPS, which is important because browser camera access requires a secure context.

---

# 6. FRAME STREAMING STRATEGY

Do NOT send raw 1080p frames continuously.

Recommended:

```text
Capture resolution:
640 × 480

Processing:
~5–10 FPS

JPEG quality:
40–60

Frame size:
Keep reasonably small

Transport:
WebSocket binary message
```

Initial target:

```text
5 FPS
640×480
JPEG quality 50
```

If performance allows:

```text
8–10 FPS
```

The goal is a stable demo, not maximum video quality.

---

# 7. BROWSER → BACKEND WEBSOCKET

Recommended message:

```text
Binary JPEG frame
```

Avoid converting every frame into huge Base64 JSON strings.

Optional control messages can remain JSON:

```json
{
  "type": "session_start",
  "session_id": "demo-001"
}
```

Frame:

```text
<binary JPEG>
```

Server response:

```json
{
  "type": "state",
  "data": {
    "trust_score": 84,
    "risk_level": "HIGH_TRUST",
    "signals": []
  }
}
```

---

# 8. SERVER FRAME PIPELINE

FastAPI WebSocket:

```text
WebSocket.receive_bytes()
        ↓
OpenCV imdecode()
        ↓
BGR/RGB conversion
        ↓
MediaPipe
        ↓
S1/S2/S4
        ↓
Fusion
        ↓
Trust
        ↓
DashboardState
        ↓
websocket.send_json()
```

Do not save every incoming frame to disk.

---

# 9. BACKEND ENDPOINTS

Minimum:

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

The backend should serve the built React frontend.

Example:

```text
GET /
    ↓
frontend/dist/index.html
```

---

# 10. FASTAPI STATIC FRONTEND

After Vite build:

```text
frontend/dist/
```

FastAPI should mount it.

Concept:

```python
app.mount(
    "/assets",
    StaticFiles(directory="frontend/dist/assets"),
    name="assets"
)
```

And `/` should return:

```text
frontend/dist/index.html
```

This allows:

```text
https://veylance.onrender.com/
```

to serve the complete application.

---

# 11. DOCKERFILE

Create:

```text
Dockerfile
```

Recommended multi-stage structure:

```dockerfile
FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --no-cache-dir \
    -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 10000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
```

The exact system packages may need adjustment based on the selected OpenCV/MediaPipe versions.

---

# 12. PYTHON VERSION

Pin Python rather than relying on the platform default.

Recommended:

```text
Python 3.11
```

Reason:

- Predictable dependency behavior
- Good compatibility with common OpenCV/MediaPipe packages
- Avoids unexpected platform version changes

Render currently supports explicitly selecting Python versions through `PYTHON_VERSION` or `.python-version`. citeturn0search11

Create:

```text
.python-version
```

with:

```text
3.11
```

If dependency compatibility requires a specific patch release, pin the exact supported patch version.

---

# 13. RENDER CONFIGURATION

Create:

```text
render.yaml
```

Example:

```yaml
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
```

The final Render service must use:

```text
Docker
```

as the runtime.

---

# 14. PORT REQUIREMENT

The backend must use:

```python
port = int(os.getenv("PORT", "10000"))
```

and:

```text
host = 0.0.0.0
```

Do not hardcode:

```text
127.0.0.1
```

for the production server.

Render expects a public web service to bind to `0.0.0.0`. citeturn0search4

---

# 15. WEBSOCKET URL

Frontend should dynamically derive the WebSocket URL.

Example:

```typescript
const protocol =
  window.location.protocol === "https:" ? "wss:" : "ws:";

const wsUrl =
  `${protocol}//${window.location.host}/ws`;
```

Therefore:

Local:

```text
http://localhost
↓
ws://localhost/ws
```

Production:

```text
https://veylance.onrender.com
↓
wss://veylance.onrender.com/ws
```

Do not hardcode the production domain.

---

# 16. HEALTH CHECK

Implement:

```text
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "veylance",
  "version": "0.1.0"
}
```

Render can use:

```text
/health
```

as the health check path.

---

# 17. PRODUCTION ENVIRONMENT

Use:

```text
APP_ENV=production
CAMERA_MODE=browser
TARGET_FPS=5
FRAME_WIDTH=640
FRAME_HEIGHT=480
JPEG_QUALITY=50

EWMA_ALPHA=0.25

TRUST_HIGH_THRESHOLD=70
TRUST_WARNING_THRESHOLD=40
```

Do not expose secrets in frontend code.

---

# 18. CORS

If frontend and backend are served from the same origin:

```text
NO CORS REQUIRED
```

This is one of the major advantages of the one-service architecture.

For local development, allow:

```text
http://localhost:5173
```

only if frontend and backend are running separately.

---

# 19. RENDER DEPLOYMENT STEPS

## Step 1 — GitHub

Push repository:

```bash
git init
git add .
git commit -m "feat: initial VeyLance MVP"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

## Step 2 — Render

Create a new:

```text
Web Service
```

Connect GitHub repository.

## Step 3 — Runtime

Select:

```text
Docker
```

## Step 4 — Deploy

Render will build the Dockerfile.

## Step 5 — Domain

Use the generated:

```text
https://<service-name>.onrender.com
```

## Step 6 — Health Check

Open:

```text
https://<service-name>.onrender.com/health
```

Expected:

```json
{
  "status": "ok"
}
```

## Step 7 — Application

Open:

```text
https://<service-name>.onrender.com/
```

Allow camera permission.

---

# 20. RENDER DEPLOYMENT FACTS

Render supports:

- Docker deployments
- Public HTTPS web services
- FastAPI deployments
- Inbound WebSockets
- Automatic deployment from a connected Git repository

Render's documentation specifically shows FastAPI deployment with a `0.0.0.0` binding and supports WebSockets on web services. citeturn0search3turn0search5turn0search13

Free web services can spin down after inactivity, so the first request/demo startup may take longer. citeturn0search8

---

# 21. IMPORTANT: FREE DEPLOYMENT LIMITATION

Do not depend on persistent local files.

Render's default service filesystem is ephemeral. Files written by the running service can disappear after restart/redeploy unless persistent storage is used. citeturn0search0turn0search2

Therefore:

```text
NO REQUIRED DATABASE
NO REQUIRED LOCAL VIDEO STORAGE
NO REQUIRED LOCAL MODEL DOWNLOADS AT RUNTIME
```

For MVP:

```text
In-memory state
+
temporary logs
```

is sufficient.

---

# 22. MODEL / ASSET REQUIREMENTS

If MediaPipe or another package downloads models at runtime:

DO NOT depend on a runtime internet download during the demo.

Prefer:

```text
Repository
   ↓
Docker build
   ↓
Model/assets included
   ↓
Runtime
```

If the package already ships required model assets, use that supported mechanism.

If a model file must be downloaded, explicitly add it to the Docker build process or package it as a project asset.

---

# 23. NO SERVER CAMERA

Production configuration must never do:

```python
cv2.VideoCapture(0)
```

when:

```text
CAMERA_MODE=browser
```

Instead:

```text
Browser captures camera
Backend receives frames
```

The local developer mode may still support:

```text
CAMERA_MODE=local
```

for debugging.

---

# 24. LOCAL + PRODUCTION MODES

## LOCAL MODE

```text
CAMERA_MODE=local
```

Optional:

```text
OpenCV VideoCapture(0)
```

## PRODUCTION MODE

```text
CAMERA_MODE=browser
```

Required:

```text
Browser getUserMedia()
↓
WebSocket
↓
Backend
```

This separation allows the existing local MVP to remain useful.

---

# 25. DEPLOYMENT TEST MATRIX

Before submission:

| Test | Local | Production |
|---|---:|---:|
| Page loads | [ ] | [ ] |
| HTTPS | N/A | [ ] |
| Camera permission | [ ] | [ ] |
| Camera preview | [ ] | [ ] |
| WebSocket connects | [ ] | [ ] |
| S1 | [ ] | [ ] |
| S2 | [ ] | [ ] |
| S4 | [ ] | [ ] |
| Trust score | [ ] | [ ] |
| Alert | [ ] | [ ] |
| Challenge | [ ] | [ ] |
| Recovery | [ ] | [ ] |
| 5-minute stability | [ ] | [ ] |
| 10-minute stability | [ ] | [ ] |
| Mobile/second laptop | Optional | [ ] |
| Fresh browser | [ ] | [ ] |

---

# 26. NETWORK TEST

Open the deployed application from:

```text
Laptop A
Laptop B
```

At minimum test:

```text
Chrome
Incognito/private window
```

Confirm:

- Camera permission appears
- Camera starts
- WebSocket connects
- Dashboard updates
- Trust score changes
- Challenge works

---

# 27. DEMO PERFORMANCE MODE

For the public demo use:

```text
Resolution: 640×480
FPS: 5
JPEG quality: 50
```

If the server comfortably handles it:

```text
FPS: 8
```

Do not increase FPS just because the local laptop can handle it.

---

# 28. PUBLIC DEMO SAFETY

Add a visible notice:

```text
VeyLance Demo

Camera frames are processed for this demonstration.
Do not use this demo with sensitive or private information.
```

Do not store raw video.

Provide:

```text
STOP CAMERA
```

button.

When stopped:

```text
MediaStreamTrack.stop()
```

must be called.

---

# 29. DEMO UI DEPLOYMENT CHECK

The first screen must immediately show:

```text
VEYLANCE

Continuous Identity Assurance

[ Start Verification ]

Camera: NOT CONNECTED
Session: IDLE
```

After start:

```text
Camera: CONNECTED
Session: ACTIVE
Trust: 94
Status: HIGH TRUST
```

This makes the deployed product understandable within seconds.

---

# 30. DEPLOYMENT FALLBACK

If Render deployment fails or the public server becomes unreliable:

## Backup 1

Run locally:

```text
localhost
```

## Backup 2

Use a second deployment provider.

Railway can deploy from GitHub/Docker and supports public services and generated domains, making it a practical backup. citeturn0search17turn0search7

## Backup 3

Record a validated demo.

Never fabricate a live deployment result.

---

# 31. DEPLOYMENT AGENT TASKS

## Agent 1 — Backend

- [ ] Add browser-frame WebSocket endpoint
- [ ] Add JPEG decode
- [ ] Remove production dependency on `VideoCapture(0)`
- [ ] Add `/health`
- [ ] Add static frontend serving
- [ ] Add production config
- [ ] Test WebSocket
- [ ] Test Docker

## Agent 2 — Detection

- [ ] Ensure S1 accepts decoded frames
- [ ] Ensure S2 accepts decoded frames
- [ ] Ensure no detector accesses local camera
- [ ] Reduce expensive per-frame processing
- [ ] Add graceful missing-frame behavior

## Agent 3 — Fusion

- [ ] Make fusion state session-safe
- [ ] Prevent cross-user/session state leakage
- [ ] Add challenge API
- [ ] Add production evaluation mode
- [ ] Ensure metrics do not block live pipeline

## Agent 4 — Frontend

- [ ] Implement getUserMedia
- [ ] Implement WebSocket
- [ ] Encode frames
- [ ] Limit FPS
- [ ] Display connection state
- [ ] Display camera permission state
- [ ] Display reconnect state
- [ ] Add Stop Camera
- [ ] Test production URL

---

# 32. 24-HOUR DEPLOYMENT TIMELINE

## H0–H6

Build core MVP.

## H6–H9

Add browser camera + WebSocket.

## H9–H12

Local end-to-end test using browser camera.

## H12

Scope freeze.

## H12–H15

Dockerize.

## H15–H16

First Render deployment.

## H16–H18

Fix production bugs.

## H18–H19

Fresh-browser tests.

## H19–H20

Second-laptop tests.

## H20–H21

Prepare final demo.

## H21–H22

Prepare screenshots + URL + README.

## H22–H23

Final production smoke test.

## H23–H24

Freeze deployment.

---

# 33. FINAL PRODUCTION SMOKE TEST

Run this exact sequence:

```text
OPEN PUBLIC URL
       ↓
HTTPS LOADS
       ↓
CLICK START
       ↓
ALLOW CAMERA
       ↓
CAMERA PREVIEW
       ↓
WEBSOCKET CONNECTED
       ↓
FACE DETECTED
       ↓
S1/S2/S4 ACTIVE
       ↓
TRUST SCORE UPDATES
       ↓
TRIGGER SUSPICIOUS SCENARIO
       ↓
TRUST DROPS
       ↓
ALERT
       ↓
CHALLENGE
       ↓
VERIFICATION
       ↓
RECOVERY / ESCALATION
       ↓
STOP CAMERA
```

If every step works, the deployment is submission-ready.

---

# 34. SUBMISSION PACKAGE

Submit/provide:

```text
1. GitHub repository
2. Public HTTPS URL
3. README
4. Architecture diagram
5. Technical stack
6. Demo instructions
7. Evaluation results
8. Limitations
9. Privacy statement
10. Demo video/backup recording
```

README should put the public URL near the top:

```text
## Live Demo

https://<your-render-domain>
```

---

# 35. JUDGE INSTRUCTIONS

Keep the instructions under 30 seconds.

```text
1. Open the live URL.
2. Click Start Verification.
3. Allow camera access.
4. Keep your face visible.
5. Observe the trust score.
6. Trigger the provided test scenario.
7. Observe the alert.
8. Complete the challenge.
```

Do not ask judges to install Python, Node, Docker, or dependencies.

---

# 36. FINAL DEPLOYMENT ACCEPTANCE CRITERIA

The deployment is DONE only when:

- [ ] Public HTTPS URL exists
- [ ] URL loads in a fresh browser
- [ ] Camera permission works
- [ ] Browser camera stream works
- [ ] WebSocket works over WSS
- [ ] Backend receives frames
- [ ] Face detection works
- [ ] S1 works
- [ ] S2 works
- [ ] S4 works
- [ ] Fusion works
- [ ] Trust score updates
- [ ] Alert works
- [ ] Challenge works
- [ ] Recovery/escalation works
- [ ] Stop camera works
- [ ] No raw video is persisted
- [ ] Health endpoint works
- [ ] README contains URL
- [ ] Backup demo exists

---

# 37. MOST IMPORTANT DEPLOYMENT RULE

Do NOT wait until H20 to deploy.

The first public deployment must happen around:

```text
H15–H16
```

Then spend the remaining hours fixing real deployment problems.

A system that works perfectly on localhost but fails through HTTPS/WebSocket/browser permissions is NOT submission-ready.

---

# 38. FINAL ARCHITECTURE

```text
                     JUDGE
                       │
                       ▼
              ┌─────────────────┐
              │ React Dashboard │
              │ Vite + TS       │
              └────────┬────────┘
                       │
                 getUserMedia()
                       │
                       ▼
                Browser Camera
                       │
                 JPEG Frames
                       │
                       ▼
                    WSS /ws
                       │
                       ▼
              ┌─────────────────┐
              │    FastAPI      │
              │    Backend      │
              └────────┬────────┘
                       │
                       ▼
                OpenCV Decode
                       │
                       ▼
               MediaPipe Face
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
            S1        S2        S4
             └─────────┼─────────┘
                       ▼
                  EWMA Fusion
                       │
                       ▼
                  Trust Score
                       │
                       ▼
                  Risk State
                       │
              ┌────────┴────────┐
              ▼                 ▼
            Alert            Normal
              │
              ▼
          Challenge
              │
              ▼
      Verify / Recover
              │
              ▼
          Escalate

          ALL INSIDE
       ONE DOCKER SERVICE
          ON RENDER
```

---

# 39. DEPLOYMENT PHILOSOPHY

The submission architecture should optimize for:

```text
ONE URL
ONE CONTAINER
ONE REPOSITORY
ONE DEPLOYMENT
ONE WEBSOCKET
NO DATABASE
NO CLOUD ML API
NO RAW VIDEO STORAGE
NO COMPLEX INFRASTRUCTURE
```

This is the safest deployment scope for a 24-hour hackathon MVP.
