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
