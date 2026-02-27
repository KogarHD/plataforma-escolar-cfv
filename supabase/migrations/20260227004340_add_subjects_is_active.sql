-- Add is_active to subjects (idempotent)

alter table public.subjects
  add column if not exists is_active boolean not null default true;