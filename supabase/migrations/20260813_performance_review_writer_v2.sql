-- Performance Review Writer (premium feature)
-- Matches the app's REAL identity model: no Supabase Auth sessions, just an
-- anonymous UUID generated client-side and trusted (same pattern already
-- used by profiles.id / create-checkout-session / stripe-webhook).
--
-- Run this in the Supabase SQL editor for the ecareerdesigner-lang project.

create table if not exists performance_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                -- matches profiles.id, NOT auth.uid()
  review_period text not null check (review_period in ('mid_year','end_of_year','end_of_position')),
  title text,
  accomplishments_raw text default '',
  accomplishments_enhanced text default '',
  elements_demonstrated text[] default '{}',
  status text not null default 'draft' check (status in ('draft','complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists performance_goals (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references performance_reviews(id) on delete cascade not null,
  goal_text text not null default '',
  summary_text text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists performance_goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references performance_goals(id) on delete cascade not null,
  task_text text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_perf_reviews_user_id on performance_reviews(user_id);
create index if not exists idx_perf_goals_review_id on performance_goals(review_id);
create index if not exists idx_perf_tasks_goal_id on performance_goal_tasks(goal_id);

create or replace function set_perf_review_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_perf_review_updated_at on performance_reviews;
create trigger trg_perf_review_updated_at
  before update on performance_reviews
  for each row execute function set_perf_review_updated_at();

-- RLS: matches the app's real pattern. There's no auth.uid() to check
-- against (no login), so — same as your other anon-key tables — access
-- control happens in the API route (it checks profiles.is_premium /
-- premium_until for the user_id the client sends) rather than in Postgres.
-- The policy below just allows the anon key to operate; the API layer is
-- the actual gate. If you'd rather enforce this at the DB layer too, that
-- would require adding real Supabase Auth, which is a bigger change than
-- this feature — flagging it, not doing it silently.
alter table performance_reviews enable row level security;
alter table performance_goals enable row level security;
alter table performance_goal_tasks enable row level security;

drop policy if exists "anon key access" on performance_reviews;
create policy "anon key access" on performance_reviews
  for all using (true) with check (true);

drop policy if exists "anon key access" on performance_goals;
create policy "anon key access" on performance_goals
  for all using (true) with check (true);

drop policy if exists "anon key access" on performance_goal_tasks;
create policy "anon key access" on performance_goal_tasks
  for all using (true) with check (true);
