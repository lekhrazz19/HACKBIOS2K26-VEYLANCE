#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  VeyLance - Interview Sentinel"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required"
    exit 1
fi

# Setup backend venv if needed
if [ ! -d "backend/venv" ]; then
    echo "[1/3] Creating Python virtual environment..."
    python3 -m venv backend/venv
else
    echo "[1/3] Virtual environment exists."
fi

source backend/venv/bin/activate

echo "[2/3] Installing Python dependencies..."
pip install -q -r backend/requirements.txt

# Build frontend if needed
if [ ! -d "frontend/dist" ]; then
    echo "[3/3] Building frontend..."
    cd frontend && npm install && npm run build && cd ..
else
    echo "[3/3] Frontend already built."
fi

echo ""
echo "Starting VeyLance server..."
echo "Open http://localhost:${PORT:-8000} in your browser"
echo ""

cd backend
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --reload
