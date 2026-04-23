#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down…"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# Copy .env if missing
if [ ! -f "$DIR/backend/.env" ]; then
  cp "$DIR/backend/.env.example" "$DIR/backend/.env"
  echo "Created backend/.env from .env.example"
fi

echo "Starting FastAPI backend on :8000…"
cd "$DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting Vite dev server on :5173…"
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════"
echo "  Meridian Rooms is running"
echo "  Dashboard:  http://localhost:5173"
echo "  API:        http://localhost:8000/api/rooms"
echo "═══════════════════════════════════════════"
echo ""

wait
