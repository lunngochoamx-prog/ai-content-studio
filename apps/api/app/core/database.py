import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from app.core.config import DATABASE_URL


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), default="Chuyên gia Content")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="user")
    daily_free_quota_limit: Mapped[int] = mapped_column(Integer, default=50)
    daily_free_quota_used: Mapped[int] = mapped_column(Integer, default=0)
    quota_reset_date: Mapped[str] = mapped_column(String(16), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ProviderConfig(Base):
    __tablename__ = "provider_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True, index=True)
    active_provider: Mapped[str] = mapped_column(String(48), default="free_9router")
    providers_json: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class IndustryVault(Base):
    __tablename__ = "industry_vaults"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    brand_name: Mapped[str] = mapped_column(String(200), default="")
    brand_tone_colors: Mapped[list] = mapped_column(JSON, default=list)
    brand_logo_text: Mapped[str] = mapped_column(String(120), default="")
    pronoun_pair: Mapped[str] = mapped_column(String(120), default="Chúng tôi - Quý khách")
    messaging_general: Mapped[str] = mapped_column(Text, default="")
    messaging_category: Mapped[str] = mapped_column(Text, default="")
    messaging_product: Mapped[str] = mapped_column(Text, default="")
    target_audience: Mapped[str] = mapped_column(Text, default="")
    terminology_lexicon: Mapped[list] = mapped_column(JSON, default=list)
    compliance_taboo: Mapped[list] = mapped_column(JSON, default=list)
    internal_links: Mapped[list] = mapped_column(JSON, default=list)
    harvard_references: Mapped[list] = mapped_column(JSON, default=list)
    case_studies: Mapped[list] = mapped_column(JSON, default=list)
    auto_learn: Mapped[bool] = mapped_column(Boolean, default=True)
    knowledge_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    vault_id: Mapped[str] = mapped_column(String(36), ForeignKey("industry_vaults.id"), index=True)
    chunk_type: Mapped[str] = mapped_column(String(48), default="insight")
    title: Mapped[str] = mapped_column(String(300), default="")
    content: Mapped[str] = mapped_column(Text)
    source_label: Mapped[str] = mapped_column(String(300), default="Hệ thống")
    embedding: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class StyleProfile(Base):
    __tablename__ = "style_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200), default="Phong cách cá nhân mặc định")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    pronoun_style: Mapped[str] = mapped_column(String(120), default="mình - bạn")
    avg_sentence_length: Mapped[float] = mapped_column(Float, default=22.0)
    preferred_tone: Mapped[str] = mapped_column(String(120), default="Chuyên nghiệp, thực chiến")
    writing_style: Mapped[str] = mapped_column(String(120), default="Phân tích trực diện & dẫn chứng thực tế")
    stylometric_dna: Mapped[dict] = mapped_column(JSON, default=dict)
    learned_rules: Mapped[list] = mapped_column(JSON, default=list)
    banned_phrases: Mapped[list] = mapped_column(JSON, default=list)
    sample_paragraphs: Mapped[list] = mapped_column(JSON, default=list)
    edit_learn_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(64), default="conversion")
    target_platforms: Mapped[list] = mapped_column(JSON, default=list)
    target_industry: Mapped[str] = mapped_column(String(120), default="Tất cả ngành nghề")
    description: Mapped[str] = mapped_column(Text, default="")
    outline_steps: Mapped[list] = mapped_column(JSON, default=list)
    system_instructions: Mapped[str] = mapped_column(Text, default="")
    custom_variables: Mapped[list] = mapped_column(JSON, default=list)
    example_output: Mapped[str] = mapped_column(Text, default="")
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    vault_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    skill_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    industry_name: Mapped[str] = mapped_column(String(200), default="")
    topic: Mapped[str] = mapped_column(String(500), default="")
    platform: Mapped[str] = mapped_column(String(64), default="seo_google", index=True)
    writing_style: Mapped[str] = mapped_column(String(120), default="Chuyên sâu & Thực chiến")
    tone_of_voice: Mapped[str] = mapped_column(String(120), default="Chuyên nghiệp")
    target_length: Mapped[str] = mapped_column(String(80), default="1200-1500 từ")
    title: Mapped[str] = mapped_column(String(500), default="")
    meta_description: Mapped[str] = mapped_column(String(500), default="")
    slug: Mapped[str] = mapped_column(String(300), default="")
    main_keyword: Mapped[str] = mapped_column(String(200), default="")
    secondary_keywords: Mapped[list] = mapped_column(JSON, default=list)
    content_html: Mapped[str] = mapped_column(Text, default="")
    content_text: Mapped[str] = mapped_column(Text, default="")
    provider_used: Mapped[str] = mapped_column(String(80), default="free_9router")
    model_used: Mapped[str] = mapped_column(String(120), default="9router-auto")
    seo_score: Mapped[int] = mapped_column(Integer, default=0)
    geo_score: Mapped[int] = mapped_column(Integer, default=0)
    uniqueness_score: Mapped[float] = mapped_column(Float, default=95.0)
    human_score: Mapped[float] = mapped_column(Float, default=90.0)
    ai_probability: Mapped[float] = mapped_column(Float, default=10.0)
    checklist_results: Mapped[dict] = mapped_column(JSON, default=dict)
    uniqueness_details: Mapped[dict] = mapped_column(JSON, default=dict)
    ai_voice_details: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(48), default="draft")
    refresh_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ArticleVersion(Base):
    __tablename__ = "article_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    article_id: Mapped[str] = mapped_column(String(36), ForeignKey("articles.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    note: Mapped[str] = mapped_column(String(255), default="Bản lưu khởi tạo")
    title: Mapped[str] = mapped_column(String(500), default="")
    content_html: Mapped[str] = mapped_column(Text, default="")
    seo_score: Mapped[int] = mapped_column(Integer, default=0)
    geo_score: Mapped[int] = mapped_column(Integer, default=0)
    human_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ArticleImage(Base):
    __tablename__ = "article_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    article_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    platform: Mapped[str] = mapped_column(String(64), default="seo_google")
    preset_label: Mapped[str] = mapped_column(String(120), default="SEO Google Featured (1200x675)")
    width: Mapped[int] = mapped_column(Integer, default=1200)
    height: Mapped[int] = mapped_column(Integer, default=675)
    prompt_used: Mapped[str] = mapped_column(Text, default="")
    provider_used: Mapped[str] = mapped_column(String(80), default="free_9router")
    file_path: Mapped[str] = mapped_column(String(500), default="")
    public_url: Mapped[str] = mapped_column(String(500), default="")
    alt_text: Mapped[str] = mapped_column(String(255), default="")
    caption_italic: Mapped[str] = mapped_column(String(120), default="")
    file_size_kb: Mapped[float] = mapped_column(Float, default=0.0)
    brand_logo_applied: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    author_name: Mapped[str] = mapped_column(String(200), default="Người dùng ẩn danh")
    author_email: Mapped[str] = mapped_column(String(255), default="")
    category: Mapped[str] = mapped_column(String(64), default="feature")
    title: Mapped[str] = mapped_column(String(300), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    rating: Mapped[int] = mapped_column(Integer, default=5)
    upvotes: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(48), default="new")
    admin_note: Mapped[str] = mapped_column(Text, default="")
    telegram_synced: Mapped[bool] = mapped_column(Boolean, default=False)
    gsheet_synced: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
