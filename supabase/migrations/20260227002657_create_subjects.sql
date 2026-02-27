-- Subjects (Materias)
create extension if not exists "pgcrypto";

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  term_id uuid references public.terms(id) on delete set null,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- term_id (si existe) debe pertenecer al mismo program_id
create or replace function public.subject_term_program_match(_term_id uuid, _program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select _term_id is null or exists (
    select 1
    from public.terms t
    where t.id = _term_id
      and t.program_id = _program_id
  );
$$;

create or replace function public.subjects_term_program_match_trg()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if not public.subject_term_program_match(new.term_id, new.program_id) then
    raise exception 'term_id no pertenece al program_id';
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_subjects_term_program_match'
  ) then
    create trigger trg_subjects_term_program_match
    before insert or update on public.subjects
    for each row execute function public.subjects_term_program_match_trg();
  end if;
end $$;

alter table public.subjects enable row level security;

-- Policies
alter table public.subjects enable row level security;

-- Helpers inline (sin is_admin para evitar ambigüedad)
-- SELECT: cualquier autenticado
drop policy if exists subjects_select_authenticated on public.subjects;
create policy subjects_select_authenticated
on public.subjects
for select
to authenticated
using (true);

-- INSERT: solo admin
drop policy if exists subjects_insert_admin on public.subjects;
create policy subjects_insert_admin
on public.subjects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- UPDATE: solo admin
drop policy if exists subjects_update_admin on public.subjects;
create policy subjects_update_admin
on public.subjects
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- DELETE: solo admin
drop policy if exists subjects_delete_admin on public.subjects;
create policy subjects_delete_admin
on public.subjects
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);