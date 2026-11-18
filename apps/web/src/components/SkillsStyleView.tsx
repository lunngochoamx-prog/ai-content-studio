"use client";

import React, { useEffect, useState } from "react";
import { Plus, Sparkles, Download, Trash2, Save, UserCheck } from "lucide-react";
import { apiFetch, downloadApiResource } from "@/lib/api";

export function SkillsHubView({
  skills,
  onRefresh,
  onNotify,
}: {
  skills: any[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}) {
  const [filterPlat, setFilterPlat] = useState<string>("all");
  const [showCreate, setShowCreate] = useState<boolean>(false);

  // Manual Skill creation
  const [name, setName] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [stepsText, setStepsText] = useState<string>(
    "Bước 1 - Mở bài Hook: Chạm trực diện vấn đề\nBước 2 - Phân tích giải pháp: Đưa số liệu kiểm chứng\nBước 3 - CTA 3S: Kêu gọi hành động cụ thể"
  );
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "seo_google", "geo_google"]);

  // AI Skill extraction from sample posts
  const [sampleName, setSampleName] = useState<string>("");
  const [samplePost, setSamplePost] = useState<string>("");
  const [extracting, setExtracting] = useState<boolean>(false);

  const visibleSkills = skills.filter(
    (s) => filterPlat === "all" || (s.target_platforms || []).includes(filterPlat)
  );

  function togglePlat(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleCreateManualSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const outlineSteps = stepsText
      .split("\n")
      .map((ln) => ln.trim())
      .filter(Boolean)
      .map((ln) => {
        const [st, ...rest] = ln.split(":");
        return {
          step: st.trim(),
          description: rest.join(":").trim() || "Triển khai chi tiết luận điểm",
        };
      });

    await apiFetch("/api/skills", {
      method: "POST",
      body: JSON.stringify({
        name,
        category: "custom",
        target_platforms: platforms.length ? platforms : ["seo_google"],
        description: desc,
        outline_steps: outlineSteps,
        system_instructions: instructions,
      }),
    });
    setName("");
    setDesc("");
    setInstructions("");
    setShowCreate(false);
    onRefresh();
    onNotify(`Đã thêm Skill viết bài mới '${name}' vào hệ thống!`);
  }

  async function handleExtractFromSample(e: React.FormEvent) {
    e.preventDefault();
    if (!samplePost.trim()) return;
    setExtracting(true);
    try {
      const res = await apiFetch("/api/skills/extract-from-sample", {
        method: "POST",
        body: JSON.stringify({
          sample_text: samplePost,
          custom_name: sampleName,
        }),
      });
      setSamplePost("");
      setSampleName("");
      onRefresh();
      onNotify(`Đã đúc kết tự động Skill '${res.skill.name}' từ bài viết mẫu!`);
    } finally {
      setExtracting(false);
    }
  }

  async function handleDeleteSkill(id: string) {
    await apiFetch(`/api/skills/${id}`, { method: "DELETE" });
    onRefresh();
    onNotify("Đã xóa Custom Skill.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* HỌC SKILL TỰ ĐỘNG TỪ BÀI MẪU */}
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <Sparkles size={16} /> Update Skill — Tự Thêm Kỹ Năng Viết Bài Hoặc Học Tự Động Từ Bài Mẫu
          </h2>
          <button
            id="btn-open-manual-skill"
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus size={14} /> {showCreate ? "Đóng form tạo thủ công" : "Tạo Skill mới thủ công"}
          </button>
        </div>

        <div className="panel-body">
          {showCreate ? (
            <form onSubmit={handleCreateManualSkill}>
              <div className="row-2">
                <div className="field-group">
                  <label className="field-label">Tên Skill viết bài mới</label>
                  <input
                    className="input"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Công thức Review Sản phẩm D2C Chuyển đổi cao"
                  />
                </div>
                <div className="field-group">
                  <span className="field-label">Áp dụng cho nền tảng</span>
                  <div className="platform-pills">
                    {["facebook", "seo_google", "geo_google", "tiktok", "website"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`platform-pill ${platforms.includes(p) ? "active" : ""}`}
                        onClick={() => togglePlat(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Mô tả ngắn về mục đích sử dụng</label>
                <input
                  className="input"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Dùng khi ra mắt bộ sưu tập mới hoặc đánh giá chuyên sâu..."
                />
              </div>
              <div className="row-2">
                <div className="field-group">
                  <label className="field-label">Các bước cấu trúc bài (Mỗi dòng: Tên bước: Mô tả)</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={stepsText}
                    onChange={(e) => setStepsText(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Chỉ dẫn chi tiết cho AI (System Prompt)</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Quy định giọng văn, cách đưa dẫn chứng, lưu ý riêng..."
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Lưu Skill Mới Vào Hệ Thống
              </button>
            </form>
          ) : (
            <form onSubmit={handleExtractFromSample}>
              <div className="row-2">
                <div className="field-group">
                  <label className="field-label">Đặt tên Skill muốn đúc kết</label>
                  <input
                    className="input"
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    placeholder="VD: Skill Viết Bài Chuyên Gia Bất Động Sản"
                  />
                </div>
                <div className="field-group" style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    type="submit"
                    className="btn btn-warm btn-full"
                    disabled={extracting}
                  >
                    <Sparkles size={15} />
                    {extracting
                      ? "Đang mổ xẻ cấu trúc bài mẫu..."
                      : "Đúc Kết Thành Skill Từ Bài Viết Mẫu"}
                  </button>
                </div>
              </div>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label">
                  Dán 1 bài viết mẫu tâm đắc để AI tự động phân tích bố cục Hook · Thân bài · CTA
                </label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={samplePost}
                  onChange={(e) => setSamplePost(e.target.value)}
                  placeholder="Dán nội dung bài mẫu hay vào đây..."
                />
              </div>
            </form>
          )}
        </div>
      </section>

      {/* DANH SÁCH 22+ CÔNG THỨC & SKILL */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div className="platform-pills">
          {[
            { id: "all", label: `Tất cả (${skills.length})` },
            { id: "facebook", label: "Facebook" },
            { id: "seo_google", label: "SEO Google" },
            { id: "geo_google", label: "GEO Google" },
            { id: "tiktok", label: "TikTok" },
            { id: "website", label: "Website" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`platform-pill ${filterPlat === f.id ? "active" : ""}`}
              onClick={() => setFilterPlat(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cards-grid-3">
        {visibleSkills.map((sk) => (
          <article key={sk.id} className="panel">
            <div className="panel-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{sk.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  Mã: {sk.code} · {sk.is_builtin ? "Công thức chuẩn hệ thống" : "Custom Skill của bạn"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  type="button"
                  onClick={() =>
                    downloadApiResource(
                      `/api/skills/${sk.id}/export-md`,
                      `${sk.code.toLowerCase()}.SKILL.md`,
                      "text/markdown;charset=utf-8"
                    )
                  }
                  className="btn btn-ghost btn-sm"
                  title="Tải file SKILL.md"
                >
                  <Download size={13} />
                </button>
                {!sk.is_builtin && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteSkill(sk.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <div className="panel-body">
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-secondary)" }}>
                {sk.description}
              </p>
              <div className="chip-list" style={{ marginBottom: 10 }}>
                {(sk.target_platforms || []).map((p: string) => (
                  <span key={p} className="chip">
                    {p}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12 }}>
                {(sk.outline_steps || []).slice(0, 4).map((st: any, i: number) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <strong>• {st.step}:</strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>{st.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PersonalStyleView({ onNotify }: { onNotify: (msg: string) => void }) {
  const [profile, setProfile] = useState<any | null>(null);
  const [sampleInput, setSampleInput] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  async function loadProfile() {
    const res = await apiFetch("/api/style/profile");
    setProfile(res);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSaveStyle() {
    if (!profile) return;
    await apiFetch("/api/style/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    onNotify("Đã lưu cập nhật Hồ sơ Phong cách cá nhân (Style DNA)!");
  }

  async function handleAnalyzeSamples(e: React.FormEvent) {
    e.preventDefault();
    if (!sampleInput.trim()) return;
    setAnalyzing(true);
    try {
      await apiFetch("/api/style/analyze-samples", {
        method: "POST",
        body: JSON.stringify({ samples: [sampleInput] }),
      });
      setSampleInput("");
      await loadProfile();
      onNotify("Đã trích xuất chỉ số nhịp điệu câu & cách xưng hô từ bài viết của bạn!");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!profile) return <div>Đang tải hồ sơ phong cách...</div>;

  return (
    <div className="two-col-layout">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <UserCheck size={16} /> Học Văn Phong Từ Bài Viết Thật Của Bạn
          </h2>
        </div>
        <form className="panel-body" onSubmit={handleAnalyzeSamples}>
          <p style={{ marginTop: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            Ngoài việc tự động học ngầm mỗi khi bạn biên tập bài trong Studio, bạn có thể dán các đoạn
            văn do chính tay bạn viết để hệ thống đo đạc độ dài câu, nhịp ngắt đoạn và cách xưng hô.
          </p>
          <div className="field-group">
            <label className="field-label">Dán bài viết / đoạn văn của bạn</label>
            <textarea
              className="textarea"
              rows={6}
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              placeholder="Dán 1–3 đoạn văn bạn từng viết ưng ý nhất..."
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={analyzing}>
            <Sparkles size={15} />
            {analyzing ? "Đang đo Stylometric DNA..." : "Phân Tích & Ghi Nhớ Văn Phong Của Tôi"}
          </button>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: "var(--bg-canvas)",
              border: "1px solid var(--border-subtle)",
              fontSize: 12.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Thống kê Học Thích Ứng (Continual Learning):
            </div>
            <div>• Số lần học ngầm từ thao tác sửa bài: <strong>{profile.edit_learn_count} lần</strong></div>
            <div>• Độ dài câu ưa thích: <strong>{profile.avg_sentence_length} từ/câu</strong></div>
            <div>• Nhịp điệu: <strong>{profile.stylometric_dna?.rhythm || "Cân bằng"}</strong></div>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Cấu Hình Style DNA &amp; Quy Tắc Đã Ghi Nhớ</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveStyle}>
            <Save size={14} /> Lưu hồ sơ
          </button>
        </div>
        <div className="panel-body">
          <div className="row-2">
            <div className="field-group">
              <label className="field-label">Cách xưng hô quen thuộc</label>
              <input
                className="input"
                value={profile.pronoun_style || ""}
                onChange={(e) => setProfile({ ...profile, pronoun_style: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Độ dài câu mục tiêu (từ/câu)</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={profile.avg_sentence_length || 22}
                onChange={(e) =>
                  setProfile({ ...profile, avg_sentence_length: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">
              Các cụm từ bạn không bao giờ muốn xuất hiện (cách nhau dấu phẩy)
            </label>
            <input
              className="input"
              value={(profile.banned_phrases || []).join(", ")}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  banned_phrases: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              Quy tắc văn phong hệ thống đã tự học được từ bạn (mỗi dòng 1 quy tắc)
            </label>
            <textarea
              className="textarea"
              rows={6}
              value={(profile.learned_rules || []).join("\n")}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  learned_rules: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
