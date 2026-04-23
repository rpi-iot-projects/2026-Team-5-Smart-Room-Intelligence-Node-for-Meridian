# Meridian Rooms

A local web dashboard that visualizes live sensor data from a Raspberry Pi over MQTT. The Pi publishes environment, occupancy, and check-in/check-out events to a public MQTT broker, and this dashboard subscribes and displays everything in real time.

## Architecture

- **Backend** — Python (FastAPI) subscribes to MQTT via `paho-mqtt`, maintains in-memory state, and pushes updates to the frontend over a WebSocket.
- **Frontend** — React (Vite) single-page app with Tailwind CSS. Connects to the backend WebSocket on load for real-time updates.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Quick Start

```bash
# 1. Install Python dependencies
cd backend
pip install -r requirements.txt

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Run everything
cd ..
./run.sh
```

The dashboard will be available at **http://localhost:5173**.

## Configuration

Copy `backend/.env.example` to `backend/.env` (done automatically by `run.sh` if missing):

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `test.mosquitto.org` | MQTT broker hostname |
| `MQTT_PORT` | `1883` | MQTT broker port |
| `MQTT_TOPIC_PREFIX` | `raven_levitt/rooms` | Topic prefix to subscribe to |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/rooms` | Current state of all rooms |
| `GET` | `/api/events` | Last 50 events (check-ins, check-outs, occupancy changes) |
| `WS` | `/ws` | Real-time updates pushed to connected clients |

## MQTT Topics

The Pi publishes to these topics under the configured prefix:

- `{prefix}/{room_id}/environment` — `{"temp_f": 72.5, "humidity_pct": 45}`
- `{prefix}/{room_id}/occupancy` — `{"person_detected": true, "confidence": 0.87}`
- `{prefix}/{room_id}/checkin` — `{"uid": "0xABC123", "event": "checkin", "room": "study_room_1"}`
- `{prefix}/{room_id}/checkout` — `{"uid": "0xABC123", "event": "auto_checkout", "room": "study_room_1"}`
