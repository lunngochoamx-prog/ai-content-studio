"""FastAPI Main Application — AI Content Studio & Multi-Industry Second Brain."""

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import json
import re
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import (
    DAILY_FREE_QUOTA_DEFAULT,
    SYSTEM_9ROUTER_API_KEY,
    SYSTEM_9ROUTER_BASE_URL,
    SYSTEM_9ROUTER_DEFAULT_MODEL,
    create_access_token,
    decode_access_token,
    decrypt_api_key,
    encrypt_api_key,
    hash_password,
    mask_api_key,
    verify_password,
)
from app.core.database import (
    Article,
    ArticleImage,
    ArticleVersion,
    AsyncSessionLocal,
    Base,
    Feedback,
    IndustryVault,
    KnowledgeChunk,
    ProviderConfig,
    Skill,
    StyleProfile,
    SystemSetting,
    User,
    engine,
    get_db,
    utcnow,
)
from app.data.seed_data import PLATFORM_PROFILES, SEED_SKILLS, SEED_VAULTS
from app.engines.checklist_65 import (
    CHECKLIST_65_RULES,
    auto_fix_checklist_issues,
    evaluate_65_checklist,
)
from app.engines.humanizer_plagiarism import (
    evaluate_ai_voice,
    evaluate_uniqueness,
    humanize_vietnamese_html,
    strip_html,
)
from app.engines.image_studio import (
    GENERATED_IMG_DIR,
    generate_platform_image,
    render_editorial_brand_visual,
)
from app.engines.integrations import (
    POPULAR_VN_BANKS,
    build_vietqr_info,
    notify_telegram_feedback,
    render_local_donate_qr_png,
    sync_google_sheets_webhook,
)
from app.engines.llm_gateway import (
    PROVIDER_CATALOG,
    build_generation_prompts,
    call_remote_llm,
    extract_skill_from_sample_text,
    suggest_titles_by_platform,
    synthesize_structured_article,
)
from app.engines.style_learner import analyze_writing_samples, learn_from_edit_diff
from app.engines.vector_brain import (
    classify_industry,
    compute_embedding,
    extract_knowledge_units,
    retrieve_relevant_chunks,
    slugify_vi,
)


async def seed_initial_data() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing_user = (await db.execute(select(User).limit(1))).scalar_one_or_none()
        if existing_user:
            return

        # 1. Tạo tài khoản Admin/Creator mặc định
        admin = User(
            email="admin@contentstudio.vn",
            full_name="Tác giả & Chuyên gia Content",
            password_hash=hash_password("demo123"),
            role="admin",
            daily_free_quota_limit=DAILY_FREE_QUOTA_DEFAULT,
            daily_free_quota_used=2,
            quota_reset_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        )
        db.add(admin)
        await db.flush()

        # 2. Cấu hình hệ thống mặc định (System 9Router + Telegram/GSheet + VietQR)
        db.add_all([
            SystemSetting(
                key="ai_free_9router",
                value={
                    "base_url": SYSTEM_9ROUTER_BASE_URL,
                    "api_key": SYSTEM_9ROUTER_API_KEY,
                    "default_model": SYSTEM_9ROUTER_DEFAULT_MODEL,
                    "daily_free_quota": DAILY_FREE_QUOTA_DEFAULT,
                },
            ),
            SystemSetting(
                key="integrations",
                value={
                    "telegram_bot_token": "",
                    "telegram_chat_id": "",
                    "google_sheets_webhook_url": "",
                },
            ),
            SystemSetting(
                key="author_qr",
                value={
                    "bank_id": "MB",
                    "account_no": "0988686868",
                    "account_name": "TAC GIA AI CONTENT STUDIO",
                    "default_message": "Ung ho phat trien AI Content Studio",
                    "preset_amounts": [25000, 50000, 100000, 200000],
                    "static_momo_note": "Ví MoMo / ZaloPay: 0988.686.868 — Cảm ơn bạn đã tiếp sức duy trì cụm server 9Router miễn phí!",
                    "thank_you_message": "Mỗi sự ủng hộ của bạn giúp duy trì cụm 9Router miễn phí và cập nhật thêm nhiều công thức viết bài thực chiến cho cộng đồng.",
                },
            ),
        ])

        # 3. Cấu hình cổng AI mặc định của người dùng (mặc định dùng Free -> 9Router hệ thống)
        db.add(
            ProviderConfig(
                user_id=admin.id,
                active_provider="free_9router",
                providers_json={
                    "free_9router": {"base_url": SYSTEM_9ROUTER_BASE_URL, "text_model": "9router/auto-free", "image_model": "flux-free"},
                    "ollama": {"base_url": "http://localhost:11434", "text_model": "qwen2.5:7b", "image_model": ""},
                    "custom_9router": {"base_url": "http://localhost:20128/v1", "text_model": "auto", "image_model": "auto"},
                    "openai": {"base_url": "https://api.openai.com/v1", "text_model": "gpt-4o", "image_model": "gpt-image-1"},
                    "gemini": {"base_url": "https://generativelanguage.googleapis.com/v1beta", "text_model": "gemini-2.5-flash", "image_model": "imagen-3.0"},
                    "claude": {"base_url": "https://api.anthropic.com/v1", "text_model": "claude-sonnet-4-20250514", "image_model": ""},
                    "deepseek": {"base_url": "https://api.deepseek.com/v1", "text_model": "deepseek-chat", "image_model": ""},
                    "openrouter": {"base_url": "https://openrouter.ai/api/v1", "text_model": "google/gemini-2.5-flash", "image_model": ""},
                },
            )
        )

        # 4. Hồ sơ phong cách viết cá nhân (Style DNA)
        db.add(
            StyleProfile(
                user_id=admin.id,
                name="Phong cách Chuyên gia Thực chiến (Mặc định)",
                is_active=True,
                pronoun_style="mình - bạn",
                avg_sentence_length=22.5,
                preferred_tone="Chuyên nghiệp, thẳng thắn, giàu dẫn chứng",
                writing_style="Phân tích thực chiến kết hợp số liệu thật",
                stylometric_dna={
                    "question_ratio": 0.18,
                    "number_density": 0.24,
                    "bullet_preference": True,
                    "rhythm": "Câu vừa chuẩn mực (20–26 từ), ngắt đoạn thoáng 3–4 dòng",
                },
                learned_rules=[
                    "Đi thẳng vào trọng tâm ngay 2 câu đầu, không mở bài vòng vo đại trà.",
                    "Ưu tiên đưa con số thực tế hoặc ví dụ đời thật vào mỗi luận điểm chính.",
                    "Luôn giữ câu ngắn dưới 28 từ để người đọc trên điện thoại dễ theo dõi.",
                ],
                banned_phrases=["trong bối cảnh hiện nay", "chìa khóa vàng", "bức tranh toàn cảnh", "không thể phủ nhận"],
                sample_paragraphs=[
                    "Thực tế khi trực tiếp thẩm định hơn 50 dự án trong năm qua, mình nhận thấy điểm nghẽn lớn nhất không nằm ở ngân sách mà ở khâu kiểm soát quy trình ngay từ tuần đầu tiên.",
                ],
                edit_learn_count=3,
            )
        )

        # 5. Seed 22 công thức viết content đa nền tảng
        first_skill_id = None
        for idx, s in enumerate(SEED_SKILLS):
            sk_obj = Skill(
                user_id=None,
                code=s["code"],
                name=s["name"],
                category=s["category"],
                target_platforms=s["target_platforms"],
                target_industry="Tất cả ngành nghề",
                description=s["description"],
                outline_steps=s["outline_steps"],
                system_instructions=s["system_instructions"],
                custom_variables=[],
                example_output="",
                is_builtin=True,
                usage_count=max(3, 28 - idx),
            )
            db.add(sk_obj)
            await db.flush()
            if s["code"] == "GEO_BLUF_TRIPLES":
                first_skill_id = sk_obj.id

        # 6. Seed 8 Kho Bộ não thứ 2 theo từng ngành nghề + Vector Knowledge Chunks
        first_vault = None
        for idx, vdata in enumerate(SEED_VAULTS):
            vault = IndustryVault(
                user_id=admin.id,
                name=vdata["name"],
                slug=vdata["slug"],
                description=vdata["description"],
                brand_name=vdata["brand_name"],
                brand_tone_colors=vdata["brand_tone_colors"],
                brand_logo_text=vdata["brand_logo_text"],
                pronoun_pair=vdata["pronoun_pair"],
                messaging_general=vdata["messaging_general"],
                messaging_category=vdata["messaging_category"],
                messaging_product=vdata["messaging_product"],
                target_audience=vdata["target_audience"],
                terminology_lexicon=vdata["terminology_lexicon"],
                compliance_taboo=vdata["compliance_taboo"],
                internal_links=vdata["internal_links"],
                harvard_references=vdata["harvard_references"],
                case_studies=vdata["case_studies"],
                auto_learn=True,
                knowledge_count=3,
            )
            db.add(vault)
            await db.flush()
            if idx == 0:
                first_vault = vault

            seed_chunks = [
                ("insight", f"Chân dung & Insight ngành {vdata['name']}", vdata["target_audience"]),
                ("case_study", f"Case study thực chứng tại {vdata['brand_name']}", vdata["case_studies"][0]),
                ("harvard_ref", f"Nguồn nghiên cứu {vdata['harvard_references'][0]['citation']}", f"{vdata['harvard_references'][0]['title']} {vdata['harvard_references'][0]['citation']}"),
            ]
            for ctype, ctitle, cbody in seed_chunks:
                db.add(
                    KnowledgeChunk(
                        vault_id=vault.id,
                        chunk_type=ctype,
                        title=ctitle,
                        content=cbody,
                        source_label="Kho chuẩn khởi tạo",
                        embedding=compute_embedding(f"{ctitle} {cbody}"),
                    )
                )

        # 7. Tạo 2 bài viết mẫu trong Lịch sử (1 bài mới đạt điểm cao + 1 bài quá hạn 90 ngày nhắc làm mới theo Checklist #65)
        if first_vault:
            synth = synthesize_structured_article(
                industry_name=first_vault.name,
                topic="Thẩm định pháp lý sổ hồng và dòng tiền căn hộ cho thuê 2026",
                platform="geo_google",
                writing_style="Phân tích chuyên sâu",
                tone_of_voice="Chuyên nghiệp",
                target_length="1200-1500 từ",
                title="Pháp lý sổ hồng căn hộ: 5 tiêu chí thẩm định 2026",
                main_keyword="pháp lý sổ hồng",
                secondary_keywords=["tỷ suất cho thuê", "quy hoạch 1/500"],
                vault_obj=first_vault,
            )
            uniq = evaluate_uniqueness(synth["content_html"], [])
            ai_v = evaluate_ai_voice(synth["content_html"])
            chk = evaluate_65_checklist(
                title=synth["title"],
                meta_description=synth["meta_description"],
                main_keyword="pháp lý sổ hồng",
                secondary_keywords=["tỷ suất cho thuê", "quy hoạch 1/500"],
                content_html=synth["content_html"],
                uniqueness_result=uniq,
                vault=first_vault,
            )
            art1 = Article(
                user_id=admin.id,
                vault_id=first_vault.id,
                skill_id=first_skill_id,
                industry_name=first_vault.name,
                topic="Thẩm định pháp lý sổ hồng và dòng tiền căn hộ cho thuê 2026",
                platform="geo_google",
                writing_style="Phân tích chuyên sâu",
                tone_of_voice="Chuyên nghiệp",
                target_length="1200-1500 từ",
                title=synth["title"],
                meta_description=synth["meta_description"],
                slug=slugify_vi(synth["title"]),
                main_keyword="pháp lý sổ hồng",
                secondary_keywords=["tỷ suất cho thuê", "quy hoạch 1/500"],
                content_html=synth["content_html"],
                content_text=strip_html(synth["content_html"]),
                provider_used="free_9router",
                model_used="9router/auto-free",
                seo_score=chk["seo_score"],
                geo_score=chk["geo_score"],
                uniqueness_score=uniq["uniqueness_score"],
                human_score=ai_v["human_score"],
                ai_probability=ai_v["ai_probability"],
                checklist_results=chk,
                uniqueness_details=uniq,
                ai_voice_details=ai_v,
                status="published",
                refresh_due_at=utcnow() + timedelta(days=90),
            )
            db.add(art1)
            await db.flush()
            db.add(
                ArticleVersion(
                    article_id=art1.id,
                    version_number=1,
                    note="Bản xuất bản chuẩn 61 tiêu chí GEO/AIO",
                    title=art1.title,
                    content_html=art1.content_html,
                    seo_score=art1.seo_score,
                    geo_score=art1.geo_score,
                    human_score=art1.human_score,
                )
            )

            # Bài mẫu thứ 2 đã tạo >92 ngày trước để minh họa cảnh báo cập nhật 3 tháng/lần (Checklist #65)
            old_created = utcnow() - timedelta(days=94)
            fb_synth = synthesize_structured_article(
                industry_name=first_vault.name,
                topic="Kinh nghiệm tính dòng tiền ròng khi cho thuê chung cư",
                platform="facebook",
                writing_style="Kể chuyện thực chiến",
                tone_of_voice="Thân thiện, thẳng thắn",
                target_length="300-500 từ",
                title="",
                main_keyword="dòng tiền ròng",
                secondary_keywords=["tỷ suất cho thuê"],
                vault_obj=first_vault,
            )
            art2 = Article(
                user_id=admin.id,
                vault_id=first_vault.id,
                skill_id=first_skill_id,
                industry_name=first_vault.name,
                topic="Kinh nghiệm tính dòng tiền ròng khi cho thuê chung cư",
                platform="facebook",
                writing_style="Kể chuyện thực chiến",
                tone_of_voice="Thân thiện, thẳng thắn",
                target_length="300-500 từ",
                title=fb_synth["title"],
                meta_description=fb_synth["meta_description"],
                slug=slugify_vi(fb_synth["title"]),
                main_keyword="dòng tiền ròng",
                secondary_keywords=["tỷ suất cho thuê"],
                content_html=fb_synth["content_html"],
                content_text=strip_html(fb_synth["content_html"]),
                provider_used="free_9router",
                model_used="9router/auto-free",
                seo_score=84,
                geo_score=82,
                uniqueness_score=96.5,
                human_score=93.0,
                ai_probability=7.0,
                checklist_results={},
                uniqueness_details={},
                ai_voice_details={},
                status="published",
                created_at=old_created,
                refresh_due_at=utcnow() - timedelta(days=4),
            )
            db.add(art2)

        # 8. Seed góp ý cộng đồng mẫu
        db.add_all([
            Feedback(
                user_id=admin.id,
                author_name="Minh Anh (SEO Leader)",
                author_email="minhanh@agency.vn",
                category="feature",
                title="Đề xuất thêm tính năng xuất trực tiếp bài lên WordPress qua REST API",
                message="Bộ chấm 65 tiêu chí SEO & AIO bám rất sát thực tế làm nghề của team mình. Nếu có thêm nút đẩy thẳng bài nháp kèm ảnh WebP sang WordPress thì tiết kiệm thêm được 15 phút mỗi bài!",
                rating=5,
                upvotes=14,
                status="planned",
                admin_note="Đã đưa vào lộ trình bản cập nhật tiếp theo.",
            ),
            Feedback(
                user_id=admin.id,
                author_name="Hoàng Nam (Content Freelancer)",
                author_email="nam.writer@gmail.com",
                category="skill_idea",
                title="Bổ sung thêm công thức viết bài PR Báo chí thông cáo ra mắt sản phẩm",
                message="Mong tác giả thêm mẫu chuẩn Thông cáo báo chí (Press Release) cho các nhãn hàng D2C và công nghệ.",
                rating=5,
                upvotes=9,
                status="reviewing",
            ),
        ])

        await db.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await seed_initial_data()
    yield


app = FastAPI(
    title="AI Content Studio & Multi-Industry Second Brain API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            u = (await db.execute(select(User).where(User.id == payload["sub"]))).scalar_one_or_none()
            if u:
                return u
    fallback_user = (await db.execute(select(User).order_by(User.created_at).limit(1))).scalar_one()
    return fallback_user


# ==================== AUTH ====================

class AuthPayload(BaseModel):
    email: str
    password: str
    full_name: str = "Chuyên gia Content"


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "checklist_rules_loaded": len(CHECKLIST_65_RULES)}


@app.get("/api/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    used = user.daily_free_quota_used if user.quota_reset_date == today else 0
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "daily_free_quota_limit": user.daily_free_quota_limit,
        "daily_free_quota_used": used,
    }


@app.post("/api/auth/register")
async def register_user(body: AuthPayload, db: AsyncSession = Depends(get_db)):
    exists = (await db.execute(select(User).where(User.email == body.email.lower().strip()))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký.")
    user = User(
        email=body.email.lower().strip(),
        full_name=body.full_name.strip() or "Chuyên gia Content",
        password_hash=hash_password(body.password),
        role="user",
        daily_free_quota_limit=DAILY_FREE_QUOTA_DEFAULT,
        daily_free_quota_used=0,
        quota_reset_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    db.add(user)
    await db.flush()
    db.add(ProviderConfig(user_id=user.id, active_provider="free_9router", providers_json={}))
    db.add(StyleProfile(user_id=user.id, name="Phong cách cá nhân mặc định", is_active=True))
    await db.commit()
    token = create_access_token(user.id, user.email, user.role)
    return {"access_token": token, "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}}


@app.post("/api/auth/login")
async def login_user(body: AuthPayload, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.email == body.email.lower().strip()))).scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")
    token = create_access_token(user.id, user.email, user.role)
    return {"access_token": token, "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}}


# ==================== AI PROVIDERS (9ROUTER FREE / BYOK / OLLAMA) ====================

class ProviderSavePayload(BaseModel):
    active_provider: str
    providers: dict[str, dict[str, Any]] = Field(default_factory=dict)


class ProviderTestPayload(BaseModel):
    provider: str
    base_url: str = ""
    api_key: str = ""
    model: str = ""


@app.get("/api/providers/config")
async def get_provider_config(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cfg = (await db.execute(select(ProviderConfig).where(ProviderConfig.user_id == user.id))).scalar_one_or_none()
    sys_9r = (await db.execute(select(SystemSetting).where(SystemSetting.key == "ai_free_9router"))).scalar_one_or_none()

    stored = (cfg.providers_json if cfg else {}) or {}
    sanitized: dict[str, dict] = {}
    for p in PROVIDER_CATALOG:
        pid = p["id"]
        cur = stored.get(pid, {})
        plain = decrypt_api_key(cur.get("encrypted_api_key", "")) if cur.get("encrypted_api_key") else ""
        sanitized[pid] = {
            "base_url": cur.get("base_url") or p["base_url_default"],
            "text_model": cur.get("text_model") or p["default_model"],
            "image_model": cur.get("image_model") or "",
            "has_key": bool(plain),
            "masked_key": mask_api_key(plain),
        }

    return {
        "active_provider": cfg.active_provider if cfg else "free_9router",
        "catalog": PROVIDER_CATALOG,
        "providers": sanitized,
        "system_9router_endpoint": (sys_9r.value or {}).get("base_url", SYSTEM_9ROUTER_BASE_URL) if sys_9r else SYSTEM_9ROUTER_BASE_URL,
        "free_quota": {
            "used": user.daily_free_quota_used,
            "limit": user.daily_free_quota_limit,
        },
    }


@app.put("/api/providers/config")
async def update_provider_config(
    body: ProviderSavePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cfg = (await db.execute(select(ProviderConfig).where(ProviderConfig.user_id == user.id))).scalar_one_or_none()
    if not cfg:
        cfg = ProviderConfig(user_id=user.id, active_provider=body.active_provider, providers_json={})
        db.add(cfg)

    merged = dict(cfg.providers_json or {})
    for pid, vals in body.providers.items():
        prev = dict(merged.get(pid, {}))
        if "base_url" in vals and vals["base_url"] is not None:
            prev["base_url"] = str(vals["base_url"]).strip()
        if "text_model" in vals and vals["text_model"] is not None:
            prev["text_model"] = str(vals["text_model"]).strip()
        if "image_model" in vals and vals["image_model"] is not None:
            prev["image_model"] = str(vals["image_model"]).strip()
        raw_key = str(vals.get("api_key", "")).strip()
        if raw_key and "..." not in raw_key and raw_key != "****":
            prev["encrypted_api_key"] = encrypt_api_key(raw_key)
        elif vals.get("clear_key") is True:
            prev["encrypted_api_key"] = ""
        merged[pid] = prev

    cfg.active_provider = body.active_provider
    cfg.providers_json = merged
    await db.commit()
    return {"ok": True, "active_provider": cfg.active_provider}


@app.post("/api/providers/test")
async def test_provider_connection(
    body: ProviderTestPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cfg = (await db.execute(select(ProviderConfig).where(ProviderConfig.user_id == user.id))).scalar_one_or_none()
    sys_9r = (await db.execute(select(SystemSetting).where(SystemSetting.key == "ai_free_9router"))).scalar_one_or_none()

    pid = body.provider
    base_url = body.base_url.strip()
    api_key = body.api_key.strip()
    model = body.model.strip()

    if pid == "free_9router":
        s_val = (sys_9r.value if sys_9r else {}) or {}
        base_url = s_val.get("base_url", SYSTEM_9ROUTER_BASE_URL)
        api_key = s_val.get("api_key", SYSTEM_9ROUTER_API_KEY)
        model = s_val.get("default_model", "auto")
    elif (not api_key or "..." in api_key) and cfg and cfg.providers_json.get(pid, {}).get("encrypted_api_key"):
        api_key = decrypt_api_key(cfg.providers_json[pid]["encrypted_api_key"])

    reply = await call_remote_llm(
        provider=pid,
        base_url=base_url,
        api_key=api_key,
        model=model,
        system_prompt="Trả lời đúng 1 câu ngắn tiếng Việt xác nhận kết nối thành công.",
        user_prompt="Xin chào, kiểm tra kết nối API.",
        timeout=9.0,
    )
    if reply:
        return {"reachable": True, "mode": "live_llm", "message": f"Kết nối thành công tới {pid}: {reply[:90]}"}
    if pid == "free_9router":
        return {
            "reachable": True,
            "mode": "system_9router_smart_engine",
            "message": f"Đang kích hoạt chế độ Free mặc định (System 9Router '{base_url}' kèm Engine Tổng hợp Nội dung Nội bộ sẵn sàng 24/7).",
        }
    return {
        "reachable": False,
        "mode": "unreachable",
        "message": f"Chưa kết nối được tới endpoint '{base_url}'. Kiểm tra lại API Key, Base URL hoặc kết nối Ollama trên trình duyệt.",
    }


# ==================== PLATFORMS & SKILLS (REQUIREMENTS 1 & 8) ====================

class SkillPayload(BaseModel):
    code: str = ""
    name: str
    category: str = "custom"
    target_platforms: list[str] = Field(default_factory=lambda: ["facebook", "seo_google", "geo_google", "tiktok", "website"])
    target_industry: str = "Tất cả ngành nghề"
    description: str = ""
    outline_steps: list[dict[str, str]] = Field(default_factory=list)
    system_instructions: str = ""
    custom_variables: list[dict[str, str]] = Field(default_factory=list)
    example_output: str = ""


class ExtractSkillPayload(BaseModel):
    sample_text: str
    custom_name: str = ""


@app.get("/api/platforms")
async def list_platforms():
    return {"platforms": PLATFORM_PROFILES, "checklist_65_rules": CHECKLIST_65_RULES}


@app.get("/api/skills")
async def list_skills(
    platform: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(Skill).order_by(desc(Skill.is_builtin), desc(Skill.usage_count), Skill.name))).scalars().all()
    items = []
    for s in rows:
        if platform and platform != "all" and platform not in (s.target_platforms or []):
            continue
        if category and category != "all" and s.category != category:
            continue
        items.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "category": s.category,
            "target_platforms": s.target_platforms,
            "target_industry": s.target_industry,
            "description": s.description,
            "outline_steps": s.outline_steps,
            "system_instructions": s.system_instructions,
            "custom_variables": s.custom_variables,
            "example_output": s.example_output,
            "is_builtin": s.is_builtin,
            "usage_count": s.usage_count,
        })
    return {"skills": items}


@app.post("/api/skills")
async def create_custom_skill(
    body: SkillPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code = body.code.strip().upper() or ("SKILL_" + slugify_vi(body.name).upper().replace("-", "_")[:20])
    sk = Skill(
        user_id=user.id,
        code=code,
        name=body.name.strip(),
        category=body.category or "custom",
        target_platforms=body.target_platforms or ["seo_google", "facebook"],
        target_industry=body.target_industry or "Tất cả ngành nghề",
        description=body.description,
        outline_steps=body.outline_steps,
        system_instructions=body.system_instructions,
        custom_variables=body.custom_variables,
        example_output=body.example_output,
        is_builtin=False,
        usage_count=1,
    )
    db.add(sk)
    await db.commit()
    await db.refresh(sk)
    return {"id": sk.id, "code": sk.code, "name": sk.name}


@app.put("/api/skills/{skill_id}")
async def update_custom_skill(
    skill_id: str,
    body: SkillPayload,
    db: AsyncSession = Depends(get_db),
):
    sk = (await db.execute(select(Skill).where(Skill.id == skill_id))).scalar_one_or_none()
    if not sk:
        raise HTTPException(status_code=404, detail="Không tìm thấy Skill.")
    sk.name = body.name.strip()
    sk.category = body.category
    sk.target_platforms = body.target_platforms
    sk.target_industry = body.target_industry
    sk.description = body.description
    sk.outline_steps = body.outline_steps
    sk.system_instructions = body.system_instructions
    sk.custom_variables = body.custom_variables
    sk.example_output = body.example_output
    await db.commit()
    return {"ok": True}


@app.delete("/api/skills/{skill_id}")
async def delete_custom_skill(skill_id: str, db: AsyncSession = Depends(get_db)):
    sk = (await db.execute(select(Skill).where(Skill.id == skill_id))).scalar_one_or_none()
    if not sk:
        raise HTTPException(status_code=404, detail="Không tìm thấy Skill.")
    if sk.is_builtin:
        raise HTTPException(status_code=400, detail="Không thể xóa công thức gốc của hệ thống.")
    await db.delete(sk)
    await db.commit()
    return {"ok": True}


@app.post("/api/skills/extract-from-sample")
async def extract_skill_endpoint(
    body: ExtractSkillPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    extracted = extract_skill_from_sample_text(body.sample_text, body.custom_name)
    sk = Skill(
        user_id=user.id,
        code=extracted["code"],
        name=extracted["name"],
        category="custom",
        target_platforms=extracted["target_platforms"],
        target_industry=extracted["target_industry"],
        description=extracted["description"],
        outline_steps=extracted["outline_steps"],
        system_instructions=extracted["system_instructions"],
        custom_variables=extracted["custom_variables"],
        example_output=extracted["example_output"],
        is_builtin=False,
        usage_count=1,
    )
    db.add(sk)
    await db.commit()
    await db.refresh(sk)
    return {"skill": {**extracted, "id": sk.id, "is_builtin": False}}


@app.get("/api/skills/{skill_id}/export-md", response_class=PlainTextResponse)
async def export_skill_markdown(skill_id: str, db: AsyncSession = Depends(get_db)):
    sk = (await db.execute(select(Skill).where(Skill.id == skill_id))).scalar_one_or_none()
    if not sk:
        raise HTTPException(status_code=404, detail="Không tìm thấy Skill.")
    steps_md = "\n".join(f"- **{st.get('step')}**: {st.get('description')}" for st in (sk.outline_steps or []))
    md = (
        f"---\nname: {slugify_vi(sk.name)}\ncode: {sk.code}\nplatforms: {', '.join(sk.target_platforms or [])}\n---\n\n"
        f"# {sk.name}\n\n{sk.description}\n\n## Cấu trúc triển khai\n{steps_md}\n\n"
        f"## Chỉ dẫn hệ thống\n{sk.system_instructions}\n"
    )
    return md


# ==================== SECOND BRAIN MULTI-INDUSTRY (REQUIREMENT 3) ====================

class VaultPayload(BaseModel):
    name: str
    description: str = ""
    brand_name: str = ""
    brand_tone_colors: list[str] = Field(default_factory=lambda: ["#0F4C5C", "#C8963E", "#F7F5F0"])
    brand_logo_text: str = ""
    pronoun_pair: str = "Chúng tôi - Quý khách"
    messaging_general: str = ""
    messaging_category: str = ""
    messaging_product: str = ""
    target_audience: str = ""
    terminology_lexicon: list[str] = Field(default_factory=list)
    compliance_taboo: list[str] = Field(default_factory=list)
    internal_links: list[dict[str, str]] = Field(default_factory=list)
    harvard_references: list[dict[str, str]] = Field(default_factory=list)
    case_studies: list[str] = Field(default_factory=list)
    auto_learn: bool = True


class IngestKnowledgePayload(BaseModel):
    raw_text: str
    source_title: str = "Tài liệu chuyên ngành"
    vault_id: str | None = None  # None = tự động phân loại ngành nghề!


@app.get("/api/brain/vaults")
async def list_industry_vaults(db: AsyncSession = Depends(get_db)):
    vaults = (await db.execute(select(IndustryVault).order_by(IndustryVault.name))).scalars().all()
    return {
        "vaults": [
            {
                "id": v.id,
                "name": v.name,
                "slug": v.slug,
                "description": v.description,
                "brand_name": v.brand_name,
                "brand_tone_colors": v.brand_tone_colors,
                "brand_logo_text": v.brand_logo_text,
                "pronoun_pair": v.pronoun_pair,
                "messaging_general": v.messaging_general,
                "messaging_category": v.messaging_category,
                "messaging_product": v.messaging_product,
                "target_audience": v.target_audience,
                "terminology_lexicon": v.terminology_lexicon,
                "compliance_taboo": v.compliance_taboo,
                "internal_links": v.internal_links,
                "harvard_references": v.harvard_references,
                "case_studies": v.case_studies,
                "auto_learn": v.auto_learn,
                "knowledge_count": v.knowledge_count,
            }
            for v in vaults
        ]
    }


@app.get("/api/brain/vaults/{vault_id}")
async def get_vault_detail(vault_id: str, db: AsyncSession = Depends(get_db)):
    v = (await db.execute(select(IndustryVault).where(IndustryVault.id == vault_id))).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho ngành nghề.")
    chunks = (
        await db.execute(
            select(KnowledgeChunk).where(KnowledgeChunk.vault_id == vault_id).order_by(desc(KnowledgeChunk.created_at))
        )
    ).scalars().all()
    return {
        "vault": {
            "id": v.id,
            "name": v.name,
            "slug": v.slug,
            "description": v.description,
            "brand_name": v.brand_name,
            "brand_tone_colors": v.brand_tone_colors,
            "brand_logo_text": v.brand_logo_text,
            "pronoun_pair": v.pronoun_pair,
            "messaging_general": v.messaging_general,
            "messaging_category": v.messaging_category,
            "messaging_product": v.messaging_product,
            "target_audience": v.target_audience,
            "terminology_lexicon": v.terminology_lexicon,
            "compliance_taboo": v.compliance_taboo,
            "internal_links": v.internal_links,
            "harvard_references": v.harvard_references,
            "case_studies": v.case_studies,
            "auto_learn": v.auto_learn,
            "knowledge_count": len(chunks),
        },
        "chunks": [
            {
                "id": c.id,
                "chunk_type": c.chunk_type,
                "title": c.title,
                "content": c.content,
                "source_label": c.source_label,
                "created_at": c.created_at.isoformat(),
            }
            for c in chunks
        ],
    }


@app.post("/api/brain/vaults")
async def create_vault(
    body: VaultPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    v = IndustryVault(
        user_id=user.id,
        name=body.name.strip(),
        slug=slugify_vi(body.name),
        description=body.description,
        brand_name=body.brand_name,
        brand_tone_colors=body.brand_tone_colors,
        brand_logo_text=body.brand_logo_text or body.brand_name,
        pronoun_pair=body.pronoun_pair,
        messaging_general=body.messaging_general,
        messaging_category=body.messaging_category,
        messaging_product=body.messaging_product,
        target_audience=body.target_audience,
        terminology_lexicon=body.terminology_lexicon,
        compliance_taboo=body.compliance_taboo,
        internal_links=body.internal_links,
        harvard_references=body.harvard_references,
        case_studies=body.case_studies,
        auto_learn=body.auto_learn,
        knowledge_count=0,
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return {"id": v.id, "name": v.name}


@app.put("/api/brain/vaults/{vault_id}")
async def update_vault(vault_id: str, body: VaultPayload, db: AsyncSession = Depends(get_db)):
    v = (await db.execute(select(IndustryVault).where(IndustryVault.id == vault_id))).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho ngành nghề.")
    v.name = body.name.strip()
    v.description = body.description
    v.brand_name = body.brand_name
    v.brand_tone_colors = body.brand_tone_colors
    v.brand_logo_text = body.brand_logo_text
    v.pronoun_pair = body.pronoun_pair
    v.messaging_general = body.messaging_general
    v.messaging_category = body.messaging_category
    v.messaging_product = body.messaging_product
    v.target_audience = body.target_audience
    v.terminology_lexicon = body.terminology_lexicon
    v.compliance_taboo = body.compliance_taboo
    v.internal_links = body.internal_links
    v.harvard_references = body.harvard_references
    v.case_studies = body.case_studies
    v.auto_learn = body.auto_learn
    await db.commit()
    return {"ok": True}


@app.post("/api/brain/ingest")
async def ingest_knowledge_auto_classify(
    body: IngestKnowledgePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vaults = (await db.execute(select(IndustryVault))).scalars().all()
    target_vault = None
    classification_info = {"confidence": 1.0, "auto_created_vault": False}

    if body.vault_id and body.vault_id != "auto":
        target_vault = next((v for v in vaults if v.id == body.vault_id), None)

    if target_vault is None:
        cls_res = classify_industry(f"{body.source_title}\n{body.raw_text}", vaults)
        classification_info["confidence"] = cls_res["confidence"]
        if cls_res["should_create_new"] or not cls_res["matched_vault_id"]:
            target_vault = IndustryVault(
                user_id=user.id,
                name=cls_res["industry_name"],
                slug=slugify_vi(cls_res["industry_name"]),
                description=f"Kho tri thức tự động khởi tạo từ dữ liệu ngành {cls_res['industry_name']}.",
                terminology_lexicon=cls_res.get("suggested_terms", []),
                brand_tone_colors=["#0F4C5C", "#C8963E", "#F7F5F0"],
                auto_learn=True,
                knowledge_count=0,
            )
            db.add(target_vault)
            await db.flush()
            classification_info["auto_created_vault"] = True
        else:
            target_vault = next((v for v in vaults if v.id == cls_res["matched_vault_id"]), vaults[0])

    extracted = extract_knowledge_units(body.raw_text, body.source_title)
    added_chunks = 0
    for ch in extracted["chunks"]:
        db.add(
            KnowledgeChunk(
                vault_id=target_vault.id,
                chunk_type=ch["chunk_type"],
                title=ch["title"],
                content=ch["content"],
                source_label=body.source_title or "Người dùng nạp tri thức",
                embedding=compute_embedding(f"{ch['title']} {ch['content']}"),
            )
        )
        added_chunks += 1

    # Bổ sung từ vựng chuyên ngành mới phát hiện vào từ điển ngành
    cur_lex = list(target_vault.terminology_lexicon or [])
    new_terms = []
    for t in extracted["discovered_terms"]:
        if t not in cur_lex and len(cur_lex) < 40:
            cur_lex.append(t)
            new_terms.append(t)
    target_vault.terminology_lexicon = cur_lex
    target_vault.knowledge_count = (target_vault.knowledge_count or 0) + added_chunks

    await db.commit()
    return {
        "vault_id": target_vault.id,
        "industry_name": target_vault.name,
        "confidence": classification_info["confidence"],
        "auto_created_vault": classification_info["auto_created_vault"],
        "added_chunks": added_chunks,
        "new_terms_learned": new_terms,
    }


# ==================== STYLE MEMORY (REQUIREMENT 4) ====================

class StyleUpdatePayload(BaseModel):
    name: str = "Phong cách cá nhân mặc định"
    pronoun_style: str = "mình - bạn"
    avg_sentence_length: float = 22.0
    preferred_tone: str = "Chuyên nghiệp"
    writing_style: str = "Phân tích thực chiến"
    learned_rules: list[str] = Field(default_factory=list)
    banned_phrases: list[str] = Field(default_factory=list)


class StyleSamplesPayload(BaseModel):
    samples: list[str]


@app.get("/api/style/profile")
async def get_style_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none()
    if not sp:
        sp = StyleProfile(user_id=user.id, name="Phong cách cá nhân mặc định", is_active=True)
        db.add(sp)
        await db.commit()
        await db.refresh(sp)
    return {
        "id": sp.id,
        "name": sp.name,
        "pronoun_style": sp.pronoun_style,
        "avg_sentence_length": sp.avg_sentence_length,
        "preferred_tone": sp.preferred_tone,
        "writing_style": sp.writing_style,
        "stylometric_dna": sp.stylometric_dna,
        "learned_rules": sp.learned_rules,
        "banned_phrases": sp.banned_phrases,
        "sample_paragraphs": sp.sample_paragraphs,
        "edit_learn_count": sp.edit_learn_count,
    }


@app.put("/api/style/profile")
async def update_style_profile(
    body: StyleUpdatePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one()
    sp.name = body.name
    sp.pronoun_style = body.pronoun_style
    sp.avg_sentence_length = body.avg_sentence_length
    sp.preferred_tone = body.preferred_tone
    sp.writing_style = body.writing_style
    sp.learned_rules = body.learned_rules
    sp.banned_phrases = body.banned_phrases
    await db.commit()
    return {"ok": True}


@app.post("/api/style/analyze-samples")
async def analyze_user_samples_endpoint(
    body: StyleSamplesPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one()
    res = analyze_writing_samples(body.samples)
    sp.avg_sentence_length = res["avg_sentence_length"]
    sp.pronoun_style = res["pronoun_style"]
    sp.stylometric_dna = res["stylometric_dna"]
    sp.sample_paragraphs = [s.strip()[:380] for s in body.samples if s.strip()][:6]
    rule = f"Học từ bài mẫu: giữ nhịp câu ~{res['avg_sentence_length']} từ, xưng hô '{res['pronoun_style']}' ({res['stylometric_dna']['rhythm']})."
    rules = list(sp.learned_rules or [])
    if rule not in rules:
        rules.insert(0, rule)
    sp.learned_rules = rules[:15]
    await db.commit()
    return {"ok": True, "analysis": res, "learned_rules": sp.learned_rules}


# ==================== CONTENT GENERATION, SCORING & HUMANIZER (REQ 2 & 6) ====================

class SuggestTitlesPayload(BaseModel):
    topic: str
    main_keyword: str = ""
    platform: str = "seo_google"
    vault_id: str | None = None


class GenerateArticlePayload(BaseModel):
    vault_id: str | None = "auto"
    skill_id: str | None = None
    topic: str
    platform: str = "seo_google"
    writing_style: str = "Phân tích chuyên sâu & Thực chiến"
    tone_of_voice: str = "Chuyên nghiệp"
    target_length: str = "1200-1500 từ"
    title: str = ""
    main_keyword: str = ""
    secondary_keywords: list[str] = Field(default_factory=list)
    use_personal_style: bool = True
    custom_vars: dict[str, str] = Field(default_factory=dict)
    ollama_client_html: str | None = None  # Khi trình duyệt tự gọi Ollama Local và gửi kết quả lên chấm điểm


class EvaluatePayload(BaseModel):
    article_id: str | None = None
    vault_id: str | None = None
    title: str = ""
    meta_description: str = ""
    main_keyword: str = ""
    secondary_keywords: list[str] = Field(default_factory=list)
    content_html: str = ""


@app.post("/api/content/suggest-titles")
async def suggest_titles_endpoint(body: SuggestTitlesPayload, db: AsyncSession = Depends(get_db)):
    vault = None
    vaults = (await db.execute(select(IndustryVault))).scalars().all()
    if body.vault_id and body.vault_id != "auto":
        vault = next((v for v in vaults if v.id == body.vault_id), None)
    if vault is None and vaults:
        cls_res = classify_industry(f"{body.topic} {body.main_keyword}", vaults)
        vault = next((v for v in vaults if v.id == cls_res["matched_vault_id"]), vaults[0])

    titles = suggest_titles_by_platform(
        topic=body.topic,
        main_keyword=body.main_keyword or body.topic,
        platform=body.platform,
        industry_name=vault.name if vault else "Đa ngành",
        vault_obj=vault,
    )
    return {
        "detected_industry": vault.name if vault else "Đa ngành",
        "detected_vault_id": vault.id if vault else None,
        "titles": titles,
    }


@app.post("/api/content/prepare-ollama-prompt")
async def prepare_ollama_prompt_endpoint(
    body: GenerateArticlePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vaults = (await db.execute(select(IndustryVault))).scalars().all()
    vault = next((v for v in vaults if v.id == body.vault_id), None) if body.vault_id and body.vault_id != "auto" else None
    if vault is None and vaults:
        cls_res = classify_industry(f"{body.topic} {body.main_keyword}", vaults)
        vault = next((v for v in vaults if v.id == cls_res["matched_vault_id"]), vaults[0])

    skill = (await db.execute(select(Skill).where(Skill.id == body.skill_id))).scalar_one_or_none() if body.skill_id else None
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none() if body.use_personal_style else None
    chunks = (await db.execute(select(KnowledgeChunk).where(KnowledgeChunk.vault_id == vault.id))).scalars().all() if vault else []
    rag = retrieve_relevant_chunks(f"{body.topic} {body.main_keyword}", chunks, top_k=4)

    sys_p, usr_p = build_generation_prompts(
        industry_name=vault.name if vault else "Đa ngành",
        topic=body.topic,
        platform=body.platform,
        writing_style=body.writing_style,
        tone_of_voice=body.tone_of_voice,
        target_length=body.target_length,
        title=body.title,
        main_keyword=body.main_keyword or body.topic,
        secondary_keywords=body.secondary_keywords,
        skill_obj=skill,
        vault_obj=vault,
        style_profile=sp,
        rag_chunks=rag,
        custom_vars=body.custom_vars,
    )
    return {"system_prompt": sys_p, "user_prompt": usr_p, "vault_id": vault.id if vault else None}


@app.post("/api/content/generate")
async def generate_article_endpoint(
    body: GenerateArticlePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Tự động xác định ngành nghề từ Bộ não thứ 2 nếu để 'auto'
    vaults = (await db.execute(select(IndustryVault))).scalars().all()
    vault = None
    auto_classified = False
    if body.vault_id and body.vault_id != "auto":
        vault = next((v for v in vaults if v.id == body.vault_id), None)
    if vault is None:
        auto_classified = True
        cls_res = classify_industry(f"{body.topic} {body.main_keyword} {body.title}", vaults)
        if cls_res["should_create_new"] or not cls_res["matched_vault_id"]:
            vault = IndustryVault(
                user_id=user.id,
                name=cls_res["industry_name"],
                slug=slugify_vi(cls_res["industry_name"]),
                description=f"Kho tri thức tự động phân loại cho ngành {cls_res['industry_name']}.",
                terminology_lexicon=cls_res.get("suggested_terms", []),
                brand_tone_colors=["#0F4C5C", "#C8963E", "#F7F5F0"],
                auto_learn=True,
                knowledge_count=0,
            )
            db.add(vault)
            await db.flush()
        else:
            vault = next((v for v in vaults if v.id == cls_res["matched_vault_id"]), vaults[0])

    skill = (await db.execute(select(Skill).where(Skill.id == body.skill_id))).scalar_one_or_none() if body.skill_id else None
    if skill:
        skill.usage_count = (skill.usage_count or 0) + 1

    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none() if body.use_personal_style else None
    chunks = (await db.execute(select(KnowledgeChunk).where(KnowledgeChunk.vault_id == vault.id))).scalars().all()
    rag = retrieve_relevant_chunks(f"{body.topic} {body.main_keyword}", chunks, top_k=4)

    # 2. Xác định cổng AI người dùng đang cấu hình
    pcfg = (await db.execute(select(ProviderConfig).where(ProviderConfig.user_id == user.id))).scalar_one_or_none()
    sys_9r = (await db.execute(select(SystemSetting).where(SystemSetting.key == "ai_free_9router"))).scalar_one_or_none()
    active_prov = pcfg.active_provider if pcfg else "free_9router"

    mk = (body.main_keyword or body.topic).strip()
    sks = [s.strip() for s in body.secondary_keywords if s.strip()]
    if not sks and vault and vault.terminology_lexicon:
        sks = vault.terminology_lexicon[:2]

    sys_p, usr_p = build_generation_prompts(
        industry_name=vault.name,
        topic=body.topic,
        platform=body.platform,
        writing_style=body.writing_style,
        tone_of_voice=body.tone_of_voice,
        target_length=body.target_length,
        title=body.title,
        main_keyword=mk,
        secondary_keywords=sks,
        skill_obj=skill,
        vault_obj=vault,
        style_profile=sp,
        rag_chunks=rag,
        custom_vars=body.custom_vars,
    )

    generated: dict[str, str] | None = None
    model_used = "9router/auto-free"

    if body.ollama_client_html:
        generated = {
            "title": body.title or suggest_titles_by_platform(topic=body.topic, main_keyword=mk, platform=body.platform, industry_name=vault.name, vault_obj=vault)[0]["title"],
            "meta_description": f"Phân tích {mk} chuyên sâu trong lĩnh vực {vault.name}."[:160],
            "content_html": body.ollama_client_html,
        }
        active_prov = "ollama"
        model_used = "ollama-local-browser"
    else:
        if active_prov == "free_9router":
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if user.quota_reset_date != today:
                user.quota_reset_date = today
                user.daily_free_quota_used = 0
            user.daily_free_quota_used += 1
            s_val = (sys_9r.value if sys_9r else {}) or {}
            b_url = s_val.get("base_url", SYSTEM_9ROUTER_BASE_URL)
            a_key = s_val.get("api_key", SYSTEM_9ROUTER_API_KEY)
            model_used = s_val.get("default_model", "9router/auto-free")
        else:
            p_entry = (pcfg.providers_json or {}).get(active_prov, {}) if pcfg else {}
            b_url = p_entry.get("base_url", "")
            a_key = decrypt_api_key(p_entry.get("encrypted_api_key", ""))
            model_used = p_entry.get("text_model", active_prov)

        raw_llm = await call_remote_llm(
            provider=active_prov,
            base_url=b_url,
            api_key=a_key,
            model=model_used,
            system_prompt=sys_p,
            user_prompt=usr_p,
        )
        if raw_llm:
            try:
                json_match = re.search(r"\{.*\}", raw_llm, flags=re.DOTALL)
                parsed = json.loads(json_match.group(0) if json_match else raw_llm)
                if parsed.get("content_html"):
                    generated = {
                        "title": parsed.get("title") or body.title or body.topic[:60],
                        "meta_description": parsed.get("meta_description") or "",
                        "content_html": parsed["content_html"],
                    }
            except Exception:
                generated = {
                    "title": body.title or body.topic[:60],
                    "meta_description": f"Phân tích thực chiến về {mk} từ {vault.brand_name or vault.name}."[:160],
                    "content_html": "".join(f"<p>{ln.strip()}</p>" for ln in raw_llm.splitlines() if ln.strip()),
                }

    if generated is None:
        generated = synthesize_structured_article(
            industry_name=vault.name,
            topic=body.topic,
            platform=body.platform,
            writing_style=body.writing_style,
            tone_of_voice=body.tone_of_voice,
            target_length=body.target_length,
            title=body.title,
            main_keyword=mk,
            secondary_keywords=sks,
            skill_obj=skill,
            vault_obj=vault,
            style_profile=sp,
        )

    # Khử sáo rỗng AI tự động ngay từ đầu ra
    clean_html = humanize_vietnamese_html(
        generated["content_html"],
        pronoun_pair=sp.pronoun_style if sp else vault.pronoun_pair,
        banned_phrases=sp.banned_phrases if sp else [],
    )

    # 3. Chấm điểm Độ trùng lặp, Giọng văn AI & 65 tiêu chí SEO/AIO
    prev_articles = (await db.execute(select(Article.id, Article.title, Article.content_text).limit(40))).all()
    prev_pairs = [(aid, f"{atitle}|||{atext}") for aid, atitle, atext in prev_articles]

    uniq = evaluate_uniqueness(clean_html, prev_pairs)
    ai_v = evaluate_ai_voice(clean_html, sp.banned_phrases if sp else [])
    chk = evaluate_65_checklist(
        title=generated["title"],
        meta_description=generated["meta_description"],
        main_keyword=mk,
        secondary_keywords=sks,
        content_html=clean_html,
        uniqueness_result=uniq,
        vault=vault,
    )

    # 4. Tự động cập nhật Bộ não thứ 2 của ngành nghề
    brain_learned_terms: list[str] = []
    if vault.auto_learn:
        ext = extract_knowledge_units(clean_html, generated["title"])
        if ext["chunks"]:
            top_ch = ext["chunks"][0]
            db.add(
                KnowledgeChunk(
                    vault_id=vault.id,
                    chunk_type="article_extract",
                    title=f"Đúc kết từ bài: {generated['title'][:55]}",
                    content=top_ch["content"],
                    source_label="Tự động học khi viết bài",
                    embedding=compute_embedding(top_ch["content"]),
                )
            )
            vault.knowledge_count = (vault.knowledge_count or 0) + 1
        cur_lex = list(vault.terminology_lexicon or [])
        for t in ext["discovered_terms"][:3]:
            if t not in cur_lex and len(cur_lex) < 45:
                cur_lex.append(t)
                brain_learned_terms.append(t)
        vault.terminology_lexicon = cur_lex

    # 5. Lưu bài viết vào Lịch sử
    article = Article(
        user_id=user.id,
        vault_id=vault.id,
        skill_id=skill.id if skill else None,
        industry_name=vault.name,
        topic=body.topic,
        platform=body.platform,
        writing_style=body.writing_style,
        tone_of_voice=body.tone_of_voice,
        target_length=body.target_length,
        title=generated["title"],
        meta_description=generated["meta_description"],
        slug=slugify_vi(generated["title"]),
        main_keyword=mk,
        secondary_keywords=sks,
        content_html=clean_html,
        content_text=strip_html(clean_html),
        provider_used=active_prov,
        model_used=model_used,
        seo_score=chk["seo_score"],
        geo_score=chk["geo_score"],
        uniqueness_score=uniq["uniqueness_score"],
        human_score=ai_v["human_score"],
        ai_probability=ai_v["ai_probability"],
        checklist_results=chk,
        uniqueness_details=uniq,
        ai_voice_details=ai_v,
        status="draft",
        refresh_due_at=utcnow() + timedelta(days=90),
    )
    db.add(article)
    await db.flush()
    db.add(
        ArticleVersion(
            article_id=article.id,
            version_number=1,
            note=f"Khởi tạo bằng {active_prov}",
            title=article.title,
            content_html=article.content_html,
            seo_score=article.seo_score,
            geo_score=article.geo_score,
            human_score=article.human_score,
        )
    )
    await db.commit()

    return {
        "article_id": article.id,
        "vault_id": vault.id,
        "industry_name": vault.name,
        "auto_classified": auto_classified,
        "brain_learned_terms": brain_learned_terms,
        "rag_chunks_used": rag,
        "provider_used": active_prov,
        "model_used": model_used,
        "title": article.title,
        "meta_description": article.meta_description,
        "main_keyword": mk,
        "secondary_keywords": sks,
        "content_html": clean_html,
        "checklist": chk,
        "uniqueness": uniq,
        "ai_voice": ai_v,
    }


@app.post("/api/content/evaluate")
async def evaluate_draft_endpoint(
    body: EvaluatePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vault = (await db.execute(select(IndustryVault).where(IndustryVault.id == body.vault_id))).scalar_one_or_none() if body.vault_id else None
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none()
    prev_articles = (await db.execute(select(Article.id, Article.title, Article.content_text).limit(40))).all()
    prev_pairs = [(aid, f"{atitle}|||{atext}") for aid, atitle, atext in prev_articles]

    uniq = evaluate_uniqueness(body.content_html, prev_pairs, exclude_article_id=body.article_id)
    ai_v = evaluate_ai_voice(body.content_html, sp.banned_phrases if sp else [])
    chk = evaluate_65_checklist(
        title=body.title,
        meta_description=body.meta_description,
        main_keyword=body.main_keyword,
        secondary_keywords=body.secondary_keywords,
        content_html=body.content_html,
        uniqueness_result=uniq,
        vault=vault,
    )
    return {"checklist": chk, "uniqueness": uniq, "ai_voice": ai_v}


@app.post("/api/content/auto-fix")
async def auto_fix_article_endpoint(
    body: EvaluatePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vault = (await db.execute(select(IndustryVault).where(IndustryVault.id == body.vault_id))).scalar_one_or_none() if body.vault_id else None
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none()

    fixed = auto_fix_checklist_issues(
        title=body.title,
        meta_description=body.meta_description,
        main_keyword=body.main_keyword,
        secondary_keywords=body.secondary_keywords,
        content_html=body.content_html,
        vault=vault,
    )
    prev_articles = (await db.execute(select(Article.id, Article.title, Article.content_text).limit(40))).all()
    prev_pairs = [(aid, f"{atitle}|||{atext}") for aid, atitle, atext in prev_articles]
    uniq = evaluate_uniqueness(fixed["content_html"], prev_pairs, exclude_article_id=body.article_id)
    ai_v = evaluate_ai_voice(fixed["content_html"], sp.banned_phrases if sp else [])
    chk = evaluate_65_checklist(
        title=fixed["title"],
        meta_description=fixed["meta_description"],
        main_keyword=body.main_keyword,
        secondary_keywords=body.secondary_keywords,
        content_html=fixed["content_html"],
        uniqueness_result=uniq,
        vault=vault,
    )
    return {**fixed, "checklist": chk, "uniqueness": uniq, "ai_voice": ai_v}


@app.post("/api/content/humanize")
async def humanize_article_endpoint(
    body: EvaluatePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none()
    vault = (await db.execute(select(IndustryVault).where(IndustryVault.id == body.vault_id))).scalar_one_or_none() if body.vault_id else None
    humanized = humanize_vietnamese_html(
        body.content_html,
        pronoun_pair=sp.pronoun_style if sp else (vault.pronoun_pair if vault else "mình - bạn"),
        banned_phrases=sp.banned_phrases if sp else [],
    )
    ai_v = evaluate_ai_voice(humanized, sp.banned_phrases if sp else [])
    return {"content_html": humanized, "ai_voice": ai_v}


# ==================== IMAGE STUDIO (REQUIREMENT 7) ====================

class GenerateImagePayload(BaseModel):
    article_id: str | None = None
    vault_id: str | None = None
    platform: str = "seo_google"
    preset_label: str = "Chuẩn Google Discover & Featured (1200x675)"
    width: int = 1200
    height: int = 675
    headline: str
    main_keyword: str = ""
    context_summary: str = ""
    apply_brand_logo: bool = True


@app.post("/api/images/generate")
async def generate_image_endpoint(
    body: GenerateImagePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vault = (await db.execute(select(IndustryVault).where(IndustryVault.id == body.vault_id))).scalar_one_or_none() if body.vault_id else None
    pcfg = (await db.execute(select(ProviderConfig).where(ProviderConfig.user_id == user.id))).scalar_one_or_none()
    sys_9r = (await db.execute(select(SystemSetting).where(SystemSetting.key == "ai_free_9router"))).scalar_one_or_none()

    prov = pcfg.active_provider if pcfg else "free_9router"
    if prov == "free_9router":
        s_val = (sys_9r.value if sys_9r else {}) or {}
        b_url = s_val.get("base_url", SYSTEM_9ROUTER_BASE_URL)
        a_key = s_val.get("api_key", SYSTEM_9ROUTER_API_KEY)
        img_model = "flux-free"
    else:
        entry = (pcfg.providers_json or {}).get(prov, {}) if pcfg else {}
        b_url = entry.get("base_url", "")
        a_key = decrypt_api_key(entry.get("encrypted_api_key", ""))
        img_model = entry.get("image_model", "")

    plat_short = PLATFORM_PROFILES.get(body.platform, {}).get("short_label", body.platform.upper())
    res = await generate_platform_image(
        provider_mode=prov,
        base_url=b_url,
        api_key=a_key,
        image_model=img_model,
        width=max(300, min(2400, body.width)),
        height=max(300, min(2400, body.height)),
        headline=body.headline,
        main_keyword=body.main_keyword or body.headline,
        context_summary=body.context_summary,
        platform_label=f"{plat_short} · {body.width}x{body.height}",
        brand_colors=vault.brand_tone_colors if vault else None,
        brand_logo_text=(vault.brand_logo_text or vault.brand_name) if vault else "",
        apply_logo=body.apply_brand_logo,
    )

    img_rec = ArticleImage(
        article_id=body.article_id,
        user_id=user.id,
        platform=body.platform,
        preset_label=body.preset_label,
        width=res["width"],
        height=res["height"],
        prompt_used=res["prompt_used"],
        provider_used=res["provider_used"],
        file_path=res["file_path"],
        public_url=res["public_url"],
        alt_text=res["alt_text"],
        caption_italic=res["caption_italic"],
        file_size_kb=res["file_size_kb"],
        brand_logo_applied=res["brand_logo_applied"],
    )
    db.add(img_rec)
    await db.commit()
    return {"id": img_rec.id, **res}


@app.get("/api/images/files/{filename}")
async def serve_generated_image(filename: str):
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "", filename)
    fpath = GENERATED_IMG_DIR / safe_name
    if not fpath.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy file ảnh.")
    return FileResponse(fpath, media_type="image/webp")


@app.get("/api/images/sample-banner")
async def serve_dynamic_sample_banner(kw: str = Query(default="noi-dung-chuyen-nganh")):
    safe_slug = slugify_vi(kw)[:45]
    fpath = GENERATED_IMG_DIR / f"sample-{safe_slug}.webp"
    if not fpath.exists():
        readable = kw.replace("-", " ").strip().capitalize() or "Minh họa chuyên ngành"
        pil_img = render_editorial_brand_visual(
            width=1200,
            height=675,
            headline=readable,
            subtext="Ấn phẩm minh họa tối ưu chuẩn SEO & GEO Google (1200x675px · WebP)",
            platform_label="SEO & GEO VISUAL",
            brand_colors=["#0F4C5C", "#C8963E"],
            brand_logo_text="CONTENT STUDIO",
            apply_logo=True,
        )
        pil_img.save(fpath, format="WEBP", quality=82)
    return FileResponse(fpath, media_type="image/webp")


@app.get("/api/images")
async def list_generated_images(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(ArticleImage).where(ArticleImage.user_id == user.id).order_by(desc(ArticleImage.created_at)).limit(30)
        )
    ).scalars().all()
    return {
        "images": [
            {
                "id": r.id,
                "platform": r.platform,
                "preset_label": r.preset_label,
                "width": r.width,
                "height": r.height,
                "public_url": r.public_url,
                "caption_italic": r.caption_italic,
                "file_size_kb": r.file_size_kb,
                "brand_logo_applied": r.brand_logo_applied,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    }


# ==================== ARTICLE HISTORY & VERSIONING (REQUIREMENT 9) ====================

class SaveArticlePayload(BaseModel):
    title: str
    meta_description: str = ""
    main_keyword: str = ""
    secondary_keywords: list[str] = Field(default_factory=list)
    content_html: str
    status: str = "optimized"
    version_note: str = "Biên tập & tối ưu thủ công"


@app.get("/api/articles")
async def list_articles_history(
    platform: str | None = None,
    search: str | None = None,
    needs_refresh: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(select(Article).where(Article.user_id == user.id).order_by(desc(Article.created_at)))
    ).scalars().all()
    now = utcnow()
    items = []
    for a in rows:
        if platform and platform != "all" and a.platform != platform:
            continue
        if search and search.lower() not in f"{a.title} {a.topic} {a.industry_name} {a.main_keyword}".lower():
            continue
        due = a.refresh_due_at
        is_overdue = bool(due and due <= now)
        if needs_refresh and not is_overdue:
            continue
        items.append({
            "id": a.id,
            "vault_id": a.vault_id,
            "industry_name": a.industry_name,
            "topic": a.topic,
            "platform": a.platform,
            "title": a.title,
            "meta_description": a.meta_description,
            "main_keyword": a.main_keyword,
            "seo_score": a.seo_score,
            "geo_score": a.geo_score,
            "uniqueness_score": a.uniqueness_score,
            "human_score": a.human_score,
            "provider_used": a.provider_used,
            "status": a.status,
            "needs_refresh_90d": is_overdue,
            "refresh_due_at": due.isoformat() if due else None,
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat(),
        })
    return {"articles": items}


@app.get("/api/articles/{article_id}")
async def get_article_detail(article_id: str, db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Article).where(Article.id == article_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
    versions = (
        await db.execute(
            select(ArticleVersion).where(ArticleVersion.article_id == article_id).order_by(desc(ArticleVersion.version_number))
        )
    ).scalars().all()
    return {
        "article": {
            "id": a.id,
            "vault_id": a.vault_id,
            "skill_id": a.skill_id,
            "industry_name": a.industry_name,
            "topic": a.topic,
            "platform": a.platform,
            "writing_style": a.writing_style,
            "tone_of_voice": a.tone_of_voice,
            "target_length": a.target_length,
            "title": a.title,
            "meta_description": a.meta_description,
            "main_keyword": a.main_keyword,
            "secondary_keywords": a.secondary_keywords,
            "content_html": a.content_html,
            "provider_used": a.provider_used,
            "model_used": a.model_used,
            "seo_score": a.seo_score,
            "geo_score": a.geo_score,
            "uniqueness_score": a.uniqueness_score,
            "human_score": a.human_score,
            "checklist_results": a.checklist_results,
            "uniqueness_details": a.uniqueness_details,
            "ai_voice_details": a.ai_voice_details,
            "status": a.status,
            "created_at": a.created_at.isoformat(),
        },
        "versions": [
            {
                "id": v.id,
                "version_number": v.version_number,
                "note": v.note,
                "title": v.title,
                "seo_score": v.seo_score,
                "geo_score": v.geo_score,
                "human_score": v.human_score,
                "created_at": v.created_at.isoformat(),
            }
            for v in versions
        ],
    }


@app.put("/api/articles/{article_id}")
async def save_and_learn_from_article(
    article_id: str,
    body: SaveArticlePayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    a = (await db.execute(select(Article).where(Article.id == article_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")

    old_html = a.content_html
    vault = (await db.execute(select(IndustryVault).where(IndustryVault.id == a.vault_id))).scalar_one_or_none() if a.vault_id else None
    sp = (await db.execute(select(StyleProfile).where(StyleProfile.user_id == user.id))).scalar_one_or_none()

    # Học tự động từ chỉnh sửa của người dùng (Implicit Style Diff-Learning)
    style_learning = {"new_rules": []}
    if sp and old_html and old_html.strip() != body.content_html.strip():
        style_learning = learn_from_edit_diff(old_html, body.content_html, sp)

    prev_articles = (await db.execute(select(Article.id, Article.title, Article.content_text).limit(40))).all()
    prev_pairs = [(aid, f"{atitle}|||{atext}") for aid, atitle, atext in prev_articles]
    uniq = evaluate_uniqueness(body.content_html, prev_pairs, exclude_article_id=article_id)
    ai_v = evaluate_ai_voice(body.content_html, sp.banned_phrases if sp else [])
    chk = evaluate_65_checklist(
        title=body.title,
        meta_description=body.meta_description,
        main_keyword=body.main_keyword or a.main_keyword,
        secondary_keywords=body.secondary_keywords or a.secondary_keywords,
        content_html=body.content_html,
        uniqueness_result=uniq,
        vault=vault,
    )

    a.title = body.title
    a.meta_description = body.meta_description
    if body.main_keyword:
        a.main_keyword = body.main_keyword
    if body.secondary_keywords:
        a.secondary_keywords = body.secondary_keywords
    a.content_html = body.content_html
    a.content_text = strip_html(body.content_html)
    a.status = body.status
    a.seo_score = chk["seo_score"]
    a.geo_score = chk["geo_score"]
    a.uniqueness_score = uniq["uniqueness_score"]
    a.human_score = ai_v["human_score"]
    a.ai_probability = ai_v["ai_probability"]
    a.checklist_results = chk
    a.uniqueness_details = uniq
    a.ai_voice_details = ai_v
    a.refresh_due_at = utcnow() + timedelta(days=90)

    v_cnt = len((await db.execute(select(ArticleVersion.id).where(ArticleVersion.article_id == article_id))).all())
    db.add(
        ArticleVersion(
            article_id=article_id,
            version_number=v_cnt + 1,
            note=body.version_note,
            title=a.title,
            content_html=a.content_html,
            seo_score=a.seo_score,
            geo_score=a.geo_score,
            human_score=a.human_score,
        )
    )
    await db.commit()
    return {"ok": True, "style_learning": style_learning, "checklist": chk, "uniqueness": uniq, "ai_voice": ai_v}


@app.delete("/api/articles/{article_id}")
async def delete_article_endpoint(article_id: str, db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Article).where(Article.id == article_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
    vers = (await db.execute(select(ArticleVersion).where(ArticleVersion.article_id == article_id))).scalars().all()
    for v in vers:
        await db.delete(v)
    await db.delete(a)
    await db.commit()
    return {"ok": True}


# ==================== FEEDBACK, DONATE QR & ADMIN (REQUIREMENTS 10 & 11) ====================

class FeedbackPayload(BaseModel):
    author_name: str = "Chuyên gia Content"
    author_email: str = ""
    category: str = "feature"
    title: str
    message: str
    rating: int = 5


class AdminFeedbackUpdate(BaseModel):
    status: str
    admin_note: str = ""


class AdminSettingsPayload(BaseModel):
    ai_free_9router: dict[str, Any] | None = None
    integrations: dict[str, Any] | None = None
    author_qr: dict[str, Any] | None = None


@app.get("/api/feedback")
async def list_feedbacks(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Feedback).order_by(desc(Feedback.upvotes), desc(Feedback.created_at)))).scalars().all()
    return {
        "feedbacks": [
            {
                "id": f.id,
                "author_name": f.author_name,
                "category": f.category,
                "title": f.title,
                "message": f.message,
                "rating": f.rating,
                "upvotes": f.upvotes,
                "status": f.status,
                "admin_note": f.admin_note,
                "telegram_synced": f.telegram_synced,
                "gsheet_synced": f.gsheet_synced,
                "created_at": f.created_at.isoformat(),
            }
            for f in rows
        ]
    }


@app.post("/api/feedback")
async def submit_feedback(
    body: FeedbackPayload,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    integ = (await db.execute(select(SystemSetting).where(SystemSetting.key == "integrations"))).scalar_one_or_none()
    ival = (integ.value if integ else {}) or {}

    payload_dict = {
        "author_name": body.author_name.strip() or user.full_name,
        "author_email": body.author_email.strip() or user.email,
        "category": body.category,
        "title": body.title.strip(),
        "message": body.message.strip(),
        "rating": max(1, min(5, body.rating)),
        "created_at": utcnow().isoformat(),
    }

    tele_ok = await notify_telegram_feedback(
        ival.get("telegram_bot_token", ""),
        ival.get("telegram_chat_id", ""),
        payload_dict,
    )
    gs_ok = await sync_google_sheets_webhook(
        ival.get("google_sheets_webhook_url", ""),
        payload_dict,
    )

    fb = Feedback(
        user_id=user.id,
        author_name=payload_dict["author_name"],
        author_email=payload_dict["author_email"],
        category=payload_dict["category"],
        title=payload_dict["title"],
        message=payload_dict["message"],
        rating=payload_dict["rating"],
        upvotes=1,
        status="new",
        telegram_synced=tele_ok,
        gsheet_synced=gs_ok,
    )
    db.add(fb)
    await db.commit()
    return {"id": fb.id, "telegram_synced": tele_ok, "gsheet_synced": gs_ok}


@app.post("/api/feedback/{feedback_id}/upvote")
async def upvote_feedback(feedback_id: str, db: AsyncSession = Depends(get_db)):
    fb = (await db.execute(select(Feedback).where(Feedback.id == feedback_id))).scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="Không tìm thấy góp ý.")
    fb.upvotes = (fb.upvotes or 0) + 1
    await db.commit()
    return {"upvotes": fb.upvotes}


@app.get("/api/feedback/export.tsv", response_class=PlainTextResponse)
async def export_feedback_tsv(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Feedback).order_by(desc(Feedback.created_at)))).scalars().all()
    lines = ["Thoi_gian\tPhan_loai\tNguoi_gui\tDanh_gia\tLuot_ung_ho\tTrang_thai\tTieu_de\tNoi_dung"]
    for f in rows:
        clean_msg = re.sub(r"[\t\r\n]+", " ", f.message or "")
        lines.append(
            f"{f.created_at.strftime('%Y-%m-%d %H:%M')}\t{f.category}\t{f.author_name}\t{f.rating}\t{f.upvotes}\t{f.status}\t{f.title}\t{clean_msg}"
        )
    return "\n".join(lines)


@app.get("/api/donate/config")
async def get_donate_config(
    amount: int = Query(default=50000),
    message: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    setting = (await db.execute(select(SystemSetting).where(SystemSetting.key == "author_qr"))).scalar_one_or_none()
    val = (setting.value if setting else {}) or {}
    msg = message.strip() or val.get("default_message", "Ung ho AI Content Studio")
    qr_info = build_vietqr_info(
        bank_id=val.get("bank_id", "MB"),
        account_no=val.get("account_no", "0988686868"),
        account_name=val.get("account_name", "TAC GIA AI CONTENT STUDIO"),
        amount=amount,
        message=msg,
    )
    return {
        "banks": POPULAR_VN_BANKS,
        "config": val,
        "qr": qr_info,
    }


@app.get("/api/donate/qr.png")
async def serve_donate_qr_png(
    bank_id: str = Query(default="MB"),
    account_no: str = Query(default="0988686868"),
    account_name: str = Query(default="TAC GIA AI CONTENT STUDIO"),
    amount: int = Query(default=50000),
    message: str = Query(default="Ung ho AI Content Studio"),
):
    png_bytes = render_local_donate_qr_png(
        bank_id=bank_id,
        account_no=account_no,
        account_name=account_name,
        amount=amount,
        message=message,
    )
    return Response(content=png_bytes, media_type="image/png")


@app.get("/api/admin/settings")
async def get_admin_settings(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(SystemSetting))).scalars().all()
    return {r.key: r.value for r in rows}


@app.put("/api/admin/settings")
async def update_admin_settings(body: AdminSettingsPayload, db: AsyncSession = Depends(get_db)):
    for key, payload in [
        ("ai_free_9router", body.ai_free_9router),
        ("integrations", body.integrations),
        ("author_qr", body.author_qr),
    ]:
        if payload is not None:
            row = (await db.execute(select(SystemSetting).where(SystemSetting.key == key))).scalar_one_or_none()
            if row:
                row.value = payload
            else:
                db.add(SystemSetting(key=key, value=payload))
    await db.commit()
    return {"ok": True}


@app.put("/api/admin/feedback/{feedback_id}")
async def update_feedback_status(feedback_id: str, body: AdminFeedbackUpdate, db: AsyncSession = Depends(get_db)):
    fb = (await db.execute(select(Feedback).where(Feedback.id == feedback_id))).scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="Không tìm thấy góp ý.")
    fb.status = body.status
    fb.admin_note = body.admin_note
    await db.commit()
    return {"ok": True}
