-- Add phone number to user profiles for onboarding.
alter table user_profiles add column if not exists phone text;
