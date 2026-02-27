-- supabase/migrations/20260226235345_groups_modality.sql
-- shift -> modality (online/presencial) + normalización segura

do $$
begin
  -- Si existe shift y no existe modality, renombra
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'groups'
      and column_name = 'shift'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'groups'
      and column_name = 'modality'
  ) then
    alter table public.groups rename column shift to modality;
  end if;

  -- Si por alguna razón no existe modality, créala (fallback)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'groups'
      and column_name = 'modality'
  ) then
    alter table public.groups add column modality text;
  end if;
end $$;

-- Normaliza valores existentes:
-- - online/presencial: fuerza lowercase/trim
-- - cualquier otro valor (matutino/vespertino/nocturno/lo que sea): presencial
-- - si viene null: presencial (porque antes era NOT NULL como shift)
update public.groups
set modality =
  case
    when modality is null then 'presencial'
    when lower(trim(modality)) in ('online','presencial') then lower(trim(modality))
    else 'presencial'
  end;

-- Constraints
alter table public.groups
  drop constraint if exists groups_shift_check;

alter table public.groups
  drop constraint if exists groups_modality_check;

alter table public.groups
  add constraint groups_modality_check check (modality in ('online','presencial'));

-- Uniques / indexes
drop index if exists public.groups_unique_term_code_shift;
drop index if exists public.groups_unique_term_code_modality;

create unique index if not exists groups_unique_term_code_modality
on public.groups(term_id, code, modality);