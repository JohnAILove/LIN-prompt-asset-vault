from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

from flask import Flask, jsonify, make_response, request
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


ROOT_DIR = Path(__file__).resolve().parents[1]
TOKEN_PATH = ROOT_DIR / ".youtube-token.json"
CLIENT_SECRET_GLOB = "client_secret_*.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
APP_HOST = "127.0.0.1"
APP_PORT = 8765

app = Flask(__name__)


def json_response(payload: dict, status: int = 200):
    response = make_response(jsonify(payload), status)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def find_client_secret_file() -> Path:
    matches = sorted(ROOT_DIR.glob(CLIENT_SECRET_GLOB))
    if not matches:
      raise FileNotFoundError("Missing OAuth client file. Put client_secret_*.json in the project root.")
    return matches[0]


def save_credentials(credentials: Credentials) -> None:
    TOKEN_PATH.write_text(credentials.to_json(), encoding="utf-8")


def load_credentials() -> Credentials | None:
    if not TOKEN_PATH.exists():
        return None

    credentials = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if credentials.valid:
        return credentials

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        save_credentials(credentials)
        return credentials

    return None


def ensure_credentials(force_authorize: bool = False) -> Credentials:
    if not force_authorize:
        credentials = load_credentials()
        if credentials:
            return credentials

    client_secret_file = find_client_secret_file()
    flow = InstalledAppFlow.from_client_secrets_file(str(client_secret_file), SCOPES)
    credentials = flow.run_local_server(
        host="localhost",
        port=0,
        open_browser=True,
        authorization_prompt_message="Please complete YouTube authorization in your browser: {url}",
        success_message="YouTube authorization completed. You can return to LPAV now."
    )
    save_credentials(credentials)
    return credentials


def build_youtube_service(credentials: Credentials):
    return build("youtube", "v3", credentials=credentials)


def get_authorized_status() -> dict:
    credentials = load_credentials()
    return {
        "authorized": bool(credentials),
        "tokenPath": str(TOKEN_PATH)
    }


def upload_video(file_storage, title: str, description: str, privacy_status: str, tags: list[str]):
    credentials = ensure_credentials(force_authorize=False)
    youtube = build_youtube_service(credentials)

    suffix = Path(file_storage.filename or "upload.mp4").suffix or ".mp4"
    temp_handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = Path(temp_handle.name)
    temp_handle.close()

    try:
        file_storage.save(temp_path)

        request_body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags
            },
            "status": {
                "privacyStatus": privacy_status
            }
        }

        media = MediaFileUpload(str(temp_path), mimetype=file_storage.mimetype or "video/mp4", resumable=True)
        response = (
            youtube.videos()
            .insert(part="snippet,status", body=request_body, media_body=media)
            .execute()
        )

        video_id = response["id"]
        return {
            "videoId": video_id,
            "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
            "privacyStatus": response.get("status", {}).get("privacyStatus", privacy_status),
            "title": response.get("snippet", {}).get("title", title)
        }
    finally:
        try:
            temp_path.unlink(missing_ok=True)
        except OSError:
            pass


@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return json_response({"ok": True})
    return json_response({"ok": True, "service": "youtube-helper"})


@app.route("/auth/status", methods=["GET", "OPTIONS"])
def auth_status():
    if request.method == "OPTIONS":
        return json_response({"ok": True})
    return json_response({"ok": True, **get_authorized_status()})


@app.route("/auth/start", methods=["POST", "OPTIONS"])
def auth_start():
    if request.method == "OPTIONS":
        return json_response({"ok": True})

    try:
        ensure_credentials(force_authorize=True)
        return json_response({"ok": True, **get_authorized_status()})
    except Exception as error:  # noqa: BLE001
        return json_response({"ok": False, "error": str(error)}, status=500)


@app.route("/upload", methods=["POST", "OPTIONS"])
def upload():
    if request.method == "OPTIONS":
        return json_response({"ok": True})

    try:
        upload_file = request.files.get("video")
        if not upload_file:
            return json_response({"ok": False, "error": "Missing video file."}, status=400)

        title = (request.form.get("title") or "").strip() or "LPAV Upload"
        description = (request.form.get("description") or "").strip()
        privacy_status = (request.form.get("privacyStatus") or "private").strip().lower()
        if privacy_status not in {"public", "private", "unlisted"}:
            privacy_status = "private"

        tags_raw = request.form.get("tagsJson") or "[]"
        try:
            tags = [str(tag).strip() for tag in json.loads(tags_raw) if str(tag).strip()]
        except json.JSONDecodeError:
            tags = []

        result = upload_video(upload_file, title, description, privacy_status, tags)
        return json_response({"ok": True, **result})
    except Exception as error:  # noqa: BLE001
        return json_response({"ok": False, "error": str(error)}, status=500)


if __name__ == "__main__":
    app.run(host=APP_HOST, port=APP_PORT, debug=False)
