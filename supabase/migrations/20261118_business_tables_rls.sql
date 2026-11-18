-- Run AFTER the Business Center auth change is deployed (routes use the service role key).
-- RLS on with no policies = anon/public key can't read or write; service role still can.
alter table public.tasks        enable row level security;
alter table public.time_entries enable row level security;
alter table public.employees    enable row level security;
alter table public.expenses     enable row level security;
alter table public.revenue      enable row level security;
alter table public.documents    enable row level security;
alter table public.projects     enable row level security;
alter table public.ai_usage     enable row level security;
