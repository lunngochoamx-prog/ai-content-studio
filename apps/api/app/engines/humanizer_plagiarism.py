"""Engine kiểm tra Độ trùng lặp (Uniqueness) và Phát hiện / Khử giọng văn AI (Vietnamese Humanizer)."""

import math
import re
from typing import Sequence
from app.data.seed_data import VIETNAMESE_AI_CLICHES


CLICHE_REPLACEMENTS = {
    "trong bối cảnh hiện nay": "thực tế hiện nay",
    "trong thời đại công nghệ 4.0": "khi chuyển đổi số diễn ra mạnh mẽ",
    "trong kỷ nguyên số": "ở giai đoạn thị trường cạnh tranh trực tuyến",
    "không thể phủ nhận rằng": "thực tế cho thấy",
    "chìa khóa vàng": "yếu tố quyết định",
    "bức tranh toàn cảnh": "góc nhìn đầy đủ",
    "hãy cùng khám phá": "cùng đi thẳng vào phân tích",
    "tóm lại,": "nhìn chung,",
    "như chúng ta đã biết": "trên thực tế,",
    "đóng vai trò vô cùng quan trọng": "tác động trực tiếp",
    "một cách toàn diện nhất": "sát thực tế",
    "nâng tầm trải nghiệm": "cải thiện trải nghiệm thực tế",
    "bước đột phá ngoạn mục": "cải tiến đáng kể",
    "giải pháp hoàn hảo nhất": "phương án phù hợp",
    "không chỉ dừng lại ở đó": "đáng chú ý hơn",
    "hơn bao giờ hết": "ngay lúc này",
    "cẩm nang toàn tập": "hướng dẫn chi tiết",
    "bí quyết thần thánh": "kinh nghiệm thực chiến",
}


def strip_html(html: str) -> str:
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html or "", flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"</?(p|div|h[1-6]|li|tr|br)[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"[ \t]+", " ", text).strip()


def split_sentences_vi(text: str) -> list[str]:
    clean = strip_html(text)
    parts = re.split(r"(?<=[.!?…])\s+|\n+", clean)
    return [p.strip() for p in parts if len(p.strip().split()) >= 4]


def build_shingles(text: str, k: int = 4) -> set[str]:
    words = re.findall(r"\w+", strip_html(text).lower())
    if len(words) < k:
        return {" ".join(words)} if words else set()
    return {" ".join(words[i : i + k]) for i in range(len(words) - k + 1)}


def evaluate_uniqueness(
    content_html: str,
    existing_articles_texts: Sequence[tuple[str, str]],
    exclude_article_id: str | None = None,
) -> dict:
    """Đo độ độc nhất so với kho bài nội bộ (>70%) và mẫu câu phổ thông ngoài web (>90%) theo Checklist #1."""
    target_shingles = build_shingles(content_html, k=4)
    if not target_shingles:
        return {
            "uniqueness_score": 100.0,
            "internal_unique_pct": 100.0,
            "external_unique_pct": 100.0,
            "passed_checklist_1": True,
            "overlapping_sentences": [],
        }

    max_internal_overlap = 0.0
    matched_title = ""
    for art_id, art_title_and_text in existing_articles_texts:
        if exclude_article_id and art_id == exclude_article_id:
            continue
        title_part, _, body_part = art_title_and_text.partition("|||")
        other_shingles = build_shingles(body_part, k=4)
        if not other_shingles:
            continue
        overlap = len(target_shingles & other_shingles) / max(1, len(target_shingles))
        if overlap > max_internal_overlap:
            max_internal_overlap = overlap
            matched_title = title_part

    sentences = split_sentences_vi(content_html)
    stock_phrases = [
        "bài viết dưới đây sẽ cung cấp cho bạn đầy đủ thông tin",
        "hy vọng qua bài viết trên bạn đã có thêm nhiều kiến thức bổ ích",
        "hiện nay nhu cầu sử dụng ngày càng tăng cao trên thị trường",
    ]
    flagged = []
    for s in sentences:
        low = s.lower()
        if any(sp in low for sp in stock_phrases):
            flagged.append(s)

    external_overlap = min(0.25, (len(flagged) * 0.04) + max_internal_overlap * 0.25)
    internal_unique = round((1.0 - max_internal_overlap) * 100, 1)
    external_unique = round((1.0 - external_overlap) * 100, 1)
    overall = round(external_unique * 0.65 + internal_unique * 0.35, 1)

    return {
        "uniqueness_score": overall,
        "internal_unique_pct": internal_unique,
        "external_unique_pct": external_unique,
        "matched_internal_article": matched_title,
        "passed_checklist_1": external_unique >= 90.0 and internal_unique >= 70.0,
        "overlapping_sentences": flagged[:5],
    }


def evaluate_ai_voice(content_html: str, banned_user_phrases: list[str] | None = None) -> dict:
    """Chấm điểm giọng văn tự nhiên (Human Score) vs Mùi văn mẫu AI tiếng Việt."""
    plain = strip_html(content_html)
    lower = plain.lower()
    sentences = split_sentences_vi(content_html)
    if not sentences:
        return {
            "human_score": 100.0,
            "ai_probability": 0.0,
            "burstiness": 0.45,
            "detected_cliches": [],
            "mechanical_transitions": [],
            "verdict": "Chưa có nội dung để phân tích",
        }

    lengths = [len(s.split()) for s in sentences]
    mean_len = sum(lengths) / max(1, len(lengths))
    variance = sum((x - mean_len) ** 2 for x in lengths) / max(1, len(lengths))
    std_len = math.sqrt(variance)
    burstiness = round(std_len / max(1.0, mean_len), 3)

    all_cliches = list(VIETNAMESE_AI_CLICHES) + [p.lower() for p in (banned_user_phrases or []) if p]
    detected_cliches = [c for c in all_cliches if c in lower]

    mech_patterns = ["thứ nhất,", "thứ hai,", "thứ ba,", "cuối cùng,", "tóm lại,"]
    mech_hits = [m for m in mech_patterns if m in lower]

    words = re.findall(r"\w+", lower)
    ttr = len(set(words)) / max(1, len(words))

    penalty = 0.0
    penalty += len(detected_cliches) * 7.5
    penalty += max(0, len(mech_hits) - 1) * 5.0
    if burstiness < 0.22 and len(sentences) >= 5:
        penalty += 14.0  # Câu quá đều nhau kiểu máy tạo
    if ttr < 0.32 and len(words) > 150:
        penalty += 8.0

    ai_prob = round(min(92.0, max(4.0, 8.0 + penalty)), 1)
    human_score = round(100.0 - ai_prob, 1)

    if human_score >= 85:
        verdict = "Giọng văn tự nhiên, giàu nhịp điệu như chuyên gia thật"
    elif human_score >= 70:
        verdict = "Khá tự nhiên nhưng còn sót vài cụm chuyển ý khuôn mẫu"
    else:
        verdict = "Mang nặng văn phong AI sáo rỗng — khuyến nghị bấm 'Khử giọng AI'"

    return {
        "human_score": human_score,
        "ai_probability": ai_prob,
        "burstiness": burstiness,
        "avg_sentence_words": round(mean_len, 1),
        "lexical_diversity": round(ttr, 3),
        "detected_cliches": detected_cliches,
        "mechanical_transitions": mech_hits,
        "verdict": verdict,
    }


def humanize_vietnamese_html(
    content_html: str,
    pronoun_pair: str = "mình - bạn",
    banned_phrases: list[str] | None = None,
) -> str:
    """Khử sáo rỗng AI, điều chỉnh nhịp câu tự nhiên và đồng bộ cách xưng hô cá nhân."""
    if not content_html:
        return content_html

    out = content_html
    for cliche, repl in CLICHE_REPLACEMENTS.items():
        pattern = re.compile(re.escape(cliche), re.IGNORECASE)
        def _replace_match(m: re.Match, r: str = repl) -> str:
            orig = m.group(0)
            if orig and orig[0].isupper():
                return r[0].upper() + r[1:]
            return r
        out = pattern.sub(_replace_match, out)

    # Xóa các cụm từ bị người dùng cấm riêng trong Style DNA
    for bp in banned_phrases or []:
        if bp and len(bp.strip()) > 3:
            out = re.sub(re.escape(bp.strip()) + r"[,\s]*", "", out, flags=re.IGNORECASE)

    # Thay chuỗi liệt kê máy móc Thứ nhất / Thứ hai / Thứ ba
    out = re.sub(r"\bThứ nhất,\s*", "Điểm cốt lõi đầu tiên là ", out)
    out = re.sub(r"\bThứ hai,\s*", "Thực tế tiếp theo cần lưu ý: ", out)
    out = re.sub(r"\bThứ ba,\s*", "Ngoài ra, trên thực tế vận hành, ", out)

    # Ngắt các câu quá dài (>38 từ) có liên từ ', đồng thời ' hoặc ', bên cạnh đó ' thành 2 câu gãy gọn
    def _split_long_p(match: re.Match) -> str:
        inner = match.group(1)
        inner = re.sub(r",\s+(đồng thời|bên cạnh đó|không những vậy)\s+", ". Thực tế, ", inner, flags=re.IGNORECASE)
        return f"<p>{inner}</p>"

    out = re.sub(r"<p>(.*?)</p>", _split_long_p, out, flags=re.DOTALL)
    return out
