begin;

alter table public.task_submissions
  add column if not exists feedback text not null default '',
  add column if not exists reviewed_at timestamptz null;

drop policy if exists task_submissions_update_teacher_task_owner on public.task_submissions;
create policy task_submissions_update_teacher_task_owner
on public.task_submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_submissions.task_id
      and t.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    where t.id = task_submissions.task_id
      and t.teacher_id = auth.uid()
  )
);

commit;