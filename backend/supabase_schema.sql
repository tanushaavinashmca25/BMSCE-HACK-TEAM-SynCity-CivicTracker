-- Enable PostGIS
create extension if not exists postgis;

-- Wards table
create table if not exists wards (
    id uuid primary key default gen_random_uuid(),
    ward_name text not null,
    geom geography(polygon, 4326) not null,
    assigned_officer_id uuid references auth.users,
    created_at timestamptz default now()
);

-- Index for spatial queries on wards
create index if not exists wards_geom_idx on wards using gist(geom);

-- Contracts table
create table if not exists contracts (
    id uuid primary key default gen_random_uuid(),
    contractor_name text not null,
    road_segments geography(multilinestring, 4326),
    warranty_expiry timestamptz,
    created_at timestamptz default now()
);

-- Reports table
create table if not exists reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    category text not null,
    description text,
    image_url text not null,
    location jsonb not null, -- Stores {lat, lng} for backup
    geom geography(point, 4326) not null, -- PostGIS geometry
    status text not null default 'Reported',
    urgency_score int not null default 1,
    exif_data jsonb,
    address text,
    assigned_officer_id uuid,
    ward_id uuid references wards,
    contract_id uuid references contracts,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for spatial queries
create index if not exists reports_geom_idx on reports using gist(geom);

-- User Stats table (extending auth.users)
create table if not exists user_stats (
    user_id uuid primary key references auth.users,
    reputation_score int not null default 0,
    xp_total int not null default 0,
    streak_count int not null default 0,
    last_activity timestamptz default now()
);

-- Trigger to automatically assign ward based on location
create or replace function assign_report_ward()
returns trigger as $$
begin
    select id into new.ward_id
    from wards
    where st_contains(wards.geom::geometry, new.geom::geometry)
    limit 1;
    return new;
end;
$$ language plpgsql;

create trigger tr_assign_report_ward
before insert on reports
for each row execute function assign_report_ward();

-- Function to check for nearby reports (Deduplication)
create or replace function check_nearby_reports(
  lat double precision,
  lng double precision,
  radius_meters float,
  category_text text
)
returns table (
  id uuid,
  distance float
)
language plpgsql
as $$
begin
  return query
  select
    r.id,
    st_distance(
      r.geom,
      st_setsrid(st_point(lng, lat), 4326)::geography
    ) as distance
  from
    reports r
  where
    r.category = category_text
    and r.status != 'Resolved'
    and st_dwithin(
      r.geom,
      st_setsrid(st_point(lng, lat), 4326)::geography,
      radius_meters
    )
  order by
    distance asc
  limit 1;
end;
$$;

-- Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Function to get reports in radius
create or replace function get_reports_in_radius(
  lat double precision,
  lng double precision,
  radius_meters float
)
returns setof reports
language plpgsql
as $$
begin
  return query
  select *
  from reports
  where st_dwithin(
    geom,
    st_setsrid(st_point(lng, lat), 4326)::geography,
    radius_meters
  )
  order by st_distance(
    geom,
    st_setsrid(st_point(lng, lat), 4326)::geography
  ) asc;
end;
$$;

-- Clustering function for Issue Packets
create or replace function get_report_clusters(radius_meters float)
returns table (
  cluster_id int,
  report_ids uuid[],
  center geography
)
language plpgsql
as $$
begin
  return query
  with clustered as (
    select 
      id,
      geom,
      st_clusterdbscan(geom::geometry, radius_meters, 1) over() as cid
    from reports
    where status != 'Resolved'
  )
  select 
    cid as cluster_id,
    array_agg(id) as report_ids,
    st_centroid(st_collect(geom::geometry))::geography as center
  from clustered
  group by cid;
end;
$$;
