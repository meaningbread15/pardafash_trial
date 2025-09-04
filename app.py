import os
import subprocess
import tempfile

import torch
import torchvision.transforms as transforms
from flask import Flask, jsonify, request
from transformers import AutoImageProcessor, AutoModelForImageClassification

app = Flask(__name__)

# Load model once at startup
MODEL_NAME = "wanghaofan/deepfake-detection"
processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
model.eval()

transform = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor()])


def download_and_extract_frames(video_url, out_dir, frame_rate=1):
    """Download video and extract 1 frame per second with ffmpeg."""
    video_path = os.path.join(out_dir, "video.mp4")
    subprocess.run(["yt-dlp", "-f", "mp4", "-o", video_path, video_url], check=True)
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-i",
            video_path,
            "-vf",
            f"fps={frame_rate}",
            os.path.join(frames_dir, "frame_%04d.jpg"),
        ],
        check=True,
    )
    return frames_dir


def analyze_video(video_url):
    with tempfile.TemporaryDirectory() as tmpdir:
        frames_dir = download_and_extract_frames(video_url, tmpdir)
        results = []

        for fname in os.listdir(frames_dir):
            path = os.path.join(frames_dir, fname)
            inputs = processor(images=path, return_tensors="pt")
            with torch.no_grad():
                outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            pred = probs[0].tolist()
            label = model.config.id2label[int(torch.argmax(probs))]
            results.append((label, max(pred)))

        # Majority vote across frames
        if not results:
            return {"status": "error", "message": "No frames extracted"}

        labels = [r[0] for r in results]
        fakes = labels.count("fake")
        reals = labels.count("real")
        status = "fake" if fakes >= reals else "real"

        avg_confidence = sum(r[1] for r in results) / len(results)
        return {"status": status, "confidence": round(avg_confidence, 3)}


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    video_url = data.get("url", "")
    try:
        result = analyze_video(video_url)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
