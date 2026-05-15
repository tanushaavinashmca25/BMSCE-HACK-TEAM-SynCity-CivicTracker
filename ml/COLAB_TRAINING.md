# Train YOLOv8m on Roboflow Universe — Colab T4 (~30-60 min)

Open https://colab.research.google.com → New notebook → Runtime → Change runtime type → T4 GPU.

### Cell 1 — install deps

```python
!pip -q install ultralytics roboflow python-dotenv huggingface_hub
```

### Cell 2 — auth

```python
import os, getpass
os.environ["ROBOFLOW_API_KEY"] = getpass.getpass("Roboflow API key: ")
# Only needed if you want to upload trained weights back to the HF Space:
os.environ["HF_TOKEN"] = getpass.getpass("HF write token (optional): ")
```

### Cell 3 — drop in the training script

```python
!wget -q https://raw.githubusercontent.com/<your-gh-user>/<your-repo>/main/ml/train.py
# OR paste the contents directly.
```

### Cell 4 — run it

```python
!python train.py --epochs 150 --model-size m --upload-hf civic-yolo
```

When the run finishes:
- `runs/detect/pothole_v2/weights/best.pt`
- `runs/detect/garbage_v2/weights/best.pt`
- both auto-uploaded to `huggingface.co/spaces/civic-yolo/weights/`

### Cell 5 — restart the Space so it picks up the new weights

```python
from huggingface_hub import HfApi
HfApi().restart_space(repo_id="civic-yolo")
```

That's it. The Space's `app.py` already prefers `weights/*_v2.pt` if present, so no app code change.

### Sanity-check post-deploy

```bash
curl -X POST https://civic-yolo.hf.space/detect \
  -H "Authorization: Bearer $YOLO_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg"}'
```

Pothole confidence should jump from ~0.53 (current bootstrap weights) to 0.80+.
