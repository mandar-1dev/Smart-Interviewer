from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_access_token
import json

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        # Map: user_id -> list of websockets
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active:
            self.active[user_id] = [ws for ws in self.active[user_id] if ws != websocket]

    async def send_to_user(self, user_id: int, data: dict):
        for ws in self.active.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()


@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(
    websocket: WebSocket,
    session_id: int,
    token: str = Query(...),
):
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = int(payload.get("sub", 0))
    await manager.connect(websocket, user_id)

    try:
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "Interview session WebSocket connected",
        })

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            # Echo back progress updates (real updates come from HTTP API)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
