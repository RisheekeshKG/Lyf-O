import type { ChatResponse, EnhanceResponse, RecommendResponse, UserProfile } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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
    const res = await fetch(`${BASE_URL}/recommend`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  enhanceTemplate: (template: unknown, userProfile: UserProfile | null) =>
    post<EnhanceResponse>("/chat/enhance", { template, user_profile: userProfile }),
};
