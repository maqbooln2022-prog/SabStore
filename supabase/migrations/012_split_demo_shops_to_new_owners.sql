-- One-time data migration, not part of the fresh-install schema. The
-- app is moving from "1 owner, many shops" to "1 owner, 1 shop, chosen
-- at signup." This project's dev account (maqbooln2022@gmail.com) has
-- 4 shops under one login; this splits 3 of them off to their own new
-- owner accounts, leaving the original owner with just "SabStore."
--
-- Run this ONLY after all 3 new owners below have signed up through the
-- app's own signup form (Create account), so their auth.users row
-- exists — do NOT let them fill out the "Set up your shop" onboarding
-- screen first, since this migration reassigns their existing shop to
-- them; there is nothing for them to create.
--
--   Trendy Boutique  -> maqbooln2022+trendyboutique@gmail.com
--   Speed Auto Parts -> maqbooln2022+speedauto@gmail.com
--   SabStore Demo    -> maqbooln2022+sabstoredemo@gmail.com
--
-- Each block is independent and safe to re-run (the member insert is
-- an upsert) — if one new owner hasn't signed up yet, that block raises
-- a clear exception and the earlier ones still committed.

do $$
declare
  v_old_owner uuid;
  v_new_owner uuid;
  v_shop_id uuid;
  v_new_name text;
begin
  select id into v_old_owner from auth.users where email = 'maqbooln2022@gmail.com';
  select id into v_new_owner from auth.users where email = 'maqbooln2022+trendyboutique@gmail.com';
  if v_new_owner is null then
    raise exception 'maqbooln2022+trendyboutique@gmail.com has not signed up yet — create that account in the app first';
  end if;

  select id into v_shop_id from shops where name = 'Trendy Boutique' and owner_id = v_old_owner;
  if v_shop_id is null then
    raise notice 'Trendy Boutique not found under the original owner — already migrated, skipping';
  else
    select coalesce(raw_user_meta_data->>'full_name', 'Owner') into v_new_name from auth.users where id = v_new_owner;
    update shops set owner_id = v_new_owner where id = v_shop_id;
    delete from shop_members where shop_id = v_shop_id and user_id = v_old_owner;
    insert into shop_members (shop_id, user_id, role, name, permissions)
      values (v_shop_id, v_new_owner, 'owner', v_new_name,
        '{"dashboard":true,"inventory":true,"billing":true,"history":true,"credit":true,"dayclose":true,"expenses":true,"cashbook":true,"suppliers":true}'::jsonb)
      on conflict (shop_id, user_id) do update set role = 'owner', permissions = excluded.permissions;
    raise notice 'Trendy Boutique reassigned to %', v_new_owner;
  end if;
end $$;

do $$
declare
  v_old_owner uuid;
  v_new_owner uuid;
  v_shop_id uuid;
  v_new_name text;
begin
  select id into v_old_owner from auth.users where email = 'maqbooln2022@gmail.com';
  select id into v_new_owner from auth.users where email = 'maqbooln2022+speedauto@gmail.com';
  if v_new_owner is null then
    raise exception 'maqbooln2022+speedauto@gmail.com has not signed up yet — create that account in the app first';
  end if;

  select id into v_shop_id from shops where name = 'Speed Auto Parts' and owner_id = v_old_owner;
  if v_shop_id is null then
    raise notice 'Speed Auto Parts not found under the original owner — already migrated, skipping';
  else
    select coalesce(raw_user_meta_data->>'full_name', 'Owner') into v_new_name from auth.users where id = v_new_owner;
    update shops set owner_id = v_new_owner where id = v_shop_id;
    delete from shop_members where shop_id = v_shop_id and user_id = v_old_owner;
    insert into shop_members (shop_id, user_id, role, name, permissions)
      values (v_shop_id, v_new_owner, 'owner', v_new_name,
        '{"dashboard":true,"inventory":true,"billing":true,"history":true,"credit":true,"dayclose":true,"expenses":true,"cashbook":true,"suppliers":true}'::jsonb)
      on conflict (shop_id, user_id) do update set role = 'owner', permissions = excluded.permissions;
    raise notice 'Speed Auto Parts reassigned to %', v_new_owner;
  end if;
end $$;

do $$
declare
  v_old_owner uuid;
  v_new_owner uuid;
  v_shop_id uuid;
  v_new_name text;
begin
  select id into v_old_owner from auth.users where email = 'maqbooln2022@gmail.com';
  select id into v_new_owner from auth.users where email = 'maqbooln2022+sabstoredemo@gmail.com';
  if v_new_owner is null then
    raise exception 'maqbooln2022+sabstoredemo@gmail.com has not signed up yet — create that account in the app first';
  end if;

  select id into v_shop_id from shops where name = 'SabStore Demo' and owner_id = v_old_owner;
  if v_shop_id is null then
    raise notice 'SabStore Demo not found under the original owner — already migrated, skipping';
  else
    select coalesce(raw_user_meta_data->>'full_name', 'Owner') into v_new_name from auth.users where id = v_new_owner;
    update shops set owner_id = v_new_owner where id = v_shop_id;
    delete from shop_members where shop_id = v_shop_id and user_id = v_old_owner;
    insert into shop_members (shop_id, user_id, role, name, permissions)
      values (v_shop_id, v_new_owner, 'owner', v_new_name,
        '{"dashboard":true,"inventory":true,"billing":true,"history":true,"credit":true,"dayclose":true,"expenses":true,"cashbook":true,"suppliers":true}'::jsonb)
      on conflict (shop_id, user_id) do update set role = 'owner', permissions = excluded.permissions;
    raise notice 'SabStore Demo reassigned to %', v_new_owner;
  end if;
end $$;
