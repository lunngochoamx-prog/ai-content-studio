/**
 * API Client & Browser-to-Ollama Local Bridge
 * Cho phép gọi REST API Backend đồng thời hỗ trợ kết nối trực tiếp từ trình duyệt tới Ollama trên máy cá nhân người dùng.
 */

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("cs_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json();
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
