# RF Reachability Checker

Check server reachability **from Russia** — DNS, TCP ports, and HTTP response (status code + plain-text body preview, HTML stripped).

Two deployment modes for shared hosting with Python support:

- **CGI** (`python3 deploy/upload.py --cgi`) — works over FTP only, no WSGI panel setup
- **WSGI/Gunicorn** — Flask app under `~/rf-reachability/` + `~/conf.d/wsgi`

## Quick start (local)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app.main:application
flask run --port 8080
```

Open http://127.0.0.1:8080

## API

```bash
curl -s "http://127.0.0.1:8080/api/check?target=google.com" | jq
curl -s "http://127.0.0.1:8080/api/check?target=https://www.google.com/" | jq
curl -s -X POST http://127.0.0.1:8080/api/check \
  -H 'Content-Type: application/json' \
  -d '{"target":"8.8.8.8"}' | jq
```

HTTP probe returns `response_summary`, e.g. `code 200, response: ...` (HTML tags removed from preview).

## Deploy

1. Copy `deploy/credentials.example.env` → `deploy/credentials.local.env` and fill in your hosting credentials.
2. Upload:

```bash
python3 deploy/upload.py --probe-only   # test FTP/SFTP
python3 deploy/upload.py --cgi          # recommended: Apache CGI in ~/http/
```

3. Optional WSGI path (SSH + panel): `python3 deploy/upload.py --setup`

## Credentials

`deploy/credentials.local.env` is **gitignored** — never commit real passwords or hostnames.

## Tests

```bash
pip install pytest
pytest -q
```

## Layout

```
app/           Flask backend + checker logic
http-cgi/      CGI bundle for FTP deploy to ~/http/
deploy/        upload scripts, hosting templates
static/        frontend assets (Flask)
templates/     Flask HTML
tests/
```
