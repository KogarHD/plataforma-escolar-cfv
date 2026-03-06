-- C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\supabase\migrations\XXXXXXXXXXXX_create_enrollments.sql

create extension if not exists "pgcrypto";

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, student_id)
);

alter table public.enrollments enable row level security;

-- Validar que el perfil inscrito realmente sea student
create or replace function public.trg_enrollments_validate()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.student_id
      and p.role = 'student'
  ) then
    raise exception 'El usuario seleccionado no es un alumno.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enrollments_validate on public.enrollments;
create trigger trg_enrollments_validate
before insert or update on public.enrollments
for each row
execute function public.trg_enrollments_validate();

-- Policies
drop policy if exists enrollments_select_authenticated on public.enrollments;
create policy enrollments_select_authenticated
on public.enrollments
for select
to authenticated
using (true);

drop policy if exists enrollments_insert_admin on public.enrollments;
create policy enrollments_insert_admin
on public.enrollments
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists enrollments_update_admin on public.enrollments;
create policy enrollments_update_admin
on public.enrollments
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists enrollments_delete_admin on public.enrollments;
create policy enrollments_delete_admin
on public.enrollments
for delete
to authenticated
using (public.is_admin(auth.uid()));