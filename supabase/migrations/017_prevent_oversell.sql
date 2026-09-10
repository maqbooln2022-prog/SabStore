-- sell_items() previously did `stock = greatest(0, current_stock - qty)`,
-- which never raises when qty > current_stock — it just floors to 0. The
-- row lock (`for update`) stops two concurrent sales from both *reading*
-- stale stock, but does nothing to stop a single sale being accepted for
-- more than exists: the bill is generated, the customer charged in full,
-- stock silently clamps to 0, and no error ever reaches the cashier.
--
-- Now it raises, which rolls back the whole call (every line already
-- processed in this loop, since it's one function call = one implicit
-- transaction) — so a bill either fully succeeds or fully fails, never
-- partially oversells.

create or replace function sell_items(p_shop_id uuid, p_lines jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  current_stock numeric;
  requested_qty numeric;
  item_name text;
begin
  if not has_shop_permission(p_shop_id, 'billing') then
    raise exception 'not permitted to bill for this shop';
  end if;

  for line in select * from jsonb_array_elements(p_lines) loop
    requested_qty := (line->>'qty')::numeric;

    select stock into current_stock from shop_products
      where id = (line->>'shop_product_id')::uuid and shop_id = p_shop_id
      for update; -- row lock: two simultaneous bills can't both oversell

    if current_stock is null then
      raise exception 'item % not found in this shop', line->>'shop_product_id';
    end if;

    item_name := coalesce(line->>'name', 'this item');
    if current_stock < requested_qty then
      raise exception 'Only % of % left in stock — bill not saved', current_stock, item_name;
    end if;

    update shop_products
      set stock = current_stock - requested_qty
      where id = (line->>'shop_product_id')::uuid;

    insert into movements (shop_id, shop_product_id, item_name, type, qty, reason)
      values (
        p_shop_id,
        (line->>'shop_product_id')::uuid,
        line->>'name',
        'out',
        requested_qty,
        'sale'
      );
  end loop;
end;
$$;

grant execute on function sell_items(uuid, jsonb) to authenticated;
