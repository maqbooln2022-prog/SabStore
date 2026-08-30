// One-off dev utility: run this once after applying
// supabase/migrations/001_shared_catalog.sql, to re-seed starter
// products/shop_products for shops that already existed before the
// migration (ShopContext's addShop only auto-seeds brand-new shops).
//
// Usage: node scripts/reseed-shop-products.mjs <email> <password>

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

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/reseed-shop-products.mjs <email> <password>");
  process.exit(1);
}

// Mirrors lib/shopTypes.js — duplicated here since this plain Node script
// can't import that ESM file across the project's CommonJS default.
const KIRANA_SEED_ITEMS = [
  { code: "01", name: "Aashirvaad Atta 5kg", hindi_name: "आटा", category: "Atta & Flour", unit: "pcs", price: 245, cost_price: 210, stock: 18, low_at: 5, quick: true },
  { code: "02", name: "Tata Salt 1kg", hindi_name: "नमक", category: "Grocery", unit: "pcs", price: 25, cost_price: 19, stock: 40, low_at: 10, quick: false },
  { code: "03", name: "Fortune Sunflower Oil 1L", hindi_name: "तेल", category: "Oil & Ghee", unit: "pcs", price: 165, cost_price: 142, stock: 12, low_at: 6, quick: true },
  { code: "04", name: "Toor Dal (Arhar)", hindi_name: "दाल", category: "Pulses", unit: "kg", price: 148, cost_price: 126, stock: 22, low_at: 5, quick: false },
  { code: "05", name: "Basmati Rice", hindi_name: "चावल", category: "Rice", unit: "kg", price: 92, cost_price: 76, stock: 35, low_at: 8, quick: false },
  { code: "06", name: "Sugar", hindi_name: "चीनी", category: "Grocery", unit: "kg", price: 44, cost_price: 39, stock: 3, low_at: 5, quick: true },
  { code: "07", name: "Amul Toned Milk", hindi_name: "दूध", category: "Dairy", unit: "pcs", price: 27, cost_price: 24, stock: 24, low_at: 10, quick: true },
  { code: "08", name: "Parle-G Biscuit", hindi_name: "बिस्कुट", category: "Snacks", unit: "pcs", price: 10, cost_price: 8, stock: 60, low_at: 15, quick: true },
  { code: "09", name: "Maggi Noodles", hindi_name: "मैगी", category: "Snacks", unit: "pcs", price: 14, cost_price: 11, stock: 4, low_at: 10, quick: true },
  { code: "10", name: "Red Label Tea 250g", hindi_name: "चाय", category: "Tea & Coffee", unit: "pcs", price: 130, cost_price: 108, stock: 15, low_at: 5, quick: false },
];
const SUPERMARKET_SEED_ITEMS = [
  { code: "01", name: "Colgate Toothpaste 150g", category: "Personal Care", unit: "pcs", price: 95, cost_price: 78, stock: 30, low_at: 8, quick: true },
  { code: "02", name: "Dettol Soap (pack of 4)", category: "Personal Care", unit: "pcs", price: 180, cost_price: 150, stock: 20, low_at: 5, quick: false },
  { code: "03", name: "Surf Excel 1kg", category: "Household", unit: "pcs", price: 145, cost_price: 122, stock: 25, low_at: 6, quick: true },
  { code: "04", name: "Lay's Chips 52g", category: "Snacks", unit: "pcs", price: 20, cost_price: 15, stock: 80, low_at: 20, quick: true },
  { code: "05", name: "Coca-Cola 750ml", category: "Beverages", unit: "pcs", price: 45, cost_price: 36, stock: 36, low_at: 10, quick: true },
  { code: "06", name: "Britannia Bread", category: "Bakery", unit: "pcs", price: 45, cost_price: 36, stock: 14, low_at: 5, quick: true },
  { code: "07", name: "Frozen Green Peas 500g", category: "Frozen", unit: "pcs", price: 65, cost_price: 52, stock: 18, low_at: 5, quick: false },
  { code: "08", name: "Head & Shoulders Shampoo 340ml", category: "Personal Care", unit: "pcs", price: 320, cost_price: 265, stock: 10, low_at: 3, quick: false },
  { code: "09", name: "Eggs (tray of 6)", category: "Dairy & Eggs", unit: "pcs", price: 42, cost_price: 34, stock: 22, low_at: 6, quick: true },
  { code: "10", name: "Basmati Rice 5kg", category: "Grocery", unit: "pcs", price: 460, cost_price: 390, stock: 16, low_at: 4, quick: false },
];
const AUTOMOBILE_SEED_ITEMS = [
  { code: "01", name: "Engine Oil 1L (Semi-Synthetic)", category: "Lubricants", unit: "pcs", price: 450, cost_price: 370, stock: 24, low_at: 6, quick: true },
  { code: "02", name: "Brake Pads (Front Set)", category: "Brakes", unit: "pcs", price: 1200, cost_price: 950, stock: 8, low_at: 3, quick: true },
  { code: "03", name: "Air Filter", category: "Filters", unit: "pcs", price: 350, cost_price: 270, stock: 15, low_at: 4, quick: false },
  { code: "04", name: "Spark Plug (set of 4)", category: "Ignition", unit: "pcs", price: 600, cost_price: 480, stock: 12, low_at: 4, quick: true },
  { code: "05", name: "Car Battery 35Ah", category: "Electrical", unit: "pcs", price: 4500, cost_price: 3800, stock: 5, low_at: 2, quick: false },
  { code: "06", name: "Wiper Blades (Pair)", category: "Accessories", unit: "pcs", price: 550, cost_price: 420, stock: 10, low_at: 3, quick: false },
  { code: "07", name: "Tyre 165/80 R14", category: "Tyres", unit: "pcs", price: 3200, cost_price: 2700, stock: 12, low_at: 4, quick: true },
  { code: "08", name: "Headlight Bulb (H4)", category: "Electrical", unit: "pcs", price: 220, cost_price: 165, stock: 20, low_at: 5, quick: false },
  { code: "09", name: "Car Air Freshener", category: "Accessories", unit: "pcs", price: 150, cost_price: 100, stock: 30, low_at: 8, quick: true },
  { code: "10", name: "Seat Cover Set", category: "Accessories", unit: "pcs", price: 2200, cost_price: 1700, stock: 6, low_at: 2, quick: false },
];
const CLOTHING_SEED_ITEMS = [
  { code: "01", name: "Men's Formal Shirt", category: "Men", unit: "pcs", price: 899, cost_price: 550, stock: 22, low_at: 5, quick: true },
  { code: "02", name: "Men's Denim Jeans", category: "Men", unit: "pcs", price: 1299, cost_price: 800, stock: 18, low_at: 4, quick: true },
  { code: "03", name: "Women's Kurti", category: "Women", unit: "pcs", price: 799, cost_price: 480, stock: 25, low_at: 6, quick: true },
  { code: "04", name: "Women's Saree", category: "Women", unit: "pcs", price: 1899, cost_price: 1200, stock: 12, low_at: 3, quick: false },
  { code: "05", name: "Kids Frock", category: "Kids", unit: "pcs", price: 549, cost_price: 320, stock: 16, low_at: 4, quick: false },
  { code: "06", name: "Cotton T-Shirt", category: "Men", unit: "pcs", price: 499, cost_price: 280, stock: 30, low_at: 8, quick: true },
  { code: "07", name: "Leather Belt", category: "Accessories", unit: "pcs", price: 399, cost_price: 220, stock: 20, low_at: 5, quick: false },
  { code: "08", name: "Formal Trousers", category: "Men", unit: "pcs", price: 999, cost_price: 620, stock: 14, low_at: 4, quick: false },
  { code: "09", name: "Women's Handbag", category: "Accessories", unit: "pcs", price: 1199, cost_price: 750, stock: 10, low_at: 3, quick: true },
  { code: "10", name: "Kids Shoes", category: "Kids", unit: "pcs", price: 649, cost_price: 400, stock: 15, low_at: 4, quick: false },
];
const SEED_ITEMS_BY_TYPE = {
  kirana: KIRANA_SEED_ITEMS,
  supermarket: SUPERMARKET_SEED_ITEMS,
  automobile: AUTOMOBILE_SEED_ITEMS,
  clothing: CLOTHING_SEED_ITEMS,
  other: [],
};

const env = loadEnvLocal();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  const user = signIn.user;
  console.log(`Signed in as ${user.email}`);

  const { data: shops, error: shopsError } = await supabase.from("shops").select("*").order("created_at");
  if (shopsError) throw shopsError;
  console.log(`Found ${shops.length} shop(s): ${shops.map((s) => s.name).join(", ")}`);

  for (const shop of shops) {
    const { data: existing } = await supabase.from("shop_products").select("id").eq("shop_id", shop.id).limit(1);
    if (existing?.length) {
      console.log(`- ${shop.name}: already has products, skipping.`);
      continue;
    }

    const seedItems = SEED_ITEMS_BY_TYPE[shop.type] || [];
    if (seedItems.length === 0) {
      console.log(`- ${shop.name}: no starter items for type "${shop.type}", skipping.`);
      continue;
    }

    const productRows = seedItems.map(({ code, price, cost_price, gst, stock, low_at, quick, ...product }) => ({
      ...product,
      owner_id: user.id,
    }));
    const { data: products, error: productError } = await supabase.from("products").insert(productRows).select();
    if (productError) throw productError;

    const shopProductRows = seedItems.map((it, i) => ({
      shop_id: shop.id,
      product_id: products[i].id,
      code: it.code,
      price: it.price,
      cost_price: it.cost_price,
      gst: it.gst ?? null,
      stock: it.stock,
      low_at: it.low_at,
      quick: it.quick,
    }));
    const { error: spError } = await supabase.from("shop_products").insert(shopProductRows);
    if (spError) throw spError;

    console.log(`- ${shop.name}: seeded ${seedItems.length} products.`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
