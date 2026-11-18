"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  FolderOpen,
  Trash2,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Heart,
  ThumbsUp,
  Send,
  Download,
  Settings,
  Save,
  X,
} from "lucide-react";
import { apiFetch, downloadApiResource, fetchLocalOllamaModels } from "@/lib/api";

/* ==================== 1. KHO LỊCH SỬ BÀI VIẾT ==================== */
export function HistoryView({
  onOpenArticle,
  onNotify,
}: {
  onOpenArticle: (art: any) => void;
  onNotify: (msg: string) => void;
}) {
  const [articles, setArticles] = useState<any[]>([]);
  const [filterPlat, setFilterPlat] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [onlyRefreshDue, setOnlyRefreshDue] = useState<boolean>(false);
  const [selectedVersions, setSelectedVersions] = useState<any[] | null>(null);

  async function loadHistory() {
    const q = new URLSearchParams();
    if (filterPlat !== "all") q.set("platform", filterPlat);
    if (search.trim()) q.set("search", search.trim());
    if (onlyRefreshDue) q.set("needs_refresh", "true");
    const res = await apiFetch(`/api/articles?${q.toString()}`);
    setArticles(res.articles || []);
  }

  useEffect(() => {
    loadHistory();
  }, [filterPlat, onlyRefreshDue]);

  async function handleSelectEdit(id: string) {
    const res = await apiFetch(`/api/articles/${id}`);
    onOpenArticle(res.article);
  }

  async function handleShowVersions(id: string) {
    const res = await apiFetch(`/api/articles/${id}`);
    setSelectedVersions(res.versions || []);
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/articles/${id}`, { method: "DELETE" });
    loadHistory();
    onNotify("Đã xóa bài viết khỏi lịch sử.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section className="panel">
        <div className="panel-body" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Tìm theo tiêu đề, từ khóa, ngành nghề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadHistory()}
          />
          <button type="button" className="btn btn-secondary" onClick={loadHistory}>
            Tìm kiếm
          </button>
          <div className="platform-pills">
            {["all", "geo_google", "seo_google", "facebook", "tiktok", "website"].map((p) => (
              <button
                key={p}
                type="button"
                className={`platform-pill ${filterPlat === p ? "active" : ""}`}
                onClick={() => setFilterPlat(p)}
              >
                {p === "all" ? "Mọi nền tảng" : p}
              </button>
            ))}
          </div>
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={onlyRefreshDue}
              onChange={(e) => setOnlyRefreshDue(e.target.checked)}
            />
            Cần cập nhật mới (&gt;90 ngày - Checklist #65)
          </label>
        </div>
      </section>

      <div className="cards-grid-3">
        {articles.map((a) => (
          <article key={a.id} className="panel">
            <div className="panel-header">
              <span className="chip">{a.platform}</span>
              {a.needs_refresh_90d && (
                <span className="status-tag status-warn">
                  <AlertTriangle size={11} /> Đến hạn cập nhật 3 tháng
                </span>
              )}
            </div>
            <div className="panel-body">
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4 }}>
                {a.industry_name} · {new Date(a.created_at).toLocaleDateString("vi-VN")}
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, lineHeight: 1.4 }}>{a.title}</h3>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-secondary)" }}>
                {a.meta_description}
              </p>
              <div className="chip-list" style={{ marginBottom: 12 }}>
                <span className="status-tag status-pass">SEO: {a.seo_score}/100</span>
                <span className="status-tag status-pass">GEO: {a.geo_score}/100</span>
                <span className="chip">Unique: {a.uniqueness_score}%</span>
                <span className="chip">Người thật: {a.human_score}%</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSelectEdit(a.id)}
                >
                  <FolderOpen size={13} /> Mở vào Studio
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleShowVersions(a.id)}
                >
                  <Clock size={13} /> Phiên bản
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={() => handleDelete(a.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedVersions && (
        <div className="modal-backdrop" onClick={() => setSelectedVersions(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h3 className="panel-title">Lịch Sử Các Phiên Bản Biên Tập</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedVersions(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="panel-body">
              {selectedVersions.map((v) => (
                <div key={v.id} className="rule-row">
                  <div style={{ fontWeight: 700 }}>
                    Phiên bản v{v.version_number} — {v.note}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    SEO: {v.seo_score} · GEO: {v.geo_score} · Giọng thật: {v.human_score}% ·{" "}
                    {new Date(v.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 2. TRUNG TÂM CẤU HÌNH ĐA CỔNG AI ==================== */
export function ProviderSettingsView({
  configData,
  onSaved,
  onNotify,
}: {
  configData: any;
  onSaved: () => void;
  onNotify: (msg: string) => void;
}) {
  const [activeProv, setActiveProv] = useState<string>(
    configData?.active_provider || "free_9router"
  );
  const [formMap, setFormMap] = useState<Record<string, any>>(configData?.providers || {});
  const [testingId, setTestingId] = useState<string>("");
  const [testResult, setTestResult] = useState<string>("");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  useEffect(() => {
    if (configData) {
      setActiveProv(configData.active_provider);
      setFormMap(configData.providers || {});
    }
  }, [configData]);

  function updateEntry(pid: string, field: string, val: any) {
    setFormMap((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [field]: val },
    }));
  }

  async function handleSaveAll() {
    await apiFetch("/api/providers/config", {
      method: "PUT",
      body: JSON.stringify({
        active_provider: activeProv,
        providers: formMap,
      }),
    });
    onSaved();
    onNotify(`Đã lưu cấu hình! Cổng AI đang kích hoạt: '${activeProv}'.`);
  }

  async function handleTestConnection(pid: string) {
    setTestingId(pid);
    setTestResult("");
    try {
      if (pid === "ollama") {
        try {
          const models = await fetchLocalOllamaModels(
            formMap.ollama?.base_url || "http://localhost:11434"
          );
          setOllamaModels(models);
          setTestResult(
            `Kết nối Ollama trên máy bạn thành công! Tìm thấy ${models.length} model: ${models.join(", ")}`
          );
          return;
        } catch {
          // Tiếp tục thử qua backend phòng trường hợp chạy cùng máy chủ
        }
      }
      const cur = formMap[pid] || {};
      const res = await apiFetch("/api/providers/test", {
        method: "POST",
        body: JSON.stringify({
          provider: pid,
          base_url: cur.base_url || "",
          api_key: cur.api_key || "",
          model: cur.text_model || "",
        }),
      });
      setTestResult(res.message);
    } catch (e: any) {
      setTestResult(`Lỗi kiểm tra: ${e.message}`);
    } finally {
      setTestingId("");
    }
  }

  const catalog = configData?.catalog || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Cpu size={16} /> Cấu Hình Nền Tảng AI (Free 9Router Mặc Định · Ollama Local · Cloud API)
            </h2>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 3 }}>
              Nếu bạn chọn <strong>Free</strong>, hệ thống tự động định tuyến qua{" "}
              <code>9Router</code> của hệ thống ({configData?.system_9router_endpoint}). Khóa API cá
              nhân được mã hóa AES-256-GCM an toàn.
            </div>
          </div>
          <button id="btn-save-providers" type="button" className="btn btn-primary" onClick={handleSaveAll}>
            <Save size={15} /> Áp dụng cấu hình AI
          </button>
        </div>

        {testResult && (
          <div style={{ padding: "10px 16px", background: "var(--brand-soft)", fontSize: 13, fontWeight: 600 }}>
            🔌 {testResult}
          </div>
        )}
      </section>

      <div className="cards-grid-3">
        {catalog.map((item: any) => {
          const pid = item.id;
          const entry = formMap[pid] || {};
          const isSelected = activeProv === pid;

          return (
            <section
              key={pid}
              className="panel"
              style={{
                borderColor: isSelected ? "var(--brand-primary)" : "var(--border-subtle)",
                boxShadow: isSelected ? "0 0 0 2px rgba(15, 76, 92, 0.16)" : undefined,
              }}
            >
              <div className="panel-header">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <span className="chip" style={{ marginTop: 4 }}>
                    {item.badge}
                  </span>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setActiveProv(pid)}
                >
                  {isSelected && <CheckCircle2 size={13} />}
                  {isSelected ? "Đang chọn" : "Chọn dùng"}
                </button>
              </div>

              <div className="panel-body">
                <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-secondary)" }}>
                  {item.description}
                </p>

                {pid === "free_9router" ? (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: "var(--status-pass-bg)",
                      color: "var(--status-pass)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    ✓ Mặc định sẵn sàng — Không cần nhập API Key. Hạn mức hôm nay:{" "}
                    {configData?.free_quota?.used || 0}/{configData?.free_quota?.limit || 50} bài.
                  </div>
                ) : (
                  <>
                    <div className="field-group">
                      <label className="field-label">Base URL / Endpoint</label>
                      <input
                        className="input"
                        value={entry.base_url || ""}
                        onChange={(e) => updateEntry(pid, "base_url", e.target.value)}
                      />
                    </div>
                    {pid !== "ollama" && (
                      <div className="field-group">
                        <label className="field-label">
                          <span>API Key</span>
                          {entry.has_key && (
                            <span style={{ color: "var(--status-pass)", fontSize: 11 }}>
                              Đã lưu: {entry.masked_key}
                            </span>
                          )}
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder={entry.has_key ? "Nhập khóa mới nếu muốn thay đổi..." : "sk-..."}
                          value={entry.api_key || ""}
                          onChange={(e) => updateEntry(pid, "api_key", e.target.value)}
                        />
                      </div>
                    )}
                    <div className="field-group">
                      <label className="field-label">Model viết bài (Text Model)</label>
                      <input
                        className="input"
                        value={entry.text_model || ""}
                        onChange={(e) => updateEntry(pid, "text_model", e.target.value)}
                        placeholder={item.default_model}
                      />
                      {pid === "ollama" && ollamaModels.length > 0 && (
                        <div className="chip-list" style={{ marginTop: 6 }}>
                          {ollamaModels.map((m) => (
                            <button
                              key={m}
                              type="button"
                              className="chip"
                              style={{ cursor: "pointer", border: "none" }}
                              onClick={() => updateEntry("ollama", "text_model", m)}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-full"
                  disabled={testingId === pid}
                  onClick={() => handleTestConnection(pid)}
                >
                  {testingId === pid ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== 3. ĐÓNG GÓP Ý KIẾN & ĐỀ XUẤT TÍNH NĂNG ==================== */
export function FeedbackCommunityView({ onNotify }: { onNotify: (msg: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [authorName, setAuthorName] = useState<string>("");
  const [category, setCategory] = useState<string>("feature");
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [sending, setSending] = useState<boolean>(false);

  async function loadFeedback() {
    const res = await apiFetch("/api/feedback");
    setItems(res.feedbacks || []);
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          author_name: authorName || "Người dùng Content Studio",
          category,
          title,
          message,
          rating,
        }),
      });
      setTitle("");
      setMessage("");
      await loadFeedback();
      onNotify("Cảm ơn bạn đã đóng góp ý kiến! Hệ thống đã ghi nhận và thông báo cho tác giả.");
    } finally {
      setSending(false);
    }
  }

  async function handleUpvote(id: string) {
    await apiFetch(`/api/feedback/${id}/upvote`, { method: "POST" });
    loadFeedback();
  }

  return (
    <div className="two-col-layout">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Gửi Phản Hồi &amp; Đề Xuất Phát Triển</h2>
        </div>
        <form className="panel-body" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Tên của bạn</label>
            <input
              className="input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="VD: Minh Trang (Content Marketing)"
            />
          </div>
          <div className="row-2">
            <div className="field-group">
              <label className="field-label">Nhóm góp ý</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="feature">Đề xuất tính năng mới</option>
                <option value="skill_idea">Đề xuất thêm Công thức viết</option>
                <option value="industry_idea">Đề xuất thêm Ngành nghề</option>
                <option value="bug">Báo lỗi kỹ thuật</option>
                <option value="general">Góp ý trải nghiệm chung</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Mức độ hài lòng</label>
              <select
                className="select"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5 Rất hữu ích)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5 Tốt)</option>
                <option value={3}>⭐⭐⭐ (3/5 Khá)</option>
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Tiêu đề ý tưởng / phản hồi</label>
            <input
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tóm tắt ngắn gọn đề xuất của bạn..."
            />
          </div>
          <div className="field-group">
            <label className="field-label">Mô tả chi tiết</label>
            <textarea
              className="textarea"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Chia sẻ chi tiết mong muốn của bạn để tác giả hoàn thiện ứng dụng tốt hơn..."
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
            <Send size={14} /> {sending ? "Đang gửi..." : "Gửi Đóng Góp Ý Kiến"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Bảng Ý Tưởng Cộng Đồng ({items.length})</h2>
          <button
            type="button"
            onClick={() =>
              downloadApiResource(
                "/api/feedback/export.tsv",
                "feedback-google-sheets.tsv",
                "text/tab-separated-values;charset=utf-8"
              )
            }
            className="btn btn-ghost btn-sm"
          >
            <Download size={13} /> Xuất TSV (Google Sheets)
          </button>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((fb) => (
            <div
              key={fb.id}
              style={{
                padding: 14,
                borderRadius: 10,
                background: "var(--bg-canvas)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <span className="chip" style={{ marginRight: 6 }}>
                    {fb.category}
                  </span>
                  <strong style={{ fontSize: 14 }}>{fb.title}</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleUpvote(fb.id)}
                >
                  <ThumbsUp size={12} /> {fb.upvotes}
                </button>
              </div>
              <p style={{ margin: "8px 0", fontSize: 13, color: "var(--text-secondary)" }}>
                {fb.message}
              </p>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                Gửi bởi {fb.author_name} · Trạng thái: <strong>{fb.status.toUpperCase()}</strong>
              </div>
              {fb.admin_note && (
                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    background: "var(--brand-soft)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  Phản hồi từ Tác giả: {fb.admin_note}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ==================== 4. TRANG QUẢN TRỊ ADMIN ==================== */
export function AdminDashboardView({ onNotify }: { onNotify: (msg: string) => void }) {
  const [settings, setSettings] = useState<any | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/settings").then(setSettings);
  }, []);

  async function handleSaveAdmin() {
    await apiFetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    onNotify("Đã cập nhật cấu hình Quản trị Hệ thống (9Router, Telegram, Google Sheets & VietQR)!");
  }

  if (!settings) return <div>Đang tải trang quản trị...</div>;

  const r9 = settings.ai_free_9router || {};
  const integ = settings.integrations || {};
  const qr = settings.author_qr || {};

  return (
    <div className="cards-grid-3">
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <Settings size={15} /> Cụm 9Router Hệ Thống (Gói Free)
          </h3>
        </div>
        <div className="panel-body">
          <div className="field-group">
            <label className="field-label">System 9Router Base URL</label>
            <input
              className="input"
              value={r9.base_url || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ai_free_9router: { ...r9, base_url: e.target.value },
                })
              }
            />
          </div>
          <div className="field-group">
            <label className="field-label">9Router System Key</label>
            <input
              type="password"
              className="input"
              value={r9.api_key || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ai_free_9router: { ...r9, api_key: e.target.value },
                })
              }
            />
          </div>
          <div className="field-group">
            <label className="field-label">Model mặc định gói Free</label>
            <input
              className="input"
              value={r9.default_model || "auto"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ai_free_9router: { ...r9, default_model: e.target.value },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Đồng Bộ Telegram Bot &amp; Google Sheets</h3>
        </div>
        <div className="panel-body">
          <div className="field-group">
            <label className="field-label">Telegram Bot Token</label>
            <input
              className="input"
              value={integ.telegram_bot_token || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  integrations: { ...integ, telegram_bot_token: e.target.value },
                })
              }
              placeholder="123456789:AAH..."
            />
          </div>
          <div className="field-group">
            <label className="field-label">Telegram Chat ID nhận Góp ý</label>
            <input
              className="input"
              value={integ.telegram_chat_id || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  integrations: { ...integ, telegram_chat_id: e.target.value },
                })
              }
              placeholder="-100123456789"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Google Sheets Apps Script Webhook URL</label>
            <input
              className="input"
              value={integ.google_sheets_webhook_url || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  integrations: { ...integ, google_sheets_webhook_url: e.target.value },
                })
              }
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Thông Tin Mã QR Ủng Hộ Tác Giả</h3>
        </div>
        <div className="panel-body">
          <div className="row-2">
            <div className="field-group">
              <label className="field-label">Mã Ngân hàng (MB, VCB, TCB...)</label>
              <input
                className="input"
                value={qr.bank_id || "MB"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    author_qr: { ...qr, bank_id: e.target.value },
                  })
                }
              />
            </div>
            <div className="field-group">
              <label className="field-label">Số Tài Khoản</label>
              <input
                className="input"
                value={qr.account_no || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    author_qr: { ...qr, account_no: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Tên Chủ Tài Khoản (Không dấu)</label>
            <input
              className="input"
              value={qr.account_name || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  author_qr: { ...qr, account_name: e.target.value },
                })
              }
            />
          </div>
          <div className="field-group">
            <label className="field-label">Thông tin Ví MoMo / ZaloPay bổ sung</label>
            <input
              className="input"
              value={qr.static_momo_note || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  author_qr: { ...qr, static_momo_note: e.target.value },
                })
              }
            />
          </div>
          <button type="button" className="btn btn-primary btn-full" onClick={handleSaveAdmin}>
            <Save size={14} /> Lưu Toàn Bộ Thiết Lập Quản Trị
          </button>
        </div>
      </section>
    </div>
  );
}

/* ==================== 5. MODAL MÃ QR ỦNG HỘ TÁC GIẢ ==================== */
export function DonateQrModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState<number>(50000);
  const [note, setNote] = useState<string>("Ung ho AI Content Studio");
  const [donateData, setDonateData] = useState<any | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({ amount: String(amount), message: note });
    apiFetch(`/api/donate/config?${q.toString()}`).then(setDonateData);
  }, [amount, note]);

  const presets = donateData?.config?.preset_amounts || [25000, 50000, 100000, 200000];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3 className="panel-title">
            <Heart size={16} style={{ color: "var(--accent-warm)" }} /> Ủng Hộ Tác Giả Phát Triển Ứng Dụng
          </h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="panel-body" style={{ textAlign: "center" }}>
          <p style={{ marginTop: 0, fontSize: 13.5, color: "var(--text-secondary)" }}>
            {donateData?.config?.thank_you_message ||
              "Cảm ơn bạn đã đồng hành! Quét mã QR bên dưới để ủng hộ tác giả duy trì hệ thống 9Router miễn phí."}
          </p>

          <div className="platform-pills" style={{ justifyContent: "center", marginBottom: 12 }}>
            {presets.map((amt: number) => (
              <button
                key={amt}
                type="button"
                className={`platform-pill ${amount === amt ? "active" : ""}`}
                onClick={() => setAmount(amt)}
              >
                {amt.toLocaleString("vi-VN")}đ
              </button>
            ))}
          </div>

          <div className="row-2" style={{ textAlign: "left", marginBottom: 14 }}>
            <div>
              <label className="field-label">Số tiền tùy chọn (VNĐ)</label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="field-label">Lời nhắn gửi tác giả</label>
              <input
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {donateData?.qr && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <img
                src={donateData.qr.local_qr_url}
                alt="Mã QR ủng hộ tác giả"
                style={{
                  width: 300,
                  maxWidth: "100%",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                }}
              />
              {donateData?.config?.static_momo_note && (
                <div
                  style={{
                    fontSize: 12.5,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "var(--accent-warm-soft)",
                    color: "var(--text-primary)",
                  }}
                >
                  {donateData.config.static_momo_note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
