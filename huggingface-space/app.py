"""
Civic YOLO inference service for HuggingFace Spaces.

Loads two YOLOv8 models (pothole + garbage), exposes a single /detect endpoint
that takes an image URL and returns per-class confidence and bounding boxes.
"""
from __future__ import annotations

import io
import logging
import os
import urllib.request
from pathlib import Path
from typing import Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from huggingface_hub import hf_hub_download
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s :: %(message)s")
logger = logging.getLogger("civic-yolo")

API_TOKEN = os.environ.get("API_TOKEN")

# Local weights checked into the Space repo (preferred). If absent, fall back
# to the original public sources used during bootstrap.
SPACE_ROOT = Path(__file__).resolve().parent
LOCAL_POTHOLE = SPACE_ROOT / "weights" / "pothole_v2.pt"
LOCAL_GARBAGE = SPACE_ROOT / "weights" / "garbage_v2.pt"
POTHOLE_URL = "https://raw.githubusercontent.com/mostsayed93/Pothole_Detection_Trained_model/main/weights/best.pt"
GARBAGE_REPO = "esapzoi/litter-detection-yolov8"
GARBAGE_FILE = "best.pt"
WEIGHTS_DIR = Path(os.environ.get("HOME", "/home/user")) / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

POTHOLE_THRESHOLD = float(os.environ.get("POTHOLE_THRESHOLD", "0.50"))
GARBAGE_THRESHOLD = float(os.environ.get("GARBAGE_THRESHOLD", "0.50"))

# Lazy globals — loaded on first request to keep cold-start log clean.
_pothole_model = None
_garbage_model = None


def _load_pothole():
    """Prefer locally-checked-in weights/pothole_v2.pt, else download bootstrap copy."""
    from ultralytics import YOLO

    if LOCAL_POTHOLE.exists():
        logger.info("loading pothole from local %s", LOCAL_POTHOLE)
        return YOLO(str(LOCAL_POTHOLE))

    pt_path = WEIGHTS_DIR / "pothole.pt"
    if not pt_path.exists():
        logger.info("downloading pothole weights from %s", POTHOLE_URL)
        urllib.request.urlretrieve(POTHOLE_URL, pt_path)
    logger.info("loading pothole from %s", pt_path)
    return YOLO(str(pt_path))


def _load_garbage():
    from ultralytics import YOLO

    if LOCAL_GARBAGE.exists():
        logger.info("loading garbage from local %s", LOCAL_GARBAGE)
        return YOLO(str(LOCAL_GARBAGE))

    logger.info("downloading garbage weights from HF: %s/%s", GARBAGE_REPO, GARBAGE_FILE)
    pt_path = hf_hub_download(repo_id=GARBAGE_REPO, filename=GARBAGE_FILE)
    logger.info("loading garbage from %s", pt_path)
    return YOLO(pt_path)


def get_models():
    global _pothole_model, _garbage_model
    if _pothole_model is None:
        _pothole_model = _load_pothole()
    if _garbage_model is None:
        _garbage_model = _load_garbage()
    return _pothole_model, _garbage_model


app = FastAPI(title="Civic YOLO")
auth = HTTPBearer(auto_error=False)


def require_token(creds: Optional[HTTPAuthorizationCredentials] = Depends(auth)):
    if API_TOKEN is None:
        # No token configured = open mode (local dev only — set API_TOKEN in prod).
        return
    if creds is None or creds.credentials != API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


class DetectRequest(BaseModel):
    image_url: str = Field(..., description="HTTP(S) URL to a JPEG/PNG image")


class Box(BaseModel):
    cls: str
    confidence: float
    # Normalized 0..1 (xywh, image-relative)
    x: float
    y: float
    w: float
    h: float


class ClassResult(BaseModel):
    detected: bool
    best_confidence: float
    boxes: list[Box]


class DetectResponse(BaseModel):
    pothole: ClassResult
    garbage: ClassResult


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest, _: None = Depends(require_token)):
    logger.info("detect image_url=%s", req.image_url)
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(req.image_url)
        resp.raise_for_status()
        image_bytes = resp.content

    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w_img, h_img = img.size

    pothole, garbage = get_models()

    def run(model, threshold: float, cls_name: str) -> ClassResult:
        preds = model.predict(img, conf=threshold, imgsz=640, verbose=False)
        boxes: list[Box] = []
        best = 0.0
        for p in preds:
            for b in p.boxes:
                conf = float(b.conf[0])
                if conf < threshold:
                    continue
                xyxy = b.xyxy[0].tolist()
                x1, y1, x2, y2 = xyxy
                boxes.append(
                    Box(
                        cls=cls_name,
                        confidence=round(conf, 4),
                        x=round(x1 / w_img, 4),
                        y=round(y1 / h_img, 4),
                        w=round((x2 - x1) / w_img, 4),
                        h=round((y2 - y1) / h_img, 4),
                    )
                )
                if conf > best:
                    best = conf
        return ClassResult(detected=best >= threshold, best_confidence=round(best, 4), boxes=boxes)

    pothole_res = run(pothole, POTHOLE_THRESHOLD, "pothole")
    garbage_res = run(garbage, GARBAGE_THRESHOLD, "garbage")

    logger.info(
        "detect result pothole=%.2f garbage=%.2f",
        pothole_res.best_confidence,
        garbage_res.best_confidence,
    )
    return DetectResponse(pothole=pothole_res, garbage=garbage_res)
