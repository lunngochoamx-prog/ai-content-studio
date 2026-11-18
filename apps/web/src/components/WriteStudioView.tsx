"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wand2,
  Image as ImageIcon,
  Copy,
  Download,
  Save,
  UserCheck,
  RefreshCw,
  FileCode2,
  Eye,
} from "lucide-react";
import { apiFetch, generateViaLocalOllama } from "@/lib/api";

interface WriteStudioProps {
  vaults: any[];
  skills: any[];
  platformsMap: Record<string, any>;
  activeProvider: string;
  providerDetails: Record<string, any>;
  loadedArticle: any | null;
  onVaultsRefresh: () => void;
  onNotify: (msg: string) => void;
  onShowDonateHint: () => void;
}

const WRITING_STYLES = [
  "Phân tích chuyên sâu & Thực chiến",
  "Kể chuyện (Storytelling) đời thực",
  "Hướng dẫn từng bước (Step-by-step)",
  "Góc nhìn phản biện & Số liệu",
  "Chia sẻ trải nghiệm cá nhân",
  "Báo chí khách quan & Chuẩn mực",
];

const TONES = [
  "Chuyên nghiệp",
  "Học thuật",
  "Nghiêm trang",
  "Thân thiện & Gần gũi",
  "Truyền cảm hứng",
  "Sắc sảo & Trực diện",
];

const LENGTH_OPTIONS = [
  "300–500 từ (Ngắn gọn MXH)",
  "700–1000 từ (Tiêu chuẩn)",
  "1200–1500 từ (Chuẩn SEO chuyên sâu)",
  "2000–2500 từ (Pillar toàn diện)",
  "Kịch bản 30 giây",
  "Kịch bản 60 giây",
];

export default function WriteStudioView({
  vaults,
  skills,
  platformsMap,
  activeProvider,
  providerDetails,
  loadedArticle,
  onVaultsRefresh,
  onNotify,
  onShowDonateHint,
}: WriteStudioProps) {
  const [vaultId, setVaultId] = useState<string>("auto");
  const [platform, setPlatform] = useState<string>("geo_google");
  const [skillId, setSkillId] = useState<string>("");
  const [topic, setTopic] = useState<string>(
    "Phác đồ trồng răng Implant kỹ thuật số 3D an toàn ít xâm lấn"
  );
  const [mainKeyword, setMainKeyword] = useState<string>("trồng răng implant");
  const [secondaryKwInput, setSecondaryKwInput] = useState<string>(
    "máng hướng dẫn phẫu thuật, tích hợp xương"
  );
  const [writingStyle, setWritingStyle] = useState<string>(WRITING_STYLES[0]);
  const [toneOfVoice, setToneOfVoice] = useState<string>(TONES[0]);
  const [targetLength, setTargetLength] = useState<string>(LENGTH_OPTIONS[2]);
  const [usePersonalStyle, setUsePersonalStyle] = useState<boolean>(true);

  const [articleId, setArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [contentHtml, setContentHtml] = useState<string>("");
  const [editSourceMode, setEditSourceMode] = useState<boolean>(false);

  const [titleSuggestions, setTitleSuggestions] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any | null>(null);
  const [uniqueness, setUniqueness] = useState<any | null>(null);
  const [aiVoice, setAiVoice] = useState<any | null>(null);
  const [detectedIndustryInfo, setDetectedIndustryInfo] = useState<string>("");

  const [checklistMode, setChecklistMode] = useState<"aio" | "seo" | "all">("aio");
  const [onlyIssues, setOnlyIssues] = useState<boolean>(false);
  const [rightTab, setRightTab] = useState<"checklist" | "voice">("checklist");

  // Image Studio state
  const [selectedImgPreset, setSelectedImgPreset] = useState<string>("");
  const [applyBrandLogo, setApplyBrandLogo] = useState<boolean>(true);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);

  const [busyAction, setBusyAction] = useState<string>("");

  // Khi mở lại 1 bài từ Lịch sử
  useEffect(() => {
    if (loadedArticle) {
      setArticleId(loadedArticle.id);
      setVaultId(loadedArticle.vault_id || "auto");
      setPlatform(loadedArticle.platform || "seo_google");
      setSkillId(loadedArticle.skill_id || "");
      setTopic(loadedArticle.topic || loadedArticle.title || "");
      setTitle(loadedArticle.title || "");
      setMetaDescription(loadedArticle.meta_description || "");
      setMainKeyword(loadedArticle.main_keyword || "");
      setSecondaryKwInput((loadedArticle.secondary_keywords || []).join(", "));
      setContentHtml(loadedArticle.content_html || "");
      if (loadedArticle.checklist_results?.items) {
        setChecklist(loadedArticle.checklist_results);
      }
      if (loadedArticle.uniqueness_details?.uniqueness_score !== undefined) {
        setUniqueness(loadedArticle.uniqueness_details);
      }
      if (loadedArticle.ai_voice_details?.human_score !== undefined) {
        setAiVoice(loadedArticle.ai_voice_details);
      }
    }
  }, [loadedArticle]);

  // Lọc công thức phù hợp nền tảng & cập nhật preset ảnh mặc định
  const filteredSkills = skills.filter(
    (s) => !s.target_platforms?.length || s.target_platforms.includes(platform)
  );

  useEffect(() => {
    if (filteredSkills.length > 0 && !filteredSkills.some((s) => s.id === skillId)) {
      setSkillId(filteredSkills[0].id);
    }
    const presets = platformsMap[platform]?.image_presets || [];
    if (presets.length > 0) {
      setSelectedImgPreset(presets[0].id);
    }
    if (platform === "seo_google") setChecklistMode("seo");
    if (platform === "geo_google") setChecklistMode("aio");
  }, [platform, skills, platformsMap]);

  const currentSkill = skills.find((s) => s.id === skillId);
  const currentPlatInfo = platformsMap[platform];
  const imgPresets = currentPlatInfo?.image_presets || [];

  const parseSecondaryKws = () =>
    secondaryKwInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

  async function handleSuggestTitles() {
    if (!topic.trim()) return;
    setBusyAction("titles");
    try {
      const res = await apiFetch("/api/content/suggest-titles", {
        method: "POST",
        body: JSON.stringify({
          topic,
          main_keyword: mainKeyword,
          platform,
          vault_id: vaultId,
        }),
      });
      setTitleSuggestions(res.titles || []);
      if (res.detected_industry) {
        setDetectedIndustryInfo(`Ngành nhận diện: ${res.detected_industry}`);
      }
    } catch (e: any) {
      onNotify(`Lỗi gợi ý tiêu đề: ${e.message}`);
    } finally {
      setBusyAction("");
    }
  }

  async function handleGenerateArticle() {
    if (!topic.trim()) return;
    setBusyAction("generate");
    try {
      let ollamaClientHtml: string | null = null;

      if (activeProvider === "ollama") {
        const ollamaCfg = providerDetails?.ollama || {};
        const prep = await apiFetch("/api/content/prepare-ollama-prompt", {
          method: "POST",
          body: JSON.stringify({
            vault_id: vaultId,
            skill_id: skillId || null,
            topic,
            platform,
            writing_style: writingStyle,
            tone_of_voice: toneOfVoice,
            target_length: targetLength,
            title,
            main_keyword: mainKeyword,
            secondary_keywords: parseSecondaryKws(),
            use_personal_style: usePersonalStyle,
          }),
        });
        try {
          ollamaClientHtml = await generateViaLocalOllama(
            ollamaCfg.base_url || "http://localhost:11434",
            ollamaCfg.text_model || "qwen2.5:7b",
            prep.system_prompt,
            prep.user_prompt
          );
        } catch {
          onNotify(
            "Không tìm thấy Ollama trên máy bạn (localhost:11434) — tự động chuyển sang Engine dự phòng để không gián đoạn!"
          );
        }
      }

      const res = await apiFetch("/api/content/generate", {
        method: "POST",
        body: JSON.stringify({
          vault_id: vaultId,
          skill_id: skillId || null,
          topic,
          platform,
          writing_style: writingStyle,
          tone_of_voice: toneOfVoice,
          target_length: targetLength,
          title,
          main_keyword: mainKeyword,
          secondary_keywords: parseSecondaryKws(),
          use_personal_style: usePersonalStyle,
          ollama_client_html: ollamaClientHtml,
        }),
      });

      setArticleId(res.article_id);
      setTitle(res.title);
      setMetaDescription(res.meta_description);
      setContentHtml(res.content_html);
      setChecklist(res.checklist);
      setUniqueness(res.uniqueness);
      setAiVoice(res.ai_voice);

      const learnedNote =
        res.brain_learned_terms?.length > 0
          ? ` · Đã cập nhật ${res.brain_learned_terms.length} thuật ngữ vào Bộ não ngành '${res.industry_name}'`
          : ` · Đã phân loại vào ngành '${res.industry_name}'`;
      setDetectedIndustryInfo(`Bộ não thứ 2: ${res.industry_name}`);
      onVaultsRefresh();
      onNotify(`Đã tạo bài viết hoàn chỉnh (${res.provider_used})${learnedNote}`);
    } catch (e: any) {
      onNotify(`Lỗi tạo bài viết: ${e.message}`);
    } finally {
      setBusyAction("");
    }
  }

  async function handleReEvaluate() {
    if (!contentHtml.trim()) return;
    setBusyAction("eval");
    try {
      const res = await apiFetch("/api/content/evaluate", {
        method: "POST",
        body: JSON.stringify({
          article_id: articleId,
          vault_id: vaultId !== "auto" ? vaultId : null,
          title,
          meta_description: metaDescription,
          main_keyword: mainKeyword || topic,
          secondary_keywords: parseSecondaryKws(),
          content_html: contentHtml,
        }),
      });
      setChecklist(res.checklist);
      setUniqueness(res.uniqueness);
      setAiVoice(res.ai_voice);
      onNotify("Đã chấm điểm lại toàn bộ 65 tiêu chí SEO/GEO & giọng văn.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleAutoFixChecklist() {
    if (!contentHtml.trim()) return;
    setBusyAction("autofix");
    try {
      const res = await apiFetch("/api/content/auto-fix", {
        method: "POST",
        body: JSON.stringify({
          article_id: articleId,
          vault_id: vaultId !== "auto" ? vaultId : null,
          title,
          meta_description: metaDescription,
          main_keyword: mainKeyword || topic,
          secondary_keywords: parseSecondaryKws(),
          content_html: contentHtml,
        }),
      });
      setTitle(res.title);
      setMetaDescription(res.meta_description);
      setContentHtml(res.content_html);
      setChecklist(res.checklist);
      setUniqueness(res.uniqueness);
      setAiVoice(res.ai_voice);
      onNotify(
        `Đã tự động tối ưu chuẩn Checklist! Điểm SEO: ${res.checklist.seo_score}/100 · GEO: ${res.checklist.geo_score}/100`
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleHumanize() {
    if (!contentHtml.trim()) return;
    setBusyAction("humanize");
    try {
      const res = await apiFetch("/api/content/humanize", {
        method: "POST",
        body: JSON.stringify({
          article_id: articleId,
          vault_id: vaultId !== "auto" ? vaultId : null,
          content_html: contentHtml,
        }),
      });
      setContentHtml(res.content_html);
      setAiVoice(res.ai_voice);
      onNotify(
        `Đã tối ưu giọng văn như người thật! Điểm tự nhiên: ${res.ai_voice.human_score}%`
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleSaveAndLearn() {
    if (!articleId) {
      onNotify("Hãy bấm 'Tạo bài viết mới' trước để lưu phiên bản.");
      return;
    }
    setBusyAction("save");
    try {
      const res = await apiFetch(`/api/articles/${articleId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          meta_description: metaDescription,
          main_keyword: mainKeyword,
          secondary_keywords: parseSecondaryKws(),
          content_html: contentHtml,
          status: "published",
          version_note: "Người dùng biên tập & duyệt xuất bản",
        }),
      });
      setChecklist(res.checklist);
      setUniqueness(res.uniqueness);
      setAiVoice(res.ai_voice);
      const learnedCount = res.style_learning?.new_rules?.length || 0;
      onNotify(
        learnedCount > 0
          ? `Đã lưu bài & học thêm ${learnedCount} quy tắc văn phong cá nhân của bạn!`
          : "Đã lưu phiên bản bài viết vào Lịch sử!"
      );
      if ((res.checklist?.seo_score || 0) >= 85) {
        onShowDonateHint();
      }
    } finally {
      setBusyAction("");
    }
  }

  async function handleGenerateImage() {
    const preset = imgPresets.find((p: any) => p.id === selectedImgPreset) || {
      label: "Chuẩn SEO 1200x675",
      width: 1200,
      height: 675,
    };
    setBusyAction("image");
    try {
      const res = await apiFetch("/api/images/generate", {
        method: "POST",
        body: JSON.stringify({
          article_id: articleId,
          vault_id: vaultId !== "auto" ? vaultId : vaults[0]?.id || null,
          platform,
          preset_label: preset.label,
          width: preset.width,
          height: preset.height,
          headline: title || topic,
          main_keyword: mainKeyword || topic,
          context_summary: metaDescription,
          apply_brand_logo: applyBrandLogo,
        }),
      });
      setGeneratedImages((prev) => [res, ...prev]);
      if (contentHtml) {
        setContentHtml((prev) => `${prev}\n${res.figure_html}`);
      }
      onNotify(
        `Đã tạo ảnh ${res.width}x${res.height}px (${res.file_size_kb}KB WebP) kèm chú thích nghiêng <70 ký tự & chèn vào bài!`
      );
    } catch (e: any) {
      onNotify(`Lỗi tạo ảnh: ${e.message}`);
    } finally {
      setBusyAction("");
    }
  }

  function handleCopyHtml() {
    navigator.clipboard.writeText(contentHtml);
    onNotify("Đã sao chép mã HTML sạch vào bộ nhớ tạm!");
  }

  function handleDownloadFile() {
    const fullDoc = `# ${title}\n\n> Meta Description: ${metaDescription}\n\n${contentHtml}`;
    const blob = new Blob([fullDoc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(mainKeyword || "bai-viet").replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowDonateHint();
  }

  const displayedRules = (checklist?.items || []).filter((item: any) => {
    if (checklistMode === "seo" && !item.apply_seo) return false;
    if (checklistMode === "aio" && !item.apply_aio) return false;
    if (onlyIssues && item.status === "pass") return false;
    return true;
  });

  const scoreClass = (val: number) =>
    val >= 85 ? "score-high" : val >= 68 ? "score-mid" : "score-low";

  return (
    <div className="studio-grid">
      {/* CỘT TRÁI: CẤU HÌNH BÀI VIẾT */}
      <section className="panel" aria-label="Thiết lập bài viết">
        <div className="panel-header">
          <h2 className="panel-title">1. Cấu Hình Đa Nền Tảng</h2>
          {detectedIndustryInfo && (
            <span className="chip" style={{ fontSize: 11 }}>
              {detectedIndustryInfo}
            </span>
          )}
        </div>
        <div className="panel-body">
          <div className="field-group">
            <label className="field-label" htmlFor="studio-vault-select">
              <span>Ngành nghề (Bộ não thứ 2)</span>
            </label>
            <select
              id="studio-vault-select"
              className="select"
              value={vaultId}
              onChange={(e) => setVaultId(e.target.value)}
            >
              <option value="auto">✨ Tự động phân loại ngành nghề (Auto)</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.knowledge_count} tri thức)
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <span className="field-label">Nền tảng tối ưu riêng biệt</span>
            <div className="platform-pills">
              {[
                { id: "geo_google", label: "GEO Google (AIO)" },
                { id: "seo_google", label: "SEO Google" },
                { id: "facebook", label: "Facebook" },
                { id: "tiktok", label: "TikTok" },
                { id: "website", label: "Website" },
              ].map((p) => (
                <button
                  key={p.id}
                  id={`btn-platform-${p.id}`}
                  type="button"
                  className={`platform-pill ${platform === p.id ? "active" : ""}`}
                  onClick={() => setPlatform(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="studio-topic-input">
              <span>Chủ đề / Ý tưởng bài viết</span>
            </label>
            <textarea
              id="studio-topic-input"
              className="textarea"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Nhập chủ đề, thông tin sản phẩm hoặc vấn đề khách hàng..."
            />
          </div>

          <div className="row-2">
            <div className="field-group">
              <label className="field-label" htmlFor="studio-main-kw">
                <span>Từ khóa chính</span>
              </label>
              <input
                id="studio-main-kw"
                className="input"
                value={mainKeyword}
                onChange={(e) => setMainKeyword(e.target.value)}
                placeholder="VD: trồng răng implant"
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="studio-length">
                <span>Độ dài / Thời lượng</span>
              </label>
              <select
                id="studio-length"
                className="select"
                value={targetLength}
                onChange={(e) => setTargetLength(e.target.value)}
              >
                {LENGTH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="studio-sec-kw">
              <span>Từ khóa phụ / LSI (cách nhau dấu phẩy)</span>
            </label>
            <input
              id="studio-sec-kw"
              className="input"
              value={secondaryKwInput}
              onChange={(e) => setSecondaryKwInput(e.target.value)}
              placeholder="máng phẫu thuật 3D, tích hợp xương..."
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="studio-skill-select">
              <span>Công thức / Skill viết bài ({filteredSkills.length})</span>
            </label>
            <select
              id="studio-skill-select"
              className="select"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
            >
              {filteredSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.is_builtin ? "📐 " : "⭐ "}
                  {s.name}
                </option>
              ))}
            </select>
            {currentSkill && (
              <div
                style={{
                  marginTop: 6,
                  padding: "8px 10px",
                  background: "var(--bg-subtle)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                {currentSkill.description}
              </div>
            )}
          </div>

          <div className="row-2">
            <div className="field-group">
              <label className="field-label" htmlFor="studio-style-select">
                <span>Phong cách viết</span>
              </label>
              <select
                id="studio-style-select"
                className="select"
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
              >
                {WRITING_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="studio-tone-select">
                <span>Giọng văn</span>
              </label>
              <select
                id="studio-tone-select"
                className="select"
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
              >
                {TONES.map((tn) => (
                  <option key={tn} value={tn}>
                    {tn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 14,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={usePersonalStyle}
              onChange={(e) => setUsePersonalStyle(e.target.checked)}
            />
            <span>Áp dụng Hồ sơ Phong cách cá nhân (Style DNA)</span>
          </label>

          <button
            id="btn-generate-article"
            type="button"
            className="btn btn-primary btn-full"
            disabled={busyAction === "generate"}
            onClick={handleGenerateArticle}
          >
            <Sparkles size={16} />
            {busyAction === "generate"
              ? "Đang tổng hợp tri thức & viết bài..."
              : "Tạo Bài Viết Chuẩn Nền Tảng"}
          </button>

          {currentPlatInfo?.rules_summary && (
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-secondary)" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Quy chuẩn thuật toán {currentPlatInfo.short_label}:
              </div>
              <ul style={{ margin: 0, paddingLeft: 17 }}>
                {currentPlatInfo.rules_summary.slice(0, 3).map((r: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* CỘT GIỮA: ĐỀ XUẤT TIÊU ĐỀ + SOẠN THẢO + TẠO ẢNH */}
      <section className="panel" aria-label="Soạn thảo nội dung và tạo ảnh">
        <div className="panel-header">
          <h2 className="panel-title">2. Đề Xuất Tiêu Đề &amp; Soạn Thảo Bài Viết</h2>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              id="btn-suggest-titles"
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={busyAction === "titles"}
              onClick={handleSuggestTitles}
            >
              <Wand2 size={14} />
              {busyAction === "titles" ? "Đang gợi ý..." : "Đề xuất 6 Tiêu đề"}
            </button>
            <button
              id="btn-save-article"
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!contentHtml || busyAction === "save"}
              onClick={handleSaveAndLearn}
            >
              <Save size={14} />
              Lưu &amp; Học phong cách
            </button>
          </div>
        </div>

        <div className="panel-body" style={{ paddingBottom: 10 }}>
          {titleSuggestions.length > 0 && (
            <div className="field-group">
              <div className="field-label">
                <span>Chọn nhanh tiêu đề đề xuất theo chuẩn {currentPlatInfo?.short_label}:</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTitleSuggestions([])}
                >
                  Thu gọn
                </button>
              </div>
              <div className="title-suggestions">
                {titleSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="title-option"
                    onClick={() => setTitle(item.title)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {item.hook_type}
                      </div>
                    </div>
                    <span className="char-counter">{item.char_count} ký tự</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field-group">
            <label className="field-label" htmlFor="editor-h1-input">
              <span>Tiêu đề bài viết (Heading 1 — chuẩn SEO/GEO &lt;63 ký tự)</span>
              <span className={`char-counter ${title.length >= 63 ? "over" : ""}`}>
                {title.length}/63 ký tự
              </span>
            </label>
            <input
              id="editor-h1-input"
              className="input"
              style={{ fontWeight: 700, fontSize: 15 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề hoặc bấm 'Đề xuất 6 Tiêu đề' phía trên..."
            />
          </div>

          <div className="field-group" style={{ marginBottom: 4 }}>
            <label className="field-label" htmlFor="editor-meta-input">
              <span>Meta Description / Tóm tắt Insight (&lt;165 ký tự)</span>
              <span className={`char-counter ${metaDescription.length >= 165 ? "over" : ""}`}>
                {metaDescription.length}/165 ký tự
              </span>
            </label>
            <textarea
              id="editor-meta-input"
              className="textarea"
              style={{ minHeight: 54 }}
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Mô tả tóm tắt chứa từ khóa chính và chạm đúng mong muốn độc giả..."
            />
          </div>
        </div>

        <div className="editor-toolbar">
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className={`btn btn-sm ${!editSourceMode ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setEditSourceMode(false)}
            >
              <Eye size={13} /> Trực quan
            </button>
            <button
              type="button"
              className={`btn btn-sm ${editSourceMode ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setEditSourceMode(true)}
            >
              <FileCode2 size={13} /> Chỉnh sửa HTML
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!contentHtml}
              onClick={handleCopyHtml}
            >
              <Copy size={13} /> Sao chép HTML
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!contentHtml}
              onClick={handleDownloadFile}
            >
              <Download size={13} /> Xuất Markdown
            </button>
          </div>
        </div>

        {contentHtml ? (
          editSourceMode ? (
            <div style={{ padding: 14 }}>
              <textarea
                id="editor-html-textarea"
                className="textarea"
                style={{
                  minHeight: 440,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
              />
            </div>
          ) : (
            <article
              className="article-canvas"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setContentHtml(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )
        ) : (
          <div
            style={{
              minHeight: 340,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Sparkles size={32} style={{ marginBottom: 10, color: "var(--brand-primary)" }} />
            <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 15 }}>
              Sẵn sàng khởi tạo bài viết đa ngành nghề
            </div>
            <p style={{ maxWidth: 420, marginTop: 6 }}>
              Chọn nền tảng ở cột trái và bấm <strong>“Tạo Bài Viết Chuẩn Nền Tảng”</strong>. Hệ
              thống sẽ tự động kết hợp công thức, Bộ não thứ 2 và chấm điểm 65 tiêu chí SEO/AIO.
            </p>
          </div>
        )}

        {/* STUDIO TẠO ẢNH THEO TỪNG NỀN TẢNG */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: 16,
            background: "var(--bg-canvas)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <ImageIcon size={16} />
              Tạo Ảnh Bài Viết Chuẩn Kích Thước {currentPlatInfo?.short_label}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={applyBrandLogo}
                onChange={(e) => setApplyBrandLogo(e.target.checked)}
              />
              Đóng dấu Logo thương hiệu &amp; nén WebP chuẩn SEO
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              id="studio-img-preset"
              className="select"
              style={{ flex: "1 1 260px" }}
              value={selectedImgPreset}
              onChange={(e) => setSelectedImgPreset(e.target.value)}
            >
              {imgPresets.map((pr: any) => (
                <option key={pr.id} value={pr.id}>
                  {pr.label}
                </option>
              ))}
            </select>
            <button
              id="btn-generate-image"
              type="button"
              className="btn btn-warm"
              disabled={busyAction === "image"}
              onClick={handleGenerateImage}
            >
              <ImageIcon size={15} />
              {busyAction === "image" ? "Đang kết xuất WebP..." : "Tạo ảnh & Chèn vào bài"}
            </button>
          </div>

          {generatedImages.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              {generatedImages.slice(0, 3).map((img, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <img
                    src={img.public_url}
                    alt={img.alt_text}
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 5 }}
                  />
                  <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6 }}>
                    {img.width}x{img.height}px · {img.file_size_kb}KB WebP
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                    {img.caption_italic}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CỘT PHẢI: CHẤM ĐIỂM 65 TIÊU CHÍ SEO/GEO + TRÙNG LẶP & KHỬ GIỌNG AI */}
      <aside className="panel studio-right-pane" aria-label="Bảng đánh giá chất lượng bài viết">
        <div className="panel-header">
          <h2 className="panel-title">3. Đánh Giá 65 Tiêu Chí &amp; Anti-AI</h2>
          <button
            id="btn-reevaluate"
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!contentHtml || busyAction === "eval"}
            onClick={handleReEvaluate}
          >
            <RefreshCw size={13} /> Chấm lại
          </button>
        </div>

        <div className="panel-body">
          <div className="score-grid-4">
            <div className="score-tile">
              <div className="score-tile-label">Checklist SEO (49 mục)</div>
              <div className={`score-tile-value ${scoreClass(checklist?.seo_score || 0)}`}>
                {checklist ? `${checklist.seo_score}/100` : "—"}
              </div>
            </div>
            <div className="score-tile">
              <div className="score-tile-label">Checklist GEO/AIO (61)</div>
              <div className={`score-tile-value ${scoreClass(checklist?.geo_score || 0)}`}>
                {checklist ? `${checklist.geo_score}/100` : "—"}
              </div>
            </div>
            <div className="score-tile">
              <div className="score-tile-label">Độ Độc Nhất (Unique)</div>
              <div
                className={`score-tile-value ${scoreClass(uniqueness?.uniqueness_score || 0)}`}
              >
                {uniqueness ? `${uniqueness.uniqueness_score}%` : "—"}
              </div>
            </div>
            <div className="score-tile">
              <div className="score-tile-label">Giọng Người Thật</div>
              <div className={`score-tile-value ${scoreClass(aiVoice?.human_score || 0)}`}>
                {aiVoice ? `${aiVoice.human_score}%` : "—"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <button
              id="btn-autofix-seo"
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!contentHtml || busyAction === "autofix"}
              onClick={handleAutoFixChecklist}
            >
              <Wand2 size={13} />
              {busyAction === "autofix" ? "Đang tối ưu..." : "1-Click Sửa SEO/GEO"}
            </button>
            <button
              id="btn-humanize-voice"
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!contentHtml || busyAction === "humanize"}
              onClick={handleHumanize}
            >
              <UserCheck size={13} />
              {busyAction === "humanize" ? "Đang xử lý..." : "Khử Giọng Văn AI"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button
              type="button"
              className={`platform-pill ${rightTab === "checklist" ? "active" : ""}`}
              onClick={() => setRightTab("checklist")}
            >
              Checklist 65 mục ({displayedRules.length})
            </button>
            <button
              type="button"
              className={`platform-pill ${rightTab === "voice" ? "active" : ""}`}
              onClick={() => setRightTab("voice")}
            >
              Trùng lặp &amp; Phân tích AI
            </button>
          </div>

          {rightTab === "checklist" ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${checklistMode === "aio" ? "btn-secondary" : "btn-ghost"}`}
                    onClick={() => setChecklistMode("aio")}
                  >
                    GEO (61)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${checklistMode === "seo" ? "btn-secondary" : "btn-ghost"}`}
                    onClick={() => setChecklistMode("seo")}
                  >
                    SEO (49)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${checklistMode === "all" ? "btn-secondary" : "btn-ghost"}`}
                    onClick={() => setChecklistMode("all")}
                  >
                    Đầy đủ (65)
                  </button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={onlyIssues}
                    onChange={(e) => setOnlyIssues(e.target.checked)}
                  />
                  Chỉ mục lỗi
                </label>
              </div>

              {checklist ? (
                <div className="checklist-scroll">
                  {displayedRules.map((r: any) => (
                    <div key={r.stt} className="rule-row">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          marginBottom: 3,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 12 }}>
                          #{r.stt} · {r.group} — {r.sub_group}
                        </span>
                        <span className={`status-tag status-${r.status}`}>
                          {r.status === "pass" && <CheckCircle2 size={11} />}
                          {r.status === "warn" && <AlertTriangle size={11} />}
                          {r.status === "fail" && <XCircle size={11} />}
                          {r.status === "pass" ? "Đạt" : r.status === "warn" ? "Lưu ý" : "Chưa đạt"}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.detail}</div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11.5,
                          fontFamily: "var(--font-mono), monospace",
                          color: "var(--brand-primary)",
                        }}
                      >
                        → {r.evidence}
                      </div>
                      {r.fix_hint && (
                        <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--status-warn)" }}>
                          💡 {r.fix_hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                   Tạo bài viết hoặc bấm “Chấm lại” để xem chi tiết từng tiêu chí từ #1 đến #65.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Kiểm định Độ Trùng Lặp (Checklist #1)
                </div>
                <div>
                  • So với ngoài Website:{" "}
                  <strong>{uniqueness?.external_unique_pct ?? "—"}%</strong> (Chuẩn &gt;90%)
                </div>
                <div>
                  • So với nội bộ hệ thống:{" "}
                  <strong>{uniqueness?.internal_unique_pct ?? "—"}%</strong> (Chuẩn &gt;70%)
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Phân tích Giọng Văn Người Thật vs AI
                </div>
                <div>• Đánh giá: {aiVoice?.verdict || "Chưa phân tích"}</div>
                <div>
                  • Độ biến thiên nhịp câu (Burstiness):{" "}
                  <strong>{aiVoice?.burstiness ?? "—"}</strong>
                </div>
                <div>
                  • Độ dài câu trung bình: <strong>{aiVoice?.avg_sentence_words ?? "—"} từ</strong>
                </div>
                {aiVoice?.detected_cliches?.length > 0 && (
                  <div style={{ marginTop: 8, color: "var(--status-fail)" }}>
                    Phát hiện từ sáo rỗng AI: {aiVoice.detected_cliches.join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
