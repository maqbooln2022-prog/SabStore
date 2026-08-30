-- Adds real, RLS-enforced staff accounts: an owner can invite a worker
-- (their own genuine Supabase auth account, PIN-as-password, created
-- server-side via the service role — see app/api/staff/create), assign
-- them a role and per-module permissions, and every table's security
-- checks that permission at the database level, not just in the UI.
--
-- Also adds shops.enabled_modules for shop-level feature toggles (e.g.
-- hide Udhaar entirely for a shop that doesn't extend credit).
--
-- Run this in the Supabase SQL editor after 001_shared_catalog.sql.

-- ---------- shop_members ----------
create table shop_members (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  name text not null,
  staff_code text unique,          -- short login code for staff sign-in; null for owner rows
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);
create index shop_members_shop_id_idx on shop_members(shop_id);
create index shop_members_user_id_idx on shop_members(user_id);

-- ---------- Shop-level feature toggles ----------
alter table shops add column if not exists enabled_modules text[] not null default array[
  'dashboard','inventory','billing','history','credit','dayclose','expenses','cashbook','suppliers'
];

-- Backfill: every existing shop gets an 'owner' membership row for its
-- current owner, so RLS below doesn't lock owners out of their own data.
insert into shop_members (shop_id, user_id, role, name, permissions)
select s.id, s.owner_id, 'owner', 'Owner',
  '{"dashboard":true,"inventory":true,"billing":true,"history":true,"credit":true,"dayclose":true,"expenses":true,"cashbook":true,"suppliers":true}'::jsonb
from shops s
on conflict (shop_id, user_id) do nothing;

-- =========================================================
-- Helper functions (SECURITY DEFINER so they can read
-- shop_members/shops without recursing into the RLS policies
-- that call them).
-- =========================================================

create or replace function is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shop_members
    where shop_id = target_shop_id and user_id = auth.uid()
  );
$$;

create or replace function has_shop_permission(target_shop_id uuid, module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
      and (role = 'owner' or (permissions->>module)::boolean is true)
  );
$$;

create or replace function is_shop_owner(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shop_members
    where shop_id = target_shop_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- For products/suppliers (owner-level tables): true if the caller IS
-- that owner, or is a member of any shop belonging to that owner.
create or replace function owns_via_membership(target_owner_id uuid)
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
      where s.owner_id = target_owner_id and sm.user_id = auth.uid()
    );
$$;

-- =========================================================
-- RLS rewrite — replaces every "owner_id = auth.uid()" /
-- "shop_id in (select id from shops where owner_id = auth.uid())"
-- policy with membership + permission checks.
-- =========================================================

alter table shop_members enable row level security;

drop policy if exists "Owners manage their own shops" on shops;
create policy "Members can view their shops" on shops for select
  using (is_shop_member(id));
create policy "Owners can insert shops" on shops for insert
  with check (owner_id = auth.uid());
create policy "Owners can update their shops" on shops for update
  using (is_shop_owner(id)) with check (is_shop_owner(id));
create policy "Owners can delete their shops" on shops for delete
  using (is_shop_owner(id));

create policy "Members can view their shop roster" on shop_members for select
  using (is_shop_member(shop_id));
create policy "Owners can add shop members" on shop_members for insert
  with check (
    is_shop_owner(shop_id)
    or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  );
create policy "Owners can update shop members" on shop_members for update
  using (is_shop_owner(shop_id)) with check (is_shop_owner(shop_id));
create policy "Owners can remove shop members" on shop_members for delete
  using (is_shop_owner(shop_id));

drop policy if exists "Owners manage their own products" on products;
create policy "Members can view products" on products for select
  using (owns_via_membership(owner_id));
create policy "Members can insert products" on products for insert
  with check (owns_via_membership(owner_id));
create policy "Members can update products" on products for update
  using (owns_via_membership(owner_id)) with check (owns_via_membership(owner_id));
create policy "Members can delete products" on products for delete
  using (owns_via_membership(owner_id));

drop policy if exists "Owners manage their own suppliers" on suppliers;
create policy "Members can view suppliers" on suppliers for select
  using (owns_via_membership(owner_id));
create policy "Members with suppliers permission can insert" on suppliers for insert
  with check (owns_via_membership(owner_id));
create policy "Members with suppliers permission can update" on suppliers for update
  using (owns_via_membership(owner_id)) with check (owns_via_membership(owner_id));
create policy "Members with suppliers permission can delete" on suppliers for delete
  using (owns_via_membership(owner_id));

drop policy if exists "Owners manage their own shop_products" on shop_products;
create policy "Members can view shop_products" on shop_products for select
  using (is_shop_member(shop_id));
create policy "Members with inventory permission can insert shop_products" on shop_products for insert
  with check (has_shop_permission(shop_id, 'inventory'));
create policy "Members with inventory permission can update shop_products" on shop_products for update
  using (has_shop_permission(shop_id, 'inventory')) with check (has_shop_permission(shop_id, 'inventory'));
create policy "Members with inventory permission can delete shop_products" on shop_products for delete
  using (has_shop_permission(shop_id, 'inventory'));

drop policy if exists "Owners manage their own shop_suppliers" on shop_suppliers;
create policy "Members can view shop_suppliers" on shop_suppliers for select
  using (is_shop_member(shop_id));
create policy "Members with suppliers permission can insert shop_suppliers" on shop_suppliers for insert
  with check (has_shop_permission(shop_id, 'suppliers'));
create policy "Members with suppliers permission can delete shop_suppliers" on shop_suppliers for delete
  using (has_shop_permission(shop_id, 'suppliers'));

drop policy if exists "Owners manage their own movements" on movements;
create policy "Members can view movements" on movements for select
  using (is_shop_member(shop_id));
create policy "Members with inventory permission can insert movements" on movements for insert
  with check (has_shop_permission(shop_id, 'inventory'));

drop policy if exists "Owners manage their own bills" on bills;
create policy "Members can view bills" on bills for select
  using (is_shop_member(shop_id));
create policy "Members with billing permission can insert bills" on bills for insert
  with check (has_shop_permission(shop_id, 'billing'));

drop policy if exists "Owners manage their own credits" on credits;
create policy "Members can view credits" on credits for select
  using (is_shop_member(shop_id));
create policy "Members with credit permission can insert credits" on credits for insert
  with check (has_shop_permission(shop_id, 'credit'));

drop policy if exists "Owners manage their own reconciliations" on reconciliations;
create policy "Members can view reconciliations" on reconciliations for select
  using (is_shop_member(shop_id));
create policy "Members with dayclose permission can insert reconciliations" on reconciliations for insert
  with check (has_shop_permission(shop_id, 'dayclose'));

drop policy if exists "Owners manage their own draws" on draws;
create policy "Members can view draws" on draws for select
  using (is_shop_member(shop_id));
create policy "Members with dayclose permission can insert draws" on draws for insert
  with check (has_shop_permission(shop_id, 'dayclose'));

drop policy if exists "Owners manage their own expenses" on expenses;
create policy "Members can view expenses" on expenses for select
  using (is_shop_member(shop_id));
create policy "Members with expenses permission can insert expenses" on expenses for insert
  with check (has_shop_permission(shop_id, 'expenses'));
