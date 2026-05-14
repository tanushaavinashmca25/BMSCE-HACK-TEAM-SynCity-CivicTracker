"""
Train YOLOv8m pothole + garbage detectors on Roboflow Universe datasets.

Reads ROBOFLOW_API_KEY from ../backend/.env. Two single-class models so the
HuggingFace Space's existing decode logic keeps working unchanged.

USAGE
-----

Locally (CPU, slow — a full run takes hours on Apple Silicon):

    cd ml && source .venv/bin/activate
    pip install -r requirements.txt
    python train.py --epochs 50

Colab (recommended, T4 GPU, ~30-60 min for 150 epochs each):

    # cell 1: !pip install ultralytics roboflow python-dotenv huggingface_hub
    # cell 2: copy this file's main() body into a cell after setting:
    #   import os; os.environ["ROBOFLOW_API_KEY"] = "<your-key>"

OUTPUTS
-------
runs/detect/pothole_v2/weights/best.pt
runs/detect/garbage_v2/weights/best.pt

Pass --upload-hf to push them to the HF Space repo.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")

API_KEY = os.environ.get("ROBOFLOW_API_KEY")
if not API_KEY:
    raise SystemExit("ROBOFLOW_API_KEY missing (looked in backend/.env)")


def download_dataset(workspace: str, project: str, version: int, fmt: str = "yolov8") -> str:
    """Returns the path to the downloaded dataset's data.yaml."""
    from roboflow import Roboflow

    rf = Roboflow(api_key=API_KEY)
    proj = rf.workspace(workspace).project(project)
    dataset = proj.version(version).download(fmt, location=str(ROOT / "ml" / "datasets" / project))
    return f"{dataset.location}/data.yaml"


def train_one(name: str, data_yaml: str, epochs: int, imgsz: int = 640, model_size: str = "m"):
    from ultralytics import YOLO

    print(f"\n=== training {name} ({epochs} epochs, imgsz={imgsz}, yolov8{model_size}) ===")
    model = YOLO(f"yolov8{model_size}.pt")  # COCO-pretrained backbone
    model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        name=name,
        patience=30,            # early stop if val mAP doesn't improve for 30 epochs
        batch=-1,               # auto batch size
        cache="ram",            # speeds up if dataset fits
        plots=True,
        save=True,
        exist_ok=True,
    )
    best = Path("runs") / "detect" / name / "weights" / "best.pt"
    print(f"  -> {best.resolve()}")
    return best


def upload_to_hf_space(pothole_pt: Path, garbage_pt: Path, repo_id: str):
    """Copies trained weights into the HF Space repo and pushes."""
    from huggingface_hub import HfApi

    api = HfApi()
    for local, name in [(pothole_pt, "pothole_v2.pt"), (garbage_pt, "garbage_v2.pt")]:
        print(f"  uploading {local} -> {repo_id}:{name}")
        api.upload_file(
            path_or_fileobj=str(local),
            path_in_repo=f"weights/{name}",
            repo_id=repo_id,
            repo_type="space",
        )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=150)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--model-size", default="m", choices=["n", "s", "m", "l"])
    ap.add_argument("--skip-pothole", action="store_true")
    ap.add_argument("--skip-garbage", action="store_true")
    ap.add_argument("--upload-hf", help="HF Space repo id, e.g. arjun-vegeta/civic-yolo")
    args = ap.parse_args()

    pothole_pt = None
    garbage_pt = None

    if not args.skip_pothole:
        # GeraPotHole — public, 608 images, pure pothole class
        data_yaml = download_dataset("gerapothole", "pothole-detection-yolov8", version=1)
        pothole_pt = train_one(
            "pothole_v2", data_yaml, args.epochs, args.imgsz, args.model_size
        )

    if not args.skip_garbage:
        # FYP YOLOv8 Trash Detections — 2176 images, multiple trash subclasses we treat as 'garbage'
        data_yaml = download_dataset("fyp-bfx3h", "yolov8-trash-detections", version=4)
        garbage_pt = train_one(
            "garbage_v2", data_yaml, args.epochs, args.imgsz, args.model_size
        )

    if args.upload_hf and pothole_pt and garbage_pt:
        upload_to_hf_space(pothole_pt, garbage_pt, args.upload_hf)
        print("\nDone. Update the Space's app.py to load weights/pothole_v2.pt and weights/garbage_v2.pt.")


if __name__ == "__main__":
    main()
