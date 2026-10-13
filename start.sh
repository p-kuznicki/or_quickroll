#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Kill only an older copy of this extension server, if one is still holding 8001.
if command -v fuser >/dev/null 2>&1; then
  fuser -k 8001/tcp >/dev/null 2>&1 || true
fi
exec python3 server.py
