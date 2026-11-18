"""Engine Ghi nhớ, Học hỏi & Tối ưu hóa Phong cách viết cá nhân của từng người dùng (Style DNA + Diff Learning)."""

import re
from app.engines.humanizer_plagiarism import strip_html, split_sentences_vi


COMMON_PRONOUN_PAIRS = [
    ("mình", "bạn", "mình - bạn"),
    ("tôi", "anh chị", "tôi - anh/chị"),
    ("chúng tôi", "quý khách", "chúng tôi - quý khách"),
    ("chúng mình", "các bạn", "chúng mình - các bạn"),
    ("em", "anh chị", "em - anh/chị"),
]


def analyze_writing_samples(samples: list[str]) -> dict:
    """Trích xuất chỉ số Stylometric DNA từ các đoạn/bài viết mẫu của chính người dùng."""
    combined = "\n".join(s for s in samples if s and s.strip())
    sentences = split_sentences_vi(combined)
    lower = strip_html(combined).lower()

    if not sentences:
        return {
            "avg_sentence_length": 22.0,
            "pronoun_style": "mình - bạn",
            "stylometric_dna": {
                "question_ratio": 0.12,
                "number_density": 0.15,
                "bullet_preference": True,
                "rhythm": "Cân bằng 20-26 từ/câu",
            },
        }

    lengths = [len(s.split()) for s in sentences]
    avg_len = round(sum(lengths) / len(lengths), 1)
    q_ratio = round(sum(1 for s in sentences if "?" in s) / len(sentences), 2)
    num_ratio = round(sum(1 for s in sentences if re.search(r"\d+", s)) / len(sentences), 2)

    detected_pronoun = "chúng tôi - quý độc giả"
    for p1, p2, label in COMMON_PRONOUN_PAIRS:
        if p1 in lower and p2 in lower:
            detected_pronoun = label
            break

    rhythm_desc = (
        "Câu ngắn dứt khoát (<18 từ), giàu nhịp nhanh"
        if avg_len < 18
        else "Câu vừa chuẩn mực (18–28 từ), mạch lạc dễ đọc"
        if avg_len <= 28
        else "Câu phân tích dài chuyên sâu (>28 từ), thiên học thuật"
    )

    return {
        "avg_sentence_length": avg_len,
        "pronoun_style": detected_pronoun,
        "stylometric_dna": {
            "question_ratio": q_ratio,
            "number_density": num_ratio,
            "bullet_preference": ("-" in combined or "•" in combined or "<li>" in combined),
            "rhythm": rhythm_desc,
        },
    }


def learn_from_edit_diff(original_html: str, edited_html: str, current_profile) -> dict:
    """So sánh bản nháp ban đầu và bản người dùng đã biên tập lại để tự động học quy tắc văn phong mới."""
    orig_sents = split_sentences_vi(original_html)
    edit_sents = split_sentences_vi(edited_html)
    if not edit_sents:
        return {"new_rules": [], "removed_phrases": []}

    orig_avg = sum(len(s.split()) for s in orig_sents) / max(1, len(orig_sents))
    edit_avg = sum(len(s.split()) for s in edit_sents) / max(1, len(edit_sents))

    new_rules: list[str] = []
    removed_phrases: list[str] = []

    if orig_avg - edit_avg >= 3.5:
        new_rules.append(f"Người dùng thích rút gọn câu súc tích khoảng {round(edit_avg)} từ/câu thay vì câu dài.")
    elif edit_avg - orig_avg >= 3.5:
        new_rules.append(f"Người dùng ưu tiên câu phân tích đầy đủ mệnh đề khoảng {round(edit_avg)} từ/câu.")

    orig_low = strip_html(original_html).lower()
    edit_low = strip_html(edited_html).lower()

    for p1, p2, label in COMMON_PRONOUN_PAIRS:
        if p1 not in orig_low and p1 in edit_low:
            new_rules.append(f"Ưu tiên đổi cách xưng hô sang '{label}'.")
            current_profile.pronoun_style = label
            break

    candidate_fillers = [
        "tuy nhiên,", "ngoài ra,", "bên cạnh đó,", "đáng chú ý là",
        "trong bối cảnh hiện nay", "không thể phủ nhận", "tóm lại,"
    ]
    for filler in candidate_fillers:
        if filler in orig_low and filler not in edit_low:
            removed_phrases.append(filler.rstrip(","))
            new_rules.append(f"Tránh dùng cụm chuyển ý '{filler.rstrip(',')}' vì người dùng thường xóa bỏ khi biên tập.")

    existing_rules = list(current_profile.learned_rules or [])
    for r in new_rules:
        if r not in existing_rules:
            existing_rules.insert(0, r)
    current_profile.learned_rules = existing_rules[:15]

    existing_banned = list(current_profile.banned_phrases or [])
    for rp in removed_phrases:
        if rp not in existing_banned:
            existing_banned.append(rp)
    current_profile.banned_phrases = existing_banned[:30]

    # Lưu câu văn mẫu chất lượng của người dùng (20-30 từ, chứa con số hoặc luận điểm sắc nét)
    exemplars = list(current_profile.sample_paragraphs or [])
    for s in edit_sents:
        wc = len(s.split())
        if 18 <= wc <= 32 and s not in orig_sents and s not in exemplars:
            exemplars.insert(0, s)
            break
    current_profile.sample_paragraphs = exemplars[:8]
    current_profile.avg_sentence_length = round((current_profile.avg_sentence_length * 0.7) + (edit_avg * 0.3), 1)
    current_profile.edit_learn_count = (current_profile.edit_learn_count or 0) + 1

    return {
        "new_rules": new_rules,
        "removed_phrases": removed_phrases,
        "updated_avg_sentence_length": current_profile.avg_sentence_length,
        "edit_learn_count": current_profile.edit_learn_count,
    }
