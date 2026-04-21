-- Per-apartment LLM analysis (summary + pros/cons + things to verify).
-- Populated on demand by a server action that calls Claude.
alter table public.apartments
  add column ai_analysis jsonb,
  add column ai_analysis_at timestamptz;
