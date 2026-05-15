-- Explicit onboarding marker. Users who already had a profile when this
-- migration ran are grandfathered in so logging back in doesn't bounce them
-- through the onboarding screen.
alter table user_profiles add column if not exists onboarded_at timestamptz;

update user_profiles
set onboarded_at = coalesce(onboarded_at, created_at, now())
where onboarded_at is null;
