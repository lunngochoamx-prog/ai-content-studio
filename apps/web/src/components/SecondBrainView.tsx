"use client";

import React, { useEffect, useState } from "react";
import { Brain, Plus, Sparkles, Save, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SecondBrainProps {
  vaults: any[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export default function SecondBrainView({ vaults, onRefresh, onNotify }: SecondBrainProps) {
  const [selectedId, setSelectedId] = useState<string>(vaults[0]?.id || "");
  const [detail, setDetail] = useState<any | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);

  // Form nạp tri thức tự động phân loại ngành nghề
  const [ingestTitle, setIngestTitle] = useState<string>("");
  const [ingestText, setIngestText] = useState<string>("");
  const [ingestTargetVault, setIngestTargetVault] = useState<string>("auto");
  const [ingesting, setIngesting] = useState<boolean>(false);

  // Form tạo ngành mới
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newBrand, setNewBrand] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");

  useEffect(() => {
    if (!selectedId && vaults.length > 0) {
      setSelectedId(vaults[0].id);
    }
  }, [vaults, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    apiFetch(`/api/brain/vaults/${selectedId}`)
      .then((res) => {
        setDetail(res.vault);
        setChunks(res.chunks || []);
      })
      .catch(() => {});
  }, [selectedId, vaults]);

  async function handleAutoIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!ingestText.trim()) return;
    setIngesting(true);
    try {
      const res = await apiFetch("/api/brain/ingest", {
        method: "POST",
        body: JSON.stringify({
          source_title: ingestTitle || "Tài liệu tri thức chuyên ngành",
          raw_text: ingestText,
          vault_id: ingestTargetVault,
        }),
      });
      setIngestText("");
      setIngestTitle("");
      onRefresh();
      setSelectedId(res.vault_id);
      onNotify(
        `${res.auto_created_vault ? "Đã tự động khởi tạo ngành mới" : "Đã tự động phân loại vào ngành"} '${res.industry_name}' (độ tin cậy ${Math.round(res.confidence * 100)}%) · Lưu ${res.added_chunks} đơn vị tri thức & ${res.new_terms_learned?.length || 0} thuật ngữ mới!`
      );
    } catch (err: any) {
      onNotify(`Lỗi nạp tri thức: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  }

  async function handleSaveVault() {
    if (!detail) return;
    await apiFetch(`/api/brain/vaults/${detail.id}`, {
      method: "PUT",
      body: JSON.stringify(detail),
    });
    onRefresh();
    onNotify(`Đã lưu cập nhật Bộ não ngành '${detail.name}'!`);
  }

  async function handleCreateVault(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await apiFetch("/api/brain/vaults", {
      method: "POST",
      body: JSON.stringify({
        name: newName,
        brand_name: newBrand,
        brand_logo_text: newBrand.toUpperCase(),
        description: newDesc,
      }),
    });
    setShowNewModal(false);
    setNewName("");
    setNewBrand("");
    setNewDesc("");
    onRefresh();
    setSelectedId(res.id);
    onNotify(`Đã tạo Kho tri thức ngành '${res.name}'!`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* KHỐI NẠP TRI THỨC & TỰ ĐỘNG PHÂN LOẠI NGÀNH NGHỀ */}
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <Sparkles size={16} /> Nạp Thông Tin Vào Bộ Não Thứ 2 — Tự Động Phân Loại Ngành Nghề
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowNewModal(true)}
          >
            <Plus size={14} /> Thêm ngành nghề thủ công
          </button>
        </div>
        <form className="panel-body" onSubmit={handleAutoIngest}>
          <div className="row-2">
            <div className="field-group">
              <label className="field-label" htmlFor="ingest-title">
                Nguồn / Tiêu đề tài liệu
              </label>
              <input
                id="ingest-title"
                className="input"
                value={ingestTitle}
                onChange={(e) => setIngestTitle(e.target.value)}
                placeholder="VD: Báo cáo thị trường Du lịch nghỉ dưỡng 2026 / Tài liệu sản phẩm..."
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="ingest-vault-mode">
                Chế độ phân loại ngành nghề
              </label>
              <select
                id="ingest-vault-mode"
                className="select"
                value={ingestTargetVault}
                onChange={(e) => setIngestTargetVault(e.target.value)}
              >
                <option value="auto">
                  🤖 Tự động nhận diện ngành nghề (Tự tạo kho mới nếu ngành chưa có)
                </option>
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    Gán trực tiếp vào: {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="ingest-raw-text">
              Nội dung nghiên cứu, số liệu, thông tin sản phẩm, trích dẫn Harvard hoặc insight khách hàng
            </label>
            <textarea
              id="ingest-raw-text"
              className="textarea"
              rows={3}
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              placeholder="Dán bất kỳ đoạn thông tin, số liệu nội bộ hoặc ghi chú chuyên ngành nào. Hệ thống sẽ tự động phân loại đúng ngành, trích xuất thuật ngữ trường từ vựng và lưu Vector RAG..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={ingesting}>
            <Brain size={15} />
            {ingesting
              ? "Đang phân loại & bóc tách Vector..."
              : "Phân Loại Tự Động & Cập Nhật Kiến Thức Ngành"}
          </button>
        </form>
      </section>

      {/* DANH SÁCH NGÀNH & CHI TIẾT KHO TRI THỨC */}
      <div className="two-col-layout">
        <aside className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Danh Mục Ngành Nghề ({vaults.length})</h3>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {vaults.map((v) => (
              <button
                key={v.id}
                type="button"
                className="title-option"
                style={{
                  background: selectedId === v.id ? "var(--brand-soft)" : "var(--bg-canvas)",
                  borderColor: selectedId === v.id ? "var(--brand-primary)" : "var(--border-subtle)",
                }}
                onClick={() => setSelectedId(v.id)}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{v.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    Thương hiệu: {v.brand_name || "Chưa gán"} · {v.terminology_lexicon?.length || 0}{" "}
                    thuật ngữ
                  </div>
                </div>
                <span className="chip">{v.knowledge_count} mục</span>
              </button>
            ))}
          </div>
        </aside>

        {detail && (
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <BookOpen size={16} /> Kho Tri Thức Ngành: {detail.name}
              </h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveVault}>
                <Save size={14} /> Lưu cấu hình ngành
              </button>
            </div>
            <div className="panel-body">
              <div className="row-2">
                <div className="field-group">
                  <label className="field-label">Tên Thương hiệu đại diện</label>
                  <input
                    className="input"
                    value={detail.brand_name || ""}
                    onChange={(e) => setDetail({ ...detail, brand_name: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Chữ đóng dấu Logo ảnh &amp; Cặp xưng hô</label>
                  <div className="row-2">
                    <input
                      className="input"
                      value={detail.brand_logo_text || ""}
                      onChange={(e) => setDetail({ ...detail, brand_logo_text: e.target.value })}
                      placeholder="LOGO TEXT"
                    />
                    <input
                      className="input"
                      value={detail.pronoun_pair || ""}
                      onChange={(e) => setDetail({ ...detail, pronoun_pair: e.target.value })}
                      placeholder="Chúng tôi - Bạn"
                    />
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">
                  Chân dung Khách hàng &amp; Insight thầm kín (Phục vụ cá nhân hóa #27 &amp; Meta #40)
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={detail.target_audience || ""}
                  onChange={(e) => setDetail({ ...detail, target_audience: e.target.value })}
                />
              </div>

              <div className="row-2">
                <div className="field-group">
                  <label className="field-label">Thông điệp chung Doanh nghiệp (#6)</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={detail.messaging_general || ""}
                    onChange={(e) => setDetail({ ...detail, messaging_general: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Thông điệp Sản phẩm chủ lực (#8)</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={detail.messaging_product || ""}
                    onChange={(e) => setDetail({ ...detail, messaging_product: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">
                  Từ điển Trường từ vựng chuyên ngành &amp; LSI (Phục vụ Cosine Similarity #60)
                </label>
                <input
                  className="input"
                  value={(detail.terminology_lexicon || []).join(", ")}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      terminology_lexicon: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  Từ cấm Pháp lý &amp; Luật Quảng cáo của ngành (#12)
                </label>
                <input
                  className="input"
                  value={(detail.compliance_taboo || []).join(", ")}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      compliance_taboo: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Đơn Vị Tri Thức Vector Đã Học ({chunks.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {chunks.map((ch) => (
                    <div
                      key={ch.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "var(--bg-canvas)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        <span>
                          [{ch.chunk_type.toUpperCase()}] {ch.title}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                          {ch.source_label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {ch.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {showNewModal && (
        <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h3 className="panel-title">Tạo Kho Ngành Nghề Mới</h3>
            </div>
            <form className="panel-body" onSubmit={handleCreateVault}>
              <div className="field-group">
                <label className="field-label">Tên ngành nghề</label>
                <input
                  className="input"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Logistics & Chuỗi cung ứng"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Thương hiệu đại diện (tùy chọn)</label>
                <input
                  className="input"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="VD: VietCargo Express"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Mô tả trọng tâm ngành</label>
                <textarea
                  className="textarea"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowNewModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Khởi tạo Kho Ngành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
