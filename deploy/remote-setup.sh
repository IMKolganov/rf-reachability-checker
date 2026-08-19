#!/usr/bin/env bash
# Run on hosting server over SSH after files are uploaded via deploy/upload.py
set -euo pipefail

APP_DIR="${HOME}/rf-reachability"
VENV_DIR="${HOME}/app-venv"

cd "${HOME}"

if [[ ! -d "${VENV_DIR}" ]]; then
  python3 -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"
pip install --upgrade pip
pip install -r "${APP_DIR}/requirements.txt"

if [[ -x "${HOME}/init.d/wsgi" ]]; then
  "${HOME}/init.d/wsgi" restart
elif [[ -x "${HOME}/init.d/wsgi-app" ]]; then
  "${HOME}/init.d/wsgi-app" restart
else
  echo "WSGI init script not found. Enable Python/WSGI in hosting panel first." >&2
  exit 1
fi

echo "Setup complete. Logs: ${HOME}/logs_wsgi/"
