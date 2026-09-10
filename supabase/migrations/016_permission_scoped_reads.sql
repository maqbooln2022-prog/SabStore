-- Previously these five tables let ANY shop member read them regardless
-- of granted module permission — only INSERT/UPDATE/DELETE were gated
-- with has_shop_permission(). SELECT used the weaker is_shop_member(),
-- meaning a staff account with e.g. only "billing" enabled could call
-- supabase.from('expenses').select('*') directly (bypassing the UI,
-- which only hides those tabs client-side via ModuleGuard) and read
-- the shop's udhaar, cash draws, day-close reconciliations, and
-- expenses. has_shop_permission() already returns true for role='owner'
-- regardless of module, so this changes nothing for shop owners.

drop policy if exists "Members can view credits" on credits;
create policy "Members with credit permission can view credits" on credits for select
  using (has_shop_permission(shop_id, 'credit'));

drop policy if exists "Members can view reconciliations" on reconciliations;
create policy "Members with dayclose permission can view reconciliations" on reconciliations for select
  using (has_shop_permission(shop_id, 'dayclose'));

drop policy if exists "Members can view draws" on draws;
create policy "Members with dayclose permission can view draws" on draws for select
  using (has_shop_permission(shop_id, 'dayclose'));

drop policy if exists "Members can view expenses" on expenses;
create policy "Members with expenses permission can view expenses" on expenses for select
  using (has_shop_permission(shop_id, 'expenses'));

drop policy if exists "Members can view fixed_expenses" on fixed_expenses;
create policy "Members with expenses permission can view fixed_expenses" on fixed_expenses for select
  using (has_shop_permission(shop_id, 'expenses'));
