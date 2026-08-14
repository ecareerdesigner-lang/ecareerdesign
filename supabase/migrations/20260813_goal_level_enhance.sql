-- Adds per-goal AI enhancement fields, alongside the existing overall
-- accomplishments_enhanced on performance_reviews.
alter table performance_goals
  add column if not exists enhanced_summary text default '',
  add column if not exists elements_demonstrated text[] default '{}';
