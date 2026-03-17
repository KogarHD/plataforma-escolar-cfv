begin;

create or replace function public.is_teacher(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _user_id
      and p.role = 'teacher'
  );
$$;

grant execute on function public.is_teacher(uuid) to authenticated;

commit;