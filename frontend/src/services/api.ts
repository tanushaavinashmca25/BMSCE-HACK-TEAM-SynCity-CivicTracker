import { supabase } from './supabase';
import type {
  AppConfig, UserProfile, LeaderboardEntry, Badge, ActivityItem, Report, ReportUpdate,
  WardReports,
} from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, 'EXPO_PUBLIC_API_URL is not configured.');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch (e: any) {
    throw new ApiError(
      0,
      `Network error: ${e?.message || 'unable to reach API'} (${API_URL}${path})`,
      e,
    );
  }

  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = body?.detail?.message || body?.detail || body?.message || res.statusText;
    throw new ApiError(res.status, typeof msg === 'string' ? msg : 'Request failed', body);
  }
  return body as T;
}

export const api = {
  config: () => request<AppConfig>('/api/v1/config/'),
  me: () => request<UserProfile>('/api/v1/users/me'),
  completeOnboarding: (body: { display_name: string; phone: string }) =>
    request<UserProfile>('/api/v1/users/onboarding', { method: 'POST', body: JSON.stringify(body) }),
  updateMe: (patch: { display_name?: string; bio?: string; avatar_url?: string }) =>
    request<UserProfile>('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify(patch) }),
  leaderboard: (limit = 50) => request<LeaderboardEntry[]>(`/api/v1/users/leaderboard?limit=${limit}`),
  achievements: () => request<Badge[]>('/api/v1/users/me/achievements'),
  activity: (limit = 50) => request<ActivityItem[]>(`/api/v1/users/me/activity?limit=${limit}`),
  myReports: (limit = 50) => request<Report[]>(`/api/v1/reports/me?limit=${limit}`),
  wardReports: (lat: number, lng: number, radius = 2000) =>
    request<WardReports>(`/api/v1/reports/ward?lat=${lat}&lng=${lng}&radius_meters=${radius}`),
  reports: (params: { lat?: number; lng?: number; radius?: number; category?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) q.append(k, String(v)); });
    const qs = q.toString();
    return request<Report[]>(`/api/v1/reports/${qs ? `?${qs}` : ''}`);
  },
  createReport: (body: any, opts: { force?: boolean } = {}) =>
    request<Report>(
      `/api/v1/reports/${opts.force ? '?force=true' : ''}`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  getReport: (id: string) => request<Report>(`/api/v1/reports/${id}`),
  reportUpdates: (id: string) => request<ReportUpdate[]>(`/api/v1/reports/${id}/updates`),
  addReportComment: (id: string, note: string) =>
    request<ReportUpdate>(`/api/v1/reports/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify({ note, author_role: 'citizen' }),
    }),
};

export { ApiError };
