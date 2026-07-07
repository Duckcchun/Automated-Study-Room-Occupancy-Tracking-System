"""Phase 1: Edge device people counter.

Install:
  python -m pip install opencv-python ultralytics requests

Run:
  python phase1_edge_counter.py

Windows setup:
    py -3.10 -m venv .venv
    .\.venv\Scripts\Activate.ps1
    python -m pip install opencv-python ultralytics requests

Optional environment variables:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone

import cv2
import requests
from ultralytics import YOLO


@dataclass
class Config:
    camera_index: int = 0
    model_path: str = "yolov8n.pt"
    room_name: str = "study_room_1"
    send_interval_seconds: int = 10
    inference_interval_seconds: float = 1.0
    supabase_url: str | None = os.getenv("SUPABASE_URL")
    supabase_service_role_key: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_log_record(room_name: str, head_count: int) -> dict:
    return {
        "room_name": room_name,
        "count": head_count,
    }


def count_people(model: YOLO, frame) -> int:
    results = model.predict(frame, classes=[0], verbose=False)
    if not results:
        return 0

    boxes = results[0].boxes
    return 0 if boxes is None else len(boxes)


def post_to_supabase(config: Config, payload: dict) -> None:
    if not config.supabase_url or not config.supabase_service_role_key:
        print("[MOCK POST] Supabase REST API payload:")
        print(payload)
        return

    endpoint = f"{config.supabase_url.rstrip('/')}/rest/v1/room_logs"
    headers = {
        "apikey": config.supabase_service_role_key,
        "Authorization": f"Bearer {config.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    print(f"[INFO] Supabase insert succeeded: {payload}")


def main() -> None:
    config = Config()
    model = YOLO(config.model_path)

    capture = cv2.VideoCapture(config.camera_index)
    if not capture.isOpened():
        raise RuntimeError(f"Could not open camera index {config.camera_index}")

    last_sent_at = 0.0

    try:
        while True:
            start_time = time.time()
            success, frame = capture.read()
            if not success:
                print("[WARN] Frame capture failed; retrying...")
                time.sleep(1.0)
                continue

            head_count = count_people(model, frame)
            payload = build_log_record(config.room_name, head_count)

            print(f"[INFO] {utc_timestamp()} | room={config.room_name} | head_count={head_count}")

            if time.time() - last_sent_at >= config.send_interval_seconds:
                post_to_supabase(config, payload)
                last_sent_at = time.time()

            del frame

            elapsed = time.time() - start_time
            sleep_for = max(0.0, config.inference_interval_seconds - elapsed)
            time.sleep(sleep_for)
    except KeyboardInterrupt:
        print("[INFO] Stopped by user.")
    finally:
        capture.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()