-- Pricing-anchor support: an optional "MRP" (or any higher reference
-- price) per shop_product, distinct from the actual selling price.
-- When set and higher than price, the UI shows it struck through next
-- to the selling price with a "X% off" badge — the classic anchor-price
-- trick so a customer sees they're getting a deal on every item, not
-- just during a clearance campaign (clearance_offers is a separate,
-- time-boxed mechanism layered on top of this).

alter table shop_products add column if not exists mrp numeric(12,2);
