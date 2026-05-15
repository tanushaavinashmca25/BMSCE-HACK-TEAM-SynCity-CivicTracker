# Civic — ML training

Trains the two YOLOv8 detectors (pothole + garbage) that the HuggingFace Space serves. Inference doesn't run here — only training and export.

The training script reads `ROBOFLOW_API_KEY` and `HF_TOKEN` from `../backend/.env` (one env file, one source of truth).

## Where training runs

| Where | When |
|---|---|
| **Colab T4** (free) | 90% of the time. ~30-60 min per model. Use the notebooks below. |
| **Kaggle T4/P100** (free) | Longer sessions if you want to iterate. Same notebooks work — just adjust mount paths. |
| **Local Apple Silicon** | Only for small smoke tests. Full 150-epoch run takes 12+ hours on CPU. |

## Files

| File | Purpose |
|---|---|
| `train.py` | CLI training script. Loads datasets, trains, optionally uploads to HF Space. |
| `train_colab.ipynb` | One-notebook flow — both models in sequence on a single Colab session. |
| `train_pothole_colab.ipynb` | Pothole-only notebook (run in parallel with garbage). |
| `train_garbage_colab.ipynb` | Garbage-only notebook (run in parallel with pothole, on a second Google account). |
| `COLAB_TRAINING.md` | Step-by-step Colab walkthrough. |
| `requirements.txt` | Local-run deps (also installed inside Colab on first cell). |
| `export_pothole.py` / `export_garbage.py` | Legacy — exports `.pt` → `.tflite` for the (now removed) on-device path. Kept in case we revisit. |

## Datasets

| Class | Source | Workspace / project | Version | Images |
|---|---|---|---|---|
| pothole | Roboflow Universe | `gerapothole/pothole-detection-yolov8` | 1 | 608 |
| garbage | Roboflow Universe | `fyp-bfx3h/yolov8-trash-detections` | 4 | 2 176 |

The garbage dataset has multiple sub-classes (bottle / can / etc.). The HF Space's inference code collapses all detected boxes into a single "garbage" class, so multi-class output works without code changes.

## Quick start — Colab

1. Upload `train_colab.ipynb` (or the two parallel notebooks) to Colab.
2. Runtime → Change runtime type → **T4 GPU**.
3. Run all. Paste your Roboflow key + HF write token when prompted.
4. The final cell uploads `pothole_v2.pt` / `garbage_v2.pt` to `civic-yolo` and restarts the Space.

## Quick start — local (small smoke test only)

```bash
cd ml
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python train.py --epochs 10 --model-size n
```

## After training

The Space's `app.py` prefers `weights/pothole_v2.pt` and `weights/garbage_v2.pt` when present, falling back to the bootstrap public sources otherwise. So uploading the new files + restarting the Space is the full deploy.

Sanity check with curl after the Space comes back up:

```bash
curl -X POST $YOLO_SERVICE_URL/detect \
  -H "Authorization: Bearer $YOLO_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg"}'
```

Pothole confidence on this image should jump from 0.53 (bootstrap weights) to 0.85+.
