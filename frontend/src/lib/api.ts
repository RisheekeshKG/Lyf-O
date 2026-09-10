import type { ChatResponse, EnhanceResponse, RecommendResponse, UserProfile } from "../types";

/**
 * Packaged builds spawn the backend on the first free port from 8000, so the
 * URL can't be hardcoded — ask the main process for the one it actually used.
 */
const DEFAULT_API_URL = "http://127.0.0.1:8000";

let baseUrlPromise: Promise<string> | null = null;

function resolveBaseUrl(): Promise<string> {
  if (import.meta.env.VITE_API_URL) return Promise.resolve(import.meta.env.VITE_API_URL);

  baseUrlPromise ??= (async () => {
    try {
      const url = await window.electronAPI?.invoke("get-api-url");
      // Older builds answer unknown channels with an object; only trust a string.
      return typeof url === "string" && url.startsWith("http") ? url : DEFAULT_API_URL;
    } catch {
      return DEFAULT_API_URL;
    }
  })();

  return baseUrlPromise;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${await resolveBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  sendChatMessage: (content: string) =>
    post<ChatResponse>("/chat/chat", { content, role: "user" }),

  recommendForProfile: (profile: UserProfile) =>
    post<RecommendResponse>("/recommend", profile),

  async recommendRandom(): Promise<RecommendResponse> {
    const res = await fetch(`${await resolveBaseUrl()}/recommend`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  enhanceTemplate: (template: unknown, userProfile: UserProfile | null) =>
    post<EnhanceResponse>("/chat/enhance", { template, user_profile: userProfile }),
};
