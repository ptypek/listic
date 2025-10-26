--
-- disable row level security (rls)
--
alter table public.categories disable row level security;
alter table public.popular_products disable row level security;
alter table public.shopping_lists disable row level security;
alter table public.list_items disable row level security;
alter table public.ai_feedback_log disable row level security;

--
-- drop rls policies for categories table
--
drop policy if exists "allow all users to read categories" on public.categories;

--
-- drop rls policies for popular_products table
--
drop policy if exists "allow all users to read popular products" on public.popular_products;

--
-- drop rls policies for shopping_lists table
--
drop policy if exists "authenticated users can view their own shopping lists" on public.shopping_lists;
drop policy if exists "authenticated users can create shopping lists" on public.shopping_lists;
drop policy if exists "authenticated users can update their own shopping lists" on public.shopping_lists;
drop policy if exists "authenticated users can delete their own shopping lists" on public.shopping_lists;

--
-- drop rls policies for list_items table
--
drop policy if exists "authenticated users can view items on their own lists" on public.list_items;
drop policy if exists "authenticated users can add items to their own lists" on public.list_items;
drop policy if exists "authenticated users can update items on their own lists" on public.list_items;
drop policy if exists "authenticated users can delete items from their own lists" on public.list_items;

--
-- drop rls policies for ai_feedback_log table
--
drop policy if exists "authenticated users can view their own feedback" on public.ai_feedback_log;
drop policy if exists "authenticated users can create feedback" on public.ai_feedback_log;
