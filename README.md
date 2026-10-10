# VeyLance — Real-Time Video Integrity & Identity Assurance

> AI-powered continuous identity verification for remote video interviews.
> Detects deepfakes, face swaps, and synthetic manipulation in real-time.

## 🎯 What It Does

VeyLance monitors live video feeds during remote interviews and provides:
- **S1 (Boundary Detection):** Detects face-background edge inconsistencies from compositing/face-swapping
- **S2 (Occlusion Analysis):** Detects landmark instability when face is partially occluded (deepfakes glitch)
- **S4 (Blink Physiology):** Monitors natural blink patterns (frequency, duration) — synthetic faces blink unnaturally
- **EWMA Fusion:** Combines signals into a smooth 0–100 Trust Score with explainable risk levels
- **Progressive Challenges:** Active liveness verification ("blink now", "turn your head") when trust drops

## 🚀 Quick Start

```bash
git clone https://github.com/lekhrazz19/HACKBIOS2K26-VEYLANCE.git
cd HACKBIOS2K26-VEYLANCE
chmod +x start.sh
./start.sh
```

Open [http://localhost:8000](http://localhost:8000) → Click **Start Monitoring** → Grant camera access.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, Uvicorn |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Computer Vision | OpenCV, MediaPipe Face Mesh (468 landmarks) |
| Real-time | WebSocket (binary JPEG frames) |
| Deployment | Docker, Render |

## 📊 Architecture

```
Browser Webcam → getUserMedia → Canvas JPEG → Binary WebSocket
    ↓
FastAPI Backend → cv2.imdecode → MediaPipe Face Mesh
    ↓
S1 Boundary + S2 Occlusion + S4 Blink → EWMA Fusion
    ↓
Trust Score (0-100) + Risk Level → JSON WebSocket → React Dashboard
```

## 🔒 Privacy

- All processing happens in RAM — **no frames are ever written to disk**
- No external AI API calls during analysis
- Camera released immediately on stop via `MediaStreamTrack.stop()`
- No database, no persistence, fully ephemeral

## 📄 License

MIT
