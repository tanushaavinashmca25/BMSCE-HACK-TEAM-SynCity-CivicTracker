FROM python:3.11-slim

# OpenCV system deps for ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# HF Spaces runs as a non-root user with uid 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Cache dirs writable by uid 1000 (HF Spaces requirement)
ENV XDG_CACHE_HOME=$HOME/.cache \
    HF_HOME=$HOME/.cache/huggingface \
    YOLO_CONFIG_DIR=$HOME/.config/Ultralytics

COPY --chown=user requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user . .

EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
