-- bill_no was previously computed client-side as
-- `KS-${1000 + bills.length + 1}` with no DB uniqueness at all. This is
-- not theoretical — a production shop already has 13 pairs of bills
-- sharing the same bill_no (two devices/tabs billing before either
-- synced its local `bills` count). This migration first renumbers the
-- later duplicate of each colliding pair (keeping the earliest bill's
-- original number untouched, since that's the one a customer may
-- already have a printed/WhatsApped copy of), then adds a uniqueness
-- constraint so this can never happen again. App-side retry logic
-- (billing/page.js, lib/offlineQueue.js) regenerates a fresh number
-- and retries if the DB ever rejects an insert on this constraint.

with ranked as (
  select id, shop_id, bill_no,
         row_number() over (partition by shop_id, bill_no order by date, id) as rn
  from bills
),
dupes as (
  select id, shop_id, bill_no, rn
  from ranked
  where rn > 1
)
update bills b
set bill_no = b.bill_no || '-DUP' || d.rn
from dupes d
where b.id = d.id;

alter table bills add constraint bills_shop_id_bill_no_key unique (shop_id, bill_no);
