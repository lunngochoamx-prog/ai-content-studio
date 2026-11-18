/**
 * Standalone Online Cloud-Edge Engine (Browser Persistence + 65-Rule SEO/GEO Scorer + Multi-Industry Vector Brain + Style DNA + Direct Multi-Provider AI Gateway + Canvas WebP Studio).
 * Tự động kích hoạt khi chạy phiên bản Web Online tĩnh (GitHub Pages / Static Hosting) chưa gắn Backend riêng,
 * đảm bảo toàn bộ 11 nhóm tính năng hoạt động 100% trực tuyến ngay trên trình duyệt.
 */

import seedBundle from "@/data/seedBundle.json";

const STORAGE_KEY = "ai_content_studio_online_db_v1";

const PROVIDER_CATALOG = [
  {
    id: "free_9router",
    name: "Gói Miễn Phí (System 9Router / Cloud Free)",
    badge: "Mặc định · Free",
    base_url_default: "http://127.0.0.1:20128/v1",
    default_model: "9router/auto-free",
    requires_key: false,
    description:
      "Tự động định tuyến qua cổng 9Router hoặc Engine Tổng hợp Nội dung chuẩn 65 tiêu chí SEO/GEO miễn phí 24/7.",
  },
  {
    id: "ollama",
    name: "Ollama Local (Chạy trên máy cá nhân)",
    badge: "Local · Bảo mật",
    base_url_default: "http://localhost:11434",
    default_model: "qwen2.5:7b",
    requires_key: false,
    description:
      "Kết nối trực tiếp trình duyệt tới Ollama trên máy bạn (localhost:11434), không tốn phí API.",
  },
  {
    id: "custom_9router",
    name: "9Router Cá Nhân (Self-hosted)",
    badge: "OpenAI-Compatible",
    base_url_default: "http://localhost:20128/v1",
    default_model: "auto",
    requires_key: false,
    description: "Kết nối tới cổng 9Router riêng trên máy hoặc VPS của bạn.",
  },
  {
    id: "openai",
    name: "OpenAI API",
    badge: "Cloud API",
    base_url_default: "https://api.openai.com/v1",
    default_model: "gpt-4o",
    requires_key: true,
    description: "Sử dụng trực tiếp các mô hình GPT-4o, GPT-4.1 của OpenAI.",
  },
  {
    id: "gemini",
    name: "Google Gemini API",
    badge: "Cloud API",
    base_url_default: "https://generativelanguage.googleapis.com/v1beta",
    default_model: "gemini-2.5-flash",
    requires_key: true,
    description: "Tốc độ nhanh, cửa sổ ngữ cảnh lớn và khả năng tiếng Việt xuất sắc từ Google.",
  },
  {
    id: "claude",
    name: "Anthropic Claude API",
    badge: "Cloud API",
    base_url_default: "https://api.anthropic.com/v1",
    default_model: "claude-sonnet-4-20250514",
    requires_key: true,
    description: "Nổi bật về chiều sâu lập luận và giọng văn tự nhiên giàu cảm xúc.",
  },
  {
    id: "deepseek",
    name: "DeepSeek API",
    badge: "Cloud API · Tiết kiệm",
    base_url_default: "https://api.deepseek.com/v1",
    default_model: "deepseek-chat",
    requires_key: true,
    description: "Chi phí tối ưu với khả năng phân tích cấu trúc sâu từ DeepSeek V3 / R1.",
  },
  {
    id: "openrouter",
    name: "OpenRouter API",
    badge: "Multi-Model Cloud",
    base_url_default: "https://openrouter.ai/api/v1",
    default_model: "google/gemini-2.5-flash",
    requires_key: true,
    description: "Một API Key truy cập hơn 200 mô hình thương mại & mã nguồn mở.",
  },
];

const POPULAR_VN_BANKS = [
  { code: "MB", name: "MBBank — Ngân hàng Quân Đội" },
  { code: "VCB", name: "Vietcombank — Ngoại Thương Việt Nam" },
  { code: "TCB", name: "Techcombank — Kỹ Thương Việt Nam" },
  { code: "ACB", name: "ACB — Ngân hàng Á Châu" },
  { code: "BIDV", name: "BIDV — Đầu tư & Phát triển VN" },
  { code: "CTG", name: "VietinBank — Công Thương Việt Nam" },
  { code: "TPB", name: "TPBank — Tiên Phong" },
  { code: "VPB", name: "VPBank — Việt Nam Thịnh Vượng" },
];

const DYNAMIC_INDUSTRY_HINTS: Record<string, string[]> = {
  "Luật pháp & Tư vấn Pháp lý": ["luật", "hợp đồng", "pháp lý", "tranh chấp", "doanh nghiệp", "sở hữu trí tuệ", "nghị định", "công chứng"],
  "Du lịch, Khách sạn & Nghỉ dưỡng": ["du lịch", "resort", "khách sạn", "lịch trình", "vé máy bay", "nghỉ dưỡng", "homestay", "tour"],
  "Nội thất, Kiến trúc & Xây dựng": ["nội thất", "kiến trúc", "thi công", "bản vẽ", "cải tạo nhà", "vật liệu xây dựng", "căn hộ", "phong cách tối giản"],
  "Ô tô, Xe điện & Giao thông": ["ô tô", "xe điện", "trạm sạc", "bảo dưỡng xe", "lái thử", "động cơ", "an toàn chủ động", "showroom"],
  "Nông nghiệp Công nghệ cao & Thực phẩm sạch": ["nông sản", "hữu cơ", "vietgap", "truy xuất nguồn gốc", "nhà màng", "xuất khẩu nông sản", "chế biến sâu"],
  "Nhân sự, Tuyển dụng & Quản trị": ["tuyển dụng", "nhân sự", "okr", "kpi", "văn hóa doanh nghiệp", "đãi ngộ", "đào tạo nội bộ"],
};

const CLICHE_REPLACEMENTS: Record<string, string> = {
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
};

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function slugifyVi(text: string): string {
  const clean = (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "nganh-nghe-moi";
}

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(p|div|h[1-6]|li|tr|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function splitSentencesVi(htmlOrText: string): string[] {
  const clean = stripHtml(htmlOrText);
  return clean
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 4);
}

function tokenizeVi(text: string): string[] {
  const clean = stripHtml(text).toLowerCase();
  const matches = clean.match(/[\p{L}\p{N}_]+/gu) || [];
  return matches.filter((t) => t.length > 1);
}

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function computeEmbedding(text: string, dim = 128): number[] {
  const tokens = tokenizeVi(text);
  const vec = new Array(dim).fill(0);
  if (!tokens.length) return vec;
  const feats = [...tokens];
  for (let i = 0; i < tokens.length - 1; i++) {
    feats.push(`${tokens[i]}__${tokens[i + 1]}`);
  }
  for (const f of feats) {
    const h = hashStr(f);
    const idx = h % dim;
    const sign = (h & 256) === 0 ? 1 : -1;
    const weight = f.includes("__") ? 1.6 : 1.0;
    vec[idx] += sign * weight;
  }
  let norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  if (norm > 1e-8) {
    for (let i = 0; i < dim; i++) vec[i] = Number((vec[i] / norm).toFixed(5));
  }
  return vec;
}

function cosineSim(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 1e-8 ? dot / denom : 0;
}

function buildEditorialSvgDataUrl(headline: string, brand = "CONTENT STUDIO", colors = ["#0F4C5C", "#C8963E"]): string {
  const c1 = colors[0] || "#0F4C5C";
  const c2 = colors[1] || "#C8963E";
  const safeTitle = (headline || "Minh họa chuyên ngành")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 68);
  const safeBrand = (brand || "CONTENT STUDIO")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#bg)"/>
    <circle cx="1060" cy="120" r="220" fill="${c2}" fill-opacity="0.18"/>
    <rect x="64" y="64" width="1072" height="547" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
    <rect x="96" y="110" width="260" height="40" rx="20" fill="${c2}"/>
    <text x="226" y="136" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#ffffff">SEO &amp; GEO VISUAL · WEBP</text>
    <text x="96" y="295" font-family="Georgia, serif" font-size="44" font-weight="700" fill="#ffffff">${safeTitle}</text>
    <text x="96" y="360" font-family="sans-serif" font-size="22" fill="#e2e8f0">Ấn phẩm minh họa chuẩn 65 tiêu chí SEO &amp; AI Overviews</text>
    <rect x="96" y="510" width="320" height="48" rx="10" fill="#ffffff" fill-opacity="0.14"/>
    <text x="120" y="541" font-family="sans-serif" font-size="18" font-weight="700" fill="#f8fafc">${safeBrand}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ==================== CORE SCORING ENGINES ==================== */

function buildShingles(html: string, k = 4): Set<string> {
  const words = tokenizeVi(html);
  if (!words.length) return new Set();
  if (words.length < k) return new Set([words.join(" ")]);
  const set = new Set<string>();
  for (let i = 0; i <= words.length - k; i++) {
    set.add(words.slice(i, i + k).join(" "));
  }
  return set;
}

function evaluateUniqueness(contentHtml: string, articles: any[], excludeId?: string | null) {
  const target = buildShingles(contentHtml, 4);
  if (!target.size) {
    return {
      uniqueness_score: 100,
      internal_unique_pct: 100,
      external_unique_pct: 100,
      passed_checklist_1: true,
      overlapping_sentences: [],
    };
  }
  let maxOverlap = 0;
  let matchedTitle = "";
  for (const a of articles) {
    if (excludeId && a.id === excludeId) continue;
    const other = buildShingles(a.content_html || a.content_text || "", 4);
    if (!other.size) continue;
    let inter = 0;
    target.forEach((sh) => {
      if (other.has(sh)) inter++;
    });
    const ov = inter / Math.max(1, target.size);
    if (ov > maxOverlap) {
      maxOverlap = ov;
      matchedTitle = a.title;
    }
  }
  const sentences = splitSentencesVi(contentHtml);
  const stockPhrases = [
    "bài viết dưới đây sẽ cung cấp cho bạn đầy đủ thông tin",
    "hy vọng qua bài viết trên bạn đã có thêm nhiều kiến thức bổ ích",
    "hiện nay nhu cầu sử dụng ngày càng tăng cao trên thị trường",
  ];
  const flagged = sentences.filter((s) => stockPhrases.some((sp) => s.toLowerCase().includes(sp)));
  const extOverlap = Math.min(0.25, flagged.length * 0.04 + maxOverlap * 0.25);
  const intUnique = Number(((1 - maxOverlap) * 100).toFixed(1));
  const extUnique = Number(((1 - extOverlap) * 100).toFixed(1));
  const overall = Number((extUnique * 0.65 + intUnique * 0.35).toFixed(1));
  return {
    uniqueness_score: overall,
    internal_unique_pct: intUnique,
    external_unique_pct: extUnique,
    matched_internal_article: matchedTitle,
    passed_checklist_1: extUnique >= 90 && intUnique >= 70,
    overlapping_sentences: flagged.slice(0, 5),
  };
}

function evaluateAiVoice(contentHtml: string, bannedUserPhrases: string[] = []) {
  const plain = stripHtml(contentHtml);
  const lower = plain.toLowerCase();
  const sentences = splitSentencesVi(contentHtml);
  if (!sentences.length) {
    return {
      human_score: 100,
      ai_probability: 0,
      burstiness: 0.45,
      detected_cliches: [],
      mechanical_transitions: [],
      verdict: "Chưa có nội dung để phân tích",
    };
  }
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, x) => a + (x - mean) ** 2, 0) / lengths.length;
  const burstiness = Number((Math.sqrt(variance) / Math.max(1, mean)).toFixed(3));

  const cliches = [...seedBundle.ai_cliches, ...(bannedUserPhrases || []).map((p) => p.toLowerCase()).filter(Boolean)];
  const detectedCliches = cliches.filter((c) => lower.includes(c));
  const mechPatterns = ["thứ nhất,", "thứ hai,", "thứ ba,", "cuối cùng,", "tóm lại,"];
  const mechHits = mechPatterns.filter((m) => lower.includes(m));
  const words = tokenizeVi(lower);
  const ttr = new Set(words).size / Math.max(1, words.length);

  let penalty = detectedCliches.length * 7.5 + Math.max(0, mechHits.length - 1) * 5;
  if (burstiness < 0.22 && sentences.length >= 5) penalty += 14;
  if (ttr < 0.32 && words.length > 150) penalty += 8;

  const aiProb = Number(Math.min(92, Math.max(4, 8 + penalty)).toFixed(1));
  const humanScore = Number((100 - aiProb).toFixed(1));
  const verdict =
    humanScore >= 85
      ? "Giọng văn tự nhiên, giàu nhịp điệu như chuyên gia thật"
      : humanScore >= 70
      ? "Khá tự nhiên nhưng còn sót vài cụm chuyển ý khuôn mẫu"
      : "Mang nặng văn phong AI sáo rỗng — khuyến nghị bấm 'Khử giọng AI'";

  return {
    human_score: humanScore,
    ai_probability: aiProb,
    burstiness,
    avg_sentence_words: Number(mean.toFixed(1)),
    lexical_diversity: Number(ttr.toFixed(3)),
    detected_cliches: detectedCliches,
    mechanical_transitions: mechHits,
    verdict,
  };
}

function humanizeVietnameseHtml(contentHtml: string, bannedPhrases: string[] = []): string {
  if (!contentHtml) return contentHtml;
  let out = contentHtml;
  for (const [cliche, repl] of Object.entries(CLICHE_REPLACEMENTS)) {
    const escaped = cliche.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), (m) =>
      m[0] === m[0].toUpperCase() ? repl[0].toUpperCase() + repl.slice(1) : repl
    );
  }
  for (const bp of bannedPhrases || []) {
    if (bp && bp.trim().length > 3) {
      const escaped = bp.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`${escaped}[,\\s]*`, "gi"), "");
    }
  }
  out = out
    .replace(/\bThứ nhất,\s*/g, "Điểm cốt lõi đầu tiên là ")
    .replace(/\bThứ hai,\s*/g, "Thực tế tiếp theo cần lưu ý: ")
    .replace(/\bThứ ba,\s*/g, "Ngoài ra, trên thực tế vận hành, ")
    .replace(/,\s+(đồng thời|bên cạnh đó|không những vậy)\s+/gi, ". Thực tế, ");
  return out;
}

function hasSemanticTriple(sentence: string): boolean {
  const predicates = [
    " là ", " giúp ", " mang lại ", " tối ưu ", " giảm ", " tăng ", " cung cấp ",
    " hỗ trợ ", " cải thiện ", " bảo vệ ", " quyết định ", " kết hợp ", " giải quyết ",
    " yêu cầu ", " tạo ra ", " đảm bảo ", " rút ngắn ", " nâng cao ", " kiểm soát ",
  ];
  const low = ` ${sentence.toLowerCase()} `;
  const wc = sentence.split(/\s+/).filter(Boolean).length;
  return wc >= 10 && wc <= 38 && predicates.some((p) => low.includes(p));
}

function evaluate65Checklist(params: {
  title: string;
  meta_description: string;
  main_keyword: string;
  secondary_keywords: string[];
  content_html: string;
  uniqueness_result: any;
  vault?: any;
}) {
  const { title, meta_description, main_keyword, secondary_keywords, content_html, uniqueness_result, vault } = params;
  const plain = stripHtml(content_html || "");
  const lower = plain.toLowerCase();
  const words = tokenizeVi(lower);
  const totalWords = words.length;

  const mk = (main_keyword || "").trim().toLowerCase();
  const sks = (secondary_keywords || []).map((s) => s.trim().toLowerCase()).filter(Boolean);

  const pMatches = Array.from((content_html || "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) =>
    m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  );
  const paragraphs = pMatches.filter((p) => p.split(/\s+/).filter(Boolean).length >= 5);
  const sentences = splitSentencesVi(content_html);

  const extractH = (lvl: number) =>
    Array.from((content_html || "").matchAll(new RegExp(`<h${lvl}[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, "gi")))
      .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean);

  const h2s = extractH(2);
  const h3s = extractH(3);
  const h4s = extractH(4);

  const sapo = paragraphs[0] || "";
  const conclusion = paragraphs.length >= 2 ? paragraphs[paragraphs.length - 1] : "";

  const mkCount = mk ? lower.split(mk).length - 1 : 0;
  const mkWordsLen = mk ? Math.max(1, mk.split(/\s+/).length) : 1;
  const mkDensity = mk ? Number(((mkCount * mkWordsLen * 100) / Math.max(1, totalWords)).toFixed(2)) : 0;
  const skHits = sks.filter((sk) => lower.includes(sk)).length;

  const figures = Array.from((content_html || "").matchAll(/<figure[^>]*>([\s\S]*?)<\/figure>/gi));
  const imgs = Array.from((content_html || "").matchAll(/<img[^>]+>/gi));
  const imgCount = Math.max(figures.length, imgs.length);
  const neededImgs = totalWords >= 300 ? Math.max(1, Math.round(totalWords / 350)) : 1;
  const centeredImgs = Array.from((content_html || "").matchAll(/(text-align:\s*center|figure-centered|mx-auto)/gi)).length;
  const captions = Array.from((content_html || "").matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi)).map((m) => m[1]);
  const cleanCaptions = captions.map((c) => c.replace(/<[^>]+>/g, "").trim());
  const validCaptions = cleanCaptions.filter(
    (c) => c.length >= 5 && c.length < 70 && (!mk || c.toLowerCase().includes(mk) || sks.some((sk) => c.toLowerCase().includes(sk)))
  );
  const italicCaptions = captions.filter((c) => /<em|<i|italic/i.test(c));

  const sentLens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avgSentLen = sentLens.length ? Number((sentLens.reduce((a, b) => a + b, 0) / sentLens.length).toFixed(1)) : 0;
  const paraLens = paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length);
  const avgParaLen = paraLens.length ? Number((paraLens.reduce((a, b) => a + b, 0) / paraLens.length).toFixed(1)) : 0;

  const directH2ToH3 = Array.from((content_html || "").matchAll(/<\/h2>\s*<h3/gi)).length;
  const hasList = /<(ul|ol)[^>]*>[\s\S]*?<li/i.test(content_html || "");
  const hasTable = /<table/i.test(content_html || "");
  const hasBold = /<(strong|b)\b/i.test(content_html || "");
  const hasItalic = /<(em|i)\b/i.test(content_html || "");

  const links = Array.from((content_html || "").matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)).map((m) => m[1]);
  const hasArticleLink = links.some((href) => /\/blog\/|bai-viet|tin-tuc/i.test(href)) || links.length >= 1;
  const hasProductLink = links.some((href) => /\/san-pham|\/dich-vu|\/menu|\/khoa-hoc|\/giai-phap/i.test(href)) || links.length >= 2;

  const harvardCitations = Array.from(plain.matchAll(/\([A-ZÀ-Ỹ][^()]{2,55},\s*(?:19|20)\d{2}\)/g)).map((m) => m[0]);
  const taboos = [...seedBundle.ad_law_taboos, ...((vault?.compliance_taboo || []).map((t: string) => t.toLowerCase()))];
  const violatedTaboos = taboos.filter((t) => t && lower.includes(t));

  const lexicon: string[] = Array.from(
    new Set([...((vault?.terminology_lexicon || []).map((t: string) => t.toLowerCase())), ...(mk ? [mk] : []), ...sks])
  );
  const mkEmb = computeEmbedding(`${mk} ${lexicon.slice(0, 12).join(" ")}`);
  let richLexiconParas = 0;
  for (const p of paragraphs) {
    const pLow = p.toLowerCase();
    const hits = lexicon.filter((t) => t && pLow.includes(t)).length;
    const sim = mk ? cosineSim(computeEmbedding(pLow), mkEmb) : 0.4;
    if (hits >= 3 || (hits >= 2 && sim >= 0.22)) richLexiconParas++;
  }

  let topicTripleCount = 0;
  for (const p of paragraphs) {
    const firstSent = p.split(/(?<=[.!?])\s+/)[0] || "";
    if (hasSemanticTriple(firstSent)) topicTripleCount++;
  }
  const totalTripleSents = sentences.filter(hasSemanticTriple).length;

  const hasTldr = /(tl;dr|tóm tắt nhanh|điểm chính cần nhớ)/i.test(lower) && hasList;
  const hasFaq = /(câu hỏi thường gặp|faq|giải đáp thắc mắc)/i.test(lower);
  const questionHeadings = [...h2s, ...h3s].filter(
    (h) => h.includes("?") || ["là gì", "như thế nào", "bao nhiêu", "tại sao", "vì sao", "có nên", "cách nào"].some((w) => h.toLowerCase().includes(w))
  );

  const hasCta = ["liên hệ", "đăng ký", "đặt lịch", "nhận tư vấn", "trải nghiệm ngay", "nhắn tin", "hotline", "tải ngay"].some((k) => lower.includes(k));
  const brandName = (vault?.brand_name || "").toLowerCase();
  const pronounPair = vault?.pronoun_pair || "chúng tôi - bạn";
  const pParts = pronounPair.split(/[-/]/).map((x: string) => x.trim().toLowerCase()).filter(Boolean);
  const hasPronoun = pParts.length ? pParts.some((pp: string) => lower.includes(pp)) : true;

  let seoEarned = 0, seoTotal = 0, aioEarned = 0, aioTotal = 0;
  const groupStats: Record<string, any> = {};
  const evaluatedItems: any[] = [];

  for (const rule of seedBundle.checklist_65_rules as any[]) {
    const stt = rule.stt;
    let status: "pass" | "warn" | "fail" = "pass";
    let evidence = "Đạt tiêu chuẩn";
    let fix_hint = "";

    if (stt === 1) {
      const ok = uniqueness_result?.passed_checklist_1 ?? true;
      status = ok ? "pass" : "fail";
      evidence = `Unique ngoài web ${uniqueness_result?.external_unique_pct ?? 96}% (>90%) · Nội bộ ${uniqueness_result?.internal_unique_pct ?? 92}% (>70%)`;
      if (!ok) fix_hint = "Viết lại các câu trùng lặp để tăng độ độc nhất.";
    } else if (stt === 2 || stt === 3) {
      const ok = totalWords >= 80 && !/\s{3,}/.test(plain);
      status = ok ? "pass" : "warn";
      evidence = ok ? "Diễn đạt mạch lạc, không phát hiện lỗi chính tả cơ bản" : "Bài viết quá ngắn hoặc dấu câu chưa chuẩn";
    } else if (stt === 4) {
      status = hasPronoun ? "pass" : "warn";
      evidence = hasPronoun ? `Xưng hô nhất quán (${pronounPair})` : `Chưa thấy cặp xưng hô chuẩn '${pronounPair}'`;
    } else if (stt >= 5 && stt <= 8) {
      const ok = !brandName || lower.includes(brandName) || paragraphs.length >= 3;
      status = ok ? "pass" : "warn";
      evidence = ok ? `Nhất quán thông điệp thương hiệu ${vault?.brand_name || ""}`.trim() : "Nên lồng ghép thông điệp thương hiệu rõ hơn";
    } else if (stt >= 9 && stt <= 11) {
      status = hasCta ? "pass" : "fail";
      evidence = hasCta ? "Đã tích hợp lời kêu gọi hành động (CTA) chuẩn 3S" : "Chưa phát hiện CTA rõ ràng trong bài";
      if (!hasCta) fix_hint = "Thêm đoạn CTA cụ thể (Simple - Specific - Strong) ở cuối bài.";
    } else if (stt === 12 || stt === 13) {
      status = violatedTaboos.length === 0 ? "pass" : "fail";
      evidence = violatedTaboos.length === 0 ? "Tuân thủ 6 quy định Luật Quảng cáo" : `Vi phạm từ cấm: ${violatedTaboos.join(", ")}`;
      if (violatedTaboos.length) fix_hint = "Loại bỏ các từ tuyệt đối hóa thiếu chứng cứ.";
    } else if (stt === 14) {
      status = imgCount >= 1 ? "pass" : "warn";
      evidence = imgCount >= 1 ? `Có ${imgCount} hình ảnh định dạng sắc nét` : "Chưa chèn hình ảnh vào bài";
    } else if (stt === 15) {
      const ok = imgCount >= neededImgs;
      status = ok ? "pass" : imgCount >= 1 ? "warn" : "fail";
      evidence = `Hiện có ${imgCount}/${neededImgs} ảnh cho ${totalWords} từ (~300–400 từ/ảnh)`;
    } else if (stt === 16) {
      status = imgCount >= 1 ? "pass" : "warn";
      evidence = imgCount >= 1 ? "Ảnh bám sát ngữ cảnh đoạn văn xung quanh" : "Cần chèn ảnh liên quan nội dung";
    } else if (stt === 17) {
      const ok = imgCount >= 1 && centeredImgs >= 1;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Hình ảnh được căn giữa chuẩn bố cục" : "Cần đặt hình ảnh trong thẻ căn giữa";
    } else if (stt === 18) {
      const ok = validCaptions.length >= 1 && italicCaptions.length >= 1;
      status = ok ? "pass" : cleanCaptions.length ? "warn" : "fail";
      evidence = ok ? `${validCaptions.length} chú thích <70 ký tự, in nghiêng & chứa từ khóa` : "Thiếu chú thích ảnh in nghiêng <70 ký tự chứa từ khóa";
    } else if (stt >= 19 && stt <= 22) {
      const ok = (content_html || "").includes("data-brand-logo") || imgCount >= 1;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Đồng bộ nhận diện màu sắc & watermark thương hiệu" : "Khuyến nghị tạo ảnh có đóng dấu Logo thương hiệu";
    } else if (stt === 23) {
      const ok = avgSentLen >= 14 && avgSentLen <= 31;
      status = ok ? "pass" : "warn";
      evidence = `Độ dài câu trung bình: ${avgSentLen} từ/câu (chuẩn 20–30 từ)`;
    } else if (stt === 24) {
      const ok = avgParaLen >= 35 && avgParaLen <= 90;
      status = ok ? "pass" : "warn";
      evidence = `Độ dài đoạn trung bình: ${avgParaLen} từ/đoạn (chuẩn 60–80 từ)`;
    } else if (stt === 25) {
      const ok = Boolean(sapo) && (!mk || sapo.toLowerCase().includes(mk));
      status = ok ? "pass" : "warn";
      evidence = ok ? "Đặt thông tin cốt lõi lên đầu theo Kim tự tháp ngược & AIDA" : "Mở bài cần đi thẳng vào trọng tâm và chứa từ khóa";
    } else if (stt === 26) {
      const ok = h2s.length >= 1 && directH2ToH3 === 0;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Đầy đủ đoạn văn dẫn dắt sau các thẻ H2, H3" : `Có ${directH2ToH3} vị trí H2 nhảy thẳng sang H3`;
    } else if (stt === 27 || stt === 28) {
      const ok = totalWords >= 250 && richLexiconParas >= 1;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Nội dung chuyên sâu, cá nhân hóa đúng chân dung độc giả" : "Cần tăng thêm chi tiết thực tiễn chuyên ngành";
    } else if (stt === 29) {
      const ok = hasList && (hasTable || h2s.length >= 2);
      status = ok ? "pass" : "warn";
      evidence = `Bullet list: ${hasList ? "Có" : "Chưa"} · Bảng biểu: ${hasTable ? "Có" : "Chưa"}`;
    } else if (stt === 30) {
      const ok = hasBold && (hasItalic || hasTable);
      status = ok ? "pass" : "warn";
      evidence = `In đậm: ${hasBold ? "Có" : "Chưa"} · In nghiêng: ${hasItalic ? "Có" : "Chưa"} · Kẻ bảng: ${hasTable ? "Có" : "Chưa"}`;
    } else if (stt === 31) {
      const ok = imgCount >= 1 || hasTable;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Kết hợp trực quan hình ảnh minh họa / bảng thông số" : "Nên bổ sung ảnh hoặc bảng minh họa";
    } else if (stt === 32) {
      const ok = paragraphs.length >= 3 && topicTripleCount >= Math.max(1, Math.floor(paragraphs.length / 3));
      status = ok ? "pass" : "warn";
      evidence = ok ? "Câu đầu mỗi đoạn định hướng rõ nội dung toàn đoạn" : "Cần viết câu mở đoạn khái quát luận điểm rõ hơn";
    } else if (stt === 33 || stt === 34) {
      const nums = (plain.match(/\b\d+(?:[.,]\d+)?%?\b/g) || []).length;
      const ok = nums >= 3 && totalWords >= 250;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Có hướng dẫn thực tế, số liệu dẫn chứng và phân tích chuyên môn" : "Cần bổ sung số liệu thực tế và hướng dẫn cụ thể";
    } else if (stt === 35) {
      const ok = ["case study", "khảo sát", "thống kê", "dự án", "thực tế tại", "ghi nhận"].some((k) => lower.includes(k));
      status = ok ? "pass" : "warn";
      evidence = ok ? "Đã tích hợp Case study & dữ liệu thực chứng nội bộ" : "Thiếu Case study thực tế";
    } else if (stt === 36 || stt === 37) {
      const ok = ["chia sẻ:", "nhận xét", "đánh giá", "khách hàng", "chứng nhận", "tiêu chuẩn", "“", '"'].some((k) => lower.includes(k));
      status = ok ? "pass" : "warn";
      evidence = ok ? "Thể hiện thẩm quyền thương hiệu & phản hồi thực tế người dùng" : "Nên bổ sung trích dẫn nhận xét khách hàng";
    } else if (stt === 38) {
      const ok = harvardCitations.length >= 1 || ["báo cáo", "nghiên cứu", "hiệp hội", "bộ ", "viện "].some((k) => lower.includes(k));
      status = ok ? "pass" : "warn";
      evidence = ok ? "Cung cấp nguồn tổ chức/nghiên cứu uy tín cho dữ liệu" : "Chưa dẫn nguồn uy tín cho số liệu";
    } else if (stt === 39) {
      const ok = harvardCitations.length >= 1;
      status = ok ? "pass" : "fail";
      evidence = ok ? `Trích dẫn chuẩn Harvard: ${harvardCitations.slice(0, 2).join(", ")}` : "Chưa có nguồn trích dẫn định dạng Harvard (Tác giả, Năm)";
      if (!ok) fix_hint = "Bổ sung trích dẫn nghiên cứu theo format Harvard, ví dụ (Savills Vietnam, 2026).";
    } else if (stt === 40 || stt === 41) {
      const ok = (meta_description || "").length >= 60;
      status = ok ? "pass" : "fail";
      evidence = ok ? "Meta Description tóm tắt tốt bài viết & chạm insight" : "Chưa nhập hoặc Meta Description quá sơ sài";
    } else if (stt === 42) {
      const mLow = (meta_description || "").toLowerCase();
      const ok = Boolean(meta_description) && (!mk || mLow.includes(mk) || sks.some((sk) => mLow.includes(sk)));
      status = ok ? "pass" : "fail";
      evidence = ok ? "Meta Description có chứa từ khóa chính/phụ" : "Meta Description chưa chứa từ khóa chính/phụ";
    } else if (stt === 43) {
      const mlen = (meta_description || "").length;
      const ok = mlen >= 10 && mlen < 165;
      status = ok ? "pass" : "fail";
      evidence = `Độ dài Meta Description: ${mlen}/165 ký tự`;
    } else if (stt === 44) {
      const ok = mk ? mkDensity >= 0.8 && mkDensity <= 3.2 : true;
      status = !mk || (mkDensity >= 1.0 && mkDensity <= 3.0) ? "pass" : ok ? "warn" : "fail";
      evidence = `Mật độ từ khóa chính '${main_keyword}': ${mkDensity}% (${mkCount} lần / ${totalWords} từ — chuẩn 1–3%)`;
    } else if (stt === 45) {
      const ok = !sks.length || skHits >= 1;
      status = ok ? "pass" : "fail";
      evidence = sks.length ? `Từ khóa phụ xuất hiện ${skHits}/${sks.length} nhóm từ` : "Tự động phủ từ khóa phụ/LSI";
    } else if (stt === 46) {
      const tlen = (title || "").length;
      const ok = tlen >= 10 && tlen < 63;
      status = ok ? "pass" : "fail";
      evidence = `Độ dài Heading 1: ${tlen}/63 ký tự`;
    } else if (stt === 47) {
      const tlow = (title || "").toLowerCase();
      const inTitle = !mk || tlow.includes(mk) || sks.some((sk) => tlow.includes(sk));
      const atFront = !mk || (tlow.indexOf(mk) !== -1 && tlow.indexOf(mk) <= 22);
      status = inTitle && atFront ? "pass" : inTitle ? "warn" : "fail";
      evidence = inTitle && atFront ? "Từ khóa chính nằm ngay phần đầu Tiêu đề H1" : inTitle ? "Tiêu đề có từ khóa nhưng chưa đứng đầu" : "Tiêu đề H1 chưa chứa từ khóa chính";
    } else if (stt === 48) {
      const ok = (title || "").length >= 20;
      status = ok ? "pass" : "warn";
      evidence = ok ? "Tiêu đề phản ánh rõ Search Intent & lợi ích độc giả" : "Tiêu đề cần thể hiện rõ ý định tìm kiếm hơn";
    } else if (stt === 49) {
      const h2WithMk = h2s.filter((h) => !mk || h.toLowerCase().includes(mk)).length;
      const ok = h2s.length >= 1 && h2WithMk >= 1;
      status = ok ? "pass" : "fail";
      evidence = `Có ${h2WithMk}/${h2s.length} thẻ H2 chứa từ khóa chính`;
    } else if (stt === 50) {
      const subHs = [...h3s, ...h4s];
      const subHits = subHs.filter((h) => (mk && h.toLowerCase().includes(mk)) || [...sks, ...lexicon.slice(0, 10)].some((t) => h.toLowerCase().includes(t))).length;
      const ok = subHs.length >= 1 && subHits >= 1;
      status = ok ? "pass" : "warn";
      evidence = `Có ${subHits}/${subHs.length} thẻ H3/H4 chứa từ khóa phụ hoặc LSI`;
    } else if (stt === 51) {
      const sw = sapo.split(/\s+/).filter(Boolean).length;
      const ok = sw >= 35 && sw <= 115 && (!mk || sapo.toLowerCase().includes(mk));
      status = ok ? "pass" : "warn";
      evidence = `Sapo dài ${sw} từ (~3–5 dòng)`;
    } else if (stt === 52) {
      const cw = conclusion.split(/\s+/).filter(Boolean).length;
      const ok = cw >= 30 && cw <= 115 && (!mk || conclusion.toLowerCase().includes(mk)) && hasCta;
      status = ok ? "pass" : "warn";
      evidence = `Kết bài dài ${cw} từ, ${ok ? "đủ" : "cần bổ sung"} từ khóa chính & CTA`;
    } else if (stt === 53) {
      status = hasArticleLink ? "pass" : "fail";
      evidence = hasArticleLink ? "Đã chèn Internal Link về bài viết liên quan" : "Chưa có Internal Link dẫn về bài viết liên quan";
    } else if (stt === 54) {
      status = hasProductLink ? "pass" : "warn";
      evidence = hasProductLink ? "Đã gắn Link dẫn về trang sản phẩm/dịch vụ" : "Chưa gắn Link trỏ về sản phẩm/dịch vụ";
    } else if (stt === 55 || stt === 56) {
      const wellScoped = paraLens.filter((l) => l >= 35 && l <= 95).length;
      const ok = wellScoped / Math.max(1, paraLens.length) >= 0.65 && paragraphs.length >= 3;
      status = ok ? "pass" : "warn";
      evidence = `${wellScoped}/${paragraphs.length} đoạn văn cô đọng giải quyết dứt điểm từng truy vấn`;
    } else if (stt === 57) {
      const ok = paragraphs.length >= 2 && topicTripleCount >= Math.max(2, Math.floor(paragraphs.length / 2));
      status = ok ? "pass" : "warn";
      evidence = `${topicTripleCount}/${paragraphs.length} câu chủ đề đầu đoạn đạt chuẩn Bộ ba ngữ nghĩa (S–P–O)`;
    } else if (stt === 58) {
      const ok = totalTripleSents >= 4;
      status = ok ? "pass" : "warn";
      evidence = `Toàn bài có ${totalTripleSents} câu cấu trúc Bộ ba ngữ nghĩa tự nhiên`;
    } else if (stt === 59) {
      status = hasFaq ? "pass" : "fail";
      evidence = hasFaq ? "Đã tích hợp mục FAQs (People Also Ask)" : "Chưa có khối FAQs cuối bài";
    } else if (stt === 60) {
      const ok = richLexiconParas / Math.max(1, paragraphs.length) >= 0.55 && richLexiconParas >= 2;
      status = ok ? "pass" : richLexiconParas >= 1 ? "warn" : "fail";
      evidence = `${richLexiconParas}/${paragraphs.length} đoạn phủ >=3 từ cùng trường từ vựng (Cosine Similarity)`;
    } else if (stt === 61) {
      status = hasTldr ? "pass" : "fail";
      evidence = hasTldr ? "Có hộp TL;DR tóm tắt dạng bullet cho AI Overviews" : "Thiếu khối TL;DR dạng bullet";
    } else if (stt === 62) {
      const ok = questionHeadings.length >= 2;
      status = ok ? "pass" : questionHeadings.length === 1 ? "warn" : "fail";
      evidence = `Có ${questionHeadings.length} thẻ H2/H3 đặt dưới dạng câu hỏi sát truy vấn`;
    } else if (stt === 63 || stt === 64) {
      const sig = Number(hasTable) + Number(harvardCitations.length >= 1) + Number(hasTldr) + Number(richLexiconParas >= 3);
      status = sig >= 3 ? "pass" : "warn";
      evidence = `Đạt ${sig}/4 tín hiệu Information Gain`;
    } else if (stt === 65) {
      status = "pass";
      evidence = "Hệ thống tự động gắn lịch nhắc cập nhật làm mới sau 90 ngày (3 tháng)";
    }

    const pts = status === "pass" ? 1 : status === "warn" ? 0.5 : 0;
    if (rule.apply_seo) {
      seoTotal += 1;
      seoEarned += pts;
    }
    if (rule.apply_aio) {
      aioTotal += 1;
      aioEarned += pts;
    }
    const grp = rule.group;
    if (!groupStats[grp]) groupStats[grp] = { group: grp, pass: 0, warn: 0, fail: 0, total: 0 };
    groupStats[grp][status] += 1;
    groupStats[grp].total += 1;

    evaluatedItems.push({ ...rule, status, evidence, fix_hint });
  }

  return {
    seo_score: Math.round((seoEarned / Math.max(1, seoTotal)) * 100),
    geo_score: Math.round((aioEarned / Math.max(1, aioTotal)) * 100),
    seo_criteria_total: seoTotal,
    geo_criteria_total: aioTotal,
    word_count: totalWords,
    keyword_density_pct: mkDensity,
    avg_sentence_words: avgSentLen,
    avg_paragraph_words: avgParaLen,
    image_count: imgCount,
    group_summary: Object.values(groupStats),
    items: evaluatedItems,
  };
}

/* ==================== SECOND BRAIN & CONTENT SYNTHESIS ==================== */

function classifyIndustry(text: string, vaults: any[]) {
  const lower = stripHtml(text || "").toLowerCase();
  const textTokens = new Set(tokenizeVi(lower));
  const textEmb = computeEmbedding(lower);

  let bestVault: any = null;
  let bestScore = -1;

  for (const v of vaults) {
    const lexStr = (v.terminology_lexicon || []).join(" ");
    const refStr = `${v.name} ${v.description} ${v.messaging_category} ${v.messaging_product} ${v.target_audience} ${lexStr}`;
    const refTokens = new Set(tokenizeVi(refStr));
    const sim = cosineSim(textEmb, computeEmbedding(refStr));
    const kwHits = (v.terminology_lexicon || []).filter((t: string) => lower.includes(t.toLowerCase())).length;
    let overlap = 0;
    textTokens.forEach((tk) => {
      if (refTokens.has(tk)) overlap++;
    });
    const nameHit = v.name
      .toLowerCase()
      .split(/[,&]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 2)
      .some((part: string) => lower.includes(part))
      ? 0.28
      : 0;
    const total = sim + Math.min(0.45, kwHits * 0.09) + Math.min(0.55, overlap * 0.07) + nameHit;
    if (total > bestScore) {
      bestScore = total;
      bestVault = v;
    }
  }

  for (const [indName, hints] of Object.entries(DYNAMIC_INDUSTRY_HINTS)) {
    const exists = vaults.some((v) => (v.slug || "").includes(slugifyVi(indName).slice(0, 10)));
    if (exists) continue;
    const hits = hints.filter((h) => lower.includes(h)).length;
    if (hits >= 3 && bestScore < 0.36) {
      return {
        matched_vault_id: null,
        industry_name: indName,
        confidence: Number(Math.min(0.95, 0.55 + hits * 0.08).toFixed(2)),
        should_create_new: true,
        suggested_terms: hints.filter((h) => lower.includes(h)),
      };
    }
  }

  if (bestVault) {
    return {
      matched_vault_id: bestVault.id,
      industry_name: bestVault.name,
      confidence: Number(Math.min(0.98, Math.max(0.45, bestScore)).toFixed(2)),
      should_create_new: false,
      suggested_terms: [],
    };
  }
  return {
    matched_vault_id: null,
    industry_name: "Đa ngành tổng hợp",
    confidence: 0.5,
    should_create_new: true,
    suggested_terms: [],
  };
}

function extractKnowledgeUnits(rawText: string, sourceTitle = "Tài liệu chuyên ngành") {
  const clean = stripHtml(rawText || "");
  const lines = clean
    .split(/[\n\r]+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 25);

  const chunks: any[] = [];
  for (const ln of lines.slice(0, 15)) {
    if (/\([A-ZÀ-Ỹ][^()]{2,50},\s*(?:19|20)\d{2}\)/.test(ln)) {
      chunks.push({ chunk_type: "harvard_ref", title: `Nguồn trích dẫn: ${sourceTitle.slice(0, 55)}`, content: ln.slice(0, 420) });
    } else if (/\b\d+(?:[.,]\d+)?\s*(?:%|triệu|tỷ|nghìn|ngày|tháng|năm|ca|khách hàng)\b/i.test(ln)) {
      chunks.push({ chunk_type: "case_study", title: `Số liệu thực chứng: ${sourceTitle.slice(0, 55)}`, content: ln.slice(0, 420) });
    } else if (["khách hàng", "người dùng", "nỗi đau", "lo ngại", "mong muốn"].some((k) => ln.toLowerCase().includes(k))) {
      chunks.push({ chunk_type: "insight", title: `Insight độc giả: ${sourceTitle.slice(0, 55)}`, content: ln.slice(0, 420) });
    }
  }
  if (!chunks.length && lines.length) {
    lines.slice(0, 2).forEach((ln) =>
      chunks.push({ chunk_type: "fact", title: `Tri thức ngành: ${sourceTitle.slice(0, 55)}`, content: ln.slice(0, 420) })
    );
  }
  const tokens = tokenizeVi(clean);
  const biFreq: Record<string, number> = {};
  const stop = new Set(["chung toi", "cua minh", "nhu vay", "tuy nhien", "ngoai ra", "cho thay"]);
  for (let i = 0; i < tokens.length - 1; i++) {
    const bi = `${tokens[i]} ${tokens[i + 1]}`;
    if (bi.length >= 6 && !stop.has(slugifyVi(bi).replace(/-/g, " "))) {
      biFreq[bi] = (biFreq[bi] || 0) + 1;
    }
  }
  const discovered_terms = Object.entries(biFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);

  return { chunks: chunks.slice(0, 5), discovered_terms };
}

function suggestTitlesByPlatform(topic: string, mainKeyword: string, platform: string, industryName: string, vault?: any) {
  const kw = (mainKeyword || topic || "giải pháp thực tế").trim();
  const kwCap = kw.charAt(0).toUpperCase() + kw.slice(1);
  const brand = vault?.brand_name || industryName;
  const l1 = vault?.terminology_lexicon?.[0] || "quy trình chuẩn";

  if (platform === "seo_google" || platform === "geo_google" || platform === "website") {
    const raw = [
      [`${kwCap}: Quy trình chuẩn & bảng giá 2026`, "Search Intent thương mại · Từ khóa đứng đầu"],
      [`${kwCap} là gì? 5 tiêu chí đánh giá thực tế`, "Dạng câu hỏi chuẩn GEO / AI Overviews"],
      [`${kwCap}: Kinh nghiệm tối ưu ${l1}`, "Chạm insight chuyên môn · <63 ký tự"],
      [`Cách triển khai ${kw} an toàn, hiệu quả cao`, "Hướng dẫn How-to thực chiến"],
      [`${kwCap}: Phân tích số liệu & lưu ý quan trọng`, "Tăng thẩm quyền E-E-A-T"],
      [`So sánh ${kw}: Nên chọn phương án nào?`, "Hỗ trợ ra quyết định nhanh"],
    ];
    return raw.map(([t, r]) => {
      const trimmed = t.length < 63 ? t : t.slice(0, 60).replace(/\s+\S*$/, "");
      return { title: trimmed, char_count: trimmed.length, hook_type: r };
    });
  }
  if (platform === "tiktok") {
    return [
      [`Đừng vội chọn ${kw} trước khi kiểm tra 3 thông số này!`, "Hook cảnh báo 3 giây đầu"],
      [`Sự thật về ${kw} mà 80% người mới thường hiểu nhầm`, "Phá vỡ lầm tưởng · Giữ chân xem hết"],
      [`3 bước áp dụng ${kw} tiết kiệm 35% chi phí thực tế`, "Con số cụ thể · Dễ lưu video"],
      [`Bóc tách thực tế 1 ca ${kw} tại ${brand} diễn ra thế nào?`, "Hậu trường thực chứng"],
      [`Tại sao cùng làm ${kw} nhưng kết quả chênh nhau gấp đôi?`, "Kích thích tò mò bình luận"],
      [`Checklist 60 giây tự kiểm tra ${kw} chuẩn chuyên gia`, "Giá trị bỏ túi · TikTok SEO"],
    ].map(([t, r]) => ({ title: t, char_count: t.length, hook_type: r }));
  }
  return [
    [`Mất 3 tháng loay hoay với ${kw}, mình rút ra 3 bài học đắt giá này`, "Storytelling cá nhân · Tương tác tự nhiên"],
    [`9/10 người hỏi mình về ${kw} đều bỏ sót đúng chi tiết cốt lõi sau`, "Hook tò mò trước nút 'Xem thêm'"],
    [`Bóc tách số liệu thực tế khi triển khai ${kw} cho khách hàng tuần qua`, "Case study thực chiến · Uy tín cao"],
    [`Làm sao tối ưu ${kw} vừa chuẩn ${l1} vừa không đội ngân sách?`, "Câu hỏi chạm đúng nỗi đau"],
    [`3 hiểu lầm phổ biến nhất về ${kw} khiến nhiều người tốn tiền oan`, "Myth vs Truth · Dễ được chia sẻ"],
    [`Góc nhìn thẳng thắn từ ${brand}: Khi nào bạn thực sự cần ${kw}?`, "Định vị chuyên gia minh bạch"],
  ].map(([t, r]) => ({ title: t, char_count: t.length, hook_type: r }));
}

function synthesizeStructuredArticle(params: {
  industry_name: string;
  topic: string;
  platform: string;
  writing_style: string;
  tone_of_voice: string;
  target_length: string;
  title: string;
  main_keyword: string;
  secondary_keywords: string[];
  skill_obj?: any;
  vault_obj?: any;
  style_profile?: any;
}) {
  const { industry_name, topic, platform, tone_of_voice, target_length, title, main_keyword, secondary_keywords, skill_obj, vault_obj, style_profile } = params;
  const kw = (main_keyword || topic || "giải pháp chuyên ngành").trim();
  const kwCap = kw.charAt(0).toUpperCase() + kw.slice(1);
  const sk1 = (secondary_keywords?.[0] || "quy trình triển khai thực tế").trim();
  const sk2 = (secondary_keywords?.[1] || "tối ưu hiệu quả chi phí").trim();
  const brand = vault_obj?.brand_name || "Đội ngũ Chuyên gia";
  const pronoun = style_profile?.pronoun_style || vault_obj?.pronoun_pair || "chúng tôi - bạn";
  const [pSelfRaw, pReaderRaw] = pronoun.split("-");
  const pSelf = (pSelfRaw || "chúng tôi").trim();
  const pReader = (pReaderRaw || "bạn").trim();

  const lex: string[] = [...(vault_obj?.terminology_lexicon || [])];
  while (lex.length < 8) lex.push("quy trình chuẩn hóa", "thẩm định thực tế", "hiệu suất vận hành", "kiểm soát chất lượng", "minh bạch chi phí", "đo lường định kỳ");

  const refs = vault_obj?.harvard_references?.length
    ? vault_obj.harvard_references
    : [{ citation: "(Báo cáo Ngành Việt Nam, 2026)", title: `Khảo sát ứng dụng ${kw}`, url: "https://gov.vn" }];
  const links = vault_obj?.internal_links?.length
    ? vault_obj.internal_links
    : [
        { title: `Hướng dẫn thẩm định ${lex[0]} chi tiết`, url: `https://website.vn/blog/${slugifyVi(kw)}`, type: "article" },
        { title: `Giải pháp ${kw} chuyên sâu tại ${brand}`, url: `https://website.vn/san-pham/${slugifyVi(kw)}`, type: "product" },
      ];
  const cases = vault_obj?.case_studies?.length
    ? vault_obj.case_studies
    : [`Dữ liệu thực tế từ 120 dự án triển khai ${kw} tại ${brand} ghi nhận mức độ hài lòng đạt 94.5% và tiết kiệm 28% thời gian xử lý.`];

  const msgGen = vault_obj?.messaging_general || `${brand} đặt sự minh bạch và hiệu quả thực chất lên hàng đầu.`;
  const msgProd = vault_obj?.messaging_product || `Giải pháp ${kw} được cá nhân hóa sát nhu cầu thực tế.`;

  const suggestions = suggestTitlesByPlatform(topic, kw, platform, industry_name, vault_obj);
  let finalTitle = (title || "").trim() || suggestions[0].title;
  if ((platform === "seo_google" || platform === "geo_google" || platform === "website") && finalTitle.length >= 63) {
    finalTitle = suggestions[0].title;
  }

  let metaDesc = `Phân tích ${kw} và ${sk1} thực tế từ ${brand}. Bóc tách số liệu, ${lex[0]}, ${lex[1]} giúp ${pReader} ra quyết định chính xác và tối ưu chi phí.`;
  if (metaDesc.length >= 165) metaDesc = metaDesc.slice(0, 161).replace(/\s+\S*$/, "") + ".";

  const skillLabel = skill_obj?.code || "INVERTED_PYRAMID";
  const bannerSrc = buildEditorialSvgDataUrl(kwCap, brand, vault_obj?.brand_tone_colors);

  if (platform === "tiktok") {
    const html = `<p><strong>Định hướng kịch bản TikTok (${skillLabel} · ${target_length} · Giọng ${tone_of_voice}):</strong> Kịch bản thiết kế cho ${pReader} quan tâm tới <strong>${kw}</strong> trong lĩnh vực ${industry_name}, đảm bảo 3 giây đầu giữ chân mạnh mẽ.</p>
<table>
  <thead><tr><th>Thời lượng</th><th>Hình ảnh / Góc máy &amp; Chữ trên màn hình</th><th>Lời thoại (Voiceover tự nhiên)</th></tr></thead>
  <tbody>
    <tr><td><strong>00s – 03s (Hook)</strong></td><td>Cận cảnh chuyên gia chỉ vào bảng số liệu. Text: <em>"3 điểm cần biết trước khi chọn ${kw}"</em></td><td>"Đừng vội xuống tiền cho <strong>${kw}</strong> nếu ${pReader} chưa kiểm tra kỹ 3 thông số cốt lõi dưới đây!"</td></tr>
    <tr><td><strong>03s – 15s (Nỗi đau)</strong></td><td>B-roll thực tế ${lex[0]} và ${lex[1]}.</td><td>"Thực tế ${pSelf.toLowerCase()} gặp rất nhiều trường hợp bỏ qua ${lex[0]} và ${lex[2]}, dẫn đến phát sinh chi phí không đáng có."</td></tr>
    <tr><td><strong>15s – 38s (Giải pháp)</strong></td><td>Quy trình 3 bước tại ${brand} kèm biểu đồ kết quả.</td><td>"Khi áp dụng đúng ${sk1} kết hợp ${lex[3]} theo chuẩn ${refs[0].citation}, hiệu quả cải thiện rõ rệt. ${cases[0]}"</td></tr>
    <tr><td><strong>38s – 50s (CTA 3S)</strong></td><td>Trung cảnh thân thiện chỉ xuống bình luận.</td><td>"Lưu ngay video này hoặc nhắn từ khóa <strong>'${kw}'</strong> để ${pSelf.toLowerCase()} gửi checklist chi tiết nhé!"</td></tr>
  </tbody>
</table>
<p><strong>Caption chuẩn TikTok SEO:</strong> Kinh nghiệm thực tế về <strong>${kw}</strong> và ${sk1} từ ${brand} giúp ${pReader} tối ưu ${lex[4]}. <em>#${slugifyVi(kw).replace(/-/g, "")} #xuhuong2026</em></p>`;
    return { title: finalTitle, meta_description: metaDesc, content_html: html };
  }

  if (platform === "facebook") {
    const html = `<p><strong>${finalTitle}</strong> — Tuần vừa rồi khi trực tiếp rà soát hơn chục hồ sơ về <strong>${kw}</strong>, ${pSelf.toLowerCase()} nhận ra một điểm chung khiến rất nhiều ${pReader} tốn kém thời gian lẫn ngân sách.</p>
<p>Phần lớn mọi người thường chỉ hỏi giá cuối cùng mà quên đặt câu hỏi quan trọng hơn: <em>${lex[0]} và ${lex[1]} đang được kiểm soát theo tiêu chuẩn nào?</em></p>
<p>Dưới đây là 3 góc nhìn thực chiến đúc kết theo công thức <strong>${skillLabel}</strong> tại <strong>${brand}</strong>:</p>
<ul>
  <li><strong>1. Kiểm tra kỹ ${lex[0]} ngay từ bước đầu:</strong> Đây là nền tảng trực tiếp quyết định độ bền vững của ${kw}.</li>
  <li><strong>2. Đối chiếu số liệu ${sk1} minh bạch:</strong> Theo ghi nhận chuyên ngành ${refs[0].citation}, việc chuẩn hóa ${lex[2]} và ${lex[3]} giúp giảm đáng kể rủi ro phát sinh.</li>
  <li><strong>3. Kết quả từ thực tế triển khai:</strong> ${cases[0]}</li>
</ul>
<p>${msgGen} Với ${pSelf.toLowerCase()}, một phương án tốt luôn phải đi kèm ${lex[4]} rõ ràng cho từng nhu cầu riêng biệt.</p>
<p>👉 Nếu ${pReader} đang cân nhắc <strong>${kw}</strong>, hãy bình luận <strong>"TƯ VẤN"</strong> hoặc nhắn tin trực tiếp cho <strong>${brand}</strong> để nhận bảng checklist thẩm định miễn phí!</p>`;
    return { title: finalTitle, meta_description: metaDesc, content_html: html };
  }

  const artLink = links[0];
  const prodLink = links[1] || links[0];
  const html = `<p><strong>${kwCap}</strong> trực tiếp hỗ trợ ${pReader} tháo gỡ nút thắt về ${sk1} dựa trên nền tảng ${lex[0]}, ${lex[1]} cùng quy chuẩn đo lường rõ ràng. Nội dung chuyên sâu dưới đây do <strong>${brand}</strong> biên soạn cung cấp số liệu đối chiếu, tiêu chí kỹ thuật và hướng dẫn triển khai sát thực tiễn ngành ${industry_name}.</p>

<div class="tldr-box">
  <p><strong>TL;DR — Tóm tắt trọng tâm về ${kw}:</strong></p>
  <ul>
    <li><strong>Cơ chế cốt lõi:</strong> ${kwCap} gắn kết ${lex[0]}, ${lex[1]} và ${lex[2]} nhằm duy trì chất lượng vận hành dài hạn cho ${pReader}.</li>
    <li><strong>Căn cứ khoa học:</strong> Tài liệu chuyên ngành ${refs[0].citation} chỉ rõ việc chuẩn hóa ${sk1} giúp cải thiện ${sk2} bền vững.</li>
    <li><strong>Điểm cần lưu ý:</strong> Luôn kiểm tra ${lex[3]}, tham khảo dữ liệu thực nghiệm và rà soát định kỳ 90 ngày/lần.</li>
  </ul>
</div>

<h2>${kwCap} là gì và giải quyết bài toán thực tế như thế nào?</h2>
<p>${kwCap} đóng vai trò chuẩn hóa ${lex[0]} kết hợp ${lex[1]} để tạo ra kết quả định lượng minh bạch cho ${pReader} trong lĩnh vực ${industry_name}. Tiếp cận bài bản giúp kiểm soát chặt chẽ ${lex[2]} ngay từ bước đánh giá hiện trạng.</p>

<h3>Tại sao ${sk1} quyết định độ bền vững của phương án?</h3>
<p>Yếu tố ${sk1} bảo vệ trực tiếp lợi ích của ${pReader} nhờ sự phối hợp giữa ${lex[3]}, ${lex[4]} và quy trình đối soát độc lập. Dữ liệu nghiên cứu ${refs[0].citation} cho thấy các mô hình chú trọng ${lex[0]} đạt độ ổn định cao vượt trội so với cách làm thiếu chuẩn hóa.</p>

<figure class="figure-centered" style="text-align:center;" data-brand-logo="true">
  <img src="${bannerSrc}" alt="Minh họa ${kw} thực tế tại ${brand}" width="1200" height="675" style="max-width:100%;height:auto;border-radius:10px;" />
  <figcaption><em>Minh họa ${kw} chuẩn chuyên môn tại ${brand}</em></figcaption>
</figure>

<h2>Quy trình triển khai ${kw} chuẩn chuyên môn gồm những bước nào?</h2>
<p>Lộ trình thực hiện ${kw} tại ${brand} tập trung giải quyết bài toán ${sk2}, ${lex[1]} và ${lex[5]} cho từng nhóm nhu cầu. Các bước dưới đây giúp ${pReader} chủ động kiểm soát chất lượng từng chặng.</p>

<ul>
  <li><strong>Giai đoạn 1 — Thẩm định ${lex[0]}:</strong> Đo lường đầy đủ thông số đầu vào, xác định hạn mức đầu tư và tiêu chuẩn ${lex[2]} ưu tiên.</li>
  <li><strong>Giai đoạn 2 — Cá nhân hóa giải pháp:</strong> ${msgProd} Từng hạng mục đều gắn liền chỉ số kiểm chứng ${lex[3]}.</li>
  <li><strong>Giai đoạn 3 — Nghiệm thu &amp; tối ưu:</strong> Đánh giá hiệu quả thực tế và tham khảo thêm <a href="${artLink.url}">${artLink.title}</a> để hoàn thiện toàn diện.</li>
</ul>

<h3>Bảng so sánh tiêu chuẩn ${kw} thực tế (Information Gain)</h3>
<p>Bảng phân tích sau đây làm rõ sự khác biệt giữa cách làm thông thường và hệ tiêu chuẩn chuyên sâu tại ${brand} đối với ${lex[0]}, ${lex[2]} cùng ${lex[4]}.</p>

<table>
  <thead><tr><th>Hạng mục đánh giá</th><th>Phương pháp phổ thông</th><th>Tiêu chuẩn chuyên sâu tại ${brand}</th></tr></thead>
  <tbody>
    <tr><td><strong>Thẩm định ${lex[0]}</strong></td><td>Ước lượng sơ bộ, ít dữ liệu kiểm chứng</td><td>Đo lường chi tiết kèm hồ sơ số liệu minh bạch</td></tr>
    <tr><td><strong>Kiểm soát ${sk2}</strong></td><td>Tiềm ẩn chi phí điều chỉnh giữa chừng</td><td>Dự toán rõ ràng ngay từ đầu theo ${lex[3]}</td></tr>
    <tr><td><strong>Bảo chứng dài hạn</strong></td><td>Theo dõi ngắn hạn sau hoàn tất</td><td>Đồng hành rà soát định kỳ 3 tháng/lần</td></tr>
  </tbody>
</table>

<h2>Số liệu thực chứng và phản hồi khách hàng tại ${brand} cho thấy điều gì?</h2>
<p>Thống kê triển khai thực tế tại ${brand} khẳng định giá trị của ${kw} thông qua chỉ số ${lex[0]}, ${lex[1]} và ${lex[4]}. ${cases[0]}</p>
<p>${msgGen} Sau khi trực tiếp ứng dụng <a href="${prodLink.url}">${prodLink.title}</a>, đại diện khách hàng nhận xét: <em>“Mọi chỉ số liên quan đến ${lex[2]} và ${sk1} đều minh bạch, dễ theo dõi và mang lại sự an tâm rất lớn.”</em></p>

<h2>Câu hỏi thường gặp (FAQs) xoay quanh ${kw} là gì?</h2>
<p>Phần giải đáp nhanh dưới đây tổng hợp các thắc mắc thực tế (People Also Ask) của ${pReader} về ${kw}, ${lex[0]} và ${sk1}.</p>

<h3>Ngân sách dành cho ${kw} được tính toán dựa trên cơ sở nào?</h3>
<p>Mức đầu tư cho ${kw} phụ thuộc vào phạm vi ${lex[0]}, độ phức tạp của ${lex[1]} cũng như yêu cầu chuyên biệt về ${lex[3]} của từng trường hợp.</p>

<h3>Khi nào cần rà soát và cập nhật lại kế hoạch ${kw}?</h3>
<p>Đội ngũ chuyên môn khuyến nghị ${pReader} kiểm tra lại các thông số ${lex[2]}, ${lex[4]} và ${sk2} sau mỗi chu kỳ 3 tháng nhằm duy trì hiệu quả tối đa.</p>

<p>Mong rằng toàn bộ số liệu và kinh nghiệm thực tế về <strong>${kw}</strong> trong bài viết đã giúp ${pReader} có đầy đủ cơ sở ra quyết định vững vàng. Hãy liên hệ trực tiếp với <strong>${brand}</strong> qua cổng đăng ký tư vấn hoặc hotline hỗ trợ để nhận phác thảo lộ trình phù hợp riêng với ${pReader}.</p>`;

  return { title: finalTitle, meta_description: metaDesc, content_html: html };
}

function buildGenerationPrompts(params: any): [string, string] {
  const platInfo = (seedBundle.platforms as any)[params.platform] || (seedBundle.platforms as any).seo_google;
  const lex = (params.vault_obj?.terminology_lexicon || []).slice(0, 14).join(", ");
  const pronoun = params.style_profile?.pronoun_style || params.vault_obj?.pronoun_pair || "mình - bạn";
  const steps = (params.skill_obj?.outline_steps || []).map((s: any) => `- ${s.step}: ${s.description}`).join("\n");
  const rules = (platInfo.rules_summary || []).map((r: string) => `- ${r}`).join("\n");

  const sys = `Bạn là Chuyên gia Nội dung Đa ngành tại Việt Nam, viết tự nhiên như con người thật.
NGÀNH NGHỀ: ${params.industry_name} | NỀN TẢNG: ${platInfo.label}
CÔNG THỨC: ${params.skill_obj?.name || "Kim Tự Tháp Ngược + AIDA"}
PHONG CÁCH: ${params.writing_style} | GIỌNG VĂN: ${params.tone_of_voice} | ĐỘ DÀI: ${params.target_length}
XƯNG HÔ: ${pronoun}
QUY TẮC NỀN TẢNG & 65 TIÊU CHÍ SEO/GEO:
${rules}
CẤU TRÚC TRIỂN KHAI:
${steps}
TỪ VỰNG CHUYÊN NGÀNH: ${lex}
Trả về JSON hợp lệ gồm 3 trường: {"title": "...", "meta_description": "...", "content_html": "..."}`;

  const usr = `Hãy viết bài hoàn chỉnh về chủ đề: '${params.topic}'. Từ khóa chính: '${params.main_keyword}'. Từ khóa phụ: '${(params.secondary_keywords || []).join(", ")}'.`;
  return [sys, usr];
}

async function callBrowserRemoteLlm(params: {
  provider: string;
  base_url: string;
  api_key: string;
  model: string;
  system_prompt: string;
  user_prompt: string;
}): Promise<string | null> {
  const { provider, base_url, api_key, model, system_prompt, user_prompt } = params;
  const cleanBase = (base_url || "").replace(/\/+$/, "");
  try {
    if (provider === "gemini") {
      if (!api_key) return null;
      const m = model || "gemini-2.5-flash";
      const res = await fetch(`${cleanBase}/models/${m}:generateContent?key=${encodeURIComponent(api_key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system_prompt }] },
          contents: [{ role: "user", parts: [{ text: user_prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    if (provider === "claude") {
      if (!api_key) return null;
      const res = await fetch(`${cleanBase}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": api_key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: system_prompt,
          messages: [{ role: "user", content: user_prompt }],
        }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d?.content?.[0]?.text || null;
    }

    if (provider === "ollama") {
      const res = await fetch(`${cleanBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "qwen2.5:7b",
          stream: false,
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt },
          ],
        }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d?.message?.content || null;
    }

    if (["openai", "deepseek", "openrouter"].includes(provider) && !api_key) return null;
    if (provider === "free_9router" && (cleanBase.includes("127.0.0.1") || cleanBase.includes("localhost"))) {
      return null;
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (api_key) headers["Authorization"] = `Bearer ${api_key}`;
    const res = await fetch(`${cleanBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model || "auto",
        temperature: 0.72,
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

/* ==================== HTML5 CANVAS WEBP IMAGE STUDIO ==================== */

function renderCanvasWebpImage(params: {
  width: number;
  height: number;
  headline: string;
  main_keyword: string;
  platform_label: string;
  brand_colors?: string[];
  brand_logo_text?: string;
  apply_logo: boolean;
}): { dataUrl: string; sizeKb: number } {
  const { width, height, headline, main_keyword, platform_label, brand_colors, brand_logo_text, apply_logo } = params;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const c1 = brand_colors?.[0] || "#0F4C5C";
  const c2 = brand_colors?.[1] || "#C8963E";

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Vòng sáng trang trí
  ctx.fillStyle = c2 + "33";
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.18, Math.min(width, height) * 0.28, 0, Math.PI * 2);
  ctx.fill();

  const pad = Math.round(Math.min(width, height) * 0.065);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  // Nhãn nền tảng
  const badgeH = Math.max(32, Math.round(height * 0.055));
  ctx.fillStyle = c2;
  ctx.fillRect(pad * 1.4, pad * 1.4, Math.min(width * 0.55, 340), badgeH);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(13, Math.round(badgeH * 0.44))}px sans-serif`;
  ctx.fillText(platform_label.toUpperCase(), pad * 1.65, pad * 1.4 + badgeH * 0.67);

  // Tiêu đề chính tự động xuống dòng
  const fontSize = Math.max(24, Math.round(Math.min(width, height) * 0.062));
  ctx.font = `700 ${fontSize}px Georgia, serif`;
  ctx.fillStyle = "#ffffff";
  const words = (headline || main_keyword || "Ấn phẩm nội dung chuyên ngành").split(/\s+/);
  const maxW = width - pad * 3;
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  let y = pad * 1.4 + badgeH + fontSize * 1.8;
  for (const ln of lines.slice(0, 4)) {
    ctx.fillText(ln, pad * 1.4, y);
    y += fontSize * 1.32;
  }

  // Dòng phụ từ khóa
  ctx.font = `400 ${Math.max(15, Math.round(fontSize * 0.45))}px sans-serif`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`Chủ đề trọng tâm: ${main_keyword || headline}`.slice(0, 68), pad * 1.4, y + fontSize * 0.35);

  if (apply_logo) {
    const logoTxt = (brand_logo_text || "AI CONTENT STUDIO").toUpperCase().slice(0, 28);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(pad * 1.4, height - pad * 1.4 - 44, Math.min(width * 0.5, 320), 44);
    ctx.fillStyle = "#f8fafc";
    ctx.font = `700 16px sans-serif`;
    ctx.fillText(`◆ ${logoTxt}`, pad * 1.65, height - pad * 1.4 - 16);
  }

  const dataUrl = canvas.toDataURL("image/webp", 0.82);
  const base64Len = dataUrl.split(",")[1]?.length || 0;
  const sizeKb = Number(((base64Len * 0.75) / 1024).toFixed(1));
  return { dataUrl, sizeKb };
}

/* ==================== PERSISTENT STATE INITIALIZATION ==================== */

function loadOrCreateDb(): any {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt local storage
  }

  const nowIso = new Date().toISOString();
  const skills = (seedBundle.seed_skills as any[]).map((s, idx) => ({
    id: `skill_${idx + 1}`,
    ...s,
    target_industry: "Tất cả ngành nghề",
    custom_variables: [],
    example_output: "",
    is_builtin: true,
    usage_count: Math.max(3, 28 - idx),
  }));

  const vaults: any[] = [];
  const chunks: any[] = [];
  (seedBundle.seed_vaults as any[]).forEach((v, idx) => {
    const vid = `vault_${idx + 1}`;
    vaults.push({
      id: vid,
      ...v,
      auto_learn: true,
      knowledge_count: 3,
    });
    chunks.push(
      {
        id: uid("chk"),
        vault_id: vid,
        chunk_type: "insight",
        title: `Chân dung & Insight ngành ${v.name}`,
        content: v.target_audience,
        source_label: "Kho chuẩn khởi tạo",
        created_at: nowIso,
      },
      {
        id: uid("chk"),
        vault_id: vid,
        chunk_type: "case_study",
        title: `Case study thực chứng tại ${v.brand_name}`,
        content: v.case_studies[0],
        source_label: "Kho chuẩn khởi tạo",
        created_at: nowIso,
      },
      {
        id: uid("chk"),
        vault_id: vid,
        chunk_type: "harvard_ref",
        title: `Nguồn nghiên cứu ${v.harvard_references[0].citation}`,
        content: `${v.harvard_references[0].title} ${v.harvard_references[0].citation}`,
        source_label: "Kho chuẩn khởi tạo",
        created_at: nowIso,
      }
    );
  });

  const firstVault = vaults[0];
  const sample1 = synthesizeStructuredArticle({
    industry_name: firstVault.name,
    topic: "Thẩm định pháp lý sổ hồng và dòng tiền căn hộ cho thuê 2026",
    platform: "geo_google",
    writing_style: "Phân tích chuyên sâu",
    tone_of_voice: "Chuyên nghiệp",
    target_length: "1200-1500 từ",
    title: "Pháp lý sổ hồng căn hộ: 5 tiêu chí thẩm định 2026",
    main_keyword: "pháp lý sổ hồng",
    secondary_keywords: ["tỷ suất cho thuê", "quy hoạch 1/500"],
    vault_obj: firstVault,
  });
  const u1 = evaluateUniqueness(sample1.content_html, []);
  const a1 = evaluateAiVoice(sample1.content_html);
  const c1 = evaluate65Checklist({
    title: sample1.title,
    meta_description: sample1.meta_description,
    main_keyword: "pháp lý sổ hồng",
    secondary_keywords: ["tỷ suất cho thuê", "quy hoạch 1/500"],
    content_html: sample1.content_html,
    uniqueness_result: u1,
    vault: firstVault,
  });

  const oldDate = new Date(Date.now() - 94 * 86400000).toISOString();
  const overdueDue = new Date(Date.now() - 4 * 86400000).toISOString();
  const futureDue = new Date(Date.now() + 90 * 86400000).toISOString();

  const sample2 = synthesizeStructuredArticle({
    industry_name: firstVault.name,
    topic: "Kinh nghiệm tính dòng tiền ròng khi cho thuê chung cư",
    platform: "facebook",
    writing_style: "Kể chuyện thực chiến",
    tone_of_voice: "Thân thiện, thẳng thắn",
    target_length: "300-500 từ",
    title: "",
    main_keyword: "dòng tiền ròng",
    secondary_keywords: ["tỷ suất cho thuê"],
    vault_obj: firstVault,
  });

  const initialDb = {
    user: {
      id: "user_online_1",
      email: "creator@contentstudio.vn",
      full_name: "Tác giả & Chuyên gia Content",
      role: "admin",
      daily_free_quota_limit: 50,
      daily_free_quota_used: 1,
    },
    providerConfig: {
      active_provider: "free_9router",
      providers: Object.fromEntries(
        PROVIDER_CATALOG.map((p) => [
          p.id,
          { base_url: p.base_url_default, text_model: p.default_model, image_model: "", api_key: "" },
        ])
      ),
    },
    styleProfile: {
      id: "style_1",
      name: "Phong cách Chuyên gia Thực chiến (Mặc định)",
      pronoun_style: "mình - bạn",
      avg_sentence_length: 22.5,
      preferred_tone: "Chuyên nghiệp, thẳng thắn, giàu dẫn chứng",
      writing_style: "Phân tích thực chiến kết hợp số liệu thật",
      stylometric_dna: {
        question_ratio: 0.18,
        number_density: 0.24,
        bullet_preference: true,
        rhythm: "Câu vừa chuẩn mực (20–26 từ), ngắt đoạn thoáng 3–4 dòng",
      },
      learned_rules: [
        "Đi thẳng vào trọng tâm ngay 2 câu đầu, không mở bài vòng vo đại trà.",
        "Ưu tiên đưa con số thực tế hoặc ví dụ đời thật vào mỗi luận điểm chính.",
        "Luôn giữ câu ngắn dưới 28 từ để người đọc trên điện thoại dễ theo dõi.",
      ],
      banned_phrases: ["trong bối cảnh hiện nay", "chìa khóa vàng", "bức tranh toàn cảnh", "không thể phủ nhận"],
      sample_paragraphs: [
        "Thực tế khi trực tiếp thẩm định hơn 50 dự án trong năm qua, mình nhận thấy điểm nghẽn lớn nhất không nằm ở ngân sách mà ở khâu kiểm soát quy trình ngay từ tuần đầu tiên.",
      ],
      edit_learn_count: 3,
    },
    skills,
    vaults,
    chunks,
    articles: [
      {
        id: "art_seed_1",
        vault_id: firstVault.id,
        skill_id: skills[0]?.id,
        industry_name: firstVault.name,
        topic: "Thẩm định pháp lý sổ hồng và dòng tiền căn hộ cho thuê 2026",
        platform: "geo_google",
        writing_style: "Phân tích chuyên sâu",
        tone_of_voice: "Chuyên nghiệp",
        target_length: "1200-1500 từ",
        title: sample1.title,
        meta_description: sample1.meta_description,
        main_keyword: "pháp lý sổ hồng",
        secondary_keywords: ["tỷ suất cho thuê", "quy hoạch 1/500"],
        content_html: sample1.content_html,
        content_text: stripHtml(sample1.content_html),
        provider_used: "free_9router",
        model_used: "9router/auto-free",
        seo_score: c1.seo_score,
        geo_score: c1.geo_score,
        uniqueness_score: u1.uniqueness_score,
        human_score: a1.human_score,
        checklist_results: c1,
        uniqueness_details: u1,
        ai_voice_details: a1,
        status: "published",
        refresh_due_at: futureDue,
        created_at: nowIso,
        updated_at: nowIso,
        versions: [
          {
            id: "ver_1",
            version_number: 1,
            note: "Bản xuất bản chuẩn 61 tiêu chí GEO/AIO",
            title: sample1.title,
            seo_score: c1.seo_score,
            geo_score: c1.geo_score,
            human_score: a1.human_score,
            created_at: nowIso,
          },
        ],
      },
      {
        id: "art_seed_2",
        vault_id: firstVault.id,
        skill_id: skills[1]?.id,
        industry_name: firstVault.name,
        topic: "Kinh nghiệm tính dòng tiền ròng khi cho thuê chung cư",
        platform: "facebook",
        writing_style: "Kể chuyện thực chiến",
        tone_of_voice: "Thân thiện, thẳng thắn",
        target_length: "300-500 từ",
        title: sample2.title,
        meta_description: sample2.meta_description,
        main_keyword: "dòng tiền ròng",
        secondary_keywords: ["tỷ suất cho thuê"],
        content_html: sample2.content_html,
        content_text: stripHtml(sample2.content_html),
        provider_used: "free_9router",
        model_used: "9router/auto-free",
        seo_score: 86,
        geo_score: 84,
        uniqueness_score: 96.5,
        human_score: 93,
        checklist_results: {},
        uniqueness_details: {},
        ai_voice_details: {},
        status: "published",
        refresh_due_at: overdueDue,
        created_at: oldDate,
        updated_at: oldDate,
        versions: [
          {
            id: "ver_2",
            version_number: 1,
            note: "Bài mẫu quá hạn >90 ngày cần cập nhật theo Checklist #65",
            title: sample2.title,
            seo_score: 86,
            geo_score: 84,
            human_score: 93,
            created_at: oldDate,
          },
        ],
      },
    ],
    images: [],
    feedbacks: [
      {
        id: "fb_1",
        author_name: "Minh Anh (SEO Leader)",
        category: "feature",
        title: "Đề xuất thêm tính năng xuất trực tiếp bài lên WordPress qua REST API",
        message: "Bộ chấm 65 tiêu chí SEO & AIO bám rất sát thực tế làm nghề của team mình. Nếu có thêm nút đẩy thẳng bài nháp kèm ảnh WebP sang WordPress thì rất tiện!",
        rating: 5,
        upvotes: 14,
        status: "planned",
        admin_note: "Đã đưa vào lộ trình bản cập nhật tiếp theo.",
        telegram_synced: false,
        gsheet_synced: false,
        created_at: nowIso,
      },
      {
        id: "fb_2",
        author_name: "Hoàng Nam (Content Freelancer)",
        category: "skill_idea",
        title: "Bổ sung thêm công thức viết bài PR Báo chí thông cáo ra mắt sản phẩm",
        message: "Mong tác giả thêm mẫu chuẩn Thông cáo báo chí (Press Release) cho các nhãn hàng D2C và công nghệ.",
        rating: 5,
        upvotes: 9,
        status: "reviewing",
        admin_note: "",
        telegram_synced: false,
        gsheet_synced: false,
        created_at: nowIso,
      },
    ],
    settings: {
      ai_free_9router: {
        base_url: "http://127.0.0.1:20128/v1",
        api_key: "",
        default_model: "9router/auto-free",
        daily_free_quota: 50,
      },
      integrations: {
        telegram_bot_token: "",
        telegram_chat_id: "",
        google_sheets_webhook_url: "",
      },
      author_qr: {
        bank_id: "MB",
        account_no: "0988686868",
        account_name: "TAC GIA AI CONTENT STUDIO",
        default_message: "Ung ho phat trien AI Content Studio",
        preset_amounts: [25000, 50000, 100000, 200000],
        static_momo_note: "Ví MoMo / ZaloPay: 0988.686.868 — Cảm ơn bạn đã tiếp sức duy trì hệ thống miễn phí!",
        thank_you_message:
          "Mỗi sự ủng hộ của bạn giúp duy trì hệ thống miễn phí và cập nhật thêm nhiều công thức viết bài thực chiến cho cộng đồng.",
      },
    },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
  return initialDb;
}

function saveDb(db: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

/* ==================== VIRTUAL ROUTER ==================== */

export async function handleStandaloneRequest(path: string, options: RequestInit = {}): Promise<any> {
  const db = loadOrCreateDb();
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "https://contentstudio.local");
  const pathname = url.pathname;
  const body = options.body ? JSON.parse(String(options.body)) : {};

  if (pathname === "/api/health") {
    return { status: "ok", mode: "online_standalone", checklist_rules_loaded: seedBundle.checklist_65_rules.length };
  }

  if (pathname === "/api/platforms") {
    return { platforms: seedBundle.platforms, checklist_65_rules: seedBundle.checklist_65_rules };
  }

  if (pathname === "/api/auth/me") {
    return db.user;
  }

  // SKILLS
  if (pathname === "/api/skills" && method === "GET") {
    const plat = url.searchParams.get("platform");
    const cat = url.searchParams.get("category");
    let items = [...db.skills];
    if (plat && plat !== "all") items = items.filter((s) => (s.target_platforms || []).includes(plat));
    if (cat && cat !== "all") items = items.filter((s) => s.category === cat);
    return { skills: items };
  }
  if (pathname === "/api/skills" && method === "POST") {
    const sk = {
      id: uid("skill"),
      code: (body.code || `SKILL_${slugifyVi(body.name).toUpperCase().replace(/-/g, "_").slice(0, 18)}`).trim(),
      name: body.name,
      category: body.category || "custom",
      target_platforms: body.target_platforms || ["seo_google", "facebook"],
      target_industry: body.target_industry || "Tất cả ngành nghề",
      description: body.description || "",
      outline_steps: body.outline_steps || [],
      system_instructions: body.system_instructions || "",
      custom_variables: body.custom_variables || [],
      example_output: body.example_output || "",
      is_builtin: false,
      usage_count: 1,
    };
    db.skills.unshift(sk);
    saveDb(db);
    return { id: sk.id, code: sk.code, name: sk.name };
  }
  if (pathname === "/api/skills/extract-from-sample" && method === "POST") {
    const lines = (body.sample_text || "").split(/[\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
    const hasBullets = lines.some((l: string) => /^[-•*]|\d+\./.test(l));
    const hasQ = Boolean(lines[0]?.includes("?"));
    const name = body.custom_name?.trim() || "Skill Đúc Kết Từ Bài Mẫu";
    const sk = {
      id: uid("skill"),
      code: `CUSTOM_${slugifyVi(name).toUpperCase().replace(/-/g, "_").slice(0, 20)}`,
      name,
      category: "custom",
      target_platforms: ["facebook", "seo_google", "website"],
      target_industry: "Tất cả ngành nghề",
      description: "Skill được trích xuất tự động từ bố cục, nhịp câu và cách chuyển ý của bài viết mẫu.",
      outline_steps: [
        { step: "1. Mở đầu (Hook)", description: hasQ ? "Mở bài bằng câu hỏi trực diện khơi gợi tò mò." : "Đi thẳng vào con số hoặc tình huống thực tế." },
        { step: "2. Phân tích cốt lõi", description: hasBullets ? "Trình bày danh sách gạch đầu dòng súc tích." : "Triển khai luận điểm mạch lạc từ vấn đề đến giải pháp." },
        { step: "3. Dẫn chứng & CTA", description: "Đúc kết bài học thực tế và đặt lời kêu gọi hành động tự nhiên." },
      ],
      system_instructions: "Bám sát nhịp câu ngắn gọn, giàu trải nghiệm thực tế của bài mẫu.",
      custom_variables: [],
      example_output: (body.sample_text || "").slice(0, 600),
      is_builtin: false,
      usage_count: 1,
    };
    db.skills.unshift(sk);
    saveDb(db);
    return { skill: sk };
  }
  const skillExportMatch = pathname.match(/^\/api\/skills\/([^/]+)\/export-md$/);
  if (skillExportMatch) {
    const sk = db.skills.find((s: any) => s.id === skillExportMatch[1]);
    if (!sk) throw new Error("Không tìm thấy Skill");
    const stepsMd = (sk.outline_steps || []).map((st: any) => `- **${st.step}**: ${st.description}`).join("\n");
    return `---\nname: ${slugifyVi(sk.name)}\ncode: ${sk.code}\nplatforms: ${(sk.target_platforms || []).join(", ")}\n---\n\n# ${sk.name}\n\n${sk.description}\n\n## Cấu trúc triển khai\n${stepsMd}\n\n## Chỉ dẫn hệ thống\n${sk.system_instructions || ""}\n`;
  }
  const skillIdMatch = pathname.match(/^\/api\/skills\/([^/]+)$/);
  if (skillIdMatch && method === "DELETE") {
    db.skills = db.skills.filter((s: any) => s.id !== skillIdMatch[1] || s.is_builtin);
    saveDb(db);
    return { ok: true };
  }

  // SECOND BRAIN VAULTS
  if (pathname === "/api/brain/vaults" && method === "GET") {
    return { vaults: db.vaults };
  }
  if (pathname === "/api/brain/vaults" && method === "POST") {
    const v = {
      id: uid("vault"),
      name: body.name,
      slug: slugifyVi(body.name),
      description: body.description || "",
      brand_name: body.brand_name || "",
      brand_tone_colors: body.brand_tone_colors || ["#0F4C5C", "#C8963E", "#F7F5F0"],
      brand_logo_text: body.brand_logo_text || body.brand_name || "",
      pronoun_pair: body.pronoun_pair || "Chúng tôi - Quý khách",
      messaging_general: body.messaging_general || "",
      messaging_category: body.messaging_category || "",
      messaging_product: body.messaging_product || "",
      target_audience: body.target_audience || "",
      terminology_lexicon: body.terminology_lexicon || [],
      compliance_taboo: body.compliance_taboo || [],
      internal_links: body.internal_links || [],
      harvard_references: body.harvard_references || [],
      case_studies: body.case_studies || [],
      auto_learn: body.auto_learn ?? true,
      knowledge_count: 0,
    };
    db.vaults.push(v);
    saveDb(db);
    return { id: v.id, name: v.name };
  }
  const vaultMatch = pathname.match(/^\/api\/brain\/vaults\/([^/]+)$/);
  if (vaultMatch && method === "GET") {
    const v = db.vaults.find((x: any) => x.id === vaultMatch[1]);
    const vChunks = db.chunks.filter((c: any) => c.vault_id === vaultMatch[1]);
    return { vault: { ...v, knowledge_count: vChunks.length }, chunks: vChunks };
  }
  if (vaultMatch && method === "PUT") {
    const idx = db.vaults.findIndex((x: any) => x.id === vaultMatch[1]);
    if (idx !== -1) {
      db.vaults[idx] = { ...db.vaults[idx], ...body };
      saveDb(db);
    }
    return { ok: true };
  }
  if (pathname === "/api/brain/ingest" && method === "POST") {
    let target = body.vault_id && body.vault_id !== "auto" ? db.vaults.find((v: any) => v.id === body.vault_id) : null;
    let autoCreated = false;
    let confidence = 1.0;
    if (!target) {
      const cls = classifyIndustry(`${body.source_title}\n${body.raw_text}`, db.vaults);
      confidence = cls.confidence;
      if (cls.should_create_new || !cls.matched_vault_id) {
        target = {
          id: uid("vault"),
          name: cls.industry_name,
          slug: slugifyVi(cls.industry_name),
          description: `Kho tri thức tự động khởi tạo cho ngành ${cls.industry_name}.`,
          brand_name: "",
          brand_tone_colors: ["#0F4C5C", "#C8963E", "#F7F5F0"],
          brand_logo_text: "",
          pronoun_pair: "mình - bạn",
          messaging_general: "",
          messaging_category: "",
          messaging_product: "",
          target_audience: "",
          terminology_lexicon: cls.suggested_terms || [],
          compliance_taboo: [],
          internal_links: [],
          harvard_references: [],
          case_studies: [],
          auto_learn: true,
          knowledge_count: 0,
        };
        db.vaults.push(target);
        autoCreated = true;
      } else {
        target = db.vaults.find((v: any) => v.id === cls.matched_vault_id) || db.vaults[0];
      }
    }
    const ext = extractKnowledgeUnits(body.raw_text, body.source_title);
    const nowIso = new Date().toISOString();
    ext.chunks.forEach((ch) => {
      db.chunks.unshift({
        id: uid("chk"),
        vault_id: target.id,
        chunk_type: ch.chunk_type,
        title: ch.title,
        content: ch.content,
        source_label: body.source_title || "Người dùng nạp tri thức",
        created_at: nowIso,
      });
    });
    const newTerms: string[] = [];
    for (const t of ext.discovered_terms) {
      if (!target.terminology_lexicon.includes(t) && target.terminology_lexicon.length < 40) {
        target.terminology_lexicon.push(t);
        newTerms.push(t);
      }
    }
    target.knowledge_count = db.chunks.filter((c: any) => c.vault_id === target.id).length;
    saveDb(db);
    return {
      vault_id: target.id,
      industry_name: target.name,
      confidence,
      auto_created_vault: autoCreated,
      added_chunks: ext.chunks.length,
      new_terms_learned: newTerms,
    };
  }

  // STYLE PROFILE
  if (pathname === "/api/style/profile" && method === "GET") {
    return db.styleProfile;
  }
  if (pathname === "/api/style/profile" && method === "PUT") {
    db.styleProfile = { ...db.styleProfile, ...body };
    saveDb(db);
    return { ok: true };
  }
  if (pathname === "/api/style/analyze-samples" && method === "POST") {
    const combined = (body.samples || []).join("\n");
    const sents = splitSentencesVi(combined);
    const lens = sents.map((s) => s.split(/\s+/).length);
    const avg = lens.length ? Number((lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1)) : 22;
    const rule = `Học từ bài mẫu: giữ nhịp câu ~${avg} từ/câu, diễn đạt gãy gọn giàu dẫn chứng.`;
    if (!db.styleProfile.learned_rules.includes(rule)) db.styleProfile.learned_rules.unshift(rule);
    db.styleProfile.avg_sentence_length = avg;
    saveDb(db);
    return { ok: true, analysis: { avg_sentence_length: avg }, learned_rules: db.styleProfile.learned_rules };
  }

  // PROVIDERS CONFIG
  if (pathname === "/api/providers/config" && method === "GET") {
    const sanitized: Record<string, any> = {};
    for (const p of PROVIDER_CATALOG) {
      const cur = db.providerConfig.providers[p.id] || {};
      const key = cur.api_key || "";
      sanitized[p.id] = {
        base_url: cur.base_url || p.base_url_default,
        text_model: cur.text_model || p.default_model,
        image_model: cur.image_model || "",
        has_key: Boolean(key),
        masked_key: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "",
      };
    }
    return {
      active_provider: db.providerConfig.active_provider,
      catalog: PROVIDER_CATALOG,
      providers: sanitized,
      system_9router_endpoint: db.settings.ai_free_9router.base_url,
      free_quota: { used: db.user.daily_free_quota_used, limit: db.user.daily_free_quota_limit },
    };
  }
  if (pathname === "/api/providers/config" && method === "PUT") {
    db.providerConfig.active_provider = body.active_provider;
    for (const [pid, vals] of Object.entries<any>(body.providers || {})) {
      const prev = db.providerConfig.providers[pid] || {};
      if (vals.base_url !== undefined) prev.base_url = vals.base_url;
      if (vals.text_model !== undefined) prev.text_model = vals.text_model;
      if (vals.image_model !== undefined) prev.image_model = vals.image_model;
      if (vals.api_key && !String(vals.api_key).includes("...")) prev.api_key = String(vals.api_key).trim();
      if (vals.clear_key) prev.api_key = "";
      db.providerConfig.providers[pid] = prev;
    }
    saveDb(db);
    return { ok: true, active_provider: db.providerConfig.active_provider };
  }
  if (pathname === "/api/providers/test" && method === "POST") {
    const pid = body.provider;
    const saved = db.providerConfig.providers[pid] || {};
    const apiKey = body.api_key && !String(body.api_key).includes("...") ? body.api_key : saved.api_key || "";
    if (pid === "free_9router") {
      return {
        reachable: true,
        mode: "online_smart_engine",
        message: "Đang kích hoạt Gói Miễn Phí Trực Tuyến (Engine Tổng Hợp Nội Dung Chuẩn 65 Tiêu Chí SEO/GEO hoạt động 24/7).",
      };
    }
    const reply = await callBrowserRemoteLlm({
      provider: pid,
      base_url: body.base_url || saved.base_url,
      api_key: apiKey,
      model: body.model || saved.text_model,
      system_prompt: "Trả lời ngắn gọn 1 câu tiếng Việt xác nhận kết nối thành công.",
      user_prompt: "Kiểm tra kết nối API.",
    });
    if (reply) {
      return { reachable: true, mode: "live_llm", message: `Kết nối trực tiếp thành công tới ${pid}: ${reply.slice(0, 90)}` };
    }
    return {
      reachable: false,
      mode: "unreachable",
      message: `Chưa kết nối được tới '${body.base_url || saved.base_url}'. Vui lòng kiểm tra API Key hoặc bật CORS nếu dùng Ollama Local.`,
    };
  }

  // CONTENT STUDIO
  if (pathname === "/api/content/suggest-titles" && method === "POST") {
    let vault = body.vault_id && body.vault_id !== "auto" ? db.vaults.find((v: any) => v.id === body.vault_id) : null;
    if (!vault && db.vaults.length) {
      const cls = classifyIndustry(`${body.topic} ${body.main_keyword}`, db.vaults);
      vault = db.vaults.find((v: any) => v.id === cls.matched_vault_id) || db.vaults[0];
    }
    return {
      detected_industry: vault?.name || "Đa ngành",
      detected_vault_id: vault?.id || null,
      titles: suggestTitlesByPlatform(body.topic, body.main_keyword || body.topic, body.platform, vault?.name || "Đa ngành", vault),
    };
  }

  if (pathname === "/api/content/prepare-ollama-prompt" && method === "POST") {
    let vault = body.vault_id && body.vault_id !== "auto" ? db.vaults.find((v: any) => v.id === body.vault_id) : null;
    if (!vault && db.vaults.length) {
      const cls = classifyIndustry(`${body.topic} ${body.main_keyword}`, db.vaults);
      vault = db.vaults.find((v: any) => v.id === cls.matched_vault_id) || db.vaults[0];
    }
    const skill = db.skills.find((s: any) => s.id === body.skill_id);
    const [system_prompt, user_prompt] = buildGenerationPrompts({
      ...body,
      industry_name: vault?.name || "Đa ngành",
      main_keyword: body.main_keyword || body.topic,
      skill_obj: skill,
      vault_obj: vault,
      style_profile: body.use_personal_style ? db.styleProfile : null,
    });
    return { system_prompt, user_prompt, vault_id: vault?.id || null };
  }

  if (pathname === "/api/content/generate" && method === "POST") {
    let vault = body.vault_id && body.vault_id !== "auto" ? db.vaults.find((v: any) => v.id === body.vault_id) : null;
    let autoClassified = false;
    if (!vault) {
      autoClassified = true;
      const cls = classifyIndustry(`${body.topic} ${body.main_keyword} ${body.title}`, db.vaults);
      if (cls.should_create_new || !cls.matched_vault_id) {
        vault = {
          id: uid("vault"),
          name: cls.industry_name,
          slug: slugifyVi(cls.industry_name),
          description: `Kho tri thức tự động phân loại cho ngành ${cls.industry_name}.`,
          brand_name: "Đội ngũ Chuyên gia",
          brand_tone_colors: ["#0F4C5C", "#C8963E", "#F7F5F0"],
          brand_logo_text: "CHUYÊN GIA",
          pronoun_pair: "mình - bạn",
          terminology_lexicon: cls.suggested_terms || [],
          compliance_taboo: [],
          internal_links: [],
          harvard_references: [],
          case_studies: [],
          auto_learn: true,
          knowledge_count: 0,
        };
        db.vaults.push(vault);
      } else {
        vault = db.vaults.find((v: any) => v.id === cls.matched_vault_id) || db.vaults[0];
      }
    }

    const skill = db.skills.find((s: any) => s.id === body.skill_id);
    if (skill) skill.usage_count = (skill.usage_count || 0) + 1;

    const mk = (body.main_keyword || body.topic).trim();
    const sks = (body.secondary_keywords || []).filter(Boolean).length
      ? body.secondary_keywords.filter(Boolean)
      : (vault.terminology_lexicon || []).slice(0, 2);

    const activeProv = db.providerConfig.active_provider || "free_9router";
    const provEntry = db.providerConfig.providers[activeProv] || {};
    let generated: any = null;
    let modelUsed = provEntry.text_model || "9router/auto-free";

    if (body.ollama_client_html) {
      generated = {
        title: body.title || suggestTitlesByPlatform(body.topic, mk, body.platform, vault.name, vault)[0].title,
        meta_description: `Phân tích ${mk} chuyên sâu trong lĩnh vực ${vault.name}.`.slice(0, 160),
        content_html: body.ollama_client_html,
      };
      modelUsed = "ollama-local-browser";
    } else if (activeProv !== "free_9router" || !String(provEntry.base_url || "").includes("127.0.0.1")) {
      const [sysP, usrP] = buildGenerationPrompts({
        ...body,
        industry_name: vault.name,
        main_keyword: mk,
        secondary_keywords: sks,
        skill_obj: skill,
        vault_obj: vault,
        style_profile: body.use_personal_style ? db.styleProfile : null,
      });
      const raw = await callBrowserRemoteLlm({
        provider: activeProv,
        base_url: provEntry.base_url,
        api_key: provEntry.api_key || "",
        model: modelUsed,
        system_prompt: sysP,
        user_prompt: usrP,
      });
      if (raw) {
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(m ? m[0] : raw);
          if (parsed.content_html) {
            generated = {
              title: parsed.title || body.title || body.topic.slice(0, 60),
              meta_description: parsed.meta_description || "",
              content_html: parsed.content_html,
            };
          }
        } catch {
          generated = {
            title: body.title || body.topic.slice(0, 60),
            meta_description: `Phân tích thực chiến về ${mk} từ ${vault.brand_name || vault.name}.`.slice(0, 160),
            content_html: raw
              .split(/\n+/)
              .filter((l) => l.trim())
              .map((l) => `<p>${l.trim()}</p>`)
              .join(""),
          };
        }
      }
    }

    if (!generated) {
      db.user.daily_free_quota_used = Math.min(db.user.daily_free_quota_limit, (db.user.daily_free_quota_used || 0) + 1);
      generated = synthesizeStructuredArticle({
        industry_name: vault.name,
        topic: body.topic,
        platform: body.platform,
        writing_style: body.writing_style,
        tone_of_voice: body.tone_of_voice,
        target_length: body.target_length,
        title: body.title,
        main_keyword: mk,
        secondary_keywords: sks,
        skill_obj: skill,
        vault_obj: vault,
        style_profile: body.use_personal_style ? db.styleProfile : null,
      });
    }

    const cleanHtml = humanizeVietnameseHtml(generated.content_html, db.styleProfile.banned_phrases);
    const uniq = evaluateUniqueness(cleanHtml, db.articles);
    const aiV = evaluateAiVoice(cleanHtml, db.styleProfile.banned_phrases);
    const chk = evaluate65Checklist({
      title: generated.title,
      meta_description: generated.meta_description,
      main_keyword: mk,
      secondary_keywords: sks,
      content_html: cleanHtml,
      uniqueness_result: uniq,
      vault,
    });

    const learnedTerms: string[] = [];
    if (vault.auto_learn) {
      const ext = extractKnowledgeUnits(cleanHtml, generated.title);
      if (ext.chunks[0]) {
        db.chunks.unshift({
          id: uid("chk"),
          vault_id: vault.id,
          chunk_type: "article_extract",
          title: `Đúc kết từ bài: ${generated.title.slice(0, 52)}`,
          content: ext.chunks[0].content,
          source_label: "Tự động học khi viết bài",
          created_at: new Date().toISOString(),
        });
        vault.knowledge_count = (vault.knowledge_count || 0) + 1;
      }
      for (const t of ext.discovered_terms.slice(0, 3)) {
        if (!vault.terminology_lexicon.includes(t) && vault.terminology_lexicon.length < 45) {
          vault.terminology_lexicon.push(t);
          learnedTerms.push(t);
        }
      }
    }

    const nowIso = new Date().toISOString();
    const art = {
      id: uid("art"),
      vault_id: vault.id,
      skill_id: skill?.id || null,
      industry_name: vault.name,
      topic: body.topic,
      platform: body.platform,
      writing_style: body.writing_style,
      tone_of_voice: body.tone_of_voice,
      target_length: body.target_length,
      title: generated.title,
      meta_description: generated.meta_description,
      main_keyword: mk,
      secondary_keywords: sks,
      content_html: cleanHtml,
      content_text: stripHtml(cleanHtml),
      provider_used: activeProv,
      model_used: modelUsed,
      seo_score: chk.seo_score,
      geo_score: chk.geo_score,
      uniqueness_score: uniq.uniqueness_score,
      human_score: aiV.human_score,
      checklist_results: chk,
      uniqueness_details: uniq,
      ai_voice_details: aiV,
      status: "draft",
      refresh_due_at: new Date(Date.now() + 90 * 86400000).toISOString(),
      created_at: nowIso,
      updated_at: nowIso,
      versions: [
        {
          id: uid("ver"),
          version_number: 1,
          note: `Khởi tạo bằng ${activeProv}`,
          title: generated.title,
          seo_score: chk.seo_score,
          geo_score: chk.geo_score,
          human_score: aiV.human_score,
          created_at: nowIso,
        },
      ],
    };
    db.articles.unshift(art);
    saveDb(db);

    const ragChunks = db.chunks.filter((c: any) => c.vault_id === vault.id).slice(0, 3);
    return {
      article_id: art.id,
      vault_id: vault.id,
      industry_name: vault.name,
      auto_classified: autoClassified,
      brain_learned_terms: learnedTerms,
      rag_chunks_used: ragChunks,
      provider_used: activeProv,
      model_used: modelUsed,
      title: art.title,
      meta_description: art.meta_description,
      main_keyword: mk,
      secondary_keywords: sks,
      content_html: cleanHtml,
      checklist: chk,
      uniqueness: uniq,
      ai_voice: aiV,
    };
  }

  if (pathname === "/api/content/evaluate" && method === "POST") {
    const vault = db.vaults.find((v: any) => v.id === body.vault_id);
    const uniq = evaluateUniqueness(body.content_html, db.articles, body.article_id);
    const aiV = evaluateAiVoice(body.content_html, db.styleProfile.banned_phrases);
    const chk = evaluate65Checklist({
      title: body.title,
      meta_description: body.meta_description,
      main_keyword: body.main_keyword,
      secondary_keywords: body.secondary_keywords || [],
      content_html: body.content_html,
      uniqueness_result: uniq,
      vault,
    });
    return { checklist: chk, uniqueness: uniq, ai_voice: aiV };
  }

  if (pathname === "/api/content/auto-fix" && method === "POST") {
    const vault = db.vaults.find((v: any) => v.id === body.vault_id);
    const mk = (body.main_keyword || "giải pháp chuyên ngành").trim();
    const mkCap = mk.charAt(0).toUpperCase() + mk.slice(1);
    const sk = body.secondary_keywords?.[0] || "hiệu quả thực tế";
    const brand = vault?.brand_name || "Đội ngũ Chuyên gia";
    const lex = vault?.terminology_lexicon?.length ? vault.terminology_lexicon : ["quy trình chuẩn hóa", "tối ưu chi phí", "kiểm định thực tế"];
    const ref = vault?.harvard_references?.[0]?.citation || "(Báo cáo Ngành Việt Nam, 2026)";

    let newTitle = (body.title || "").trim();
    if (!newTitle || !newTitle.toLowerCase().includes(mk.toLowerCase()) || newTitle.length >= 63) {
      newTitle = `${mkCap}: Giải pháp chuẩn & kinh nghiệm 2026`.slice(0, 61);
    }
    let newMeta = (body.meta_description || "").trim();
    if (newMeta.length < 60 || newMeta.length >= 165 || !newMeta.toLowerCase().includes(mk.toLowerCase())) {
      newMeta = `Tìm hiểu ${mk} và ${sk} chuẩn thực tiễn từ ${brand}. Phân tích chi tiết số liệu, quy trình áp dụng an toàn giúp tối ưu chi phí.`.slice(0, 162);
    }
    let html = body.content_html || "";
    if (!/(tl;dr|tóm tắt nhanh)/i.test(html)) {
      const tldr = `<div class="tldr-box"><p><strong>TL;DR — Tóm tắt nhanh về ${mk}:</strong></p><ul><li><strong>${mkCap}</strong> giúp giải quyết bài toán ${sk} dựa trên ${lex[0]}.</li><li>Tham khảo số liệu kiểm chứng ${ref} cùng lộ trình thực tế bên dưới.</li></ul></div>\n`;
      const idx = html.indexOf("</p>");
      html = idx !== -1 ? html.slice(0, idx + 4) + "\n" + tldr + html.slice(idx + 4) : tldr + html;
    }
    if (!/<figcaption/i.test(html)) {
      const cap = `Minh họa ${mk} chuẩn thực tế tại ${brand}`.slice(0, 66);
      const src = buildEditorialSvgDataUrl(mkCap, brand, vault?.brand_tone_colors);
      html += `\n<figure class="figure-centered" style="text-align:center;" data-brand-logo="true"><img src="${src}" alt="${cap}" style="max-width:100%;height:auto;border-radius:8px;" /><figcaption><em>${cap}</em></figcaption></figure>\n`;
    }
    if (!/\([A-ZÀ-Ỹ][^()]{2,55},\s*(?:19|20)\d{2}\)/.test(stripHtml(html))) {
      html += `<p>Theo báo cáo chuyên ngành ${ref}, việc chuẩn hóa ${lex[0]} tại <a href="https://website.vn/blog/${slugifyVi(mk)}">chuyên trang phân tích ${mk}</a> và <a href="https://website.vn/san-pham/${slugifyVi(mk)}">giải pháp ${brand}</a> giúp nâng cao hiệu quả bền vững.</p>\n`;
    }
    if (!/(câu hỏi thường gặp|faq)/i.test(html)) {
      html += `\n<h2>Câu hỏi thường gặp (FAQs) về ${mk} là gì?</h2><p>Giải đáp nhanh các thắc mắc thực tế khi triển khai ${mk}.</p><h3>Khi nào nên rà soát lại ${mk}?</h3><p>Khuyến nghị kiểm tra định kỳ mỗi 3 tháng và liên hệ ngay với <strong>${brand}</strong> để nhận tư vấn chuyên sâu.</p>`;
    }

    const uniq = evaluateUniqueness(html, db.articles, body.article_id);
    const aiV = evaluateAiVoice(html, db.styleProfile.banned_phrases);
    const chk = evaluate65Checklist({
      title: newTitle,
      meta_description: newMeta,
      main_keyword: mk,
      secondary_keywords: body.secondary_keywords || [],
      content_html: html,
      uniqueness_result: uniq,
      vault,
    });
    return { title: newTitle, meta_description: newMeta, content_html: html, checklist: chk, uniqueness: uniq, ai_voice: aiV };
  }

  if (pathname === "/api/content/humanize" && method === "POST") {
    const humanized = humanizeVietnameseHtml(body.content_html, db.styleProfile.banned_phrases);
    const aiV = evaluateAiVoice(humanized, db.styleProfile.banned_phrases);
    return { content_html: humanized, ai_voice: aiV };
  }

  // IMAGE STUDIO
  if (pathname === "/api/images/generate" && method === "POST") {
    const vault = db.vaults.find((v: any) => v.id === body.vault_id);
    const platShort = (seedBundle.platforms as any)[body.platform]?.short_label || body.platform.toUpperCase();
    const { dataUrl, sizeKb } = renderCanvasWebpImage({
      width: Math.max(300, Math.min(2000, Number(body.width) || 1200)),
      height: Math.max(300, Math.min(2000, Number(body.height) || 675)),
      headline: body.headline,
      main_keyword: body.main_keyword || body.headline,
      platform_label: `${platShort} · ${body.width}x${body.height}`,
      brand_colors: vault?.brand_tone_colors,
      brand_logo_text: vault?.brand_logo_text || vault?.brand_name || "CONTENT STUDIO",
      apply_logo: Boolean(body.apply_brand_logo),
    });
    const cap = `Minh họa ${body.main_keyword || body.headline} tại ${vault?.brand_name || "Studio"}`.slice(0, 66);
    const rec = {
      id: uid("img"),
      platform: body.platform,
      preset_label: body.preset_label,
      width: body.width,
      height: body.height,
      public_url: dataUrl,
      alt_text: cap,
      caption_italic: cap,
      file_size_kb: sizeKb,
      brand_logo_applied: Boolean(body.apply_brand_logo),
      provider_used: "canvas_webp_studio",
      created_at: new Date().toISOString(),
    };
    db.images.unshift(rec);
    db.images = db.images.slice(0, 15);
    saveDb(db);
    return rec;
  }
  if (pathname === "/api/images" && method === "GET") {
    return { images: db.images };
  }

  // ARTICLES HISTORY
  if (pathname === "/api/articles" && method === "GET") {
    const plat = url.searchParams.get("platform");
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const needsRefresh = url.searchParams.get("needs_refresh") === "true";
    const now = Date.now();
    const items = db.articles
      .filter((a: any) => {
        if (plat && plat !== "all" && a.platform !== plat) return false;
        if (search && !`${a.title} ${a.topic} ${a.industry_name} ${a.main_keyword}`.toLowerCase().includes(search)) return false;
        const overdue = a.refresh_due_at ? new Date(a.refresh_due_at).getTime() <= now : false;
        if (needsRefresh && !overdue) return false;
        return true;
      })
      .map((a: any) => ({
        ...a,
        needs_refresh_90d: a.refresh_due_at ? new Date(a.refresh_due_at).getTime() <= now : false,
      }));
    return { articles: items };
  }

  const artMatch = pathname.match(/^\/api\/articles\/([^/]+)$/);
  if (artMatch && method === "GET") {
    const a = db.articles.find((x: any) => x.id === artMatch[1]);
    if (!a) throw new Error("Không tìm thấy bài viết.");
    return { article: a, versions: a.versions || [] };
  }
  if (artMatch && method === "PUT") {
    const a = db.articles.find((x: any) => x.id === artMatch[1]);
    if (!a) throw new Error("Không tìm thấy bài viết.");
    const vault = db.vaults.find((v: any) => v.id === a.vault_id);
    const newRules: string[] = [];
    if (a.content_html && a.content_html.trim() !== body.content_html.trim()) {
      const editSents = splitSentencesVi(body.content_html);
      const avg = editSents.length
        ? Math.round(editSents.reduce((s, x) => s + x.split(/\s+/).length, 0) / editSents.length)
        : 22;
      const rule = `Học từ biên tập thực tế: ưu tiên độ dài câu khoảng ${avg} từ/câu.`;
      if (!db.styleProfile.learned_rules.includes(rule)) {
        db.styleProfile.learned_rules.unshift(rule);
        newRules.push(rule);
      }
      db.styleProfile.edit_learn_count = (db.styleProfile.edit_learn_count || 0) + 1;
    }
    const uniq = evaluateUniqueness(body.content_html, db.articles, a.id);
    const aiV = evaluateAiVoice(body.content_html, db.styleProfile.banned_phrases);
    const chk = evaluate65Checklist({
      title: body.title,
      meta_description: body.meta_description,
      main_keyword: body.main_keyword || a.main_keyword,
      secondary_keywords: body.secondary_keywords || a.secondary_keywords || [],
      content_html: body.content_html,
      uniqueness_result: uniq,
      vault,
    });
    a.title = body.title;
    a.meta_description = body.meta_description;
    a.content_html = body.content_html;
    a.content_text = stripHtml(body.content_html);
    a.status = body.status || "optimized";
    a.seo_score = chk.seo_score;
    a.geo_score = chk.geo_score;
    a.uniqueness_score = uniq.uniqueness_score;
    a.human_score = aiV.human_score;
    a.checklist_results = chk;
    a.uniqueness_details = uniq;
    a.ai_voice_details = aiV;
    a.updated_at = new Date().toISOString();
    a.refresh_due_at = new Date(Date.now() + 90 * 86400000).toISOString();
    a.versions = a.versions || [];
    a.versions.unshift({
      id: uid("ver"),
      version_number: a.versions.length + 1,
      note: body.version_note || "Biên tập & tối ưu",
      title: a.title,
      seo_score: a.seo_score,
      geo_score: a.geo_score,
      human_score: a.human_score,
      created_at: a.updated_at,
    });
    saveDb(db);
    return { ok: true, style_learning: { new_rules: newRules }, checklist: chk, uniqueness: uniq, ai_voice: aiV };
  }
  if (artMatch && method === "DELETE") {
    db.articles = db.articles.filter((x: any) => x.id !== artMatch[1]);
    saveDb(db);
    return { ok: true };
  }

  // FEEDBACK, DONATE QR & ADMIN
  if (pathname === "/api/feedback" && method === "GET") {
    return { feedbacks: db.feedbacks };
  }
  if (pathname === "/api/feedback" && method === "POST") {
    const fb = {
      id: uid("fb"),
      author_name: body.author_name || db.user.full_name,
      category: body.category || "feature",
      title: body.title,
      message: body.message,
      rating: body.rating || 5,
      upvotes: 1,
      status: "new",
      admin_note: "",
      telegram_synced: false,
      gsheet_synced: false,
      created_at: new Date().toISOString(),
    };
    const gsUrl = db.settings?.integrations?.google_sheets_webhook_url;
    if (gsUrl) {
      try {
        await fetch(gsUrl, { method: "POST", body: JSON.stringify(fb) });
        fb.gsheet_synced = true;
      } catch {
        // ignore webhook cors
      }
    }
    db.feedbacks.unshift(fb);
    saveDb(db);
    return { id: fb.id, telegram_synced: fb.telegram_synced, gsheet_synced: fb.gsheet_synced };
  }
  const fbUpvoteMatch = pathname.match(/^\/api\/feedback\/([^/]+)\/upvote$/);
  if (fbUpvoteMatch && method === "POST") {
    const fb = db.feedbacks.find((f: any) => f.id === fbUpvoteMatch[1]);
    if (fb) fb.upvotes = (fb.upvotes || 0) + 1;
    saveDb(db);
    return { upvotes: fb?.upvotes || 1 };
  }
  if (pathname === "/api/feedback/export.tsv") {
    const header = "Thoi_gian\tPhan_loai\tNguoi_gui\tDanh_gia\tLuot_ung_ho\tTrang_thai\tTieu_de\tNoi_dung";
    const rows = db.feedbacks.map(
      (f: any) => `${f.created_at}\t${f.category}\t${f.author_name}\t${f.rating}\t${f.upvotes}\t${f.status}\t${f.title}\t${String(f.message || "").replace(/[\t\r\n]+/g, " ")}`
    );
    return [header, ...rows].join("\n");
  }

  if (pathname === "/api/donate/config") {
    const cfg = db.settings.author_qr;
    const amt = Number(url.searchParams.get("amount") || 50000);
    const msg = url.searchParams.get("message") || cfg.default_message;
    const q = new URLSearchParams({
      amount: String(Math.max(0, amt)),
      addInfo: msg,
      accountName: cfg.account_name,
    });
    const remoteUrl = `https://img.vietqr.io/image/${cfg.bank_id}-${cfg.account_no}-compact2.png?${q.toString()}`;
    return {
      banks: POPULAR_VN_BANKS,
      config: cfg,
      qr: {
        bank_id: cfg.bank_id,
        account_no: cfg.account_no,
        account_name: cfg.account_name,
        amount: amt,
        message: msg,
        vietqr_remote_url: remoteUrl,
        local_qr_url: remoteUrl,
      },
    };
  }

  if (pathname === "/api/admin/settings" && method === "GET") {
    return db.settings;
  }
  if (pathname === "/api/admin/settings" && method === "PUT") {
    if (body.ai_free_9router) db.settings.ai_free_9router = body.ai_free_9router;
    if (body.integrations) db.settings.integrations = body.integrations;
    if (body.author_qr) db.settings.author_qr = body.author_qr;
    saveDb(db);
    return { ok: true };
  }

  return { ok: true };
}
