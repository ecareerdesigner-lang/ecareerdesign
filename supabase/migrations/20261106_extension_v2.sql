-- Browser extension v2: revocable/expiring connections and per-user daily usage limits.
-- Safe to run more than once. Run after the original extension tables exist.

alter table extension_tokens add column if not exists id uuid default gen_random_uuid();
alter table extension_tokens add column if not exists label text;
alter table extension_tokens add column if not exists last_used_at timestamptz;
alter table extension_tokens add column if not exists expires_at timestamptz;
update extension_tokens set id = gen_random_uuid() where id is null;
update extension_tokens set expires_at = created_at + interval '90 days' where expires_at is null;
create unique index if not exists extension_tokens_id_idx on extension_tokens (id);
create index if not exists extension_tokens_user_idx on extension_tokens (user_id);
create index if not exists extension_pair_codes_user_idx on extension_pair_codes (user_id);

create table if not exists extension_usage (
  user_id   uuid not null,
  day       date not null,
  matches   int  not null default 0,
  prepares  int  not null default 0,
  primary key (user_id, day)
);
alter table extension_usage enable row level security;

-- Atomically add one use for today. Returns the new count, or -1 if the daily limit was already reached.
create or replace function extension_bump_usage(p_user uuid, p_kind text, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'utc')::date;
  n int;
begin
  if p_kind not in ('matches', 'prepares') then
    raise exception 'bad kind';
  end if;
  insert into extension_usage (user_id, day) values (p_user, d) on conflict do nothing;
  if p_kind = 'matches' then
    update extension_usage set matches = matches + 1
      where user_id = p_user and day = d and matches < p_limit
      returning matches into n;
  else
    update extension_usage set prepares = prepares + 1
      where user_id = p_user and day = d and prepares < p_limit
      returning prepares into n;
  end if;
  if n is null then return -1; end if;
  return n;
end;
$$;

revoke all on function extension_bump_usage(uuid, text, int) from public, anon, authenticated;
grant execute on function extension_bump_usage(uuid, text, int) to service_role;
