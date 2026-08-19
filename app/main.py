from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from app.checker import check_target

BASE_DIR = Path(__file__).resolve().parent.parent

application = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)
application.config["JSON_SORT_KEYS"] = False


@application.get("/")
def index():
    return render_template("index.html", site_name=os.getenv("SITE_NAME", "rf-probe"))


@application.get("/health")
def health():
    return jsonify({"status": "ok"})


@application.post("/api/check")
def api_check():
    payload = request.get_json(silent=True) or {}
    target = (payload.get("target") or request.form.get("target") or "").strip()
    if not target:
        return jsonify({"error": "target is required"}), 400

    try:
        result = check_target(target, probe_from=os.getenv("SITE_NAME", "rf-probe"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result.to_dict())


@application.get("/api/check")
def api_check_get():
    target = (request.args.get("target") or "").strip()
    if not target:
        return jsonify({"error": "target query param is required"}), 400

    try:
        result = check_target(target, probe_from=os.getenv("SITE_NAME", "rf-probe"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result.to_dict())
