# AI Content Studio & Multi-Industry Second Brain

Ứng dụng viết content đa ngành nghề, tối ưu riêng biệt cho **Facebook, SEO Google, GEO Google (AI Overviews), TikTok, Website**, tích hợp bộ chấm điểm **65 tiêu chí SEO/AIO**, **Bộ não thứ 2 tự động phân loại ngành nghề**, **Học phong cách cá nhân (`Style DNA`)**, kết nối **9Router (Free mặc định) / Ollama Local / OpenAI / Gemini / Claude / DeepSeek / OpenRouter**, **Tạo ảnh chuẩn kích thước nền tảng**, **Update Skill**, **Lịch sử**, **Góp ý** và **Mã QR ủng hộ tác giả**.

## 📥 Tải File Cài Đặt Máy Tính (Windows / macOS / Linux)

Cài đặt trực tiếp sang bất kỳ máy tính nào khác mà không cần cài Python, Node.js hay Docker:
- **Tải bộ cài đặt chính thức (`v1.0.0`):** **https://github.com/lunngochoamx-prog/ai-content-studio/releases/latest**
  - 🪟 **Windows 10/11:** `AI-Content-Studio-Setup-1.0.0.exe` (Bản cài đặt chuẩn) hoặc `AI-Content-Studio-Portable-1.0.0.exe` (Chạy ngay trên USB)
  - 🍎 **macOS (Apple Silicon & Intel):** `AI-Content-Studio-macOS-arm64-1.0.0.dmg` / `AI-Content-Studio-macOS-x64-1.0.0.dmg`
  - 🐧 **Linux (Ubuntu/Debian):** `AI-Content-Studio-Linux-x64-1.0.0.deb` / `AI-Content-Studio-Linux-x64-1.0.0.AppImage`

## 🌐 Truy Cập Bản Xuất Bản Trực Tuyến (Online)

- **Sử dụng ngay trên trình duyệt (GitHub Pages Cloud-Edge):** **https://lunngochoamx-prog.github.io/ai-content-studio/**
- **Triển khai Full-Stack Cloud (PostgreSQL + FastAPI + Next.js) 1-Click trên Render:**
  [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/lunngochoamx-prog/ai-content-studio)

## Khởi chạy nhanh trên máy chủ riêng / Local

### Cách 1: Chạy bộ cài đặt Server tự động
- **Windows:** Bấm đúp `install-server-windows.bat`
- **Linux / macOS:** `./install-server-linux-mac.sh && ./start.sh`

### Cách 2: Chạy bằng Docker Compose (kèm PostgreSQL `pgvector`, Redis & `9router`)
```bash
cp .env.example .env
docker compose up -d --build
```

## Cấu trúc dự án
- `apps/desktop`: Ứng dụng máy tính Electron đóng gói bộ cài `.exe`, `.dmg`, `.AppImage`, `.deb`, tích hợp lưu trữ ổ cứng tự động, sao lưu/khôi phục `.json` liên máy và cầu nối mạng AI không bị chặn CORS.
- `apps/api`: Python FastAPI, SQLAlchemy Async, `pyvi` NLP tiếng Việt, Engine chấm điểm 65 tiêu chí (`app/engines/checklist_65.py`), Bộ não thứ 2 Vector RAG (`app/engines/vector_brain.py`), Học phong cách (`app/engines/style_learner.py`), Khử giọng AI & Chống trùng lặp (`app/engines/humanizer_plagiarism.py`), Tạo ảnh & Hậu kỳ WebP (`app/engines/image_studio.py`), Tích hợp Telegram/Google Sheets/VietQR (`app/engines/integrations.py`).
- `apps/web`: Next.js App Router (TypeScript + Vanilla CSS Editorial Design System) + Hybrid API Client (`src/lib/api.ts`) + Standalone Engine (`src/lib/standaloneEngine.ts`).
