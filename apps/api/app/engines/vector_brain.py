"""Engine Bộ não thứ 2 đa ngành nghề: Tự động phân loại ngành nghề, bóc tách tri thức và tìm kiếm Vector Cosine Similarity."""

import hashlib
import math
import re
from typing import Sequence
import numpy as np
from pyvi import ViTokenizer


EMBED_DIM = 256

DYNAMIC_INDUSTRY_HINTS = {
    "Luật pháp & Tư vấn Pháp lý": ["luật", "hợp đồng", "pháp lý", "tranh chấp", "doanh nghiệp", "sở hữu trí tuệ", "nghị định", "công chứng"],
    "Du lịch, Khách sạn & Nghỉ dưỡng": ["du lịch", "resort", "khách sạn", "lịch trình", "vé máy bay", "nghỉ dưỡng", "homestay", "tour"],
    "Nội thất, Kiến trúc & Xây dựng": ["nội thất", "kiến trúc", "thi công", "bản vẽ", "cải tạo nhà", "vật liệu xây dựng", "căn hộ", "phong cách tối giản"],
    "Ô tô, Xe điện & Giao thông": ["ô tô", "xe điện", "trạm sạc", "bảo dưỡng xe", "lái thử", "động cơ", "an toàn chủ động", "showroom"],
    "Nông nghiệp Công nghệ cao & Thực phẩm sạch": ["nông sản", "hữu cơ", "vietgap", "truy xuất nguồn gốc", "nhà màng", "xuất khẩu nông sản", "chế biến sâu"],
    "Nhân sự, Tuyển dụng & Quản trị": ["tuyển dụng", "nhân sự", "okr", "kpi", "văn hóa doanh nghiệp", "đãi ngộ", "đào tạo nội bộ"],
}


def slugify_vi(text: str) -> str:
    vi_map = str.maketrans(
        "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
        "ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ",
        "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"
        "AAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD",
    )
    clean = text.translate(vi_map).lower()
    clean = re.sub(r"[^a-z0-9]+", "-", clean).strip("-")
    return clean or "nganh-nghe-moi"


def tokenize_vi(text: str) -> list[str]:
    if not text:
        return []
    clean = re.sub(r"<[^>]+>", " ", text)
    tokenized = ViTokenizer.tokenize(clean.lower())
    tokens = re.findall(r"[a-zA-Z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+", tokenized)
    return [t for t in tokens if len(t) > 1]


def compute_embedding(text: str, dim: int = EMBED_DIM) -> list[float]:
    """Tạo vector ngữ nghĩa 256 chiều chuẩn hóa L2 từ unigram + bigram tiếng Việt."""
    tokens = tokenize_vi(text)
    if not tokens:
        return [0.0] * dim
    vec = np.zeros(dim, dtype=np.float32)
    features = list(tokens)
    for i in range(len(tokens) - 1):
        features.append(f"{tokens[i]}__{tokens[i + 1]}")
    for feat in features:
        h = hashlib.blake2b(feat.encode("utf-8"), digest_size=8).digest()
        idx = int.from_bytes(h[:4], "little") % dim
        sign = 1.0 if (h[4] % 2 == 0) else -1.0
        weight = 1.6 if "_" in feat else 1.0
        vec[idx] += sign * weight
    norm = float(np.linalg.norm(vec))
    if norm > 1e-8:
        vec = vec / norm
    return [round(float(x), 5) for x in vec]


def cosine_sim(v1: Sequence[float], v2: Sequence[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    a = np.asarray(v1, dtype=np.float32)
    b = np.asarray(v2, dtype=np.float32)
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom < 1e-8:
        return 0.0
    return float(np.dot(a, b) / denom)


def classify_industry(text: str, vaults: list) -> dict:
    """Tự động phân loại ngành nghề từ nội dung văn bản. Đề xuất tạo mới nếu phát hiện ngành chưa có."""
    lower_text = re.sub(r"<[^>]+>", " ", text or "").lower()
    text_tokens = set(tokenize_vi(lower_text))
    text_emb = compute_embedding(lower_text)

    best_vault = None
    best_score = -1.0

    for v in vaults:
        lexicon_str = " ".join(v.terminology_lexicon or [])
        ref_str = f"{v.name} {v.description} {v.messaging_category} {v.messaging_product} {v.target_audience} {lexicon_str}"
        ref_tokens = set(tokenize_vi(ref_str))
        v_emb = compute_embedding(ref_str)
        sim = cosine_sim(text_emb, v_emb)
        kw_hits = sum(1 for term in (v.terminology_lexicon or []) if term.lower() in lower_text)
        compound_overlap = len(text_tokens & ref_tokens) * 0.085
        name_hit = 0.28 if any(part.strip() in lower_text for part in re.split(r"[,&]", v.name.lower()) if len(part.strip()) > 2) else 0.0
        total_score = sim + min(0.45, kw_hits * 0.09) + min(0.55, compound_overlap) + name_hit
        if total_score > best_score:
            best_score = total_score
            best_vault = v

    # Kiểm tra xem có khớp mạnh với một ngành động chưa có trong danh sách không
    for new_ind_name, hints in DYNAMIC_INDUSTRY_HINTS.items():
        already_exists = any(slugify_vi(new_ind_name)[:10] in (v.slug or "") for v in vaults)
        if already_exists:
            continue
        hits = sum(1 for h in hints if h in lower_text)
        if hits >= 3 and best_score < 0.34:
            return {
                "matched_vault_id": None,
                "industry_name": new_ind_name,
                "confidence": round(min(0.95, 0.55 + hits * 0.08), 2),
                "should_create_new": True,
                "suggested_terms": [h for h in hints if h in lower_text],
            }

    if best_vault is not None:
        return {
            "matched_vault_id": best_vault.id,
            "industry_name": best_vault.name,
            "confidence": round(min(0.98, max(0.42, best_score)), 2),
            "should_create_new": False,
            "suggested_terms": [],
        }

    return {
        "matched_vault_id": None,
        "industry_name": "Đa ngành tổng hợp",
        "confidence": 0.5,
        "should_create_new": True,
        "suggested_terms": [],
    }


def extract_knowledge_units(raw_text: str, source_title: str = "Tài liệu người dùng") -> dict:
    """Bóc tách số liệu, trích dẫn Harvard, insight và thuật ngữ chuyên ngành từ văn bản/bài viết."""
    clean = re.sub(r"<[^>]+>", "\n", raw_text or "")
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in re.split(r"[\n\r]+", clean) if len(ln.strip()) >= 25]

    chunks = []
    # Phát hiện trích dẫn Harvard (Author, YYYY)
    harvard_pattern = re.compile(r"\([A-ZÀ-Ỹ][^()]{2,50},\s*(?:19|20)\d{2}\)")
    number_pattern = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:%|triệu|tỷ|nghìn|ngày|tháng|năm|ca|khách hàng|đơn)\b", re.IGNORECASE)

    for ln in lines[:18]:
        if harvard_pattern.search(ln):
            chunks.append({
                "chunk_type": "harvard_ref",
                "title": f"Nguồn trích dẫn từ: {source_title[:60]}",
                "content": ln[:420],
            })
        elif number_pattern.search(ln):
            chunks.append({
                "chunk_type": "case_study",
                "title": f"Số liệu & Dẫn chứng: {source_title[:60]}",
                "content": ln[:420],
            })
        elif any(k in ln.lower() for k in ["khách hàng", "người dùng", "nỗi đau", "lo ngại", "mong muốn", "thường gặp"]):
            chunks.append({
                "chunk_type": "insight",
                "title": f"Insight độc giả: {source_title[:60]}",
                "content": ln[:420],
            })

    if not chunks and lines:
        for ln in lines[:3]:
            chunks.append({
                "chunk_type": "fact",
                "title": f"Tri thức ngành: {source_title[:60]}",
                "content": ln[:420],
            })

    # Trích xuất từ ghép chuyên ngành (2-3 âm tiết nối bằng dấu _ của pyvi)
    tokenized = ViTokenizer.tokenize(clean.lower())
    compound_words = re.findall(r"\b[a-zà-ỹ]+_[a-zà-ỹ]+(?:_[a-zà-ỹ]+)?\b", tokenized)
    stop_compounds = {"chúng_tôi", "của_mình", "như_vậy", "tuy_nhiên", "ngoài_ra", "bên_cạnh", "cho_thấy", "có_thể", "cần_phải"}
    freq: dict[str, int] = {}
    for cw in compound_words:
        if cw in stop_compounds or len(cw) < 6:
            continue
        readable = cw.replace("_", " ")
        freq[readable] = freq.get(readable, 0) + 1

    discovered_terms = [term for term, cnt in sorted(freq.items(), key=lambda x: -x[1])[:10] if cnt >= 1]
    return {
        "chunks": chunks[:6],
        "discovered_terms": discovered_terms,
    }


def retrieve_relevant_chunks(query: str, chunks: Sequence, top_k: int = 5) -> list[dict]:
    """Truy xuất RAG các đơn vị tri thức gần nhất theo Cosine Similarity."""
    if not chunks:
        return []
    q_emb = compute_embedding(query)
    scored = []
    for c in chunks:
        emb = c.embedding if c.embedding else compute_embedding(c.content)
        sim = cosine_sim(q_emb, emb)
        scored.append((sim, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {
            "id": item.id,
            "chunk_type": item.chunk_type,
            "title": item.title,
            "content": item.content,
            "source_label": item.source_label,
            "similarity": round(max(0.0, sim), 3),
        }
        for sim, item in scored[:top_k]
    ]
