create table if not exists public.ingredient_usage (
  id bigint generated always as identity primary key,
  username text not null,
  ingredient_name text not null,
  ingredient_key text not null,
  used_at timestamptz not null default now()
);

create index if not exists ingredient_usage_username_used_at_idx
  on public.ingredient_usage (username, used_at desc);

alter table public.ingredient_usage disable row level security;
