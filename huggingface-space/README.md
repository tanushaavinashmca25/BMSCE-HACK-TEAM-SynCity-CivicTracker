---
title: Civic YOLO
emoji: 🛣️
colorFrom: blue
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

# Civic YOLO inference service

FastAPI service that runs two YOLOv8 models on uploaded civic-issue photos and
returns per-class confidence + bounding boxes.

- `POST /detect` — JSON `{ "image_url": "https://..." }` → JSON `{ pothole, garbage }`
- `GET /health` — liveness probe

Loaded models (downloaded on first boot):

- pothole: `mostsayed93/Pothole_Detection_Trained_model` (GitHub, public)
- garbage: `esapzoi/litter-detection-yolov8` (HF, public)

## Auth

Set a secret `API_TOKEN` in the Space settings. Callers must send
`Authorization: Bearer <API_TOKEN>`.

## Local dev

```bash
docker build -t civic-yolo .
docker run -p 7860:7860 -e API_TOKEN=dev civic-yolo
curl -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://...jpg"}' \
  http://localhost:7860/detect
```
