begin;

alter table public.tasks
  add column if not exists description text not null default '',
  add column if not exists due_date timestamptz null,
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_tasks_created_at on public.tasks(created_at desc);

commit;