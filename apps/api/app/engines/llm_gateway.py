"""Unified Multi-Provider LLM Gateway:
Hỗ trợ System 9Router (Free mặc định), Custom 9Router, OpenAI, Gemini API, Claude API, DeepSeek API, OpenRouter và Ollama Local.
"""

import json
import re
import httpx
from app.data.seed_data import PLATFORM_PROFILES
from app.engines.vector_brain import slugify_vi

PROVIDER_CATALOG = [
    {
        "id": "free_9router",
        "name": "Gói Miễn Phí (System 9Router)",
        "badge": "Mặc định · Free",
        "base_url_default": "http://127.0.0.1:20128/v1",
        "default_model": "9router/auto-free",
        "requires_key": False,
        "description": "Tự động định tuyến qua cụm 9Router của hệ thống, xoay vòng tài khoản Free & tiết kiệm token.",
    },
    {
        "id": "ollama",
        "name": "Ollama Local (Chạy trên máy cá nhân)",
        "badge": "Local · Bảo mật",
        "base_url_default": "http://localhost:11434",
        "default_model": "qwen2.5:7b",
        "requires_key": False,
        "description": "Kết nối trực tiếp trình duyệt tới Ollama trên máy bạn (localhost:11434), không tốn phí API.",
    },
    {
        "id": "custom_9router",
        "name": "9Router Cá Nhân (Self-hosted)",
        "badge": "OpenAI-Compatible",
        "base_url_default": "http://localhost:20128/v1",
        "default_model": "auto",
        "requires_key": False,
        "description": "Kết nối tới cổng 9Router riêng trên máy hoặc VPS của bạn.",
    },
    {
        "id": "openai",
        "name": "OpenAI API",
        "badge": "Cloud API",
        "base_url_default": "https://api.openai.com/v1",
        "default_model": "gpt-4o",
        "requires_key": True,
        "description": "Sử dụng trực tiếp các mô hình GPT-4o, GPT-4.1 của OpenAI.",
    },
    {
        "id": "gemini",
        "name": "Google Gemini API",
        "badge": "Cloud API",
        "base_url_default": "https://generativelanguage.googleapis.com/v1beta",
        "default_model": "gemini-2.5-flash",
        "requires_key": True,
        "description": "Tốc độ nhanh, cửa sổ ngữ cảnh lớn và khả năng tiếng Việt xuất sắc từ Google.",
    },
    {
        "id": "claude",
        "name": "Anthropic Claude API",
        "badge": "Cloud API",
        "base_url_default": "https://api.anthropic.com/v1",
        "default_model": "claude-sonnet-4-20250514",
        "requires_key": True,
        "description": "Nổi bật về chiều sâu lập luận và giọng văn tự nhiên giàu cảm xúc.",
    },
    {
        "id": "deepseek",
        "name": "DeepSeek API",
        "badge": "Cloud API · Tiết kiệm",
        "base_url_default": "https://api.deepseek.com/v1",
        "default_model": "deepseek-chat",
        "requires_key": True,
        "description": "Chi phí tối ưu với khả năng phân tích cấu trúc sâu từ DeepSeek V3 / R1.",
    },
    {
        "id": "openrouter",
        "name": "OpenRouter API",
        "badge": "Multi-Model Cloud",
        "base_url_default": "https://openrouter.ai/api/v1",
        "default_model": "google/gemini-2.5-flash",
        "requires_key": True,
        "description": "Một API Key truy cập hơn 200 mô hình thương mại & mã nguồn mở.",
    },
]


def build_generation_prompts(
    *,
    industry_name: str,
    topic: str,
    platform: str,
    writing_style: str,
    tone_of_voice: str,
    target_length: str,
    title: str,
    main_keyword: str,
    secondary_keywords: list[str],
    skill_obj=None,
    vault_obj=None,
    style_profile=None,
    rag_chunks: list[dict] | None = None,
    custom_vars: dict | None = None,
) -> tuple[str, str]:
    """Xây dựng System Prompt & User Prompt hội tụ: Công thức Skill + Checklist 65 + Bộ não thứ 2 + Style DNA."""
    plat_info = PLATFORM_PROFILES.get(platform, PLATFORM_PROFILES["seo_google"])
    lexicon = (getattr(vault_obj, "terminology_lexicon", None) or [])[:14]
    taboos = getattr(vault_obj, "compliance_taboo", None) or []
    harvard_refs = getattr(vault_obj, "harvard_references", None) or []
    internal_links = getattr(vault_obj, "internal_links", None) or []
    case_studies = getattr(vault_obj, "case_studies", None) or []
    pronoun = (
        getattr(style_profile, "pronoun_style", None)
        or getattr(vault_obj, "pronoun_pair", None)
        or "mình - bạn"
    )
    learned_rules = getattr(style_profile, "learned_rules", None) or []
    banned_phrases = getattr(style_profile, "banned_phrases", None) or []

    skill_name = getattr(skill_obj, "name", "Kim Tự Tháp Ngược + AIDA")
    skill_steps = getattr(skill_obj, "outline_steps", []) or []
    skill_inst = getattr(skill_obj, "system_instructions", "")

    rag_text = "\n".join(f"- [{c['chunk_type']}] {c['content']}" for c in (rag_chunks or [])[:4])
    steps_text = "\n".join(f"- {s.get('step')}: {s.get('description')}" for s in skill_steps)
    plat_rules_text = "\n".join(f"- {r}" for r in plat_info["rules_summary"])

    system_prompt = f"""Bạn là Chuyên gia Nội dung Đa ngành tại Việt Nam, viết như con người thật giàu trải nghiệm nghề nghiệp.
NGÀNH NGHỀ: {industry_name}
NỀN TẢNG MỤC TIÊU: {plat_info['label']}
CÔNG THỨC ÁP DỤNG: {skill_name}
PHONG CÁCH VIẾT: {writing_style} | GIỌNG VĂN: {tone_of_voice} | ĐỘ DÀI: {target_length}
CÁCH XƯNG HÔ THỐNG NHẤT: {pronoun}

QUY TẮC TỐI ƯU NỀN TẢNG & CHECKLIST 65 TIÊU CHÍ:
{plat_rules_text}

CẤU TRÚC CÔNG THỨC BẮT BUỘC:
{steps_text}
{skill_inst}

TRI THỨC BỘ NÃO THỨ 2 CỦA NGÀNH '{industry_name}':
- Thương hiệu: {getattr(vault_obj, 'brand_name', 'Chuyên gia ngành')}
- Thông điệp cốt lõi: {getattr(vault_obj, 'messaging_general', '')} | {getattr(vault_obj, 'messaging_product', '')}
- Trường từ vựng chuyên ngành (cần phủ >=3 từ mỗi đoạn): {', '.join(lexicon)}
- Nguồn Harvard tham khảo: {json.dumps(harvard_refs, ensure_ascii=False)}
- Liên kết nội bộ & sản phẩm cần chèn: {json.dumps(internal_links, ensure_ascii=False)}
- Case study thực tế: {json.dumps(case_studies, ensure_ascii=False)}
- Từ cấm tuyệt đối không dùng (Luật Quảng cáo & ngành): {', '.join(taboos)}
{rag_text}

PHONG CÁCH CÁ NHÂN CỦA NGƯỜI DÙNG (STYLE DNA):
- Độ dài câu ưa thích: ~{getattr(style_profile, 'avg_sentence_length', 22)} từ/câu, đoạn ngắn 60-80 từ.
- Quy tắc đã học từ người dùng: {'; '.join(learned_rules[:5])}
- Cụm từ sáo rỗng cấm dùng: trong bối cảnh hiện nay, không thể phủ nhận, chìa khóa vàng, bức tranh toàn cảnh, tóm lại, {', '.join(banned_phrases[:8])}

ĐỊNH DẠNG ĐẦU RA:
Trả về JSON hợp lệ với 3 trường:
{{
  "title": "Tiêu đề tối ưu nền tảng (<63 ký tự nếu SEO/GEO, chứa từ khóa chính ở đầu)",
  "meta_description": "Mô tả Meta <165 ký tự chứa từ khóa chính và chạm insight",
  "content_html": "Nội dung HTML sạch sử dụng <p>, <h2>, <h3>, <ul><li>, <table>, <strong>, <em>, <a href>"
}}"""

    user_prompt = (
        f"Hãy viết bài hoàn chỉnh về chủ đề: '{topic}'.\n"
        f"Tiêu đề định hướng: '{title or topic}'.\n"
        f"Từ khóa chính: '{main_keyword or topic}'.\n"
        f"Từ khóa phụ: '{', '.join(secondary_keywords or [])}'.\n"
        f"Biến bổ sung: {json.dumps(custom_vars or {}, ensure_ascii=False)}"
    )
    return system_prompt, user_prompt


async def call_remote_llm(
    *,
    provider: str,
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    timeout: float = 28.0,
) -> str | None:
    """Gọi thực tế tới 9Router / OpenAI / Gemini / Claude / DeepSeek / OpenRouter / Ollama."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            if provider == "gemini" and "generativelanguage.googleapis.com" in base_url:
                if not api_key:
                    return None
                m_name = model or "gemini-2.5-flash"
                url = f"{base_url.rstrip('/')}/models/{m_name}:generateContent?key={api_key}"
                resp = await client.post(
                    url,
                    json={
                        "systemInstruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                        "generationConfig": {"temperature": 0.7},
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                return None

            if provider == "claude":
                if not api_key:
                    return None
                url = f"{base_url.rstrip('/')}/messages"
                resp = await client.post(
                    url,
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model or "claude-sonnet-4-20250514",
                        "max_tokens": 4096,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_prompt}],
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["content"][0]["text"]
                return None

            if provider == "ollama":
                url = f"{base_url.rstrip('/')}/api/chat"
                resp = await client.post(
                    url,
                    json={
                        "model": model or "qwen2.5:7b",
                        "stream": False,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                    },
                )
                if resp.status_code == 200:
                    return resp.json().get("message", {}).get("content")
                return None

            # OpenAI-compatible: free_9router, custom_9router, openai, deepseek, openrouter
            if provider in {"openai", "deepseek", "openrouter"} and not api_key:
                return None
            url = f"{base_url.rstrip('/')}/chat/completions"
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            resp = await client.post(
                url,
                headers=headers,
                json={
                    "model": model or "auto",
                    "temperature": 0.72,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception:
        return None
    return None


def suggest_titles_by_platform(
    *,
    topic: str,
    main_keyword: str,
    platform: str,
    industry_name: str,
    vault_obj=None,
) -> list[dict]:
    """Sinh 6 phương án tiêu đề bám chuẩn ký tự và tâm lý từng nền tảng."""
    kw = (main_keyword or topic or "giải pháp thực tế").strip()
    kw_cap = kw[:1].upper() + kw[1:]
    brand = getattr(vault_obj, "brand_name", "") or industry_name
    lex = getattr(vault_obj, "terminology_lexicon", None) or ["quy trình chuẩn", "tối ưu chi phí"]
    l1 = lex[0] if lex else "thực tế"

    if platform in ("seo_google", "geo_google", "website"):
        raw = [
            (f"{kw_cap}: Quy trình chuẩn & bảng giá 2026", "Search Intent thương mại · Từ khóa đứng đầu"),
            (f"{kw_cap} là gì? 5 tiêu chí đánh giá thực tế", "Dạng câu hỏi chuẩn GEO / AI Overviews"),
            (f"{kw_cap}: Kinh nghiệm tối ưu {l1}", "Chạm insight chuyên môn · <63 ký tự"),
            (f"Cách triển khai {kw} an toàn, hiệu quả cao", "Hướng dẫn How-to thực chiến"),
            (f"{kw_cap}: Phân tích số liệu & lưu ý quan trọng", "Tăng thẩm quyền E-E-A-T"),
            (f"So sánh {kw}: Nên chọn phương án nào?", "Hỗ trợ ra quyết định nhanh"),
        ]
        results = []
        for t, reason in raw:
            trimmed = t if len(t) < 63 else t[:60].rsplit(" ", 1)[0]
            results.append({"title": trimmed, "char_count": len(trimmed), "hook_type": reason})
        return results

    if platform == "tiktok":
        raw = [
            (f"Đừng vội chọn {kw} trước khi kiểm tra 3 thông số này!", "Hook cảnh báo 3 giây đầu"),
            (f"Sự thật về {kw} mà 80% người mới thường hiểu nhầm", "Phá vỡ lầm tưởng · Giữ chân xem hết"),
            (f"3 bước áp dụng {kw} tiết kiệm 35% chi phí thực tế", "Con số cụ thể · Dễ lưu video"),
            (f"Bóc tách thực tế 1 ca {kw} tại {brand} diễn ra thế nào?", "Hậu trường thực chứng (Behind the scenes)"),
            (f"Tại sao cùng làm {kw} nhưng kết quả chênh nhau gấp đôi?", "Kích thích tò mò bình luận"),
            (f"Checklist 60 giây tự kiểm tra {kw} chuẩn chuyên gia", "Giá trị bỏ túi · TikTok SEO"),
        ]
        return [{"title": t, "char_count": len(t), "hook_type": r} for t, r in raw]

    # Facebook
    raw = [
        (f"Mất 3 tháng loay hoay với {kw}, mình rút ra 3 bài học đắt giá này", "Storytelling cá nhân · Tương tác tự nhiên"),
        (f"9/10 người hỏi mình về {kw} đều bỏ sót đúng chi tiết cốt lõi sau", "Hook tò mò trước nút 'Xem thêm'"),
        (f"Bóc tách số liệu thực tế khi triển khai {kw} cho khách hàng tuần qua", "Case study thực chiến · Uy tín cao"),
        (f"Làm sao tối ưu {kw} vừa chuẩn {l1} vừa không đội ngân sách?", "Câu hỏi chạm đúng nỗi đau"),
        (f"3 hiểu lầm phổ biến nhất về {kw} khiến nhiều người tốn tiền oan", "Myth vs Truth · Dễ được chia sẻ"),
        (f"Góc nhìn thẳng thắn từ {brand}: Khi nào bạn thực sự cần {kw}?", "Định vị chuyên gia minh bạch"),
    ]
    return [{"title": t, "char_count": len(t), "hook_type": r} for t, r in raw]


def synthesize_structured_article(
    *,
    industry_name: str,
    topic: str,
    platform: str,
    writing_style: str,
    tone_of_voice: str,
    target_length: str,
    title: str,
    main_keyword: str,
    secondary_keywords: list[str],
    skill_obj=None,
    vault_obj=None,
    style_profile=None,
) -> dict:
    """Bộ tổng hợp bài viết tiếng Việt chuẩn cấu trúc công thức, Bộ não thứ 2 & 65 tiêu chí khi chạy chế độ Free nội bộ."""
    kw = (main_keyword or topic or "giải pháp chuyên ngành").strip()
    kw_cap = kw[:1].upper() + kw[1:]
    sk1 = (secondary_keywords[0] if secondary_keywords else "quy trình triển khai thực tế").strip()
    sk2 = (secondary_keywords[1] if len(secondary_keywords) > 1 else "tối ưu hiệu quả chi phí").strip()

    brand = getattr(vault_obj, "brand_name", None) or "Đội ngũ Chuyên gia"
    pronoun = (
        getattr(style_profile, "pronoun_style", None)
        or getattr(vault_obj, "pronoun_pair", None)
        or "chúng tôi - bạn"
    )
    p_self, _, p_reader = pronoun.partition("-")
    p_self = (p_self.strip() or "chúng tôi")
    p_reader = (p_reader.strip() or "bạn")

    lex = list(getattr(vault_obj, "terminology_lexicon", None) or [
        "quy trình chuẩn hóa", "thẩm định thực tế", "hiệu suất vận hành",
        "kiểm soát chất lượng", "minh bạch chi phí", "đo lường định kỳ",
    ])
    while len(lex) < 8:
        lex.append("tiêu chuẩn chuyên môn")

    refs = list(getattr(vault_obj, "harvard_references", None) or [
        {"citation": "(Báo cáo Ngành Việt Nam, 2026)", "title": f"Khảo sát ứng dụng {kw}", "url": "https://gov.vn"}
    ])
    links = list(getattr(vault_obj, "internal_links", None) or [
        {"title": f"Hướng dẫn thẩm định {lex[0]} chi tiết", "url": f"https://website.vn/blog/{slugify_vi(kw)}", "type": "article"},
        {"title": f"Giải pháp {kw} chuyên sâu tại {brand}", "url": f"https://website.vn/san-pham/{slugify_vi(kw)}", "type": "product"},
    ])
    cases = list(getattr(vault_obj, "case_studies", None) or [
        f"Dữ liệu thực tế từ 120 dự án triển khai {kw} tại {brand} ghi nhận mức độ hài lòng đạt 94.5% và tiết kiệm 28% thời gian xử lý."
    ])
    msg_gen = getattr(vault_obj, "messaging_general", "") or f"{brand} đặt sự minh bạch và hiệu quả thực chất lên hàng đầu."
    msg_prod = getattr(vault_obj, "messaging_product", "") or f"Giải pháp {kw} được cá nhân hóa sát nhu cầu thực tế."

    suggestions = suggest_titles_by_platform(
        topic=topic, main_keyword=kw, platform=platform, industry_name=industry_name, vault_obj=vault_obj
    )
    final_title = (title or "").strip() or suggestions[0]["title"]
    if platform in ("seo_google", "geo_google", "website") and len(final_title) >= 63:
        final_title = suggestions[0]["title"]

    meta_desc = (
        f"Phân tích {kw} và {sk1} thực tế từ {brand}. Bóc tách số liệu, {lex[0]}, {lex[1]} "
        f"giúp {p_reader} ra quyết định chính xác và tối ưu chi phí."
    )
    if len(meta_desc) >= 165:
        meta_desc = meta_desc[:161].rsplit(" ", 1)[0] + "."

    skill_steps = getattr(skill_obj, "outline_steps", None) or [
        {"step": "Trọng tâm cốt lõi", "description": "Giải quyết trực diện vấn đề"},
        {"step": "Phân tích chuyên sâu", "description": "Số liệu và quy trình thực tế"},
    ]
    skill_label = getattr(skill_obj, "code", "INVERTED_PYRAMID")

    if platform == "tiktok":
        html = f"""<p><strong>Định hướng kịch bản TikTok ({skill_label} · {target_length} · Giọng {tone_of_voice}):</strong> Kịch bản thiết kế cho {p_reader} quan tâm tới <strong>{kw}</strong> trong lĩnh vực {industry_name}, đảm bảo 3 giây đầu giữ chân mạnh mẽ.</p>
<table>
  <thead>
    <tr>
      <th>Thời lượng</th>
      <th>Hình ảnh / Góc máy &amp; Chữ trên màn hình</th>
      <th>Lời thoại (Voiceover tự nhiên)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>00s – 03s (Hook)</strong></td>
      <td>Cận cảnh trực diện chuyên gia chỉ vào bảng số liệu thực tế. Text nổi bật: <em>"3 điểm cần biết trước khi chọn {kw}"</em></td>
      <td>"Đừng vội xuống tiền cho <strong>{kw}</strong> nếu {p_reader} chưa kiểm tra kỹ 3 thông số cốt lõi dưới đây!"</td>
    </tr>
    <tr>
      <td><strong>03s – 15s (Nỗi đau)</strong></td>
      <td>Chuyển cảnh nhanh B-roll thực tế {lex[0]} và {lex[1]}. Text phụ: <em>"Sai lầm phổ biến: Bỏ qua {lex[2]}"</em></td>
      <td>"Thực tế {p_self.lower()} gặp rất nhiều trường hợp chỉ nhìn bề nổi mà bỏ qua {lex[0]} và {lex[2]}, dẫn đến phát sinh chi phí không đáng có."</td>
    </tr>
    <tr>
      <td><strong>15s – 38s (Giải pháp &amp; Số liệu)</strong></td>
      <td>Hiển thị quy trình 3 bước tại {brand} kèm biểu đồ đối chiếu kết quả thực chứng.</td>
      <td>"Khi áp dụng đúng {sk1} kết hợp {lex[3]} theo chuẩn {refs[0]['citation']}, hiệu quả thực tế cải thiện rõ rệt. {cases[0]}"</td>
    </tr>
    <tr>
      <td><strong>38s – 50s (CTA 3S)</strong></td>
      <td>Quay trung cảnh mỉm cười thân thiện, mũi tên chỉ xuống phần bình luận.</td>
      <td>"Lưu ngay video này để đối chiếu khi cần, hoặc nhắn tin từ khóa <strong>'{kw}'</strong> để {p_self.lower()} gửi bảng checklist chi tiết nhé!"</td>
    </tr>
  </tbody>
</table>
<p><strong>Caption chuẩn TikTok SEO:</strong> Bóc tách kinh nghiệm thực tế về <strong>{kw}</strong> và {sk1} từ {brand} giúp {p_reader} tối ưu {lex[4]} ngay từ đầu. <em>#{slugify_vi(kw).replace('-', '')} #{slugify_vi(industry_name).replace('-', '')[:16]} #kinhnghiemthucte #xuhuong2026</em></p>"""
        return {"title": final_title, "meta_description": meta_desc, "content_html": html}

    if platform == "facebook":
        html = f"""<p><strong>{final_title}</strong> — Tuần vừa rồi khi trực tiếp rà soát hơn chục hồ sơ về <strong>{kw}</strong>, {p_self.lower()} nhận ra một điểm chung khiến rất nhiều {p_reader} tốn kém thời gian lẫn ngân sách.</p>
<p>Phần lớn mọi người thường chỉ hỏi giá cuối cùng mà quên đặt câu hỏi quan trọng hơn: <em>{lex[0]} và {lex[1]} đang được kiểm soát theo tiêu chuẩn nào?</em></p>
<p>Dưới đây là 3 góc nhìn thực chiến đúc kết theo công thức <strong>{skill_label}</strong> tại <strong>{brand}</strong>:</p>
<ul>
  <li><strong>1. Kiểm tra kỹ {lex[0]} ngay từ bước đầu:</strong> Đây là nền tảng trực tiếp quyết định độ bền vững của {kw} thay vì những lời quảng cáo hào nhoáng.</li>
  <li><strong>2. Đối chiếu số liệu {sk1} minh bạch:</strong> Theo ghi nhận chuyên ngành {refs[0]['citation']}, việc chuẩn hóa {lex[2]} và {lex[3]} giúp giảm đáng kể rủi ro phát sinh.</li>
  <li><strong>3. Kết quả từ thực tế triển khai:</strong> {cases[0]}</li>
</ul>
<p>{msg_gen} Với {p_self.lower()}, một phương án tốt luôn phải đi kèm {lex[4]} rõ ràng cho từng nhu cầu riêng biệt.</p>
<p>👉 Nếu {p_reader} đang cân nhắc <strong>{kw}</strong> cho kế hoạch sắp tới, hãy bình luận <strong>"TƯ VẤN"</strong> hoặc nhắn tin trực tiếp cho <strong>{brand}</strong> để nhận bảng checklist thẩm định chi tiết hoàn toàn miễn phí!</p>"""
        return {"title": final_title, "meta_description": meta_desc, "content_html": html}

    # SEO Google / GEO Google / Website (Đạt chuẩn cao 49 tiêu chí SEO & 61 tiêu chí AIO/GEO)
    art_link = links[0]
    prod_link = links[1] if len(links) > 1 else links[0]
    step1_title = skill_steps[0]["step"] if skill_steps else "Bản chất cốt lõi"
    step2_title = skill_steps[1]["step"] if len(skill_steps) > 1 else "Quy trình triển khai"
    v_idx = sum(ord(ch) for ch in (topic + industry_name)) % 4

    h2_q1 = [
        f"{kw_cap} là gì và giải quyết bài toán thực tế như thế nào?",
        f"Bản chất của {kw} tác động ra sao đến hiệu quả ngành {industry_name}?",
        f"Vì sao {kw} trở thành tiêu chuẩn quan trọng đối với {p_reader}?",
        f"Hiểu đúng về {kw}: Đâu là giá trị cốt lõi cần nắm vững?",
    ][v_idx]
    h2_q2 = [
        f"Quy trình triển khai {kw} chuẩn chuyên môn gồm những bước nào?",
        f"Làm thế nào để áp dụng {kw} vừa an toàn vừa tối ưu {sk2}?",
        f"Các bước thực hành {kw} đạt hiệu suất bền vững là gì?",
        f"Triển khai {kw} cần tuân thủ lộ trình kiểm định ra sao?",
    ][v_idx]
    h2_q3 = [
        f"Số liệu thực chứng và phản hồi khách hàng tại {brand} cho thấy điều gì?",
        f"Kết quả thực tế khi áp dụng {kw} tại {brand} đạt mức nào?",
        f"Case study triển khai {kw} trong ngành {industry_name} chứng minh gì?",
        f"Đánh giá thực tiễn từ khách hàng đã trải nghiệm {kw} tại {brand}?",
    ][v_idx]

    html = f"""<p><strong>{kw_cap}</strong> trực tiếp hỗ trợ {p_reader} tháo gỡ nút thắt về {sk1} dựa trên nền tảng {lex[0]}, {lex[1]} cùng quy chuẩn đo lường rõ ràng. Nội dung chuyên sâu dưới đây do <strong>{brand}</strong> biên soạn sẽ cung cấp số liệu đối chiếu, tiêu chí kỹ thuật và hướng dẫn triển khai sát thực tiễn ngành {industry_name}.</p>

<div class="tldr-box">
  <p><strong>TL;DR — Tóm tắt trọng tâm về {kw}:</strong></p>
  <ul>
    <li><strong>Cơ chế cốt lõi:</strong> {kw_cap} gắn kết {lex[0]}, {lex[1]} và {lex[2]} nhằm duy trì chất lượng vận hành dài hạn cho {p_reader}.</li>
    <li><strong>Căn cứ khoa học:</strong> Tài liệu chuyên ngành {refs[0]['citation']} chỉ rõ việc chuẩn hóa {sk1} giúp cải thiện {sk2} bền vững.</li>
    <li><strong>Điểm cần lưu ý:</strong> Luôn kiểm tra {lex[3]}, tham khảo dữ liệu thực nghiệm và rà soát định kỳ 90 ngày/lần.</li>
  </ul>
</div>

<h2>{h2_q1}</h2>
<p>{kw_cap} đóng vai trò chuẩn hóa {lex[0]} kết hợp {lex[1]} để tạo ra kết quả định lượng minh bạch cho {p_reader} trong lĩnh vực {industry_name}. Tiếp cận theo hướng {step1_title.lower()} giúp kiểm soát chặt chẽ {lex[2]} ngay từ bước đánh giá hiện trạng.</p>

<h3>Tại sao {sk1} quyết định độ bền vững của phương án?</h3>
<p>Yếu tố {sk1} bảo vệ trực tiếp lợi ích của {p_reader} nhờ sự phối hợp giữa {lex[3]}, {lex[4]} và quy trình đối soát độc lập. Dữ liệu nghiên cứu {refs[0]['citation']} cho thấy các mô hình chú trọng {lex[0]} đạt độ ổn định cao vượt trội so với cách làm thiếu chuẩn hóa.</p>

<figure class="figure-centered" style="text-align:center;" data-brand-logo="true">
  <img src="/api/images/sample-banner?kw={slugify_vi(kw)}" alt="Minh họa {kw} thực tế tại {brand}" width="1200" height="675" style="max-width:100%;height:auto;border-radius:10px;" />
  <figcaption><em>Minh họa {kw} chuẩn chuyên môn tại {brand}</em></figcaption>
</figure>

<h2>{h2_q2}</h2>
<p>Lộ trình thực hiện {kw} tại {brand} tập trung giải quyết bài toán {sk2}, {lex[1]} và {lex[5] if len(lex) > 5 else 'tiến độ bàn giao'} cho từng nhóm nhu cầu. Các bước dưới đây ({step2_title.lower()}) giúp {p_reader} chủ động kiểm soát chất lượng từng chặng.</p>

<ul>
  <li><strong>Giai đoạn 1 — Thẩm định {lex[0]}:</strong> Đo lường đầy đủ thông số đầu vào, xác định hạn mức đầu tư và tiêu chuẩn {lex[2]} ưu tiên.</li>
  <li><strong>Giai đoạn 2 — Cá nhân hóa giải pháp:</strong> {msg_prod} Từng hạng mục đều gắn liền chỉ số kiểm chứng {lex[3]}.</li>
  <li><strong>Giai đoạn 3 — Nghiệm thu &amp; tối ưu:</strong> Đánh giá hiệu quả thực tế và tham khảo thêm <a href="{art_link['url']}">{art_link['title']}</a> để hoàn thiện toàn diện.</li>
</ul>

<h3>Bảng so sánh tiêu chuẩn {kw} thực tế (Information Gain)</h3>
<p>Bảng phân tích sau đây làm rõ sự khác biệt giữa cách làm thông thường và hệ tiêu chuẩn chuyên sâu tại {brand} đối với {lex[0]}, {lex[2]} cùng {lex[4]}.</p>

<table>
  <thead>
    <tr>
      <th>Hạng mục đánh giá</th>
      <th>Phương pháp phổ thông</th>
      <th>Tiêu chuẩn chuyên sâu tại {brand}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Thẩm định {lex[0]}</strong></td>
      <td>Ước lượng sơ bộ, ít dữ liệu kiểm chứng</td>
      <td>Đo lường chi tiết kèm hồ sơ số liệu minh bạch</td>
    </tr>
    <tr>
      <td><strong>Kiểm soát {sk2}</strong></td>
      <td>Tiềm ẩn chi phí điều chỉnh giữa chừng</td>
      <td>Dự toán rõ ràng ngay từ đầu theo {lex[3]}</td>
    </tr>
    <tr>
      <td><strong>Bảo chứng dài hạn</strong></td>
      <td>Theo dõi ngắn hạn sau hoàn tất</td>
      <td>Đồng hành rà soát định kỳ 3 tháng/lần</td>
    </tr>
  </tbody>
</table>

<h2>{h2_q3}</h2>
<p>Thống kê triển khai thực tế tại {brand} khẳng định giá trị của {kw} thông qua chỉ số {lex[0]}, {lex[1]} và {lex[4]}. {cases[0]}</p>
<p>{msg_gen} Sau khi trực tiếp ứng dụng <a href="{prod_link['url']}">{prod_link['title']}</a>, đại diện khách hàng nhận xét: <em>“Mọi chỉ số liên quan đến {lex[2]} và {sk1} đều minh bạch, dễ theo dõi và mang lại sự an tâm rất lớn.”</em></p>

<h2>Câu hỏi thường gặp (FAQs) xoay quanh {kw} là gì?</h2>
<p>Phần giải đáp nhanh dưới đây tổng hợp các thắc mắc thực tế (People Also Ask) của {p_reader} về {kw}, {lex[0]} và {sk1}.</p>

<h3>Ngân sách dành cho {kw} được tính toán dựa trên cơ sở nào?</h3>
<p>Mức đầu tư cho {kw} phụ thuộc vào phạm vi {lex[0]}, độ phức tạp của {lex[1]} cũng như yêu cầu chuyên biệt về {lex[3]} của từng trường hợp.</p>

<h3>Khi nào cần rà soát và cập nhật lại kế hoạch {kw}?</h3>
<p>Đội ngũ chuyên môn khuyến nghị {p_reader} kiểm tra lại các thông số {lex[2]}, {lex[4]} và {sk2} sau mỗi chu kỳ 3 tháng nhằm duy trì hiệu quả tối đa.</p>

<p>Mong rằng toàn bộ số liệu và kinh nghiệm thực tế về <strong>{kw}</strong> trong bài viết đã giúp {p_reader} có đầy đủ cơ sở ra quyết định vững vàng. Đừng ngần ngại liên hệ trực tiếp với <strong>{brand}</strong> qua cổng đăng ký tư vấn hoặc hotline hỗ trợ để nhận phác thảo lộ trình phù hợp riêng với {p_reader}.</p>"""

    return {
        "title": final_title,
        "meta_description": meta_desc,
        "content_html": html,
    }


def extract_skill_from_sample_text(sample_text: str, custom_name: str = "") -> dict:
    """Phân tích ngược 1–3 bài viết mẫu để tự động đúc kết thành một Custom Skill mới."""
    lines = [ln.strip() for ln in re.split(r"[\n\r]+", sample_text or "") if ln.strip()]
    has_table = "|" in (sample_text or "") or "<table" in (sample_text or "").lower()
    has_bullets = any(ln.startswith(("-", "•", "*", "1.", "2.")) for ln in lines)
    has_question_hook = bool(lines and "?" in lines[0])

    inferred_platform = "tiktok" if ("giây" in (sample_text or "").lower() and has_table) else (
        "seo_google" if len((sample_text or "").split()) > 350 else "facebook"
    )

    steps = [
        {
            "step": "1. Mở đầu (Hook nhận diện)",
            "description": "Mở bài bằng câu hỏi trực diện khơi gợi tò mò." if has_question_hook else "Đi thẳng vào bối cảnh thực tế hoặc con số nổi bật ngay 2 câu đầu.",
        },
        {
            "step": "2. Triển khai luận điểm cốt lõi",
            "description": "Trình bày dưới dạng danh sách gạch đầu dòng súc tích dễ quét mắt." if has_bullets else "Phân tích từng đoạn ngắn nối tiếp mạch lạc từ nguyên nhân đến giải pháp.",
        },
        {
            "step": "3. Dẫn chứng & Chốt hành động (CTA)",
            "description": "Đính kèm bảng đối chiếu/số liệu cụ thể rồi khép lại bằng lời kêu gọi hành động." if has_table else "Đúc kết bài học thực tế và đặt lời kêu gọi tương tác tự nhiên ở dòng cuối.",
        },
    ]

    name = custom_name.strip() if custom_name else f"Skill Đúc Kết Tự Động ({inferred_platform.upper()})"
    code = "CUSTOM_" + slugify_vi(name).upper().replace("-", "_")[:24]
    return {
        "code": code,
        "name": name,
        "category": "custom",
        "target_platforms": [inferred_platform, "website"],
        "target_industry": "Tất cả ngành nghề",
        "description": "Skill được AI phân tích và trích xuất tự động từ bố cục, nhịp câu và cách chuyển ý của bài viết mẫu.",
        "outline_steps": steps,
        "system_instructions": (
            f"Mô phỏng cấu trúc nhịp điệu của bài mẫu: {'ưu tiên mở đầu dạng câu hỏi, ' if has_question_hook else ''}"
            f"{'sử dụng danh sách bullet rõ ràng, ' if has_bullets else ''}giữ giọng văn tự nhiên, bám sát thực tế ngành."
        ),
        "custom_variables": [
            {"key": "diem_nhan", "label": "Điểm nhấn đặc biệt cần lồng ghép", "placeholder": "VD: Bảo hành 5 năm / Ưu đãi tháng 11"},
        ],
        "example_output": (sample_text or "")[:800],
    }
