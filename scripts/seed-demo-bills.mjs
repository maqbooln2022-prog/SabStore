// One-off dev utility: seeds a handful of realistic past bills (+ one udhaar
// entry) for a shop, so Dashboard/History/Udhaar aren't empty while those
// pages are being built. Ported from seedBillsForShop in
// reference/kirana-store-app.jsx, adapted to the real `bills`/`credits`
// schema (snake_case columns, item_id instead of a client-generated id).
//
// Usage: node scripts/seed-demo-bills.mjs <email> <password> [shopName]

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const [, , email, password, shopNameArg] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/seed-demo-bills.mjs <email> <password> [shopName]");
  process.exit(1);
}

const env = loadEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const SAMPLE_CUSTOMERS = [
  { name: "Rohit Verma", phone: "9811122233" },
  { name: "Priya Nair", phone: "9822233344" },
  { name: "Amit Khanna", phone: "9833344455" },
];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const mkLine = (item, qty) => ({
  item_id: item.id,
  code: item.code,
  name: item.name,
  price: item.price,
  unit: item.unit,
  gst: item.gst,
  qty,
});

async function main() {
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  console.log(`Signed in as ${signIn.user.email}`);

  const { data: shops, error: shopsError } = await supabase.from("shops").select("*").order("created_at");
  if (shopsError) throw shopsError;
  const shop = shopNameArg ? shops.find((s) => s.name === shopNameArg) : shops[0];
  if (!shop) throw new Error(`Shop not found (have: ${shops.map((s) => s.name).join(", ")})`);
  console.log(`Seeding demo bills for "${shop.name}" (${shop.id})`);

  const { data: existingBills } = await supabase.from("bills").select("id").eq("shop_id", shop.id).limit(1);
  if (existingBills?.length) {
    console.log("This shop already has bills — skipping to avoid duplicates.");
    return;
  }

  const { data: items, error: itemsError } = await supabase.from("items").select("*").eq("shop_id", shop.id).order("code");
  if (itemsError) throw itemsError;
  if (items.length === 0) throw new Error("This shop has no items to bill — nothing to seed.");
  const pick = (i) => items[i % items.length];

  const draftBills = [
    { bill_no: "KS-1001", date: daysAgo(2), customer: SAMPLE_CUSTOMERS[0], items: [mkLine(pick(0), 2), mkLine(pick(1), 1)], payment_type: "cash" },
    { bill_no: "KS-1002", date: daysAgo(1), customer: SAMPLE_CUSTOMERS[1], items: [mkLine(pick(2), 1), mkLine(pick(3), 3)], payment_type: "cash" },
    { bill_no: "KS-1003", date: daysAgo(0), customer: SAMPLE_CUSTOMERS[0], items: [mkLine(pick(4), 1)], payment_type: "cash" },
    { bill_no: "KS-1004", date: daysAgo(0), customer: SAMPLE_CUSTOMERS[2], items: [mkLine(pick(5), 2), mkLine(pick(6), 1)], payment_type: "credit" },
  ].map((b) => {
    const subtotal = b.items.reduce((s, l) => s + l.qty * l.price, 0);
    return {
      shop_id: shop.id,
      bill_no: b.bill_no,
      date: b.date,
      customer_name: b.customer.name,
      customer_phone: b.customer.phone,
      items: b.items,
      subtotal,
      discount_amount: 0,
      total: subtotal,
      payment_type: b.payment_type,
    };
  });

  const { data: insertedBills, error: billsError } = await supabase.from("bills").insert(draftBills).select();
  if (billsError) throw billsError;
  console.log(`Inserted ${insertedBills.length} bills`);

  const creditBill = insertedBills.find((b) => b.payment_type === "credit");
  if (creditBill) {
    const { error: creditError } = await supabase.from("credits").insert({
      shop_id: shop.id,
      phone: creditBill.customer_phone,
      name: creditBill.customer_name,
      amount: creditBill.total,
      type: "charge",
      note: `Bill ${creditBill.bill_no}`,
      date: creditBill.date,
    });
    if (creditError) throw creditError;
    console.log(`Inserted 1 udhaar (credit) entry for ${creditBill.customer_name}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
