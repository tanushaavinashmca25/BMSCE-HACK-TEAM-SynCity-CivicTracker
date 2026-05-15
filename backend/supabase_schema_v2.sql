-- V2 schema additions: gamification, leaderboard, achievements
-- Run after supabase_schema.sql

-- Profile info (display name, avatar)
create table if not exists user_profiles (
    user_id uuid primary key references auth.users on delete cascade,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamptz default now()
);

-- Make sure user_stats has all the fields we need
alter table user_stats add column if not exists last_activity timestamptz default now();
alter table user_stats add column if not exists reports_submitted int not null default 0;
alter table user_stats add column if not exists reports_resolved int not null default 0;

-- Badges catalog
create table if not exists badges (
    code text primary key,
    name text not null,
    description text not null,
    icon text not null,        -- icon key the client maps to a Hugeicon
    color text not null,       -- hex color for display
    xp_reward int not null default 0,
    threshold int not null default 1, -- e.g. number of reports needed
    kind text not null,        -- 'reports' | 'resolved' | 'streak' | 'reputation' | 'level'
    sort_order int not null default 0
);

-- User awarded badges
create table if not exists user_badges (
    user_id uuid references auth.users on delete cascade,
    badge_code text references badges(code) on delete cascade,
    awarded_at timestamptz default now(),
    primary key (user_id, badge_code)
);

-- Activity feed (immutable log of XP-relevant events)
create table if not exists user_activity (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade,
    kind text not null,        -- 'report_submitted' | 'report_verified' | 'report_resolved' | 'badge_earned' | 'level_up'
    title text not null,
    detail text,
    xp_delta int not null default 0,
    ref_id uuid,               -- optional ref to report/badge
    created_at timestamptz default now()
);

create index if not exists user_activity_user_idx on user_activity(user_id, created_at desc);

-- Levels catalog (single source of truth, served to client)
create table if not exists levels (
    tier int primary key,
    name text not null,
    min_xp int not null,
    color text not null,
    perks text
);

insert into levels (tier, name, min_xp, color, perks) values
    (1, 'Junior Inspector', 0, '#94A3B8', 'Submit reports and earn your first XP.'),
    (2, 'Urban Scout', 100, '#0EA5E9', 'Unlock activity feed and badge tracking.'),
    (3, 'Civic Guardian', 500, '#10B981', 'Bonus XP on verified reports.'),
    (4, 'Urban Architect', 1500, '#F59E0B', 'Priority routing for your reports.'),
    (5, 'Civic Legend', 5000, '#EF4444', 'Featured on the city leaderboard.')
on conflict (tier) do update set
    name = excluded.name,
    min_xp = excluded.min_xp,
    color = excluded.color,
    perks = excluded.perks;

-- Seed badges
insert into badges (code, name, description, icon, color, xp_reward, threshold, kind, sort_order) values
    ('first_report', 'First Step', 'Submitted your first report.', 'sparkles', '#0EA5E9', 25, 1, 'reports', 1),
    ('reports_10', 'Eagle Eye', 'Submitted 10 reports.', 'eye', '#6366F1', 75, 10, 'reports', 2),
    ('reports_50', 'Civic Sentinel', 'Submitted 50 reports.', 'shield', '#0891B2', 150, 50, 'reports', 3),
    ('resolved_1', 'Problem Solver', 'Had a report resolved.', 'check', '#10B981', 50, 1, 'resolved', 4),
    ('resolved_10', 'Impact Maker', '10 reports resolved.', 'trophy', '#F59E0B', 200, 10, 'resolved', 5),
    ('streak_3', 'On a Roll', '3-day reporting streak.', 'flame', '#F97316', 50, 3, 'streak', 6),
    ('streak_7', 'Week Warrior', '7-day reporting streak.', 'flame', '#EF4444', 150, 7, 'streak', 7),
    ('rep_100', 'Trusted Voice', 'Earned 100 reputation.', 'star', '#FBBF24', 100, 100, 'reputation', 8)
on conflict (code) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    color = excluded.color,
    xp_reward = excluded.xp_reward,
    threshold = excluded.threshold,
    kind = excluded.kind,
    sort_order = excluded.sort_order;

-- Leaderboard RPC (joins user_stats + user_profiles + auth users)
create or replace function get_leaderboard(limit_n int default 50)
returns table (
    user_id uuid,
    display_name text,
    avatar_url text,
    xp_total int,
    reputation_score int,
    streak_count int,
    reports_submitted int,
    reports_resolved int,
    rank int
)
language plpgsql
as $$
begin
    return query
    select
        s.user_id,
        coalesce(p.display_name, split_part(u.email, '@', 1)) as display_name,
        p.avatar_url,
        s.xp_total,
        s.reputation_score,
        s.streak_count,
        s.reports_submitted,
        s.reports_resolved,
        (rank() over (order by s.xp_total desc, s.reputation_score desc))::int as rank
    from user_stats s
    left join user_profiles p on p.user_id = s.user_id
    left join auth.users u on u.id = s.user_id
    order by s.xp_total desc, s.reputation_score desc
    limit limit_n;
end;
$$;

-- User's rank lookup
create or replace function get_user_rank(target uuid)
returns int
language plpgsql
as $$
declare r int;
begin
    select rnk into r from (
        select user_id, rank() over (order by xp_total desc, reputation_score desc) as rnk
        from user_stats
    ) s where s.user_id = target;
    return coalesce(r, 0);
end;
$$;

-- Atomic XP/reputation increment + activity log
create or replace function award_xp(
    target uuid,
    delta_xp int,
    delta_rep int,
    kind text,
    title text,
    detail text,
    ref uuid
)
returns void
language plpgsql
as $$
begin
    insert into user_stats(user_id, xp_total, reputation_score)
    values (target, delta_xp, delta_rep)
    on conflict (user_id) do update set
        xp_total = user_stats.xp_total + delta_xp,
        reputation_score = user_stats.reputation_score + delta_rep,
        last_activity = now();

    insert into user_activity(user_id, kind, title, detail, xp_delta, ref_id)
    values (target, kind, title, detail, delta_xp, ref);
end;
$$;
