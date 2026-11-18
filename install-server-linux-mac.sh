#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=============================================================="
echo "  CÀI ĐẶT AI CONTENT STUDIO (FULL-STACK SERVER LINUX / MACOS)"
echo "=============================================================="

if ! command -v python3 >/dev/null 2>&1; then
  echo "[!] Chưa tìm thấy python3. Vui lòng cài đặt Python 3.11+."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[!] Chưa tìm thấy Node.js. Vui lòng cài đặt Node.js 20+."
  exit 1
fi

echo "[1/2] Cài đặt Backend Python FastAPI..."
cd "$ROOT_DIR/apps/api"
python3 -m venv .venv
"$ROOT_DIR/apps/api/.venv/bin/pip" install --upgrade pip
"$ROOT_DIR/apps/api/.venv/bin/pip" install -r requirements.txt

echo "[2/2] Cài đặt Frontend Next.js..."
cd "$ROOT_DIR/apps/web"
npm install

chmod +x "$ROOT_DIR/start.sh"
echo ""
echo "✅ Cài đặt hoàn tất! Chạy './start.sh' để khởi động ứng dụng tại http://localhost:3000"
