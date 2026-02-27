-- supabase/migrations/20260225_0001_create_groups.sql

create extension if not exists "pgcrypto";

-- Helper: admin check (idempotente)
create or replace function public.is_admin(_uid uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _uid
      and p.role = 'admin'
  );
$$;

-- Helper: term pertenece a program
create or replace function public.term_belongs_to_program(_term_id uuid, _program_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.terms t
    where t.id = _term_id
      and t.program_id = _program_id
  );
$$;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  term_id uuid not null references public.terms(id) on delete restrict,
  code text not null,
  shift text not null,
  created_at timestamptz not null default now(),

  constraint groups_shift_check check (shift in ('matutino','vespertino','nocturno'))
);

-- Un grupo no se repite dentro del mismo cuatrimestre por turno
create unique index if not exists groups_unique_term_code_shift
on public.groups(term_id, code, shift);

create index if not exists groups_program_id_idx on public.groups(program_id);
create index if not exists groups_term_id_idx on public.groups(term_id);

-- Enforce: term_id debe ser del mismo program_id
create or replace function public.enforce_groups_term_program_match()
returns trigger
language plpgsql
as $$
begin
  if not public.term_belongs_to_program(new.term_id, new.program_id) then
    raise exception 'term_id % does not belong to program_id %', new.term_id, new.program_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_groups_term_program_match on public.groups;
create trigger trg_groups_term_program_match
before insert or update of program_id, term_id on public.groups
for each row
execute function public.enforce_groups_term_program_match();

alter table public.groups enable row level security;

-- Policies (idempotentes)
drop policy if exists "groups_select_authenticated" on public.groups;
create policy "groups_select_authenticated"
on public.groups
for select
to authenticated
using (true);

drop policy if exists "groups_insert_admin" on public.groups;
create policy "groups_insert_admin"
on public.groups
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_update_admin"
on public.groups
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "groups_delete_admin" on public.groups;
create policy "groups_delete_admin"
on public.groups
for delete
to authenticated
using (public.is_admin(auth.uid()));