-- Free tier usage limits.
-- Run this in the Supabase SQL editor BEFORE deploying the matching code.
--
-- 1. profiles.grandfathered: every account that exists when this runs is exempt from limits.
--    New sign-ups after this runs get the default (false) and are limited.
-- 2. usage_events: one row per counted AI action (user rows) or per public-tool call (ip rows).
-- 3. consume_usage / refund_usage / consume_anon: atomic check-and-increment, callable only by
--    the service role (the Next.js API routes), never by browsers.

alter table public.profiles add column if not exists grandfathered boolean not null default false;

-- Accounts with no profiles row yet (sign-up insert failed, etc.) get one, already grandfathered.
insert into public.profiles (id, is_premium, grandfathered)
select u.id, false, true
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Everyone who exists right now keeps unlimited access, exactly as before.
update public.profiles set grandfathered = true where grandfathered = false;

create table if not exists public.usage_events (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  ip_hash    text,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_action_idx on public.usage_events (user_id, action);
create index if not exists usage_events_ip_action_time_idx on public.usage_events (ip_hash, action, created_at);

-- RLS on with no policies: browsers cannot read or write it. The service role bypasses RLS.
alter table public.usage_events enable row level security;

-- Count + insert in one transaction, serialized per (user, action) so two quick clicks
-- cannot both squeeze under the limit.
create or replace function public.consume_usage(p_user uuid, p_action text, p_limit int)
returns table (allowed boolean, used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_action, 0));
  select count(*) into v_count from public.usage_events where user_id = p_user and action = p_action;
  if v_count >= p_limit then
    return query select false, v_count;
    return;
  end if;
  insert into public.usage_events (user_id, action) values (p_user, p_action);
  return query select true, v_count + 1;
end;
$$;

-- Give a unit back when the AI call itself failed (provider error, network), so an outage
-- never costs a free user one of their tries.
create or replace function public.refund_usage(p_user uuid, p_action text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.usage_events
  where id = (
    select id from public.usage_events
    where user_id = p_user and action = p_action
    order by id desc
    limit 1
  );
$$;

-- Per-IP guard for the open public tools (ATS checker, match tool, resume score).
create or replace function public.consume_anon(p_ip text, p_action text, p_limit int, p_window interval)
returns table (allowed boolean, used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_ip || ':' || p_action, 0));
  select count(*) into v_count from public.usage_events
    where ip_hash = p_ip and action = p_action and created_at > now() - p_window;
  if v_count >= p_limit then
    return query select false, v_count;
    return;
  end if;
  insert into public.usage_events (ip_hash, action) values (p_ip, p_action);
  return query select true, v_count + 1;
end;
$$;

revoke all on function public.consume_usage(uuid, text, int) from public, anon, authenticated;
revoke all on function public.refund_usage(uuid, text) from public, anon, authenticated;
revoke all on function public.consume_anon(text, text, int, interval) from public, anon, authenticated;
grant execute on function public.consume_usage(uuid, text, int) to service_role;
grant execute on function public.refund_usage(uuid, text) to service_role;
grant execute on function public.consume_anon(text, text, int, interval) to service_role;

-- Housekeeping: anonymous IP rows are only needed for the rate window.
-- (Optional) schedule: delete from public.usage_events where ip_hash is not null and created_at < now() - interval '2 days';
