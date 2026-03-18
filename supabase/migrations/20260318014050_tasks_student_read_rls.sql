begin;

drop policy if exists tasks_select_student_group on public.tasks;
create policy tasks_select_student_group
on public.tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    where e.student_id = auth.uid()
      and e.group_id = tasks.group_id
  )
);

commit;