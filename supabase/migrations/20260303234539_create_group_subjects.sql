-- C:\Users\edgar\Proyectos\plataforma-escolar-cfv\supabase\migrations\XXXXXXXXXXXX_create_group_subjects.sql

create extension if not exists "pgcrypto";

-- Tabla puente: materias asignadas a grupos
create table if not exists public.group_subjects (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, subject_id)
);

alter table public.group_subjects enable row level security;

-- Helper: validar compatibilidad subject <-> group
-- Regla:
-- - subject.program_id debe ser igual a group.program_id
-- - subject.term_id puede ser null (materia "global"), si no es null, debe ser igual a group.term_id
create or replace function public.subject_matches_group(_subject_id uuid, _group_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.subjects s
    join public.groups g on g.id = _group_id
    where s.id = _subject_id
      and s.program_id = g.program_id
      and (s.term_id is null or s.term_id = g.term_id)
  );
$$;

-- Trigger: impedir asignaciones inválidas
create or replace function public.trg_group_subjects_validate()
returns trigger
language plpgsql
as $$
begin
  if not public.subject_matches_group(new.subject_id, new.group_id) then
    raise exception 'La materia no pertenece a la misma carrera del grupo o no coincide el cuatrimestre.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_group_subjects_validate on public.group_subjects;
create trigger trg_group_subjects_validate
before insert or update on public.group_subjects
for each row
execute function public.trg_group_subjects_validate();

-- Policies
-- Lectura: cualquier usuario autenticado (para que en futuro teacher/student puedan leer)
drop policy if exists group_subjects_select_authenticated on public.group_subjects;
create policy group_subjects_select_authenticated
on public.group_subjects
for select
to authenticated
using (true);

-- Escritura: solo admin
drop policy if exists group_subjects_insert_admin on public.group_subjects;
create policy group_subjects_insert_admin
on public.group_subjects
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists group_subjects_update_admin on public.group_subjects;
create policy group_subjects_update_admin
on public.group_subjects
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists group_subjects_delete_admin on public.group_subjects;
create policy group_subjects_delete_admin
on public.group_subjects
for delete
to authenticated
using (public.is_admin(auth.uid()));