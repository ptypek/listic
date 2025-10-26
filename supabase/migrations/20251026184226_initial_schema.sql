-- migration: 20251026184226_initial_schema.sql
-- description: sets up the initial database schema for the listic application.
-- tables created: categories, popular_products, shopping_lists, list_items, ai_feedback_log
-- policies: enables rls and defines access policies for all tables.
-- triggers: adds triggers to automatically update the updated_at timestamp.

--
-- create categories table
-- a static lookup table for predefined product categories.
--
create table public.categories (
  id smallint primary key,
  name text not null unique
);

--
-- populate categories table
-- insert the initial set of categories.
--
insert into public.categories (id, name) values
(1, 'nabiał'),
(2, 'warzywa'),
(3, 'mięso'),
(4, 'suche'),
(5, 'owoce'),
(6, 'ryby'),
(7, 'przyprawy'),
(8, 'inne');

--
-- create popular_products table
-- a static lookup table to support the autocomplete feature with popular products.
--
create table public.popular_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id smallint not null references public.categories(id)
);

--
-- create shopping_lists table
-- stores shopping lists created by users.
--
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--
-- create item_source enum type
-- defines the source of a list item, either 'ai' or 'manual'.
--
create type public.item_source as enum ('ai', 'manual');

--
-- create list_items table
-- stores individual items within a shopping list.
--
create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  category_id smallint not null references public.categories(id),
  name text not null,
  quantity numeric(10, 2) not null default 1,
  unit text not null default 'szt',
  is_checked boolean not null default false,
  source item_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--
-- create ai_feedback_log table
-- logs "incorrect ingredient" submissions from users for ai-generated items.
--
create table public.ai_feedback_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  list_item_id uuid references public.list_items(id) on delete set null,
  created_at timestamptz not null default now()
);

--
-- create indexes
-- add indexes on foreign keys to optimize query performance.
--
create index idx_shopping_lists_user_id on public.shopping_lists(user_id);
create index idx_list_items_list_id on public.list_items(list_id);
create index idx_list_items_category_id on public.list_items(category_id);
create index idx_popular_products_category_id on public.popular_products(category_id);
create index idx_ai_feedback_log_user_id on public.ai_feedback_log(user_id);
create index idx_ai_feedback_log_list_item_id on public.ai_feedback_log(list_item_id);

--
-- create function to update timestamp
-- this function is used by triggers to set the updated_at column to the current time.
--
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

--
-- create trigger for shopping_lists
-- automatically updates the updated_at timestamp on shopping_list updates.
--
create trigger set_timestamp_shopping_lists
before update on public.shopping_lists
for each row
execute procedure public.trigger_set_timestamp();

--
-- create trigger for list_items
-- automatically updates the updated_at timestamp on list_item updates.
--
create trigger set_timestamp_list_items
before update on public.list_items
for each row
execute procedure public.trigger_set_timestamp();

--
-- enable row level security (rls)
-- activate rls for all user-data tables to enforce access control.
--
alter table public.categories enable row level security;
alter table public.popular_products enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.list_items enable row level security;
alter table public.ai_feedback_log enable row level security;

--
-- rls policies for categories table
-- categories are public and read-only for all users.
--
create policy "allow all users to read categories"
  on public.categories for select
  using (true);

--
-- rls policies for popular_products table
-- popular products are public and read-only for all users.
--
create policy "allow all users to read popular products"
  on public.popular_products for select
  using (true);

--
-- rls policies for shopping_lists table
-- users can manage their own shopping lists.
--
create policy "authenticated users can view their own shopping lists"
  on public.shopping_lists for select
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated users can create shopping lists"
  on public.shopping_lists for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "authenticated users can update their own shopping lists"
  on public.shopping_lists for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "authenticated users can delete their own shopping lists"
  on public.shopping_lists for delete
  to authenticated
  using (auth.uid() = user_id);

--
-- rls policies for list_items table
-- users can manage items on their own shopping lists.
--
create policy "authenticated users can view items on their own lists"
  on public.list_items for select
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists
      where id = list_id and user_id = auth.uid()
    )
  );

create policy "authenticated users can add items to their own lists"
  on public.list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shopping_lists
      where id = list_id and user_id = auth.uid()
    )
  );

create policy "authenticated users can update items on their own lists"
  on public.list_items for update
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists
      where id = list_id and user_id = auth.uid()
    )
  );

create policy "authenticated users can delete items from their own lists"
  on public.list_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists
      where id = list_id and user_id = auth.uid()
    )
  );

--
-- rls policies for ai_feedback_log table
-- users can create and view their own feedback logs.
--
create policy "authenticated users can view their own feedback"
  on public.ai_feedback_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated users can create feedback"
  on public.ai_feedback_log for insert
  to authenticated
  with check (auth.uid() = user_id);
