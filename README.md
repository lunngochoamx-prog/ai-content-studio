# AI Content Studio & Multi-Industry Second Brain

Ứng dụng Web SaaS viết content đa ngành nghề, tối ưu riêng biệt cho **Facebook, SEO Google, GEO Google (AI Overviews), TikTok, Website**, tích hợp bộ chấm điểm **65 tiêu chí SEO/AIO**, **Bộ não thứ 2 tự động phân loại ngành nghề**, **Học phong cách cá nhân (`Style DNA`)**, kết nối **9Router (Free mặc định) / Ollama Local / OpenAI / Gemini / Claude / DeepSeek / OpenRouter**, **Tạo ảnh chuẩn kích thước nền tảng**, **Update Skill**, **Lịch sử**, **Góp ý** và **Mã QR ủng hộ tác giả**.

## 🌐 Truy Cập Bản Xuất Bản Trực Tuyến (Online)

- **Sử dụng ngay trên trình duyệt (GitHub Pages Cloud-Edge):** **https://lunngochoamx-prog.github.io/ai-content-studio/**
- **Triển khai Full-Stack Cloud (PostgreSQL + FastAPI + Next.js) 1-Click trên Render:**
  [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/lunngochoamx-prog/ai-content-studio)

## Khởi chạy nhanh trên máy chủ riêng / Local

### Cách 1: Chạy trực tiếp trên môi trường phát triển
```bash
chmod +x start.sh
./start.sh
```
- Giao diện Web Studio: `http://localhost:3000`
- Tài liệu Swagger FastAPI: `http://localhost:8000/docs`

### Cách 2: Chạy bằng Docker Compose (kèm PostgreSQL `pgvector`, Redis & `9router`)
```bash
cp .env.example .env
docker compose up -d --build
```

## Cấu trúc dự án
- `apps/api`: Python FastAPI, SQLAlchemy Async, `pyvi` NLP tiếng Việt, Engine chấm điểm 65 tiêu chí (`app/engines/checklist_65.py`), Bộ não thứ 2 Vector RAG (`app/engines/vector_brain.py`), Học phong cách (`app/engines/style_learner.py`), Khử giọng AI & Chống trùng lặp (`app/engines/humanizer_plagiarism.py`), Tạo ảnh & Hậu kỳ WebP (`app/engines/image_studio.py`), Tích hợp Telegram/Google Sheets/VietQR (`app/engines/integrations.py`).
- `apps/web`: Next.js App Router (TypeScript + Vanilla CSS Editorial Design System) + Hybrid API Client (`src/lib/api.ts`) + Standalone Online Engine (`src/lib/standaloneEngine.ts`) + `Ollama Local Bridge`.
