begin;

alter table public.task_submissions
  add column if not exists grade numeric(5,2) null,
  add column if not exists graded_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'task_submissions_grade_range'
  ) then
    alter table public.task_submissions
      add constraint task_submissions_grade_range
      check (grade is null or (grade >= 0 and grade <= 100));
  end if;
end
$$;

commit;