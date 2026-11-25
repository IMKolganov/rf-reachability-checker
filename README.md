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

The home page links to the API documentation and an OpenAPI JSON document with the request and response schemas.

| Deployment | Documentation | OpenAPI JSON |
| --- | --- | --- |
| Flask/WSGI | `/docs` | `/openapi.json` |
| CGI | `/docs.html` | `/openapi.json` |

Flask/WSGI examples:

```bash
curl -s "http://127.0.0.1:8080/api/check?target=google.com" | jq
curl -s "http://127.0.0.1:8080/api/check?target=https://www.google.com/" | jq
curl -s -X POST http://127.0.0.1:8080/api/check \
  -H 'Content-Type: application/json' \
  -d '{"target":"8.8.8.8"}' | jq
```

For CGI, send `GET /check.cgi?target=example.com`.

The result page shows DNS resolution, TCP connections, and whether the web request returned an HTTP status. A successful TCP connection can coexist with a failed HTTPS request. HTTP 401 confirms the server responded and indicates that access requires authorization.

In the API, `reachable` and `summary` report the existing network-level verdict. `http.status_code` is set when the web request returned an HTTP status, including 4xx and 5xx. `http.error_kind` identifies failures before a status is received, such as `tls_timeout` or `tls_certificate`. `http.body_error` records a failed body read after a status is received. `http.response_summary` may include a plain-text preview with HTML tags removed.

For HTTP(S) availability checks in consumers such as dashboards, inspect `http.status_code`. A numeric status (including 401) confirms the destination returned an HTTP response. If the `http` object exists with a null status, the web request did not receive a response. When `http` itself is null, the result contains only the network checks.

## Deploy

1. Copy `deploy/credentials.example.env` → `deploy/credentials.local.env` and fill in your hosting credentials.
2. Upload:

```bash
python3 deploy/upload.py --probe-only   # test FTP/SFTP
python3 deploy/upload.py --cgi          # recommended: Apache CGI in ~/http/
```

3. Optional WSGI path (SSH + panel): `python3 deploy/upload.py --setup`

When updating CGI CSS or JavaScript, refresh the `v` query values in `http-cgi/index.html` and `http-cgi/docs.html` to match the first 12 characters of each changed asset's SHA-256 digest.

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
