begin;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_teacher_id on public.tasks(teacher_id);
create index if not exists idx_tasks_group_id on public.tasks(group_id);
create index if not exists idx_tasks_subject_id on public.tasks(subject_id);
create index if not exists idx_tasks_created_at on public.tasks(created_at desc);

alter table public.tasks enable row level security;

drop policy if exists tasks_select_teacher_own on public.tasks;
create policy tasks_select_teacher_own
on public.tasks
for select
to authenticated
using (
  teacher_id = auth.uid()
);

drop policy if exists tasks_insert_teacher_own on public.tasks;
create policy tasks_insert_teacher_own
on public.tasks
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.teacher_assignments ta
    where ta.teacher_id = auth.uid()
      and ta.group_id = tasks.group_id
      and ta.subject_id = tasks.subject_id
  )
);

drop policy if exists tasks_update_teacher_own on public.tasks;
create policy tasks_update_teacher_own
on public.tasks
for update
to authenticated
using (
  teacher_id = auth.uid()
)
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.teacher_assignments ta
    where ta.teacher_id = auth.uid()
      and ta.group_id = tasks.group_id
      and ta.subject_id = tasks.subject_id
  )
);

drop policy if exists tasks_delete_teacher_own on public.tasks;
create policy tasks_delete_teacher_own
on public.tasks
for delete
to authenticated
using (
  teacher_id = auth.uid()
);

commit;