# Multi-Shop Billing & Inventory App — Build Brief for Claude Code

## What this is
A production web app for small Indian shop owners (kirana stores, supermarkets,
automobile/auto-parts shops, clothing boutiques, or any retail business) to
manage inventory, bill customers, track credit (udhaar), and get low-stock
alerts — usable across multiple businesses owned by the same person.

A fully working **prototype** already exists: `kirana-store-app.jsx`
(included in this folder). It's a single-file React component with realistic
sample data and every feature below already built and clickable — but it
only runs in-browser with no real backend, no real login, and no real
message-sending. Your job is to turn this into a real, deployed product:
same features, real infrastructure underneath.

## Recommended stack
- **Frontend**: Next.js (React) — reuse the UI/UX and logic from
  `kirana-store-app.jsx` as the reference implementation, restructured into
  proper pages/components.
- **Backend + database + auth**: Supabase (Postgres, row-level security,
  built-in auth with phone/OTP or email+password).
- **Hosting**: Vercel (pairs naturally with Next.js).
- **Messaging (phase 2)**: WhatsApp Cloud API (Meta) for automatic bill
  sending, credit reminders, and the weekly digest — the prototype currently
  fakes this with `wa.me` deep links, which only pre-fills a message for the
  owner to manually hit send.
- **Push/SMS alerts (phase 2)**: once on Supabase, low-stock alerts can move
  from browser-only notifications to real push (web push) or SMS.

## Core data model (build this first in Supabase)
- `shops` — id, owner_id, name, type (kirana/supermarket/automobile/clothing/other), gstin
- `items` — id, shop_id, code (2-digit), name, hindi_name, category, unit
  (pcs/kg/g/l/ml/packet), price, cost_price, gst (nullable — **GST must stay
  optional, off by default**), stock, low_at (low-stock threshold), quick
  (boolean, for quick-add), created_at
- `movements` — id, shop_id, item_id, type (in/out), qty, reason, supplier
  (nullable), date
- `bills` — id, shop_id, bill_no, date, customer_name, customer_phone, items
  (jsonb array of line items: item_id, code, name, price, unit, gst, qty),
  subtotal, discount_amount, total, payment_type (cash/credit)
- `credits` — id, shop_id, phone, name, amount, type (charge/payment), note, date
- `reconciliations` — id, shop_id, date, expected_cash, cash_counted, diff
- `draws` — id, shop_id, amount, note, date (owner's personal cash draws)
- `users` — Supabase auth users, linked to shops via an `owner_id` or a
  `shop_members` join table if multiple staff per shop is needed later

## Features already designed and built in the prototype (build all of these)

1. **Multi-shop switcher** — vendor can run several businesses (different
   types) under one account, each with fully separate inventory/bills/credit/
   cash. A shop-type picker seeds sensible starter categories.
2. **Inventory** — add/search items by name or 2-digit code, category color
   chips, stock in/out with a reason + optional supplier name, margin display
   (price − cost price), smart reorder suggestions based on actual sales pace.
3. **Billing** — quick-add tiles for frequent items, category browsing, search
   by name or code, a quantity picker that accepts grams/kg and ml/litres
   interchangeably (auto-converts to the item's stored unit), voice billing
   (Web Speech API in the prototype — replace with a proper speech-to-text
   service for production reliability) supporting English and Hindi, cash vs.
   udhaar (credit) toggle, automatic loyalty discount prompt on a customer's
   3rd+ visit, printable receipt, and bill sending via WhatsApp.
4. **Udhaar (credit) book** — per-customer running balance, record payments,
   send payment reminders via WhatsApp.
5. **Day Close** — daily cash reconciliation (expected cash from cash sales
   minus personal draws vs. actual cash counted), plus a personal-draw log.
6. **Dashboard** — today's sales/profit hero, clickable stat cards (items in
   stock, stock value, low stock, today's profit — each opens a detail
   breakdown), top customers (clickable to see their purchase history), a
   weekly WhatsApp digest button (sales, profit, top sellers, low stock,
   outstanding udhaar).
7. **Low-stock alerts** — automatic the moment a sale or stock adjustment
   crosses the threshold; in-app banner + optional device notification.
8. **GST support, kept fully optional** — GSTIN is a shop-level setting; each
   item has an optional GST% (defaults to none/off). Only bills containing a
   taxed item show a tax breakup. **Do not default any item to a GST rate.**

## What needs to become real (the actual build work)
- Replace the in-browser `window.storage` mock with real Supabase reads/writes.
- Replace the informal owner/staff PIN login (previously built, then removed
  from the prototype at the client's request) with real Supabase auth —
  confirm with the client whether they want it back in, and with what roles.
- Replace `wa.me` links with the WhatsApp Cloud API so messages can actually
  send automatically (bill on generation, reminders on a schedule, weekly
  digest on a cron job) instead of requiring a manual tap.
- Add a real low-stock notification channel (web push and/or SMS) since
  browser notifications only fire while the app is open.
- Production hardening: input validation, rate limiting, proper error states,
  offline-first sync if the shop has patchy internet.

## Not required yet (explicitly deferred by the client)
- Barcode scanning
- Bluetooth weighing-scale integration
- Full GST e-invoicing compliance (HSN codes, e-way bills, etc.) — the
  current scope is just an optional GST% and a basic tax breakup on the bill

## How to use this brief with Claude Code
1. Put this file and `kirana-store-app.jsx` in a new project folder.
2. Run Claude Code in that folder.
3. Ask it to scaffold a Next.js + Supabase project, then implement each
   feature section above one at a time, using `kirana-store-app.jsx` as the
   reference for exact UI/UX and business logic (unit conversion, voice
   parsing, tax breakup, loyalty logic, etc. are all already correct there —
   port the logic, don't redesign it from scratch).
