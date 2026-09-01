-- 008: Supplier payables (what you owe each supplier, per shop)
--
-- Same supplier can serve several of an owner's shops with a different
-- balance owed at each, so this lives on shop_suppliers (the per-shop
-- link), not on suppliers itself (the owner-level shared contact).
--
-- Run this in the Supabase SQL editor after 001-007.

alter table shop_suppliers add column owed numeric(12,2) not null default 0;

-- shop_suppliers had select/insert/delete policies but no update policy —
-- nothing could change `owed` (or anything else on the row) without one.
create policy "Members with suppliers permission can update shop_suppliers" on shop_suppliers for update
  using (has_shop_permission(shop_id, 'suppliers')) with check (has_shop_permission(shop_id, 'suppliers'));
