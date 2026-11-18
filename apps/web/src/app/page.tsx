"use client";

import React, { useEffect, useState } from "react";
import {
  PenTool,
  Brain,
  Layers,
  UserCheck,
  History,
  Cpu,
  MessageSquarePlus,
  ShieldCheck,
  Coffee,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import WriteStudioView from "@/components/WriteStudioView";
import SecondBrainView from "@/components/SecondBrainView";
import { SkillsHubView, PersonalStyleView } from "@/components/SkillsStyleView";
import {
  HistoryView,
  ProviderSettingsView,
  FeedbackCommunityView,
  AdminDashboardView,
  DonateQrModal,
} from "@/components/HistoryProvidersFeedbackView";

type NavKey =
  | "write"
  | "brain"
  | "skills"
  | "style"
  | "history"
  | "providers"
  | "feedback"
  | "admin";

const VIEW_TITLES: Record<NavKey, string> = {
  write: "Studio Viết Bài Đa Ngành & Chấm Điểm 65 Tiêu Chí SEO/GEO",
  brain: "Bộ Não Thứ 2 Đa Ngành Nghề — Tự Động Phân Loại & Lưu Trữ Tri Thức",
  skills: "Kho 22+ Công Thức & Tự Thêm Kỹ Năng Viết Bài (Update Skill)",
  style: "Ghi Nhớ & Tối Ưu Hóa Theo Phong Cách Viết Cá Nhân (Style DNA)",
  history: "Kho Lịch Sử Bài Viết & Quản Lý Vòng Đời Nội Dung",
  providers: "Cấu Hình Cổng AI: Free 9Router · Ollama Local · OpenAI · Gemini · Claude · DeepSeek",
  feedback: "Đóng Góp Ý Kiến & Đề Xuất Ý Tưởng Phát Triển",
  admin: "Quản Trị Hệ Thống (9Router · Telegram · Google Sheets · VietQR)",
};

export default function HomePage() {
  const [activeNav, setActiveNav] = useState<NavKey>("write");
  const [vaults, setVaults] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [platformsMap, setPlatformsMap] = useState<Record<string, any>>({});
  const [providerData, setProviderData] = useState<any | null>(null);
  const [loadedArticle, setLoadedArticle] = useState<any | null>(null);

  const [toastMsg, setToastMsg] = useState<string>("");
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [showSubtleDonateBanner, setShowSubtleDonateBanner] = useState<boolean>(false);

  function notify(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? "" : cur));
    }, 5500);
  }

  async function refreshVaults() {
    const res = await apiFetch("/api/brain/vaults");
    setVaults(res.vaults || []);
  }

  async function refreshSkills() {
    const res = await apiFetch("/api/skills");
    setSkills(res.skills || []);
  }

  async function refreshProviders() {
    const res = await apiFetch("/api/providers/config");
    setProviderData(res);
  }

  useEffect(() => {
    Promise.all([
      apiFetch("/api/platforms").then((r) => setPlatformsMap(r.platforms || {})),
      refreshVaults(),
      refreshSkills(),
      refreshProviders(),
    ]).catch(() => {});
  }, []);

  const activeProviderId = providerData?.active_provider || "free_9router";
  const activeProviderLabel =
    providerData?.catalog?.find((c: any) => c.id === activeProviderId)?.name ||
    "Gói Miễn Phí (System 9Router)";

  return (
    <div className="app-shell">
      {/* SIDEBAR ĐIỀU HƯỚNG */}
      <aside className="sidebar" aria-label="Điều hướng chính">
        <div className="brand-header">
          <div className="brand-mark">
            <span className="brand-icon-box">CS</span>
            <span>AI Content Studio</span>
          </div>
          <div className="brand-sub">Viết Content Đa Ngành &amp; Bộ Não Thứ 2</div>
        </div>

        <div className="nav-group-label">Không Gian Sáng Tạo</div>
        <button
          id="nav-write"
          type="button"
          className={`nav-btn ${activeNav === "write" ? "active" : ""}`}
          onClick={() => setActiveNav("write")}
        >
          <PenTool size={16} />
          <span>Viết Bài &amp; Chấm SEO</span>
        </button>
        <button
          id="nav-brain"
          type="button"
          className={`nav-btn ${activeNav === "brain" ? "active" : ""}`}
          onClick={() => setActiveNav("brain")}
        >
          <Brain size={16} />
          <span>Bộ Não Thứ 2</span>
          <span className="nav-badge">{vaults.length}</span>
        </button>
        <button
          id="nav-skills"
          type="button"
          className={`nav-btn ${activeNav === "skills" ? "active" : ""}`}
          onClick={() => setActiveNav("skills")}
        >
          <Layers size={16} />
          <span>Công Thức &amp; Skill</span>
          <span className="nav-badge">{skills.length}</span>
        </button>
        <button
          id="nav-style"
          type="button"
          className={`nav-btn ${activeNav === "style" ? "active" : ""}`}
          onClick={() => setActiveNav("style")}
        >
          <UserCheck size={16} />
          <span>Phong Cách Cá Nhân</span>
        </button>
        <button
          id="nav-history"
          type="button"
          className={`nav-btn ${activeNav === "history" ? "active" : ""}`}
          onClick={() => setActiveNav("history")}
        >
          <History size={16} />
          <span>Lịch Sử Bài Viết</span>
        </button>

        <div className="nav-group-label" style={{ marginTop: 8 }}>
          Hệ Thống &amp; Cộng Đồng
        </div>
        <button
          id="nav-providers"
          type="button"
          className={`nav-btn ${activeNav === "providers" ? "active" : ""}`}
          onClick={() => setActiveNav("providers")}
        >
          <Cpu size={16} />
          <span>Cấu Hình Cổng AI</span>
        </button>
        <button
          id="nav-feedback"
          type="button"
          className={`nav-btn ${activeNav === "feedback" ? "active" : ""}`}
          onClick={() => setActiveNav("feedback")}
        >
          <MessageSquarePlus size={16} />
          <span>Đóng Góp Ý Kiến</span>
        </button>
        <button
          id="nav-admin"
          type="button"
          className={`nav-btn ${activeNav === "admin" ? "active" : ""}`}
          onClick={() => setActiveNav("admin")}
        >
          <ShieldCheck size={16} />
          <span>Quản Trị Hệ Thống</span>
        </button>

        <div className="sidebar-footer">
          <div className="provider-status-box">
            <div style={{ color: "var(--text-on-dark-muted)", fontSize: 11 }}>
              Đang kết nối AI:
            </div>
            <div style={{ fontWeight: 700, color: "#fff", marginTop: 2 }}>
              {activeProviderLabel}
            </div>
          </div>

          <button
            id="btn-open-donate-qr"
            type="button"
            className="donate-cta-btn"
            onClick={() => setShowDonateModal(true)}
          >
            <Coffee size={15} />
            <span>Mã QR Ủng Hộ Tác Giả</span>
          </button>
        </div>
      </aside>

      {/* VÙNG LÀM VIỆC CHÍNH */}
      <div className="main-area">
        <header className="topbar">
          <h1 className="topbar-title">{VIEW_TITLES[activeNav]}</h1>
          <div className="topbar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setActiveNav("providers")}
            >
              <Cpu size={14} /> {activeProviderId === "free_9router" ? "9Router Free" : activeProviderId}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDonateModal(true)}
            >
              <Coffee size={14} /> Ủng hộ tác giả
            </button>
          </div>
        </header>

        <main className="workspace-body">
          {toastMsg && (
            <div className="toast-banner" role="status">
              <span>✓ {toastMsg}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setToastMsg("")}
              >
                Đóng
              </button>
            </div>
          )}

          {showSubtleDonateBanner && (
            <div
              className="toast-banner"
              style={{ background: "var(--accent-warm-soft)", color: "var(--text-primary)" }}
            >
              <span>
                🎉 Bài viết của bạn đạt chuẩn rất cao! Nếu công cụ hữu ích, bạn có thể mời tác giả 1
                ly cà phê để duy trì server 9Router miễn phí nhé.
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-warm btn-sm"
                  onClick={() => {
                    setShowSubtleDonateBanner(false);
                    setShowDonateModal(true);
                  }}
                >
                  Xem Mã QR
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowSubtleDonateBanner(false)}
                >
                  Để sau
                </button>
              </div>
            </div>
          )}

          {activeNav === "write" && (
            <WriteStudioView
              vaults={vaults}
              skills={skills}
              platformsMap={platformsMap}
              activeProvider={activeProviderId}
              providerDetails={providerData?.providers || {}}
              loadedArticle={loadedArticle}
              onVaultsRefresh={refreshVaults}
              onNotify={notify}
              onShowDonateHint={() => setShowSubtleDonateBanner(true)}
            />
          )}

          {activeNav === "brain" && (
            <SecondBrainView vaults={vaults} onRefresh={refreshVaults} onNotify={notify} />
          )}

          {activeNav === "skills" && (
            <SkillsHubView skills={skills} onRefresh={refreshSkills} onNotify={notify} />
          )}

          {activeNav === "style" && <PersonalStyleView onNotify={notify} />}

          {activeNav === "history" && (
            <HistoryView
              onOpenArticle={(art) => {
                setLoadedArticle(art);
                setActiveNav("write");
                notify(`Đã tải bài viết '${art.title}' vào Studio!`);
              }}
              onNotify={notify}
            />
          )}

          {activeNav === "providers" && (
            <ProviderSettingsView
              configData={providerData}
              onSaved={refreshProviders}
              onNotify={notify}
            />
          )}

          {activeNav === "feedback" && <FeedbackCommunityView onNotify={notify} />}

          {activeNav === "admin" && <AdminDashboardView onNotify={notify} />}
        </main>
      </div>

      {showDonateModal && <DonateQrModal onClose={() => setShowDonateModal(false)} />}
    </div>
  );
}
