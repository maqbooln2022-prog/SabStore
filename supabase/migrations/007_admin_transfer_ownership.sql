-- 007: Admin-driven shop ownership transfer
--
-- Reassigning who owns a shop touches three things that must move
-- together or the shop ends up broken (no owner able to manage it, or
-- shops.owner_id disagreeing with shop_members.role='owner'):
--   1. shops.owner_id
--   2. the old owner's shop_members row -> role 'staff'
--   3. the new owner's shop_members row -> role 'owner'
-- Wrapped in one function so it's one transaction, not three separate
-- round trips that could partially fail.
--
-- Deliberately NOT granted to `authenticated` — unlike is_platform_admin()
-- and the atomic stock functions, this has no internal permission check
-- (auth.uid() is meaningless when called via the service-role key, which
-- is the only way it's ever invoked — see app/api/admin/transfer-ownership).
-- The real gate is requireAdmin() in that route. Granting this to
-- `authenticated` would let any signed-in user call it directly and
-- reassign any shop's ownership.
--
-- Run this in the Supabase SQL editor after 001-006.

create or replace function admin_transfer_shop_ownership(p_shop_id uuid, p_new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_owner_id uuid;
begin
  select owner_id into v_old_owner_id from shops where id = p_shop_id;
  if v_old_owner_id is null then
    raise exception 'shop not found';
  end if;

  if v_old_owner_id = p_new_owner_id then
    raise exception 'that member is already the owner';
  end if;

  if not exists (select 1 from shop_members where shop_id = p_shop_id and user_id = p_new_owner_id) then
    raise exception 'target user is not a member of this shop';
  end if;

  update shops set owner_id = p_new_owner_id where id = p_shop_id;
  update shop_members set role = 'staff' where shop_id = p_shop_id and user_id = v_old_owner_id;
  update shop_members set role = 'owner' where shop_id = p_shop_id and user_id = p_new_owner_id;
end;
$$;
