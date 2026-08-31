-- 005: Atomic stock operations
--
-- Billing and Inventory previously did "read current stock client-side,
-- then write new stock" as two separate round trips — two sales of the
-- same item landing at the same moment can both read the same stock
-- count and both succeed, overselling. These RPC functions do the
-- read-lock-write-log as one Postgres transaction with a row lock
-- (`for update`), so concurrent calls for the same item queue up instead
-- of racing.
--
-- SECURITY DEFINER (like the helper functions in schema.sql) so the
-- function itself can write shop_products/movements regardless of which
-- specific permission the caller's own RLS would otherwise require for a
-- direct write — the has_shop_permission() check below is what actually
-- authorizes the call, done once, explicitly, up front. This matters
-- because a cashier with only 'billing' permission (no 'inventory')
-- still needs sell_items() to be able to log a movement row, which a
-- direct insert into movements would normally require 'inventory' for.
--
-- Run this in the Supabase SQL editor after 001-004.

create or replace function sell_items(p_shop_id uuid, p_lines jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  current_stock numeric;
begin
  if not has_shop_permission(p_shop_id, 'billing') then
    raise exception 'not permitted to bill for this shop';
  end if;

  for line in select * from jsonb_array_elements(p_lines) loop
    select stock into current_stock from shop_products
      where id = (line->>'shop_product_id')::uuid and shop_id = p_shop_id
      for update; -- row lock: two simultaneous bills can't both oversell

    if current_stock is null then
      raise exception 'item % not found in this shop', line->>'shop_product_id';
    end if;

    update shop_products
      set stock = greatest(0, current_stock - (line->>'qty')::numeric)
      where id = (line->>'shop_product_id')::uuid;

    insert into movements (shop_id, shop_product_id, item_name, type, qty, reason)
      values (
        p_shop_id,
        (line->>'shop_product_id')::uuid,
        line->>'name',
        'out',
        (line->>'qty')::numeric,
        'sale'
      );
  end loop;
end;
$$;

-- Used by Inventory's In/Out stock-adjustment modal (manual restock or
-- correction, not a sale). Returns the updated shop_products row so the
-- caller can refresh local state without a second round trip.
create or replace function adjust_stock(
  p_shop_id uuid,
  p_shop_product_id uuid,
  p_type text,          -- 'in' or 'out'
  p_qty numeric,
  p_reason text,
  p_supplier text default null
)
returns shop_products
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock numeric;
  item_name text;
  updated shop_products;
begin
  if not has_shop_permission(p_shop_id, 'inventory') then
    raise exception 'not permitted to adjust inventory for this shop';
  end if;
  if p_type not in ('in', 'out') then
    raise exception 'type must be in or out';
  end if;

  select sp.stock, p.name into current_stock, item_name
    from shop_products sp
    join products p on p.id = sp.product_id
    where sp.id = p_shop_product_id and sp.shop_id = p_shop_id
    for update of sp;

  if current_stock is null then
    raise exception 'item not found in this shop';
  end if;

  update shop_products
    set stock = case when p_type = 'in' then current_stock + p_qty
                     else greatest(0, current_stock - p_qty) end
    where id = p_shop_product_id
    returning * into updated;

  insert into movements (shop_id, shop_product_id, item_name, type, qty, reason, supplier)
    values (p_shop_id, p_shop_product_id, item_name, p_type, p_qty, p_reason, p_supplier);

  return updated;
end;
$$;

grant execute on function sell_items(uuid, jsonb) to authenticated;
grant execute on function adjust_stock(uuid, uuid, text, numeric, text, text) to authenticated;
