@echo off
chcp 65001 >nul
echo ==============================================================
echo   CAI DAT AI CONTENT STUDIO (FULL-STACK SERVER TREN WINDOWS)
echo ==============================================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Chua tim thay Python 3.11+. Vui long cai Python tai https://www.python.org/downloads/
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Chua tim thay Node.js 20+. Vui long cai Node.js tai https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Cai dat moi truong Python FastAPI Backend...
cd /d "%~dp0apps\api"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

echo [2/3] Cai dat thu vien Giao dien Next.js...
cd /d "%~dp0apps\web"
call npm install

echo [3/3] Tao file khoi chay nhanh run-studio.bat...
cd /d "%~dp0"
(
echo @echo off
echo start "AI Content Studio API" cmd /k "cd /d %%~dp0apps\api && .venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000"
echo timeout /t 3 /nobreak ^>nul
echo start http://localhost:3000
echo cd /d "%%~dp0apps\web" ^&^& npm run dev
) > run-studio.bat

echo.
echo [HOAN TAT] Da cai dat xong! Bam dup vao file "run-studio.bat" de mo ung dung.
pause
