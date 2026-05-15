-- Report progress + comments
alter table reports add column if not exists user_note text;

create table if not exists report_updates (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references reports(id) on delete cascade not null,
    author_id uuid references auth.users on delete set null,
    author_name text,
    author_role text not null default 'citizen',  -- 'citizen' | 'authority' | 'system'
    status_to text,                                -- if a status change accompanies this update
    note text,
    created_at timestamptz default now()
);

create index if not exists report_updates_report_idx
    on report_updates(report_id, created_at desc);

-- Convenience RPC: returns updates joined with profile display_name
create or replace function get_report_updates(target uuid)
returns table (
    id uuid,
    report_id uuid,
    author_id uuid,
    author_name text,
    author_role text,
    status_to text,
    note text,
    created_at timestamptz
)
language sql
as $$
    select
        ru.id, ru.report_id, ru.author_id,
        coalesce(ru.author_name, p.display_name, split_part(u.email, '@', 1), 'Anonymous') as author_name,
        ru.author_role, ru.status_to, ru.note, ru.created_at
    from report_updates ru
    left join user_profiles p on p.user_id = ru.author_id
    left join auth.users u on u.id = ru.author_id
    where ru.report_id = target
    order by ru.created_at asc;
$$;
