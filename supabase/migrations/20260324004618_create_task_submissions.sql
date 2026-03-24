begin;

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_submissions_task_student_unique unique (task_id, student_id)
);

create index if not exists idx_task_submissions_task_id
  on public.task_submissions(task_id);

create index if not exists idx_task_submissions_student_id
  on public.task_submissions(student_id);

create index if not exists idx_task_submissions_submitted_at
  on public.task_submissions(submitted_at desc);

alter table public.task_submissions enable row level security;

drop policy if exists task_submissions_select_student_own on public.task_submissions;
create policy task_submissions_select_student_own
on public.task_submissions
for select
to authenticated
using (
  student_id = auth.uid()
);

drop policy if exists task_submissions_insert_student_own on public.task_submissions;
create policy task_submissions_insert_student_own
on public.task_submissions
for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.tasks t
    join public.enrollments e
      on e.group_id = t.group_id
    where t.id = task_submissions.task_id
      and e.student_id = auth.uid()
  )
);

drop policy if exists task_submissions_update_student_own on public.task_submissions;
create policy task_submissions_update_student_own
on public.task_submissions
for update
to authenticated
using (
  student_id = auth.uid()
)
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.tasks t
    join public.enrollments e
      on e.group_id = t.group_id
    where t.id = task_submissions.task_id
      and e.student_id = auth.uid()
  )
);

drop policy if exists task_submissions_delete_student_own on public.task_submissions;
create policy task_submissions_delete_student_own
on public.task_submissions
for delete
to authenticated
using (
  student_id = auth.uid()
);

drop policy if exists task_submissions_select_teacher_task_owner on public.task_submissions;
create policy task_submissions_select_teacher_task_owner
on public.task_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_submissions.task_id
      and t.teacher_id = auth.uid()
  )
);

commit;