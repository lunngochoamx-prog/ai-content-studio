#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_BIN="/usr/lib/postgresql/15/bin"

if [ -x "$PG_BIN/pg_isready" ]; then
  if ! "$PG_BIN/pg_isready" -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    "$PG_BIN/pg_ctl" -D /home/antigravity/pgdata -l /home/antigravity/pgdata/pg.log start
  fi
fi

cd "$ROOT_DIR/apps/api"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
API_PID=$!

cd "$ROOT_DIR/apps/web"
npm run dev -- --port 3000 --hostname 0.0.0.0 &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null || true" EXIT INT TERM
wait
