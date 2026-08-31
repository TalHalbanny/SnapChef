create table if not exists public.saved_recipes (
  id bigint generated always as identity primary key,
  username text not null,
  recipe_title text not null,
  recipe_description text not null default '',
  prep_time text not null default '',
  servings int not null default 1,
  steps jsonb not null default '[]'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  chosen_at timestamptz not null default now()
);

create index if not exists saved_recipes_username_chosen_at_idx
  on public.saved_recipes (username, chosen_at desc);

alter table public.saved_recipes disable row level security;
