import type {
  ActorProfile,
  BundleResponse,
  CampaignSummary,
  NovelSummary,
  OpenRouterStatus,
  StepResponse,
  ViewResponse
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";
const OPENROUTER_API_KEY_STORAGE_KEY = "opera.openrouter.apiKey";

export function getStoredOpenRouterApiKey(): string {
  return window.localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY) ?? "";
}

export function setStoredOpenRouterApiKey(value: string): void {
  const trimmed = value.trim();
  if (trimmed) {
    window.localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, trimmed);
    return;
  }
  window.localStorage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const openRouterApiKey = getStoredOpenRouterApiKey().trim();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(openRouterApiKey ? { "X-OpenRouter-API-Key": openRouterApiKey } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `請求失敗：${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getOpenRouterStatus: () => request<OpenRouterStatus>("/openrouter/status"),
  listNovels: () => request<NovelSummary[]>("/novels"),
  listCampaigns: () => request<CampaignSummary[]>("/campaigns"),
  createCampaign: (payload: Record<string, unknown>) =>
    request<BundleResponse>("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createCampaignFromNovel: (payload: Record<string, unknown>) =>
    request<BundleResponse>("/campaigns/from-novel", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getCampaign: (campaignId: string) =>
    request<BundleResponse>(`/campaigns/${campaignId}`),
  stepCampaign: (campaignId: string, payload: Record<string, unknown>) =>
    request<StepResponse>(`/campaigns/${campaignId}/run/step`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  postPlayerAction: (campaignId: string, payload: Record<string, unknown>) =>
    request(`/campaigns/${campaignId}/actions/player`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  postDirectorAction: (campaignId: string, payload: Record<string, unknown>) =>
    request(`/campaigns/${campaignId}/actions/director`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  postGMBrief: (campaignId: string, payload: Record<string, unknown>) =>
    request(`/campaigns/${campaignId}/director/gm-brief`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  postInjectedEvent: (campaignId: string, payload: Record<string, unknown>) =>
    request(`/campaigns/${campaignId}/director/inject-event`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getGMView: (campaignId: string) =>
    request<ViewResponse>(`/campaigns/${campaignId}/views/gm`),
  getDirectorView: (campaignId: string) =>
    request<ViewResponse>(`/campaigns/${campaignId}/views/director`),
  getAgentView: (campaignId: string, actorId: string) =>
    request<ViewResponse>(`/campaigns/${campaignId}/views/agent/${actorId}`),
  exportCampaign: (campaignId: string, format: string) =>
    request<{ format: string; content: string; payload: Record<string, unknown> }>(
      `/campaigns/${campaignId}/export?format=${format}`
    ),
  importCampaign: (campaignId: string, payload: Record<string, unknown>) =>
    request<BundleResponse>(`/campaigns/${campaignId}/import`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateActor: (
    campaignId: string,
    actorId: string,
    payload: Partial<Pick<ActorProfile, "name" | "role" | "persona" | "model_provider" | "model_name" | "temperature">>
  ) =>
    request<ActorProfile>(`/campaigns/${campaignId}/actors/${actorId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    })
};

export function streamUrl(campaignId: string): string {
  return `${API_BASE}/campaigns/${campaignId}/stream`;
}
