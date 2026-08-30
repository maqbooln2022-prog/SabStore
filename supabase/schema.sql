-- Kirana / multi-shop billing app — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Mirrors the data model in PROJECT_BRIEF.md, ported from the working prototype.

create extension if not exists "uuid-ossp";

-- ---------- Shops ----------
create table shops (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('kirana', 'supermarket', 'automobile', 'clothing', 'other')),
  gstin text,
  upi_id text,
  created_at timestamptz not null default now()
);

-- ---------- Items ----------
create table items (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  code text,                      -- 2-digit quick-billing code
  name text not null,
  hindi_name text,
  barcode text,                   -- scanned via BarcodeDetector on the client
  image_url text,
  category text not null default 'General',
  unit text not null default 'pcs' check (unit in ('pcs','kg','g','l','ml','packet')),
  price numeric(12,2) not null,        -- selling price
  cost_price numeric(12,2),            -- purchase price
  gst numeric(4,2),                    -- percent, nullable = no GST (must stay optional per spec)
  stock numeric(12,3) not null default 0,
  low_at numeric(12,3) not null default 5,
  quick boolean not null default false,
  created_at timestamptz not null default now()
);
create index items_shop_id_idx on items(shop_id);

-- ---------- Stock movements (in/out log) ----------
create table movements (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  item_id uuid references items(id) on delete set null,
  item_name text not null,             -- denormalized so history survives item deletion
  type text not null check (type in ('in','out')),
  qty numeric(12,3) not null,
  reason text not null,
  supplier text,
  date timestamptz not null default now()
);
create index movements_shop_id_idx on movements(shop_id);

-- ---------- Bills ----------
create table bills (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  bill_no text not null,
  customer_name text,
  customer_phone text,
  items jsonb not null,                -- [{ item_id, code, name, price, unit, gst, qty }, ...]
  subtotal numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  payment_type text not null default 'cash' check (payment_type in ('cash','credit')),
  date timestamptz not null default now()
);
create index bills_shop_id_idx on bills(shop_id);
create index bills_customer_phone_idx on bills(customer_phone);

-- ---------- Udhaar (credit) ledger ----------
create table credits (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  phone text not null,
  name text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('charge','payment')),
  note text,
  date timestamptz not null default now()
);
create index credits_shop_id_idx on credits(shop_id);
create index credits_phone_idx on credits(phone);

-- ---------- Cash reconciliation (Day Close) ----------
create table reconciliations (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  expected_cash numeric(12,2) not null,
  cash_counted numeric(12,2) not null,
  diff numeric(12,2) not null,
  date timestamptz not null default now()
);

-- ---------- Personal draws ----------
create table draws (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  amount numeric(12,2) not null,
  note text,
  date timestamptz not null default now()
);

-- ---------- Daily shop expenses ----------
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  category text not null,              -- Rent / Electricity / Staff salary / Transport / Maintenance / Other
  amount numeric(12,2) not null,
  note text,
  date timestamptz not null default now()
);

-- ---------- Suppliers ----------
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  phone text,
  items text,                          -- free-text description of what they supply
  created_at timestamptz not null default now()
);

-- =========================================================
-- Row Level Security — every table is scoped to the owner's
-- own shops. Adjust once staff logins / multi-user shops are
-- reintroduced (see PROJECT_BRIEF.md).
-- =========================================================

alter table shops enable row level security;
alter table items enable row level security;
alter table movements enable row level security;
alter table bills enable row level security;
alter table credits enable row level security;
alter table reconciliations enable row level security;
alter table draws enable row level security;
alter table expenses enable row level security;
alter table suppliers enable row level security;

create policy "Owners manage their own shops"
  on shops for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Every other table is keyed off shop_id, so the policy always
-- checks that the parent shop belongs to the current user.
create policy "Owners manage their own items" on items for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own movements" on movements for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own bills" on bills for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own credits" on credits for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own reconciliations" on reconciliations for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own draws" on draws for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own expenses" on expenses for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "Owners manage their own suppliers" on suppliers for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));
