-- One-click unsubscribe for the nurture emails.
-- unsubscribe_token is the secret in each email's unsubscribe link; existing
-- rows are backfilled with a random value when the column is added.
alter table email_nurture_leads
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists email_nurture_leads_unsubscribe_token_idx
  on email_nurture_leads (unsubscribe_token);
