from __future__ import annotations

import asyncio
import json
import os
import time
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, List, Optional

import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER", "test.mosquitto.org")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "raven_levitt/rooms")

rooms_state: Dict[str, dict] = {}
events_log: deque = deque(maxlen=50)
ws_clients: List[WebSocket] = []
mqtt_client: Optional[mqtt.Client] = None


def init_room(room_id: str) -> dict:
    if room_id not in rooms_state:
        rooms_state[room_id] = {
            "room_id": room_id,
            "temp_f": None,
            "humidity_pct": None,
            "person_detected": False,
            "confidence": 0.0,
            "current_uid": None,
            "last_checkin_time": None,
        }
    return rooms_state[room_id]


def build_event(topic_type: str, room_id: str, payload: dict) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": topic_type,
        "room": room_id,
        "data": payload,
    }


async def broadcast(message: dict):
    dead = []
    data = json.dumps(message)
    for ws in ws_clients:
        try:
            await ws.send_text(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_clients.remove(ws)


loop: Optional[asyncio.AbstractEventLoop] = None


def on_connect(client, userdata, flags, rc, properties=None):
    topic = f"{MQTT_TOPIC_PREFIX}/+/+"
    client.subscribe(topic)
    print(f"MQTT connected (rc={rc}), subscribed to {topic}")


def on_message(client, userdata, msg):
    try:
        parts = msg.topic.split("/")
        room_id = parts[-2]
        topic_type = parts[-1]
        payload = json.loads(msg.payload.decode())
    except (IndexError, json.JSONDecodeError) as e:
        print(f"Bad MQTT message on {msg.topic}: {e}")
        return

    room = init_room(room_id)

    if topic_type == "environment":
        room["temp_f"] = payload.get("temp_f")
        room["humidity_pct"] = payload.get("humidity_pct")

    elif topic_type == "occupancy":
        prev = room["person_detected"]
        room["person_detected"] = payload.get("person_detected", False)
        room["confidence"] = payload.get("confidence", 0.0)
        if prev != room["person_detected"]:
            event = build_event("occupancy_change", room_id, payload)
            events_log.appendleft(event)

    elif topic_type == "checkin":
        room["current_uid"] = payload.get("uid")
        room["last_checkin_time"] = datetime.now(timezone.utc).isoformat()
        event = build_event("checkin", room_id, payload)
        events_log.appendleft(event)

    elif topic_type == "checkout":
        if room["current_uid"] == payload.get("uid"):
            room["current_uid"] = None
        event = build_event("checkout", room_id, payload)
        events_log.appendleft(event)

    update = {
        "type": "update",
        "topic_type": topic_type,
        "room_id": room_id,
        "room": dict(room),
        "payload": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if loop and loop.is_running():
        asyncio.run_coroutine_threadsafe(broadcast(update), loop)


def start_mqtt():
    global mqtt_client
    mqtt_client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"meridian-dashboard-{int(time.time())}",
    )
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    mqtt_client.loop_start()
    print(f"MQTT client connecting to {MQTT_BROKER}:{MQTT_PORT}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global loop
    loop = asyncio.get_running_loop()
    start_mqtt()
    yield
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()


app = FastAPI(title="Meridian Rooms API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/rooms")
def get_rooms():
    return list(rooms_state.values())


@app.get("/api/events")
def get_events():
    return list(events_log)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_clients.append(ws)
    try:
        snapshot = {
            "type": "snapshot",
            "rooms": list(rooms_state.values()),
            "events": list(events_log)[:10],
        }
        await ws.send_text(json.dumps(snapshot))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in ws_clients:
            ws_clients.remove(ws)
