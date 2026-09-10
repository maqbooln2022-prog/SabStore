-- Receiving a PO previously: (1) wrote status='received' to the DB
-- immediately, then (2) looped calling adjust_stock() once per line with
-- no try/catch. If any line failed partway (a deleted product, a
-- transient error), the PO was left permanently marked "Received" while
-- some or all of its stock was never actually added — silently, with no
-- user-facing error and no way to retry just the failed lines.
--
-- This wraps the whole receive operation — every line's stock update,
-- every movement log entry, and the status flip — in one Postgres
-- transaction. Either the entire PO receives cleanly, or none of it
-- does and the status stays exactly as it was so the owner can retry.

create or replace function receive_purchase_order(p_po_id uuid, p_shop_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  po record;
  line record;
  current_stock numeric;
  item_name text;
begin
  if not has_shop_permission(p_shop_id, 'inventory') then
    raise exception 'not permitted to adjust inventory for this shop';
  end if;

  select * into po from purchase_orders where id = p_po_id and shop_id = p_shop_id;
  if po is null then
    raise exception 'purchase order not found';
  end if;
  if po.status = 'received' then
    raise exception 'this purchase order was already received';
  end if;

  for line in
    select * from purchase_order_items where po_id = p_po_id and shop_product_id is not null
  loop
    select sp.stock, p.name into current_stock, item_name
      from shop_products sp
      join products p on p.id = sp.product_id
      where sp.id = line.shop_product_id and sp.shop_id = p_shop_id
      for update of sp;

    if current_stock is null then
      raise exception 'item "%" no longer exists in this shop — remove it from the order and try again', line.item_name;
    end if;

    update shop_products set stock = current_stock + line.qty where id = line.shop_product_id;

    insert into movements (shop_id, shop_product_id, item_name, type, qty, reason, supplier)
      values (p_shop_id, line.shop_product_id, item_name, 'in', line.qty,
              'PO received — ' || coalesce(po.supplier_name, 'supplier'), po.supplier_name);
  end loop;

  update purchase_orders set status = 'received' where id = p_po_id;
end;
$$;

grant execute on function receive_purchase_order(uuid, uuid) to authenticated;
