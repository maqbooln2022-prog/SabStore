-- Quick clearance offers: a time-boxed % discount on a picked set of
-- items. "Active" is purely start_date <= today <= end_date — there's
-- no separate enable flag and no cron job to turn it on/off. Billing
-- reads the date range live on every load, so an offer auto-applies
-- the day it starts and auto-reverts the day after it ends, with
-- nothing to remember to switch off.
--
-- Read access is any shop member (billing needs to price against
-- active offers for every staff member who can bill, not just the
-- owner); writes are owner-only, same as Staff/Admin pages — this is
-- a pricing decision, not a per-permission-module feature.

create table clearance_offers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null default 'Clearance offer',
  discount_pct numeric(5,2) not null check (discount_pct > 0 and discount_pct <= 90),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  created_at timestamptz not null default now()
);
create index clearance_offers_shop_id_idx on clearance_offers(shop_id);

create table clearance_offer_items (
  id uuid primary key default uuid_generate_v4(),
  offer_id uuid not null references clearance_offers(id) on delete cascade,
  shop_product_id uuid not null references shop_products(id) on delete cascade,
  unique (offer_id, shop_product_id)
);
create index clearance_offer_items_offer_id_idx on clearance_offer_items(offer_id);
create index clearance_offer_items_shop_product_id_idx on clearance_offer_items(shop_product_id);

alter table clearance_offers enable row level security;
alter table clearance_offer_items enable row level security;

create policy "Members can view clearance_offers" on clearance_offers for select
  using (is_shop_member(shop_id));
create policy "Owners can insert clearance_offers" on clearance_offers for insert
  with check (is_shop_owner(shop_id));
create policy "Owners can delete clearance_offers" on clearance_offers for delete
  using (is_shop_owner(shop_id));

create policy "Members can view clearance_offer_items" on clearance_offer_items for select
  using (exists (select 1 from clearance_offers co where co.id = offer_id and is_shop_member(co.shop_id)));
create policy "Owners can insert clearance_offer_items" on clearance_offer_items for insert
  with check (exists (select 1 from clearance_offers co where co.id = offer_id and is_shop_owner(co.shop_id)));
create policy "Owners can delete clearance_offer_items" on clearance_offer_items for delete
  using (exists (select 1 from clearance_offers co where co.id = offer_id and is_shop_owner(co.shop_id)));
