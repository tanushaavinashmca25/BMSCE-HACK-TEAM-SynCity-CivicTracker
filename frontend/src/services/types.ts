export type LevelInfo = {
  tier: number;
  name: string;
  min_xp: number;
  color: string;
  perks?: string | null;
};

export type UserStats = {
  reputation_score: number;
  xp_total: number;
  streak_count: number;
  reports_submitted: number;
  reports_resolved: number;
  level: LevelInfo;
  next_level?: LevelInfo | null;
  progress_to_next: number;
  rank: number;
};

export type UserProfile = {
  id: string;
  email: string;
  display_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  onboarding_complete: boolean;
  stats: UserStats;
};

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  xp_total: number;
  reputation_score: number;
  streak_count: number;
  reports_submitted: number;
  reports_resolved: number;
  rank: number;
  level: LevelInfo;
};

export type Badge = {
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  xp_reward: number;
  threshold: number;
  kind: string;
  awarded: boolean;
  awarded_at?: string | null;
  progress: number;
};

export type ActivityItem = {
  id: string;
  kind: string;
  title: string;
  detail?: string | null;
  xp_delta: number;
  ref_id?: string | null;
  created_at: string;
};

export type CategoryInfo = {
  code: string;
  label: string;
  icon: string;
  color: string;
  description: string;
};

export type AppConfig = {
  app_name: string;
  tagline: string;
  categories: CategoryInfo[];
  levels: LevelInfo[];
  xp_rules: Record<string, number>;
};

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
  created_at: string;
  updated_at: string;
};

export type WardReports = {
  ward: { id: string; ward_name?: string } | null;
  reports: Report[];
  fallback: boolean;
};

export type ReportUpdate = {
  id: string;
  report_id: string;
  author_id?: string | null;
  author_name?: string | null;
  author_role: string;          // 'citizen' | 'authority' | 'system'
  status_to?: string | null;
  note?: string | null;
  created_at: string;
};
