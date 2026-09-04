-- Per-shop visual theme — three selectable palettes (see app/globals.css
-- for the actual token values), so an owner can compare them live via
-- Store Settings and each shop can look meaningfully different.
alter table shops add column theme text not null default 'light' check (theme in ('light', 'dark', 'warm'));
