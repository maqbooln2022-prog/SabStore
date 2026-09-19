-- HSN/SAC code per product (owner-level catalog) — needed for the GSTR-1
-- HSN-wise summary section in the Reports > GST filing export tab.
alter table products add column if not exists hsn_code text;
