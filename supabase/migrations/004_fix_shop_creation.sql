-- Fixes "new row violates row-level security policy for table shops"
-- when creating ANY new shop (including the very first one).
--
-- Root cause: ShopContext.addShop() does `.select().single()` on the
-- shops insert, which makes PostgREST also re-check the SELECT policy
-- on the brand-new row (Postgres applies SELECT-style RLS to RETURNING
-- clauses). The shops SELECT policy was `is_shop_member(id)`, which
-- requires a shop_members row — but that row is only created in a
-- SEPARATE, later insert (addShop's second step), so at the moment of
-- the shops insert's RETURNING, no shop_members row exists yet for
-- this shop. PostgREST reports the whole insert as rejected even
-- though the row was actually written.
--
-- Fix: let the owner see their own shop directly via owner_id, without
-- needing a shop_members row to exist first — matching the same
-- "owner_id = auth.uid() OR ..." fallback already used for
-- products/suppliers.
--
-- Run this in the Supabase SQL editor.

drop policy if exists "Members can view their shops" on shops;
create policy "Members can view their shops" on shops for select
  using (owner_id = auth.uid() or is_shop_member(id));

-- Housekeeping from diagnosing this: 003's `create or replace function
-- owns_via_membership(uuid, text default null)` didn't replace the
-- original single-argument version from 002 — different parameter
-- lists mean Postgres treats it as a new overload, not a replacement.
-- Nothing calls the 1-arg version anymore (003's policies all use the
-- 2-arg one), so it's just dead weight; drop it. Also drops the
-- temporary debug_whoami() used while diagnosing this issue.
drop function if exists owns_via_membership(uuid);
drop function if exists debug_whoami();
