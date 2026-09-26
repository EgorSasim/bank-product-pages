-- Витрина: страницы, продукты, блоки, вход только для отправки анкеты.
-- Список видов в check (category) совпадает с productCategories в packages/contract.

create table pages (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  published boolean not null default false,
  check (length(trim(slug)) > 0),
  check (length(trim(title)) > 0)
);

create table products (
  id uuid primary key,
  slug text not null unique,
  category text not null,
  title text not null,
  summary text not null,
  highlight text not null,
  terms jsonb not null,
  page_id uuid not null unique references pages (id) on delete restrict,
  home_position integer,
  published boolean not null default false,
  check (category in ('card', 'loan', 'leasing', 'installment', 'deposit')),
  check ((terms ->> 'category') = category),
  check (home_position is null or home_position > 0),
  check (length(trim(slug)) > 0),
  check (length(trim(highlight)) > 0)
);

create unique index products_home_position_unique
  on products (home_position)
  where home_position is not null;

create table blocks (
  id uuid primary key,
  page_id uuid not null references pages (id) on delete cascade,
  position integer not null,
  type text not null,
  props jsonb not null,
  unique (page_id, position),
  check (position >= 0),
  check (length(trim(type)) > 0)
);

create table block_variants (
  block_id uuid not null references blocks (id) on delete cascade,
  segment text not null,
  props jsonb not null,
  primary key (block_id, segment),
  check (segment in ('salary', 'premium')),
  check (length(trim(segment)) > 0)
);

create table users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  check (length(trim(email)) > 0),
  check (length(password_hash) > 0)
);

create table sessions (
  id uuid primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key,
  block_id uuid not null references blocks (id) on delete restrict,
  user_id uuid not null references users (id) on delete restrict,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
