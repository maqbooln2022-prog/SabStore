-- Closes gaps found in a security review after 002_staff_roles.sql:
--
-- 1. products/suppliers RLS only checked "is this caller a member of ANY
--    shop this owner runs" with NO permission check at all — a staff
--    member with zero permissions could edit/delete catalog data
--    belonging to shops they weren't even a member of. Fixed by scoping
--    to the specific shop(s) a product/supplier is actually linked to
--    (via shop_products/shop_suppliers) and requiring the matching
--    'inventory'/'suppliers' permission for writes.
-- 2. shop_members UPDATE/DELETE policies didn't protect the owner's own
--    row — callable directly via the REST API even though the app's own
--    API routes refuse it. Fixed by restricting both to role='staff'
--    rows only; nothing in the app needs to update/delete an owner row.
--
-- Run this in the Supabase SQL editor after 002_staff_roles.sql.

-- ---------- shop_members: never touch the owner row ----------
drop policy if exists "Owners can update shop members" on shop_members;
create policy "Owners can update staff members" on shop_members for update
  using (is_shop_owner(shop_id) and role = 'staff')
  with check (is_shop_owner(shop_id) and role = 'staff');

drop policy if exists "Owners can remove shop members" on shop_members;
create policy "Owners can remove staff members" on shop_members for delete
  using (is_shop_owner(shop_id) and role = 'staff');

-- ---------- products / suppliers: scope to the specific shop(s) linked ----------

-- Insert-time check only (the row doesn't exist yet, so it can't be
-- linked via shop_products/shop_suppliers yet) — broader by necessity,
-- but still requires the specific permission at some shop of this owner.
create or replace function owns_via_membership(target_owner_id uuid, required_permission text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_owner_id = auth.uid()
    or exists (
      select 1 from shops s
      join shop_members sm on sm.shop_id = s.id
      where s.owner_id = target_owner_id
        and sm.user_id = auth.uid()
        and (required_permission is null or sm.role = 'owner' or (sm.permissions->>required_permission)::boolean is true)
    );
$$;

create or replace function product_linked_to_member_shop(target_product_id uuid, required_permission text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from shop_products sp
    join shop_members sm on sm.shop_id = sp.shop_id
    where sp.product_id = target_product_id
      and sm.user_id = auth.uid()
      and (required_permission is null or sm.role = 'owner' or (sm.permissions->>required_permission)::boolean is true)
  );
$$;

create or replace function supplier_linked_to_member_shop(target_supplier_id uuid, required_permission text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from shop_suppliers ss
    join shop_members sm on sm.shop_id = ss.shop_id
    where ss.supplier_id = target_supplier_id
      and sm.user_id = auth.uid()
      and (required_permission is null or sm.role = 'owner' or (sm.permissions->>required_permission)::boolean is true)
  );
$$;

drop policy if exists "Members can view products" on products;
drop policy if exists "Members can insert products" on products;
drop policy if exists "Members can update products" on products;
drop policy if exists "Members can delete products" on products;

create policy "Members can view products" on products for select
  using (owner_id = auth.uid() or product_linked_to_member_shop(id));
create policy "Members with inventory permission can insert products" on products for insert
  with check (owns_via_membership(owner_id, 'inventory'));
create policy "Members with inventory permission can update products" on products for update
  using (owner_id = auth.uid() or product_linked_to_member_shop(id, 'inventory'))
  with check (owner_id = auth.uid() or product_linked_to_member_shop(id, 'inventory'));
create policy "Members with inventory permission can delete products" on products for delete
  using (owner_id = auth.uid() or product_linked_to_member_shop(id, 'inventory'));

drop policy if exists "Members can view suppliers" on suppliers;
drop policy if exists "Members with suppliers permission can insert" on suppliers;
drop policy if exists "Members with suppliers permission can update" on suppliers;
drop policy if exists "Members with suppliers permission can delete" on suppliers;

create policy "Members can view suppliers" on suppliers for select
  using (owner_id = auth.uid() or supplier_linked_to_member_shop(id));
create policy "Members with suppliers permission can insert" on suppliers for insert
  with check (owns_via_membership(owner_id, 'suppliers'));
create policy "Members with suppliers permission can update" on suppliers for update
  using (owner_id = auth.uid() or supplier_linked_to_member_shop(id, 'suppliers'))
  with check (owner_id = auth.uid() or supplier_linked_to_member_shop(id, 'suppliers'));
create policy "Members with suppliers permission can delete" on suppliers for delete
  using (owner_id = auth.uid() or supplier_linked_to_member_shop(id, 'suppliers'));
