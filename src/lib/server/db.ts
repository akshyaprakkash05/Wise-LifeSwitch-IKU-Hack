import { Pool } from "pg";

/**
 * Postgres on Tiger Data. Server-side only.
 * Tables are created on first use, so a fresh database needs no setup step.
 */

// One pool per server process. Kept on globalThis because Next.js dev loads each
// API route separately (and re-loads on every edit), which would otherwise open new pools.
const g = globalThis as typeof globalThis & { __lsPool?: Pool; __lsSchema?: Promise<void> | null };

export class NoDatabaseError extends Error {}

function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new NoDatabaseError("DATABASE_URL is not set.");
  g.__lsPool ??= new Pool({
    connectionString: url,
    ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
    idleTimeoutMillis: 30_000,
  });
  return g.__lsPool;
}

const SCHEMA = `
create table if not exists circles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  name text not null,
  relation text not null,
  sharing boolean not null default true,
  last_place text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists circle_activities (
  id bigserial primary key,
  circle_id uuid not null references circles(id) on delete cascade,
  member_id uuid references circle_members(id) on delete set null,
  kind text not null,
  text text not null,
  at timestamptz not null default now()
);
create table if not exists circle_messages (
  id bigserial primary key,
  circle_id uuid not null references circles(id) on delete cascade,
  member_id uuid references circle_members(id) on delete set null,
  body text not null,
  at timestamptz not null default now()
);
create table if not exists splits (
  id uuid primary key default gen_random_uuid(),
  circle_code text,
  merchant text not null,
  currency text not null,
  payer text not null,
  receipt jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists split_shares (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null references splits(id) on delete cascade,
  person text not null,
  amount_minor integer not null,
  items jsonb not null default '[]',
  status text not null default 'unpaid',
  method text,
  payment_intent text unique,
  paid_at timestamptz
);
create index if not exists split_shares_split_idx on split_shares (split_id);
create index if not exists circle_activities_circle_idx on circle_activities (circle_id, id);
create index if not exists circle_messages_circle_idx on circle_messages (circle_id, id);
`;

export async function db() {
  const p = getPool();
  g.__lsSchema ??= p.query(SCHEMA).then(() => undefined).catch((err) => {
    g.__lsSchema = null;
    throw err;
  });
  await g.__lsSchema;
  return p;
}
