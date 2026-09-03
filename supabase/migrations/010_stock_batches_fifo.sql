-- 010: FIFO stock batches
--
-- Every stock-in (purchase, return, correction) becomes its own batch —
-- quantity, cost at the time, when it arrived, and an optional expiry
-- date. Selling or removing stock consumes the oldest batch first
-- (first in, first out), so a shop's actual stock rotation is tracked,
-- not just a single blended count.
--
-- shop_products.stock stays authoritative for "how much is on hand" —
-- nothing about that changes. Batches are an additional, parallel
-- record for rotation order and expiry tracking. An item with no
-- batches (created before this migration, or never restocked since)
-- behaves exactly as before — the FIFO consumption loop below just has
-- nothing to consume and is a no-op.
--
-- Run this in the Supabase SQL editor after 001-009.

create table stock_batches (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  shop_product_id uuid not null references shop_products(id) on delete cascade,
  qty_received numeric(12,3) not null,
  qty_remaining numeric(12,3) not null,
  cost_price numeric(12,2),
  received_date timestamptz not null default now(),
  expiry_date date,
  reason text not null default 'Purchase',
  supplier text,
  created_at timestamptz not null default now()
);
create index stock_batches_shop_id_idx on stock_batches(shop_id);
create index stock_batches_fifo_idx on stock_batches(shop_product_id, received_date);

alter table stock_batches enable row level security;

-- Read-only for clients — every write goes through sell_items()/
-- adjust_stock() below, which already gate on the right permission.
-- No insert/update/delete policy at all means the anon/authenticated
-- client can never touch a batch directly, only read it.
create policy "Members can view stock_batches" on stock_batches for select
  using (is_shop_member(shop_id));

-- Replaces migration 005's adjust_stock: same behavior, plus batch
-- bookkeeping and an optional expiry date on a stock-in. Adding a new
-- trailing parameter means this is technically a different signature —
-- `create or replace` would leave the old 6-argument version behind as
-- a separate overload (exactly the bug fixed in migration 004's
-- owns_via_membership), so the old one is dropped explicitly first.
drop function if exists adjust_stock(uuid, uuid, text, numeric, text, text);

create or replace function adjust_stock(
  p_shop_id uuid,
  p_shop_product_id uuid,
  p_type text,
  p_qty numeric,
  p_reason text,
  p_supplier text default null,
  p_expiry_date date default null
)
returns shop_products
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock numeric;
  item_name text;
  item_cost numeric;
  updated shop_products;
  remaining_to_consume numeric;
  batch record;
  consume_qty numeric;
begin
  if not has_shop_permission(p_shop_id, 'inventory') then
    raise exception 'not permitted to adjust inventory for this shop';
  end if;
  if p_type not in ('in', 'out') then
    raise exception 'type must be in or out';
  end if;

  select sp.stock, sp.cost_price, p.name into current_stock, item_cost, item_name
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

  if p_type = 'in' then
    insert into stock_batches (shop_id, shop_product_id, qty_received, qty_remaining, cost_price, expiry_date, reason, supplier)
      values (p_shop_id, p_shop_product_id, p_qty, p_qty, item_cost, p_expiry_date, p_reason, p_supplier);
  else
    remaining_to_consume := p_qty;
    for batch in
      select id, qty_remaining from stock_batches
        where shop_product_id = p_shop_product_id and qty_remaining > 0
        order by received_date asc
        for update
    loop
      exit when remaining_to_consume <= 0;
      consume_qty := least(batch.qty_remaining, remaining_to_consume);
      update stock_batches set qty_remaining = qty_remaining - consume_qty where id = batch.id;
      remaining_to_consume := remaining_to_consume - consume_qty;
    end loop;
  end if;

  return updated;
end;
$$;

-- Replaces migration 005's sell_items: same behavior, plus FIFO batch
-- consumption per line.
create or replace function sell_items(p_shop_id uuid, p_lines jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  current_stock numeric;
  v_shop_product_id uuid;
  v_qty numeric;
  remaining_to_consume numeric;
  batch record;
  consume_qty numeric;
begin
  if not has_shop_permission(p_shop_id, 'billing') then
    raise exception 'not permitted to bill for this shop';
  end if;

  for line in select * from jsonb_array_elements(p_lines) loop
    v_shop_product_id := (line->>'shop_product_id')::uuid;
    v_qty := (line->>'qty')::numeric;

    select stock into current_stock from shop_products
      where id = v_shop_product_id and shop_id = p_shop_id
      for update;

    if current_stock is null then
      raise exception 'item % not found in this shop', line->>'shop_product_id';
    end if;

    update shop_products
      set stock = greatest(0, current_stock - v_qty)
      where id = v_shop_product_id;

    insert into movements (shop_id, shop_product_id, item_name, type, qty, reason)
      values (p_shop_id, v_shop_product_id, line->>'name', 'out', v_qty, 'sale');

    remaining_to_consume := v_qty;
    for batch in
      select id, qty_remaining from stock_batches
        where shop_product_id = v_shop_product_id and qty_remaining > 0
        order by received_date asc
        for update
    loop
      exit when remaining_to_consume <= 0;
      consume_qty := least(batch.qty_remaining, remaining_to_consume);
      update stock_batches set qty_remaining = qty_remaining - consume_qty where id = batch.id;
      remaining_to_consume := remaining_to_consume - consume_qty;
    end loop;
  end loop;
end;
$$;

grant execute on function adjust_stock(uuid, uuid, text, numeric, text, text, date) to authenticated;
