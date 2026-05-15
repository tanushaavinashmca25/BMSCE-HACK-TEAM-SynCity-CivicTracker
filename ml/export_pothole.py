"""
Download mostsayed93's public Pothole YOLOv8 weights and export to TFLite
for use with react-native-fast-tflite.

Run from /ml:
    source .venv/bin/activate
    python export_pothole.py
"""
from pathlib import Path
import urllib.request
from ultralytics import YOLO

WEIGHT_URL = "https://raw.githubusercontent.com/mostsayed93/Pothole_Detection_Trained_model/main/weights/best.pt"
ML_DIR = Path(__file__).resolve().parent
PT_PATH = ML_DIR / "pothole_best.pt"
OUT_PATH = ML_DIR.parent / "frontend" / "assets" / "models" / "yolov8n.tflite"


def main() -> None:
    if not PT_PATH.exists():
        print(f"Downloading weights from {WEIGHT_URL}...")
        urllib.request.urlretrieve(WEIGHT_URL, PT_PATH)
    print(f"Weights: {PT_PATH} ({PT_PATH.stat().st_size / 1024 / 1024:.1f} MB)")

    print("Loading model and exporting to TFLite (float16, imgsz=416)...")
    model = YOLO(str(PT_PATH))
    exported = model.export(format="tflite", half=True, imgsz=416)
    exported_path = Path(exported)
    print(f"Exported: {exported_path}")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(exported_path.read_bytes())
    print(f"Copied to: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
