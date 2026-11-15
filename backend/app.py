"""
Facial Biometric Assessment Guide
Backend: serves the frontend and a small API for saving assessment records.

Author: Dee Williamson
November 2026

Run with:  python app.py
Then open: http://127.0.0.1:5000
"""

import os
import time
from pathlib import Path

from flask import Flask, Response, abort, jsonify, request, send_from_directory

from storage import create_store, is_valid_id

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# The top-level sections every assessment record has.
RECORD_SECTIONS = ("meta", "screen", "crit", "decide", "impl", "monitor", "reassess")

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 MB per request
store = create_store()


def is_assessment_record(record) -> bool:
    return isinstance(record, dict) and all(
        isinstance(record.get(section), dict) for section in RECORD_SECTIONS
    )


# ---------- API ----------


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/assessments")
def list_assessments():
    return jsonify(store.list())


@app.get("/api/assessments/<record_id>")
def get_assessment(record_id):
    if not is_valid_id(record_id):
        abort(400, description="Invalid assessment id.")
    stored = store.get(record_id)
    if stored is None:
        abort(404, description="Assessment not found.")
    return jsonify(stored)


@app.put("/api/assessments/<record_id>")
def save_assessment(record_id):
    if not is_valid_id(record_id):
        abort(400, description="Invalid assessment id.")
    body = request.get_json(silent=True) or {}
    record = body.get("record")
    if not is_assessment_record(record):
        abort(400, description="The request does not contain an assessment record.")
    updated_at = body.get("updatedAt")
    if not isinstance(updated_at, int) or isinstance(updated_at, bool):
        updated_at = int(time.time() * 1000)
    stored = store.save(record_id, record, updated_at)
    return jsonify({"id": stored["id"], "updatedAt": stored["updatedAt"]})


@app.delete("/api/assessments/<record_id>")
def delete_assessment(record_id):
    if not is_valid_id(record_id):
        abort(400, description="Invalid assessment id.")
    if not store.delete(record_id):
        abort(404, description="Assessment not found.")
    return "", 204


@app.errorhandler(400)
@app.errorhandler(404)
@app.errorhandler(413)
def api_error(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": error.description}), error.code
    return error


# ---------- Frontend ----------


@app.get("/js/config.js")
def frontend_config():
    """Tell the frontend that a backend is available."""
    script = 'window.FBAG_CONFIG = { apiBase: "/api" };\n'
    return Response(script, mimetype="application/javascript")


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:filename>")
def frontend_file(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == "__main__":
    # Listens on this computer only. Add sign-in and HTTPS before sharing it.
    app.run(
        host=os.environ.get("FBAG_HOST", "127.0.0.1"),
        port=int(os.environ.get("FBAG_PORT", "5000")),
        debug=os.environ.get("FBAG_DEBUG") == "1",
    )
