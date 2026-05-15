"""
Download esapzoi/litter-detection-yolov8 from HuggingFace and export to TFLite.

Run from /ml (after setting up the venv per export_pothole.py):
    source .venv/bin/activate
    python export_garbage.py
"""
from pathlib import Path
from huggingface_hub import hf_hub_download
from ultralytics import YOLO

REPO_ID = "esapzoi/litter-detection-yolov8"
WEIGHT_FILE = "best.pt"
OUT_PATH = Path(__file__).resolve().parents[1] / "frontend" / "assets" / "models" / "garbage.tflite"


def main() -> None:
    print(f"Downloading {WEIGHT_FILE} from {REPO_ID}...")
    pt_path = hf_hub_download(repo_id=REPO_ID, filename=WEIGHT_FILE)
    print(f"Got: {pt_path}")

    print("Loading model and exporting to TFLite (float16, imgsz=416)...")
    model = YOLO(pt_path)
    exported = model.export(format="tflite", half=True, imgsz=416)
    exported_path = Path(exported)
    print(f"Exported: {exported_path}")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(exported_path.read_bytes())
    print(f"Copied to: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
