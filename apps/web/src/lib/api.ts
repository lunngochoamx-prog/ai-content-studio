/**
 * Hybrid API Client:
 * 1. Desktop App (Electron Setup .exe / .dmg / .AppImage): lưu trữ trực tiếp trên ổ cứng máy tính & gọi AI/Ollama không bị chặn CORS qua IPC.
 * 2. Web Online tĩnh (GitHub Pages): kích hoạt Standalone Cloud-Edge Engine trên trình duyệt.
 * 3. Full-Stack Server (Local / Docker / Render / Railway): kết nối trực tiếp Python FastAPI + PostgreSQL.
 */

import { handleStandaloneRequest } from "./standaloneEngine";

let backendProbePromise: Promise<boolean> | null = null;

function getElectronBridge(): any {
  return typeof window !== "undefined" ? (window as any).electronStudio : null;
}

function getConfiguredApiBase(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("cs_custom_api_base");
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, "");
  }
  return (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
}

async function isBackendReachable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const customBase = getConfiguredApiBase();
  const isStandaloneHost =
    Boolean(getElectronBridge()?.isDesktop) ||
    (window.location.protocol !== "http:" && window.location.protocol !== "https:") ||
    window.location.hostname.endsWith("github.io");

  if (!customBase && isStandaloneHost) {
    return false;
  }
  if (!backendProbePromise) {
    backendProbePromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(`${customBase}/api/health`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return false;
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return false;
        const data = await res.json();
        return data?.status === "ok";
      } catch {
        return false;
      }
    })();
  }
  return backendProbePromise;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const useBackend = await isBackendReachable();
  if (!useBackend) {
    return handleStandaloneRequest(path, options) as Promise<T>;
  }

  const base = getConfiguredApiBase();
  const token = typeof window !== "undefined" ? localStorage.getItem("cs_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(`${base}${path}`, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return (await res.text()) as unknown as T;
  } catch (err) {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.endsWith("github.io") || Boolean(getElectronBridge()?.isDesktop))
    ) {
      return handleStandaloneRequest(path, options) as Promise<T>;
    }
    throw err;
  }
}

export async function downloadApiResource(path: string, filename: string, mimeType = "text/plain;charset=utf-8") {
  const content = await apiFetch<string>(path);
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchLocalOllamaModels(baseUrl = "http://localhost:11434"): Promise<string[]> {
  const clean = baseUrl.replace(/\/+$/, "");
  const bridge = getElectronBridge();
  if (bridge?.proxyFetch) {
    const resp = await bridge.proxyFetch({ url: `${clean}/api/tags`, method: "GET" });
    if (!resp?.ok) throw new Error("Không kết nối được Ollama Local trên máy này.");
    const data = JSON.parse(resp.text || "{}");
    return (data.models || []).map((m: { name: string }) => m.name);
  }
  const res = await fetch(`${clean}/api/tags`, { method: "GET" });
  if (!res.ok) {
    throw new Error("Không kết nối được Ollama Local trên trình duyệt.");
  }
  const data = await res.json();
  return (data.models || []).map((m: { name: string }) => m.name);
}

export async function generateViaLocalOllama(
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const clean = baseUrl.replace(/\/+$/, "");
  const payload = JSON.stringify({
    model: model || "qwen2.5:7b",
    stream: false,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const bridge = getElectronBridge();
  if (bridge?.proxyFetch) {
    const resp = await bridge.proxyFetch({
      url: `${clean}/api/chat`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (!resp?.ok) throw new Error(`Ollama trả về mã lỗi ${resp?.status || 500}`);
    const data = JSON.parse(resp.text || "{}");
    return data?.message?.content || "";
  }
  const res = await fetch(`${clean}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  if (!res.ok) {
    throw new Error(`Ollama trả về mã lỗi ${res.status}`);
  }
  const data = await res.json();
  return data?.message?.content || "";
}
