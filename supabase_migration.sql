-- ── openclaw-ui migration ────────────────────────────────────────────

-- Agents
create table if not exists agents (
  id            uuid        default gen_random_uuid() primary key,
  name          text        not null,
  model         text        default 'minimax-m2.5',
  system_prompt text        default '',
  status        text        default 'idle',
  flowise_chatflow_id text  default '',
  config        jsonb       default '{}',
  created_at    timestamptz default now()
);

-- Sessions (chat sessions / topics)
create table if not exists sessions (
  id         uuid        default gen_random_uuid() primary key,
  name       text,
  session_id text,
  user_id    text        default 'default',
  created_at timestamptz default now()
);

-- Agent workspace files (identity.md, soul.md, etc.)
create table if not exists agent_workspace (
  id         uuid        default gen_random_uuid() primary key,
  agent_id   uuid        references agents(id) on delete cascade,
  file_key   text        not null,
  content    text        default '',
  updated_at timestamptz default now(),
  unique(agent_id, file_key)
);

-- Disable RLS (development — enable & add policies before production)
alter table agents          disable row level security;
alter table sessions        disable row level security;
alter table agent_workspace disable row level security;

-- Done
select 'Migration complete ✓' as result;
