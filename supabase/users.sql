create table if not exists public.users (
  id bigint generated always as identity primary key,
  username text not null unique,
  email text not null unique,
  password text not null
);

alter table public.users disable row level security;

insert into public.users (username, email, password)
values ('admin', 'admin@snapchef.app', 'admin')
on conflict (username) do nothing;
