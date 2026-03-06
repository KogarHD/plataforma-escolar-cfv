-- supabase/migrations/XXXXXXXXXXXX_create_teacher_assignments.sql

create extension if not exists "pgcrypto";

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (group_id, subject_id)
);

alter table public.teacher_assignments enable row level security;

-- Validación:
-- 1) subject debe existir en group_subjects (materia ya asignada al grupo)
-- 2) teacher_id debe tener role='teacher'
create or replace function public.trg_teacher_assignments_validate()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.group_subjects gs
    where gs.group_id = new.group_id
      and gs.subject_id = new.subject_id
  ) then
    raise exception 'La materia no está asignada a este grupo.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.teacher_id
      and p.role = 'teacher'
  ) then
    raise exception 'El usuario asignado no es profesor.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teacher_assignments_validate on public.teacher_assignments;
create trigger trg_teacher_assignments_validate
before insert or update on public.teacher_assignments
for each row
execute function public.trg_teacher_assignments_validate();

-- Policies
drop policy if exists teacher_assignments_select_authenticated on public.teacher_assignments;
create policy teacher_assignments_select_authenticated
on public.teacher_assignments
for select
to authenticated
using (true);

drop policy if exists teacher_assignments_insert_admin on public.teacher_assignments;
create policy teacher_assignments_insert_admin
on public.teacher_assignments
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists teacher_assignments_update_admin on public.teacher_assignments;
create policy teacher_assignments_update_admin
on public.teacher_assignments
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists teacher_assignments_delete_admin on public.teacher_assignments;
create policy teacher_assignments_delete_admin
on public.teacher_assignments
for delete
to authenticated
using (public.is_admin(auth.uid()));