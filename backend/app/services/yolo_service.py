"""
Calls the Civic YOLO HuggingFace Space to verify a report's category.

The HF Space exposes:
    POST {YOLO_SERVICE_URL}/detect  body={"image_url": "..."}
    headers={"Authorization": "Bearer {YOLO_SERVICE_TOKEN}"}

Response:
    {
      "pothole": {"detected": bool, "best_confidence": float, "boxes": [...]},
      "garbage": {"detected": bool, "best_confidence": float, "boxes": [...]}
    }
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from ..config import settings

logger = logging.getLogger("civic.yolo")

# Map our report categories to YOLO class keys the Space returns.
CATEGORY_TO_YOLO: dict[str, str] = {
    "Pothole": "pothole",
    "Garbage": "garbage",
}


class YoloResult:
    def __init__(
        self,
        ok: bool,
        category_detected: bool,
        category_confidence: float,
        other_detections: dict,
        raw: Optional[dict] = None,
        error: Optional[str] = None,
    ):
        self.ok = ok
        self.category_detected = category_detected
        self.category_confidence = category_confidence
        self.other_detections = other_detections
        self.raw = raw
        self.error = error

    def as_dict(self) -> dict:
        return {
            "ok": self.ok,
            "category_detected": self.category_detected,
            "category_confidence": self.category_confidence,
            "other_detections": self.other_detections,
            "error": self.error,
        }


async def verify(image_url: str, category: str) -> YoloResult:
    if not settings.YOLO_SERVICE_URL:
        logger.warning("YOLO_SERVICE_URL not configured; skipping verification")
        return YoloResult(
            ok=False,
            category_detected=False,
            category_confidence=0.0,
            other_detections={},
            error="yolo_service_not_configured",
        )

    yolo_key = CATEGORY_TO_YOLO.get(category)
    if yolo_key is None:
        # No YOLO model for this category (e.g. Utility Fault) — skip but report OK.
        return YoloResult(
            ok=True,
            category_detected=False,
            category_confidence=0.0,
            other_detections={},
            error="no_model_for_category",
        )

    headers = {}
    if settings.YOLO_SERVICE_TOKEN:
        headers["Authorization"] = f"Bearer {settings.YOLO_SERVICE_TOKEN}"

    url = settings.YOLO_SERVICE_URL.rstrip("/") + "/detect"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"image_url": image_url}, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        logger.exception("yolo call failed: %s", e)
        return YoloResult(
            ok=False,
            category_detected=False,
            category_confidence=0.0,
            other_detections={},
            error=str(e),
        )

    target = data.get(yolo_key) or {}
    others = {k: v for k, v in data.items() if k != yolo_key}
    return YoloResult(
        ok=True,
        category_detected=bool(target.get("detected")),
        category_confidence=float(target.get("best_confidence") or 0.0),
        other_detections=others,
        raw=data,
    )
