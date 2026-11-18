"""Studio Tạo ảnh theo từng nền tảng & Hậu kỳ SEO tự động (Crop chuẩn pixel, đóng Logo thương hiệu, nén WebP <100KB, chú thích <70 ký tự)."""

import base64
import io
import os
import textwrap
import uuid
from pathlib import Path
import httpx
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from app.engines.vector_brain import slugify_vi

GENERATED_IMG_DIR = Path(__file__).resolve().parent.parent.parent / "generated_images"
GENERATED_IMG_DIR.mkdir(parents=True, exist_ok=True)

FONT_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_REG_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def _load_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()


def _hex_to_rgb(hex_str: str, fallback: tuple[int, int, int] = (15, 76, 92)) -> tuple[int, int, int]:
    s = (hex_str or "").strip().lstrip("#")
    if len(s) == 6:
        try:
            return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
        except ValueError:
            pass
    return fallback


def build_seo_caption(main_keyword: str, headline: str, brand_name: str = "") -> str:
    """Sinh chú thích ảnh chuẩn Checklist #18: <70 ký tự, rõ nghĩa, chứa từ khóa chính."""
    kw = (main_keyword or headline or "nội dung chuyên ngành").strip()
    if brand_name:
        cand = f"{kw[:1].upper() + kw[1:]} thực tế tại {brand_name}"
    else:
        cand = f"Minh họa thực tế {kw} chuẩn chuyên môn"
    if len(cand) >= 70:
        cand = f"Minh họa {kw}"[:67]
    return cand


def render_editorial_brand_visual(
    *,
    width: int,
    height: int,
    headline: str,
    subtext: str,
    platform_label: str,
    brand_colors: list[str] | None = None,
    brand_logo_text: str = "",
    apply_logo: bool = True,
) -> Image.Image:
    """Vẽ ấn phẩm đồ họa Editorial sắc nét theo đúng kích thước nền tảng & bảng màu thương hiệu."""
    colors = brand_colors or ["#0F4C5C", "#C8963E", "#F7F5F0"]
    primary = _hex_to_rgb(colors[0], (15, 76, 92))
    accent = _hex_to_rgb(colors[1] if len(colors) > 1 else "#D97706", (200, 150, 62))

    # Nền chuyển sắc tinh tế
    base = Image.new("RGB", (width, height), primary)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # Khối ánh sáng nghệ thuật mềm
    r1 = int(min(width, height) * 0.55)
    odraw.ellipse(
        (width - r1, -int(r1 * 0.35), width + int(r1 * 0.45), int(r1 * 0.95)),
        fill=(accent[0], accent[1], accent[2], 95),
    )
    odraw.ellipse(
        (-int(r1 * 0.4), height - int(r1 * 0.6), int(r1 * 0.7), height + int(r1 * 0.4)),
        fill=(255, 255, 255, 34),
    )
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=max(18, min(width, height) // 16)))
    img = Image.alpha_composite(base.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(img)

    pad_x = max(36, int(width * 0.075))
    pad_y = max(36, int(height * 0.085))

    # Khung nội dung mảnh tinh tế
    card_top = pad_y
    card_bottom = height - pad_y
    draw.rounded_rectangle(
        (pad_x, card_top, width - pad_x, card_bottom),
        radius=20,
        fill=(10, 22, 30, 118),
        outline=(255, 255, 255, 58),
        width=2,
    )

    inner_x = pad_x + max(28, int(width * 0.045))
    inner_w = width - 2 * inner_x

    # Nhãn chuyên mục nhỏ phía trên
    tag_font = _load_font(FONT_BOLD_CANDIDATES, max(14, int(min(width, height) * 0.024)))
    title_size = max(24, int(min(width, height) * (0.056 if width >= height else 0.052)))
    title_font = _load_font(FONT_BOLD_CANDIDATES, title_size)
    sub_font = _load_font(FONT_REG_CANDIDATES, max(15, int(title_size * 0.52)))

    cur_y = card_top + max(28, int(height * 0.06))
    draw.rounded_rectangle(
        (inner_x, cur_y, inner_x + min(inner_w, 320), cur_y + int(title_size * 0.85)),
        radius=8,
        fill=(accent[0], accent[1], accent[2], 225),
    )
    draw.text((inner_x + 14, cur_y + 6), platform_label.upper()[:32], font=tag_font, fill=(255, 255, 255, 255))
    cur_y += int(title_size * 1.35)

    # Tiêu đề chính trên ảnh
    approx_chars = max(14, int(inner_w / max(10, title_size * 0.56)))
    wrapped_title = textwrap.wrap(headline.strip(), width=approx_chars)[:4]
    for line in wrapped_title:
        draw.text((inner_x, cur_y), line, font=title_font, fill=(252, 251, 247, 255))
        cur_y += int(title_size * 1.28)

    # Gạch ngang nhấn màu thương hiệu
    cur_y += 10
    draw.rectangle((inner_x, cur_y, inner_x + 96, cur_y + 4), fill=(accent[0], accent[1], accent[2], 255))
    cur_y += 22

    # Phụ đề mô tả ngắn
    sub_chars = max(24, int(inner_w / max(8, title_size * 0.3)))
    for sline in textwrap.wrap(subtext.strip(), width=sub_chars)[:3]:
        if cur_y + int(title_size * 0.7) < card_bottom - 58:
            draw.text((inner_x, cur_y), sline, font=sub_font, fill=(226, 232, 240, 235))
            cur_y += int(title_size * 0.75)

    # Đóng dấu Logo thương hiệu chuẩn Checklist #19
    if apply_logo and brand_logo_text:
        logo_font = _load_font(FONT_BOLD_CANDIDATES, max(13, int(min(width, height) * 0.022)))
        badge_text = f"◆ {brand_logo_text.upper()}"
        bbox = draw.textbbox((0, 0), badge_text, font=logo_font)
        bw = (bbox[2] - bbox[0]) + 28
        bh = (bbox[3] - bbox[1]) + 16
        bx = width - inner_x - bw
        by = card_bottom - bh - max(20, int(height * 0.04))
        draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=8, fill=(255, 255, 255, 235))
        draw.text((bx + 14, by + 7), badge_text, font=logo_font, fill=(primary[0], primary[1], primary[2], 255))

    return img.convert("RGB")


def postprocess_resize_and_logo(
    raw_img: Image.Image,
    width: int,
    height: int,
    brand_logo_text: str = "",
    brand_colors: list[str] | None = None,
    apply_logo: bool = True,
) -> Image.Image:
    """Smart center-crop đúng kích thước pixel mục tiêu + đóng dấu Logo thương hiệu."""
    src_w, src_h = raw_img.size
    target_ratio = width / height
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        cropped = raw_img.crop((left, 0, left + new_w, src_h))
    else:
        new_h = int(src_w / target_ratio)
        top = (src_h - new_h) // 2
        cropped = raw_img.crop((0, top, src_w, top + new_h))

    resized = cropped.resize((width, height), Image.Resampling.LANCZOS).convert("RGBA")
    if apply_logo and brand_logo_text:
        draw = ImageDraw.Draw(resized)
        primary = _hex_to_rgb((brand_colors or ["#0F4C5C"])[0])
        logo_font = _load_font(FONT_BOLD_CANDIDATES, max(13, int(min(width, height) * 0.022)))
        badge_text = f"◆ {brand_logo_text.upper()}"
        bbox = draw.textbbox((0, 0), badge_text, font=logo_font)
        bw = (bbox[2] - bbox[0]) + 26
        bh = (bbox[3] - bbox[1]) + 14
        bx = width - bw - 24
        by = height - bh - 20
        draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=7, fill=(255, 255, 255, 225))
        draw.text((bx + 13, by + 6), badge_text, font=logo_font, fill=(primary[0], primary[1], primary[2], 255))
    return resized.convert("RGB")


async def generate_platform_image(
    *,
    provider_mode: str,
    base_url: str,
    api_key: str,
    image_model: str,
    width: int,
    height: int,
    headline: str,
    main_keyword: str,
    context_summary: str,
    platform_label: str,
    brand_colors: list[str] | None = None,
    brand_logo_text: str = "",
    apply_logo: bool = True,
) -> dict:
    """Tạo ảnh đa nguồn (9Router / OpenAI / OpenRouter / Editorial Studio Fallback) và nén WebP <100KB chuẩn SEO."""
    prompt_en = (
        f"Editorial commercial photography and clean visual composition representing '{headline}' ({main_keyword}), "
        f"brand palette {', '.join(brand_colors or ['#0F4C5C', '#C8963E'])}, natural lighting, authentic Vietnamese context, "
        f"sharp focus, high resolution, no garbled text."
    )

    pil_img: Image.Image | None = None
    used_provider = provider_mode

    if api_key and base_url and provider_mode in {"custom_9router", "openai", "openrouter", "free_9router"}:
        endpoint = base_url.rstrip("/") + "/images/generations"
        try:
            async with httpx.AsyncClient(timeout=18.0) as client:
                resp = await client.post(
                    endpoint,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": image_model or "dall-e-3",
                        "prompt": prompt_en,
                        "n": 1,
                        "size": "1024x1024",
                        "response_format": "b64_json",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    item = (data.get("data") or [{}])[0]
                    if item.get("b64_json"):
                        raw_bytes = base64.b64decode(item["b64_json"])
                        raw_pil = Image.open(io.BytesIO(raw_bytes))
                        pil_img = postprocess_resize_and_logo(
                            raw_pil, width, height, brand_logo_text, brand_colors, apply_logo
                        )
                    elif item.get("url"):
                        img_r = await client.get(item["url"])
                        if img_r.status_code == 200:
                            raw_pil = Image.open(io.BytesIO(img_r.content))
                            pil_img = postprocess_resize_and_logo(
                                raw_pil, width, height, brand_logo_text, brand_colors, apply_logo
                            )
        except Exception:
            pil_img = None

    if pil_img is None:
        used_provider = f"{provider_mode} (Studio Graphic Engine)"
        pil_img = render_editorial_brand_visual(
            width=width,
            height=height,
            headline=headline or main_keyword or "Nội dung Chuyên ngành",
            subtext=context_summary or f"Chuẩn kích thước {width}x{height}px · Tối ưu hiển thị & tốc độ tải trang",
            platform_label=platform_label,
            brand_colors=brand_colors,
            brand_logo_text=brand_logo_text,
            apply_logo=apply_logo,
        )

    slug = slugify_vi(f"{main_keyword or headline}-{width}x{height}")[:56]
    filename = f"{slug}-{uuid.uuid4().hex[:6]}.webp"
    out_path = GENERATED_IMG_DIR / filename

    # Nén WebP chất lượng cao đảm bảo nhẹ (<100KB khi có thể) và sắc nét
    quality = 86
    buf = io.BytesIO()
    pil_img.save(buf, format="WEBP", quality=quality, method=6)
    while buf.tell() > 98 * 1024 and quality > 58:
        quality -= 8
        buf = io.BytesIO()
        pil_img.save(buf, format="WEBP", quality=quality, method=6)

    out_path.write_bytes(buf.getvalue())
    size_kb = round(buf.tell() / 1024.0, 1)

    caption = build_seo_caption(main_keyword, headline, brand_logo_text)
    public_url = f"/api/images/files/{filename}"
    figure_html = (
        f'<figure class="figure-centered" style="text-align:center;" data-brand-logo="{str(apply_logo).lower()}">'
        f'<img src="{public_url}" alt="{caption}" width="{width}" height="{height}" '
        f'style="max-width:100%;height:auto;border-radius:10px;" />'
        f"<figcaption><em>{caption}</em></figcaption>"
        f"</figure>"
    )

    return {
        "filename": filename,
        "file_path": str(out_path),
        "public_url": public_url,
        "width": width,
        "height": height,
        "file_size_kb": size_kb,
        "alt_text": caption,
        "caption_italic": caption,
        "prompt_used": prompt_en,
        "provider_used": used_provider,
        "brand_logo_applied": bool(apply_logo and brand_logo_text),
        "figure_html": figure_html,
    }
