-- One-time cleanup, not part of the fresh-install schema. Each of the 4
-- new owners created in migration 012 also clicked through "Set up your
-- shop" and created their own empty (well, seed-template-filled) shop in
-- addition to the real one reassigned to them — leaving each with 2.
-- This removes the 4 accidental duplicates by exact id (not name, since
-- one pair — Trendy Boutique — shares a name with the original; the
-- older of the two, created 2026-08-30 10:44, is kept as the real one).
delete from shops where id in (
  'b0fc0491-0257-43e3-8984-648b543312fb', -- "SuperMarket" duplicate
  '76085983-425a-4955-9a68-ea30dac69d6d', -- "MaqboolAutomobile" duplicate
  '18693d55-6eff-4fcb-84ee-c557d670f2c1', -- "Maqbool Automobile" duplicate
  'd41f25fd-1a19-4765-b886-0482e82624c9'  -- "Trendy Boutique" duplicate (2026-08-30 16:07)
);
