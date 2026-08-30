# SabStore — Project Summary

Current state of the build, as of 2026-08-30. `PROJECT_BRIEF.md` and
`README.md` describe the original plan; this file describes what actually
exists now, since the two have diverged (most notably the shared-catalog
data model and the staff/roles system, neither of which were in the
original brief).

## What it is

A multi-shop billing, inventory, and udhaar (credit) management app for
small Indian retail businesses (kirana stores, supermarkets, automobile/
auto-parts shops, clothing boutiques, or any other business). One owner
account can run several shops of different types, each with its own
inventory, bills, credit ledger, and cash tracking — with staff who can be
given a real login and limited, per-feature permissions.

## Stack

- **Frontend**: Next.js 14 (App Router, JavaScript), Tailwind CSS, a custom
  design system ported from the original prototype (`ks-*` classes in
  `app/globals.css`).
- **Backend**: Supabase — Postgres with Row Level Security, Supabase Auth
  (email/password for owners, a PIN-based flow for staff built on top of
  real Supabase auth accounts).
- **Hosting**: Vercel, auto-deploys on push to `main`.
- **Repo**: [github.com/maqbooln2022-prog/SabStore](https://github.com/maqbooln2022-prog/SabStore)

## Data model

Two-tier "shared catalog" design:

- **Owner-level master data** — `products`, `suppliers`. Belongs to the
  owner (`owner_id`), not to any single shop, so the same item or supplier
  can be reused across every shop that owner runs.
- **Shop-level instance data** — `shop_products` (price, cost, GST, stock,
  low-stock threshold, quick-add flag for one shop's copy of a product),
  `shop_suppliers` (which suppliers serve which shop).
- **Everything else is shop-scoped**: `bills`, `movements`, `credits`,
  `reconciliations`, `draws`, `expenses`.
- **`shop_members`** ties a Supabase auth user to a shop with a role
  (`owner`/`staff`) and a `permissions` jsonb map, one key per module.
- **`shops.enabled_modules`** is a shop-level on/off switch per module,
  independent of any individual staff member's permissions.

Full schema, RLS policies, and the SECURITY DEFINER helper functions that
back them: `supabase/schema.sql`. Incremental changes since the initial
schema are in `supabase/migrations/001` through `004`.

## Auth & roles

- **Owners** sign up/sign in with email + password and get full access to
  every enabled module on every shop they own.
- **Staff** get a real, separate Supabase auth account (a short staff code
  + a 6+ digit PIN as their password), created server-side by the owner
  via `app/api/staff/create` using the Supabase service-role key. They see
  only the modules the owner both enabled for the shop and granted to
  them personally.
- Permissions are enforced in Postgres RLS, not just hidden in the UI — a
  staff member without a permission can't read or write that data even via
  a raw API call.

## Features built

- **Multi-shop switcher** — add, rename, configure, and delete shops from
  one account; a shop-type picker (kirana/supermarket/automobile/
  clothing/other) drives sensible defaults.
- **Add Shop flow** — starts empty by default (manual entry); optional
  toggle to seed a generic starter catalog for the business type, or a
  separate tab to import selected items (with prices/categories) from one
  of the owner's other existing shops.
- **Inventory** — add/search items by name or code, category chips, stock
  in/out with reason + optional supplier, margin display, reorder
  suggestions based on sales pace.
- **Billing** — quick-add tiles, search by name/code, unit-aware quantity
  entry, voice billing (Web Speech API), cash vs. udhaar toggle, loyalty
  discount prompt on repeat customers, printable receipt, WhatsApp send
  (via `wa.me` deep link — see Known limitations).
- **History** — past bills, searchable/filterable.
- **Udhaar (credit) book** — per-customer running balance, record
  payments, WhatsApp reminders.
- **Day Close** — daily cash reconciliation and personal draw log.
- **Expenses** and **Cashbook**.
- **Suppliers** — owner-level supplier list, linked per shop.
- **Dashboard** — today's sales/profit hero, clickable stat cards (items in
  stock, stock value, low stock, today's profit) with detail breakdowns,
  an "Add items" shortcut when a shop's inventory is empty, top customers.
- **Staff management** (owner-only) — add/edit/remove staff, set a name,
  PIN, and per-module permission checklist; staff sign in from a dedicated
  "staff" tab on the login page using their staff code + PIN.

## Security posture

A full review was done and all findings fixed:
- Products/suppliers RLS scoped to the specific shop a row is linked to,
  not just "any shop this owner runs," and requires the relevant
  permission for writes.
- Staff login lookup rate-limited (best-effort, in-memory — see
  `lib/rateLimit.js` for the serverless caveat).
- Staff codes generated with a CSPRNG (`crypto.randomInt`), not
  `Math.random()`.
- `shop_members` update/delete RLS can't touch an owner's own row, only
  staff rows.
- The service-role key is only ever used server-side, in `app/api/staff/*`
  route handlers, verified against the caller's bearer token first.

## Known limitations / deferred

- **Platform admin page** (managing shop owners across all of SabStore,
  not just one owner's own shops) — explicitly deferred; the per-owner
  staff panel above was built first.
- **WhatsApp Cloud API** — bills/reminders/digests currently use `wa.me`
  deep links (pre-fills a message, owner taps send manually), not
  automatic sending. Correct for phase 1 per `PROJECT_BRIEF.md`.
- **Low-stock alerts** are in-app only; no push/SMS channel yet.
- No offline-first sync — needs a real internet connection.
- Rate limiting is in-memory per serverless instance, not a durable/
  distributed limiter — fine as a speed bump, not for a serious attack.

## Running locally

1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in its SQL editor
   (fresh install) — or the migration files in order if updating an
   existing project.
3. Copy `.env.example` to `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (the
   last one only needed for staff account creation — keep it secret,
   server-side only).
4. `npm run dev`, open `http://localhost:3000`.

Same three env vars need to be set in the Vercel project's dashboard for
the deployed app to work — `.env.local` is git-ignored and never deployed.
