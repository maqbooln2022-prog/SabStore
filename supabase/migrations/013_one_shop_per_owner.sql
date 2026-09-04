-- Enforce one shop per owner at the database level — the app has moved
-- from "1 owner, many shops" to "1 owner, 1 shop, chosen at signup."
-- The old "Add shop" flow is gone from the UI; this is the hard backstop
-- so a second shop can't be created for an owner even via a direct API
-- call. Run this only after 012_split_demo_shops_to_new_owners.sql has
-- completed — every owner must already have exactly one shop, or the
-- constraint below will fail to apply.

do $$
begin
  if exists (select owner_id from shops group by owner_id having count(*) > 1) then
    raise exception 'Some owners still have more than one shop — finish 012_split_demo_shops_to_new_owners.sql first';
  end if;
end $$;

alter table shops add constraint shops_owner_id_unique unique (owner_id);
