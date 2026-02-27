-- Fix: trigger/groups validation must bypass RLS on terms
-- Make helper function SECURITY DEFINER + row_security off

create or replace function public.term_belongs_to_program(_term_id uuid, _program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.terms t
    where t.id = _term_id
      and t.program_id = _program_id
  );
$$;

-- If your trigger function exists, recreate it to call the helper.
-- (Adjust the name here ONLY if your function is different; most likely it is this.)
create or replace function public.groups_term_program_match()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if not public.term_belongs_to_program(new.term_id, new.program_id) then
    raise exception 'term_id no pertenece al program_id';
  end if;
  return new;
end;
$$;

-- Ensure trigger exists (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_groups_term_program_match'
  ) then
    create trigger trg_groups_term_program_match
    before insert or update on public.groups
    for each row execute function public.groups_term_program_match();
  end if;
end $$;

-- Lock down function execution (optional but recommended)
revoke all on function public.term_belongs_to_program(uuid, uuid) from public;
revoke all on function public.groups_term_program_match() from public;
grant execute on function public.term_belongs_to_program(uuid, uuid) to authenticated;
grant execute on function public.groups_term_program_match() to authenticated;