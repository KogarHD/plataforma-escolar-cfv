begin;

alter table public.teacher_assignments enable row level security;
alter table public.enrollments enable row level security;
alter table public.profiles enable row level security;

drop policy if exists teacher_assignments_select_own on public.teacher_assignments;
create policy teacher_assignments_select_own
on public.teacher_assignments
for select
to authenticated
using (
  teacher_id = auth.uid()
);

drop policy if exists enrollments_select_teacher_groups on public.enrollments;
create policy enrollments_select_teacher_groups
on public.enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.teacher_assignments ta
    where ta.teacher_id = auth.uid()
      and ta.group_id = enrollments.group_id
  )
);

drop policy if exists profiles_select_students_in_teacher_groups on public.profiles;
create policy profiles_select_students_in_teacher_groups
on public.profiles
for select
to authenticated
using (
  role = 'student'
  and exists (
    select 1
    from public.enrollments e
    join public.teacher_assignments ta
      on ta.group_id = e.group_id
    where e.student_id = profiles.id
      and ta.teacher_id = auth.uid()
  )
);

commit;