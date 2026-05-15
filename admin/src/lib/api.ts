/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000";

const ADMIN_KEY = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";

export type Report = {
  id: string;
  user_id: string;
  category: string;
  description?: string | null;
  image_url: string;
  status: string;
  urgency_score: number;
  address?: string | null;
  user_note?: string | null;
  location: { latitude: number; longitude: number };
  ward_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportUpdate = {
  id: string;
  report_id: string;
  author_id?: string | null;
  author_name?: string | null;
  author_role: string;
  status_to?: string | null;
  note?: string | null;
  created_at: string;
};

export type LevelInfo = {
  tier: number;
  name: string;
  min_xp: number;
  color: string;
  perks?: string | null;
};

export type AppConfig = {
  app_name: string;
  tagline: string;
  categories: { code: string; label: string; icon: string; color: string; description: string }[];
  levels: LevelInfo[];
  xp_rules: Record<string, number>;
};

export type AdminKpis = {
  total_reports: number;
  pending_review: number;
  in_progress: number;
  verified: number;
  resolved_24h: number;
  high_urgency: number;
  by_status: Record<string, number>;
  active_citizens: number;
};

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_KEY ? { "X-Admin-Key": ADMIN_KEY } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = body?.detail?.message || body?.detail || body?.message || res.statusText;
    throw new Error(typeof msg === "string" ? msg : `HTTP ${res.status}`);
  }
  return body as T;
}

export const adminApi = {
  config: () => adminFetch<AppConfig>("/api/v1/config/"),
  kpis: () => adminFetch<AdminKpis>("/api/v1/admin/kpis"),
  reports: (params: { status?: string; category?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.append(k, String(v)); });
    const qs = q.toString();
    return adminFetch<Report[]>(`/api/v1/admin/reports${qs ? `?${qs}` : ""}`);
  },
  report: (id: string) => adminFetch<Report>(`/api/v1/reports/${id}`),
  reportUpdates: (id: string) => adminFetch<ReportUpdate[]>(`/api/v1/reports/${id}/updates`),
  addUpdate: (id: string, body: { note?: string; status_to?: string; author_role?: string }) =>
    adminFetch<ReportUpdate>(`/api/v1/admin/reports/${id}/updates`, {
      method: "POST",
      body: JSON.stringify({ author_role: "authority", ...body }),
    }),
};

export { REPORT_STATUSES as STATUSES } from "./statuses";
