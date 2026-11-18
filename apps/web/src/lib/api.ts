/**
 * Hybrid API Client:
 * 1. Khi chạy cùng Backend Python FastAPI (Local / Docker / Render / Railway hoặc cấu hình NEXT_PUBLIC_API_URL): gọi trực tiếp REST API + PostgreSQL.
 * 2. Khi xuất bản Online tĩnh trên GitHub Pages (github.io): tự động kích hoạt Standalone Cloud-Edge Engine ngay trên trình duyệt.
 * 3. Hỗ trợ Browser-to-Ollama Local Bridge trực tiếp tới máy cá nhân người dùng.
 */

import { handleStandaloneRequest } from "./standaloneEngine";

let backendProbePromise: Promise<boolean> | null = null;

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
  if (!customBase && window.location.hostname.endsWith("github.io")) {
    return false;
  }
  if (!backendProbePromise) {
    backendProbePromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(`${customBase}/api/health`, { signal: controller.signal });
        clearTimeout(timer);
        return res.ok;
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
    // Dự phòng mượt sang Standalone Engine nếu mất kết nối tạm thời
    if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
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
  const res = await fetch(`${clean}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "qwen2.5:7b",
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama trả về mã lỗi ${res.status}`);
  }
  const data = await res.json();
  return data?.message?.content || "";
}
