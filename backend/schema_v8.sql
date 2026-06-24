-- PiyasaAI + MaçAI + Tuzak Radar v8 schema taslağı

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  symbol text,
  name text,
  asset_type text,
  market text,
  source text,
  created_at timestamptz default now()
);

create table if not exists market_signals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  alpha_score int,
  up_probability int,
  down_probability int,
  risk_level text,
  signal_type text,
  reasons jsonb,
  valid_until timestamptz,
  created_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  api_fixture_id bigint unique,
  league text,
  home_team text,
  away_team text,
  kickoff timestamptz,
  status text,
  score text,
  created_at timestamptz default now()
);

create table if not exists match_predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id),
  confidence int,
  home_probability int,
  draw_probability int,
  away_probability int,
  main_pick text,
  goals_pick text,
  btts_pick text,
  predicted_score text,
  risk_level text,
  reasons jsonb,
  created_at timestamptz default now()
);

create table if not exists trap_signals (
  id uuid primary key default gen_random_uuid(),
  target_type text check (target_type in ('market','match')),
  target_id uuid,
  trap_type text,
  crowd_score int,
  data_score int,
  trap_score int,
  risk_level text,
  crowd_view text,
  data_view text,
  if_then jsonb,
  created_at timestamptz default now()
);

create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  summary text,
  source text,
  impact_type text,
  impact_score int,
  related_target_type text,
  related_target_id uuid,
  created_at timestamptz default now()
);

create table if not exists weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date,
  week_end date,
  total_matches int,
  hit_count int,
  miss_count int,
  partial_count int,
  success_rate numeric,
  ai_summary text,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  device_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  panel text,
  expires_at timestamptz,
  credits int default 0,
  reward_provider text,
  reward_tx_id text,
  created_at timestamptz default now()
);

create table if not exists ad_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  panel text,
  reward_provider text,
  reward_tx_id text,
  verified boolean default false,
  credits_awarded int default 0,
  created_at timestamptz default now()
);
