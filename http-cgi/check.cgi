#!/usr/bin/env python3
"""CGI entrypoint for Apache shared hosting (FTP-only deploy)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.parse import parse_qs

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "lib"))

from checker import check_target  # noqa: E402


def _respond(status: str, payload: dict, code: int = 200) -> None:
    body = json.dumps(payload, ensure_ascii=False)
    sys.stdout.write(f"Status: {code} {status}\r\n")
    sys.stdout.write("Content-Type: application/json; charset=utf-8\r\n")
    sys.stdout.write(f"Content-Length: {len(body.encode('utf-8'))}\r\n")
    sys.stdout.write("\r\n")
    sys.stdout.write(body)


def _read_target() -> str:
    query = os.environ.get("QUERY_STRING", "")
    values = parse_qs(query, keep_blank_values=False)
    target = values.get("target", [""])[0].strip()
    return target


def main() -> None:
    os.chdir(ROOT)
    target = _read_target()
    if not target:
        _respond("Bad Request", {"error": "target is required"}, 400)
        return

    try:
        result = check_target(target, probe_from=os.getenv("SITE_NAME", "rf-probe"))
    except ValueError as exc:
        _respond("Bad Request", {"error": str(exc)}, 400)
        return

    _respond("OK", result.to_dict())


if __name__ == "__main__":
    main()
