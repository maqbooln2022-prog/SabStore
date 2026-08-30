import React, { useState, useEffect, useMemo, useRef } from "react";
import { Package, Wallet, Receipt, AlertTriangle, Search, Plus, Printer, Store, ArrowUpCircle, ArrowDownCircle, Bell, X, Minus, ChevronRight, Star, CheckCircle2, TrendingUp, MessageCircle, Mic, Settings, Users, Languages, ShoppingCart, Car, Shirt, LayoutDashboard, ChevronDown, Clock, Calculator, Menu, Wallet2, BookOpen, Truck, ScanLine, Camera } from "lucide-react";

// ---------- Fonts & global style ----------
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    .ks-root {
      font-family: 'Inter', sans-serif;
      color: #000000;
      min-height: 100vh;
      background:
        radial-gradient(circle at 6% 0%, rgba(6,78,59,0.16), transparent 42%),
        radial-gradient(circle at 96% 18%, rgba(6,78,59,0.12), transparent 38%),
        radial-gradient(circle at 50% 100%, rgba(6,78,59,0.09), transparent 50%),
        #EAF3EE;
    }
    .ks-display { font-family: 'Sora', sans-serif; }
    .ks-mono { font-family: 'IBM Plex Mono', monospace; }

    .ks-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .ks-scroll::-webkit-scrollbar-thumb { background: #E1DCD0; border-radius: 999px; }

    .ks-card { background: #fff; border: 1px solid #E2E4F0; border-radius: 18px; box-shadow: 0 1px 2px rgba(27,36,48,0.03), 0 10px 24px -16px rgba(27,36,48,0.15); }
    .ks-input { width:100%; border:1.5px solid #E4DFD2; border-radius:12px; padding:9px 12px; font-size:14px; background:#F8F9FD; outline:none; transition: border-color .15s, box-shadow .15s; }
    .ks-input:focus { border-color:#4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.12); background:#fff; }
    .ks-btn-primary { border-radius:999px; background:#4F46E5; color:#fff; font-weight:600; padding:10px 20px; font-size:14px; box-shadow: 0 6px 16px -6px rgba(79,70,229,0.55); transition: filter .15s, transform .1s; }
    .ks-btn-primary:hover { filter: brightness(1.07); }
    .ks-btn-primary:active { transform: scale(.96); }
    .ks-btn-primary:disabled { opacity:.4; box-shadow:none; }
    .ks-btn-outline { border-radius:999px; border:1.5px solid #000000; color:#000000; font-weight:600; padding:9px 18px; font-size:14px; transition: background .15s, color .15s, transform .1s; }
    .ks-btn-outline:hover { background:#000000; color:#fff; }
    .ks-btn-outline:active { transform: scale(.96); }
    .ks-qtybtn { width:26px; height:26px; border-radius:999px; background:#E7E9F3; display:flex; align-items:center; justify-content:center; transition: background .15s, transform .1s; }
    .ks-qtybtn:hover { background:#E4DFD2; }
    .ks-qtybtn:active { transform: scale(.9); }

    .ks-hero {
      background: linear-gradient(135deg, #4F46E5 0%, #129C81 55%, #818CF8 100%);
      border-radius: 26px;
      color: #fff;
      box-shadow: 0 22px 40px -20px rgba(79,70,229,0.6);
      position: relative;
      overflow: hidden;
    }
    .ks-hero::after {
      content: '';
      position: absolute;
      right: -40px; top: -60px;
      width: 220px; height: 220px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
    }
    .ks-hero-chip { background: rgba(255,255,255,0.16); backdrop-filter: blur(4px); }

    @keyframes ks-pop { 0% { transform: scale(0.85); opacity: 0; } 60% { transform: scale(1.04); opacity:1;} 100% { transform: scale(1);} }
    @keyframes ks-fade-up { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
    @keyframes ks-pulse-dot { 0%,100% { opacity:1; } 50% { opacity:.35; } }
    .ks-pop { animation: ks-pop .4s cubic-bezier(.34,1.56,.64,1); }
    .ks-fade-up { animation: ks-fade-up .35s ease-out; }
    .ks-pulse { animation: ks-pulse-dot 1.6s ease-in-out infinite; }

    .ks-print-only { display: none; }

    /* Layout — plain CSS + real media queries, not Tailwind responsive classes,
       so this reliably works even without a JIT compiler in the sandbox. */
    .ks-mobile-bar { display: flex; }
    .ks-mobile-overlay { display: block; }
    .ks-sidebar-wrap { position: fixed; top: 0; left: -288px; height: 100vh; width: 288px; z-index: 40; transition: left .2s ease; }
    .ks-sidebar-wrap.open { left: 0; }
    .ks-main { padding-top: 56px; }
    .ks-page-pad { padding-left: 16px; padding-right: 16px; }
    .ks-billing-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 1024px) {
      .ks-mobile-bar { display: none; }
      .ks-mobile-overlay { display: none; }
      .ks-sidebar-wrap { position: sticky; left: 0; }
      .ks-main { padding-top: 0; }
      .ks-page-pad { padding-left: 32px; padding-right: 32px; }
      .ks-billing-grid { grid-template-columns: 3fr 2fr; }
    }
    @media print {
      body * { visibility: hidden; }
      .ks-print-only, .ks-print-only * { visibility: visible; }
      .ks-print-only { display: block !important; position: absolute; top: 0; left: 0; width: 100%; }
      .ks-no-print { display: none !important; }
    }
  `}</style>
);

// ---------- Sample seed data ----------
const KIRANA_SEED_ITEMS = [
  { code: "01", name: "Aashirvaad Atta 5kg", hindiName: "आटा", category: "Atta & Flour", unit: "pcs", price: 245, costPrice: 210, stock: 18, lowAt: 5, quick: true },
  { code: "02", name: "Tata Salt 1kg", hindiName: "नमक", category: "Grocery", unit: "pcs", price: 25, costPrice: 19, stock: 40, lowAt: 10, quick: false },
  { code: "03", name: "Fortune Sunflower Oil 1L", hindiName: "तेल", category: "Oil & Ghee", unit: "pcs", price: 165, costPrice: 142, stock: 12, lowAt: 6, quick: true },
  { code: "04", name: "Toor Dal (Arhar)", hindiName: "दाल", category: "Pulses", unit: "kg", price: 148, costPrice: 126, stock: 22, lowAt: 5, quick: false },
  { code: "05", name: "Basmati Rice", hindiName: "चावल", category: "Rice", unit: "kg", price: 92, costPrice: 76, stock: 35, lowAt: 8, quick: false },
  { code: "06", name: "Sugar", hindiName: "चीनी", category: "Grocery", unit: "kg", price: 44, costPrice: 39, stock: 3, lowAt: 5, quick: true },
  { code: "07", name: "Amul Toned Milk", hindiName: "दूध", category: "Dairy", unit: "pcs", price: 27, costPrice: 24, stock: 24, lowAt: 10, quick: true },
  { code: "08", name: "Parle-G Biscuit", hindiName: "बिस्कुट", category: "Snacks", unit: "pcs", price: 10, costPrice: 8, stock: 60, lowAt: 15, quick: true },
  { code: "09", name: "Maggi Noodles", hindiName: "मैगी", category: "Snacks", unit: "pcs", price: 14, costPrice: 11, stock: 4, lowAt: 10, quick: true },
  { code: "10", name: "Red Label Tea 250g", hindiName: "चाय", category: "Tea & Coffee", unit: "pcs", price: 130, costPrice: 108, stock: 15, lowAt: 5, quick: false },
];
const SUPERMARKET_SEED_ITEMS = [
  { code: "01", name: "Colgate Toothpaste 150g", category: "Personal Care", unit: "pcs", price: 95, costPrice: 78, stock: 30, lowAt: 8, quick: true },
  { code: "02", name: "Dettol Soap (pack of 4)", category: "Personal Care", unit: "pcs", price: 180, costPrice: 150, stock: 20, lowAt: 5, quick: false },
  { code: "03", name: "Surf Excel 1kg", category: "Household", unit: "pcs", price: 145, costPrice: 122, stock: 25, lowAt: 6, quick: true },
  { code: "04", name: "Lay's Chips 52g", category: "Snacks", unit: "pcs", price: 20, costPrice: 15, stock: 80, lowAt: 20, quick: true },
  { code: "05", name: "Coca-Cola 750ml", category: "Beverages", unit: "pcs", price: 45, costPrice: 36, stock: 36, lowAt: 10, quick: true },
  { code: "06", name: "Britannia Bread", category: "Bakery", unit: "pcs", price: 45, costPrice: 36, stock: 14, lowAt: 5, quick: true },
  { code: "07", name: "Frozen Green Peas 500g", category: "Frozen", unit: "pcs", price: 65, costPrice: 52, stock: 18, lowAt: 5, quick: false },
  { code: "08", name: "Head & Shoulders Shampoo 340ml", category: "Personal Care", unit: "pcs", price: 320, costPrice: 265, stock: 10, lowAt: 3, quick: false },
  { code: "09", name: "Eggs (tray of 6)", category: "Dairy & Eggs", unit: "pcs", price: 42, costPrice: 34, stock: 22, lowAt: 6, quick: true },
  { code: "10", name: "Basmati Rice 5kg", category: "Grocery", unit: "pcs", price: 460, costPrice: 390, stock: 16, lowAt: 4, quick: false },
];
const AUTOMOBILE_SEED_ITEMS = [
  { code: "01", name: "Engine Oil 1L (Semi-Synthetic)", category: "Lubricants", unit: "pcs", price: 450, costPrice: 370, stock: 24, lowAt: 6, quick: true },
  { code: "02", name: "Brake Pads (Front Set)", category: "Brakes", unit: "pcs", price: 1200, costPrice: 950, stock: 8, lowAt: 3, quick: true },
  { code: "03", name: "Air Filter", category: "Filters", unit: "pcs", price: 350, costPrice: 270, stock: 15, lowAt: 4, quick: false },
  { code: "04", name: "Spark Plug (set of 4)", category: "Ignition", unit: "pcs", price: 600, costPrice: 480, stock: 12, lowAt: 4, quick: true },
  { code: "05", name: "Car Battery 35Ah", category: "Electrical", unit: "pcs", price: 4500, costPrice: 3800, stock: 5, lowAt: 2, quick: false },
  { code: "06", name: "Wiper Blades (Pair)", category: "Accessories", unit: "pcs", price: 550, costPrice: 420, stock: 10, lowAt: 3, quick: false },
  { code: "07", name: "Tyre 165/80 R14", category: "Tyres", unit: "pcs", price: 3200, costPrice: 2700, stock: 12, lowAt: 4, quick: true },
  { code: "08", name: "Headlight Bulb (H4)", category: "Electrical", unit: "pcs", price: 220, costPrice: 165, stock: 20, lowAt: 5, quick: false },
  { code: "09", name: "Car Air Freshener", category: "Accessories", unit: "pcs", price: 150, costPrice: 100, stock: 30, lowAt: 8, quick: true },
  { code: "10", name: "Seat Cover Set", category: "Accessories", unit: "pcs", price: 2200, costPrice: 1700, stock: 6, lowAt: 2, quick: false },
];
const CLOTHING_SEED_ITEMS = [
  { code: "01", name: "Men's Formal Shirt", category: "Men", unit: "pcs", price: 899, costPrice: 550, stock: 22, lowAt: 5, quick: true },
  { code: "02", name: "Men's Denim Jeans", category: "Men", unit: "pcs", price: 1299, costPrice: 800, stock: 18, lowAt: 4, quick: true },
  { code: "03", name: "Women's Kurti", category: "Women", unit: "pcs", price: 799, costPrice: 480, stock: 25, lowAt: 6, quick: true },
  { code: "04", name: "Women's Saree", category: "Women", unit: "pcs", price: 1899, costPrice: 1200, stock: 12, lowAt: 3, quick: false },
  { code: "05", name: "Kids Frock", category: "Kids", unit: "pcs", price: 549, costPrice: 320, stock: 16, lowAt: 4, quick: false },
  { code: "06", name: "Cotton T-Shirt", category: "Men", unit: "pcs", price: 499, costPrice: 280, stock: 30, lowAt: 8, quick: true },
  { code: "07", name: "Leather Belt", category: "Accessories", unit: "pcs", price: 399, costPrice: 220, stock: 20, lowAt: 5, quick: false },
  { code: "08", name: "Formal Trousers", category: "Men", unit: "pcs", price: 999, costPrice: 620, stock: 14, lowAt: 4, quick: false },
  { code: "09", name: "Women's Handbag", category: "Accessories", unit: "pcs", price: 1199, costPrice: 750, stock: 10, lowAt: 3, quick: true },
  { code: "10", name: "Kids Shoes", category: "Kids", unit: "pcs", price: 649, costPrice: 400, stock: 15, lowAt: 4, quick: false },
];

const SHOP_TYPES = [
  { id: "kirana", label: "Kirana / Grocery", icon: "Store", seed: KIRANA_SEED_ITEMS, sample: "Sharma General Store" },
  { id: "supermarket", label: "Supermarket", icon: "ShoppingCart", seed: SUPERMARKET_SEED_ITEMS, sample: "City Supermarket" },
  { id: "automobile", label: "Automobile / Auto Parts", icon: "Car", seed: AUTOMOBILE_SEED_ITEMS, sample: "Speed Auto Parts" },
  { id: "clothing", label: "Clothing / Boutique", icon: "Shirt", seed: CLOTHING_SEED_ITEMS, sample: "Trendy Boutique" },
  { id: "other", label: "Other business", icon: "Store", seed: [], sample: "My Shop" },
];
function shopTypeInfo(typeId) { return SHOP_TYPES.find((t) => t.id === typeId) || SHOP_TYPES[4]; }
function seedItemsForShop(shopId, typeId) {
  return shopTypeInfo(typeId).seed.map((it) => ({ ...it, id: uid("i"), shopId }));
}

const SAMPLE_CUSTOMERS = [
  { name: "Rohit Verma", phone: "9811122233" },
  { name: "Priya Nair", phone: "9822233344" },
  { name: "Amit Khanna", phone: "9833344455" },
];
// Seeds a handful of realistic past bills (and one udhaar entry) so a freshly
// created shop's dashboard, history, and top-customers views aren't empty.
function seedBillsForShop(shopId, seededItems) {
  if (seededItems.length === 0) return { bills: [], credits: [] };
  const pick = (i) => seededItems[i % seededItems.length];
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  const mkLine = (item, qty) => ({ id: item.id, code: item.code, name: item.name, price: item.price, unit: item.unit, gst: item.gst, qty });

  const bills = [
    { id: uid("b"), billNo: "KS-1001", date: daysAgo(2), customer: SAMPLE_CUSTOMERS[0], items: [mkLine(pick(0), 2), mkLine(pick(1), 1)], paymentType: "cash" },
    { id: uid("b"), billNo: "KS-1002", date: daysAgo(1), customer: SAMPLE_CUSTOMERS[1], items: [mkLine(pick(2), 1), mkLine(pick(3), 3)], paymentType: "cash" },
    { id: uid("b"), billNo: "KS-1003", date: daysAgo(0), customer: SAMPLE_CUSTOMERS[0], items: [mkLine(pick(4), 1)], paymentType: "cash" },
    { id: uid("b"), billNo: "KS-1004", date: daysAgo(0), customer: SAMPLE_CUSTOMERS[2], items: [mkLine(pick(5), 2), mkLine(pick(6), 1)], paymentType: "credit" },
  ].map((b) => {
    const subtotal = b.items.reduce((s, l) => s + l.qty * l.price, 0);
    return { ...b, shopId, subtotal, discountAmount: 0, total: subtotal };
  });

  const creditBill = bills.find((b) => b.paymentType === "credit");
  const credits = creditBill
    ? [{ id: uid("cr"), shopId, phone: creditBill.customer.phone, name: creditBill.customer.name, amount: creditBill.total, type: "charge", note: `Bill ${creditBill.billNo}`, date: creditBill.date }]
    : [];

  return { bills, credits };
}
const SHOP_TYPE_ICONS = { Store, ShoppingCart, Car, Shirt };
function ShopTypeIcon({ type, size = 16 }) {
  const Icon = SHOP_TYPE_ICONS[shopTypeInfo(type).icon] || Store;
  return <Icon size={size} />;
}

function nextCode(items) {
  const used = new Set(items.map((i) => i.code));
  for (let n = 1; n <= 99; n++) {
    const c = String(n).padStart(2, "0");
    if (!used.has(c)) return c;
  }
  return String(items.length + 1).padStart(2, "0");
}

const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const rupee = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const todayStr = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function billMessageText(bill, storeName, gstin) {
  const lines = bill.items.map((it) => `• ${it.name} x ${it.qty}${it.unit} — ${rupee(it.qty * it.price)}`).join("\n");
  const { taxable, taxAmt } = taxBreakup(bill.items);
  const taxLine = taxAmt > 0 ? `\nTaxable: ${rupee(taxable)}\nGST: ${rupee(taxAmt)}\n` : "";
  const gstinLine = gstin ? `GSTIN: ${gstin}\n` : "";
  return `*${storeName}*\n${gstinLine}Bill No: ${bill.billNo}\nDate: ${new Date(bill.date).toLocaleString("en-IN")}\n\n${lines}\n${taxLine}\n*Total: ${rupee(bill.total)}*\n\nThank you for shopping with us!`;
}

function whatsappLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(text)}`;
}

// Builds a standard UPI deep link (opens any UPI app on a phone) and a QR code
// image of it (via a public QR-rendering service, since no QR library ships here).
function upiUri(upiId, payeeName, amount, note) {
  const params = new URLSearchParams({
    pa: upiId, pn: payeeName, am: amount ? String(Math.round(amount * 100) / 100) : "", cu: "INR", tn: note || "",
  });
  return `upi://pay?${params.toString()}`;
}
function upiQrImageUrl(uri, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(uri)}`;
}

function customerBalance(credits, phone) {
  return credits.filter((c) => c.phone === phone).reduce((s, c) => s + (c.type === "charge" ? c.amount : -c.amount), 0);
}

function creditReminderText(storeName, name, balance) {
  return `*${storeName}*\nHi ${name || "there"}, this is a friendly reminder that your outstanding balance (udhaar) is *${rupee(balance)}*. Please settle at your convenience. Thank you!`;
}

// Tax breakup assuming line prices are GST-inclusive (standard for retail).
function taxBreakup(billItems) {
  let taxable = 0, taxAmt = 0;
  (billItems || []).forEach((it) => {
    const lineTotal = it.qty * it.price;
    if (it.gst) {
      const base = lineTotal * 100 / (100 + it.gst);
      taxable += base;
      taxAmt += lineTotal - base;
    } else {
      taxable += lineTotal;
    }
  });
  return { taxable: Math.round(taxable * 100) / 100, taxAmt: Math.round(taxAmt * 100) / 100 };
}

function topCustomers(bills, limit = 5) {
  const map = new Map();
  bills.forEach((b) => {
    const phone = (b.customer?.phone || "").replace(/\D/g, "");
    if (!phone) return;
    const cur = map.get(phone) || { phone, name: b.customer.name || "Customer", total: 0, visits: 0 };
    cur.total += b.total;
    cur.visits += 1;
    cur.name = b.customer.name || cur.name;
    map.set(phone, cur);
  });
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

function weeklyDigestText(storeName, weekBills, items, lowStockCount, outstandingCredit) {
  const sales = weekBills.reduce((s, b) => s + b.total, 0);
  const profit = weekBills.reduce((sum, b) => sum + b.items.reduce((s, line) => {
    const cur = items.find((i) => i.id === line.id);
    return s + (line.price - (cur?.costPrice ?? 0)) * line.qty;
  }, 0), 0);
  const qtyByItem = new Map();
  weekBills.forEach((b) => b.items.forEach((line) => qtyByItem.set(line.name, (qtyByItem.get(line.name) || 0) + line.qty * line.price)));
  const topSellers = [...qtyByItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name], i) => `${i + 1}. ${name}`).join("\n") || "—";
  return `*${storeName} — Weekly Shop Health*\n\n📈 Sales (7 days): *${rupee(sales)}*\n💰 Profit (7 days): *${rupee(profit)}*\n🧾 Bills: ${weekBills.length}\n\n🏆 Top sellers:\n${topSellers}\n\n⚠️ Low stock items: ${lowStockCount}\n🪙 Outstanding udhaar: ${rupee(outstandingCredit)}\n\nHave a great week ahead!`;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

// ---------- Voice billing helpers (English + Hindi) ----------
const NUM_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, dozen: 12,
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10, "आधा": 0.5, "दर्जन": 12,
};
const UNIT_WORD_MAP = {
  g: "g", gm: "g", gms: "g", gram: "g", grams: "g",
  kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
  ml: "ml", millilitre: "ml", millilitres: "ml", milliliter: "ml", milliliters: "ml",
  l: "l", litre: "l", litres: "l", liter: "l", liters: "l",
  pcs: "pcs", piece: "pcs", pieces: "pcs", packet: "packet", packets: "packet",
  "किलो": "kg", "किलोग्राम": "kg", "ग्राम": "g", "ग्रा": "g", "लीटर": "l", "मिली": "ml", "मिलीलीटर": "ml", "पीस": "pcs", "पैकेट": "packet",
};
// Extracts a spoken quantity (digits or number-words) plus any unit spoken alongside it
// (e.g. "250 grams", "1.5 liters"), then converts it into the item's actual stock unit
// so grams/kg and ml/litres are both accepted no matter which one is said.
function parseSpokenQuantity(text, itemUnit) {
  const t = text.toLowerCase();
  let qty = null;
  let spokenUnit = null;

  const digitMatch = t.match(/(\d+(\.\d+)?)\s*([a-z]+)?/);
  if (digitMatch) {
    qty = parseFloat(digitMatch[1]);
    if (digitMatch[3] && UNIT_WORD_MAP[digitMatch[3]]) spokenUnit = UNIT_WORD_MAP[digitMatch[3]];
  } else {
    const words = t.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (NUM_WORDS[words[i]] !== undefined) {
        qty = NUM_WORDS[words[i]];
        if (words[i + 1] && UNIT_WORD_MAP[words[i + 1]]) spokenUnit = UNIT_WORD_MAP[words[i + 1]];
        break;
      }
    }
  }
  if (qty == null) return null;
  if (!spokenUnit || !itemUnit || spokenUnit === itemUnit) return qty;
  if (spokenUnit === "g" && itemUnit === "kg") return qty / 1000;
  if (spokenUnit === "kg" && itemUnit === "g") return qty * 1000;
  if (spokenUnit === "ml" && itemUnit === "l") return qty / 1000;
  if (spokenUnit === "l" && itemUnit === "ml") return qty * 1000;
  return qty; // no matching conversion (e.g. said "liters" for a pcs item) — use the raw number
}
const VOICE_STOPWORDS = ["add", "please", "kg", "kgs", "kilo", "kilos", "liter", "litre", "liters", "litres", "l", "ml", "gram", "grams", "gms", "gm", "g", "pcs", "piece", "pieces", "packet", "packets", "of", "the", "a", "an", "to", "bill", "and", "जोड़ो", "डालो", "डालिए", "कृपया", "का", "की", "के", "और", "बिल", "में", "को", "से"];
function matchItemFromSpeech(items, transcript) {
  const t = transcript.toLowerCase().trim();
  const codeMatch = t.match(/\b(\d{2})\b/);
  if (codeMatch) {
    const byCode = items.find((i) => i.code === codeMatch[1]);
    if (byCode) return byCode;
  }
  let stripped = t.replace(/\d+(\.\d+)?/g, " ");
  Object.keys(NUM_WORDS).forEach((w) => { stripped = stripped.replace(new RegExp(`\\b${w}\\b`, "g"), " "); });
  VOICE_STOPWORDS.forEach((w) => { stripped = stripped.replace(new RegExp(`\\b${w}\\b`, "g"), " "); });
  stripped = stripped.replace(/\s+/g, " ").trim();
  if (!stripped) return null;

  let best = null, bestScore = 0;
  items.forEach((i) => {
    const name = i.name.toLowerCase();
    const hindiName = (i.hindiName || "").toLowerCase();
    let score = 0;
    if (name.includes(stripped)) score += 5;
    if (hindiName && hindiName.includes(stripped)) score += 5;
    stripped.split(" ").forEach((w) => {
      if (w.length > 1 && (name.includes(w) || hindiName.includes(w))) score += 1;
    });
    if (i.category.toLowerCase().includes(stripped)) score += 1;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return bestScore > 0 ? best : null;
}

const STORAGE_KEY = "kirana-data-v3-restyle";

// ---------- Category color chips ----------
const CHIP_PALETTE = [
  { bg: "#E4F5F0", text: "#4F46E5" },
  { bg: "#FCEEDA", text: "#B5720B" },
  { bg: "#FDEAEA", text: "#C13F45" },
  { bg: "#EAEBFD", text: "#4B4FC1" },
  { bg: "#FDEAF6", text: "#B5399C" },
  { bg: "#E9F3FD", text: "#1D6FB5" },
];
function categoryColor(category) {
  let h = 0;
  for (let i = 0; i < (category || "").length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return CHIP_PALETTE[h % CHIP_PALETTE.length];
}
function CategoryChip({ category }) {
  const c = categoryColor(category);
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
      {category}
    </span>
  );
}

// Shows the item's photo if one was set, otherwise a colored initial-letter
// placeholder in the same category color used for its chip.
function ItemThumb({ item, size = 32 }) {
  const c = categoryColor(item.category || "");
  if (item.image) {
    return (
      <img
        src={item.image}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }}
      />
    );
  }
  return (
    <div
      className="rounded-lg flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.4 }}
    >
      {(item.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ---------- Low-stock alert helpers ----------
function notifySupported() {
  return typeof window !== "undefined" && "Notification" in window;
}
function sendDeviceAlert(item) {
  if (!notifySupported() || Notification.permission !== "granted") return;
  try {
    new Notification("Stock running low", {
      body: `${item.name} — only ${item.stock} ${item.unit} left. Please refill before it runs out.`,
      tag: `low-${item.id}`,
    });
  } catch (e) {}
}

export default function KiranaApp() {
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showStoreSettings, setShowStoreSettings] = useState(false);
  const [shops, setShops] = useState(() => {
    const id = uid("shop");
    return [{ id, name: "Sharma General Store", type: "kirana", gstin: "", upiId: "" }];
  });
  const [activeShopId, setActiveShopId] = useState(() => null); // resolved below once shops is known
  const [items, setItems] = useState(() => []);
  const [movements, setMovements] = useState([]);
  const [bills, setBills] = useState([]);
  const [credits, setCredits] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [draws, setDraws] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState(notifySupported() ? Notification.permission : "unsupported");
  const online = useOnlineStatus();

  // First-run seed: give the default Kirana shop its starter items + a few sample bills once shops/items are both known.
  useEffect(() => {
    if (activeShopId === null && shops.length > 0) {
      setActiveShopId(shops[0].id);
      setItems((prev) => {
        if (prev.length > 0) return prev;
        const seeded = seedItemsForShop(shops[0].id, shops[0].type);
        const { bills: sBills, credits: sCredits } = seedBillsForShop(shops[0].id, seeded);
        setBills((pb) => (pb.length === 0 ? sBills : pb));
        setCredits((pc) => (pc.length === 0 ? sCredits : pc));
        return seeded;
      });
    }
  }, [activeShopId, shops]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage?.get?.(STORAGE_KEY);
        if (res?.value) {
          const p = JSON.parse(res.value);
          if (p.shops && p.shops.length) setShops(p.shops);
          if (p.activeShopId) setActiveShopId(p.activeShopId);
          if (p.items) setItems(p.items);
          if (p.movements) setMovements(p.movements);
          if (p.bills) setBills(p.bills);
          if (p.credits) setCredits(p.credits);
          if (p.reconciliations) setReconciliations(p.reconciliations);
          if (p.draws) setDraws(p.draws);
          if (p.expenses) setExpenses(p.expenses);
          if (p.suppliers) setSuppliers(p.suppliers);
          if (p.ownerPhone) setOwnerPhone(p.ownerPhone);
          if (typeof p.notifyEnabled === "boolean") setNotifyEnabled(p.notifyEnabled);
        }
      } catch (e) {}
      finally { setLoaded(true); }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try {
        await window.storage?.set?.(STORAGE_KEY, JSON.stringify({ shops, activeShopId, items, movements, bills, credits, reconciliations, draws, expenses, suppliers, ownerPhone, notifyEnabled }));
      } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [shops, activeShopId, items, movements, bills, credits, reconciliations, draws, expenses, suppliers, ownerPhone, notifyEnabled, loaded]);

  function showToast(msg, tone = "ok") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  }

  const activeShop = shops.find((s) => s.id === activeShopId) || shops[0];

  function addShop(name, type) {
    const id = uid("shop");
    const shop = { id, name, type, gstin: "", upiId: "" };
    const seeded = seedItemsForShop(id, type);
    const { bills: sBills, credits: sCredits } = seedBillsForShop(id, seeded);
    setShops((prev) => [...prev, shop]);
    setItems((prev) => [...prev, ...seeded]);
    setBills((prev) => [...prev, ...sBills]);
    setCredits((prev) => [...prev, ...sCredits]);
    setActiveShopId(id);
    showToast(`${name} created`);
  }

  function renameActiveShop(name) {
    setShops((prev) => prev.map((s) => (s.id === activeShopId ? { ...s, name } : s)));
  }
  function setActiveShopGstin(g) {
    setShops((prev) => prev.map((s) => (s.id === activeShopId ? { ...s, gstin: g } : s)));
  }
  function setActiveShopUpiId(u) {
    setShops((prev) => prev.map((s) => (s.id === activeShopId ? { ...s, upiId: u } : s)));
  }

  // Scoped views + wrapper setters: children keep operating on "their" array as if it were the whole thing,
  // and every record gets stamped with the active shop's id when merged back.
  const shopItems = useMemo(() => items.filter((i) => i.shopId === activeShopId), [items, activeShopId]);
  function setShopItems(updater) {
    setItems((prev) => {
      const others = prev.filter((i) => i.shopId !== activeShopId);
      const mine = prev.filter((i) => i.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopMovements = useMemo(() => movements.filter((m) => m.shopId === activeShopId), [movements, activeShopId]);
  function setShopMovements(updater) {
    setMovements((prev) => {
      const others = prev.filter((m) => m.shopId !== activeShopId);
      const mine = prev.filter((m) => m.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopBills = useMemo(() => bills.filter((b) => b.shopId === activeShopId), [bills, activeShopId]);
  function setShopBills(updater) {
    setBills((prev) => {
      const others = prev.filter((b) => b.shopId !== activeShopId);
      const mine = prev.filter((b) => b.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopCredits = useMemo(() => credits.filter((c) => c.shopId === activeShopId), [credits, activeShopId]);
  function setShopCredits(updater) {
    setCredits((prev) => {
      const others = prev.filter((c) => c.shopId !== activeShopId);
      const mine = prev.filter((c) => c.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopReconciliations = useMemo(() => reconciliations.filter((r) => r.shopId === activeShopId), [reconciliations, activeShopId]);
  function setShopReconciliations(updater) {
    setReconciliations((prev) => {
      const others = prev.filter((r) => r.shopId !== activeShopId);
      const mine = prev.filter((r) => r.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopDraws = useMemo(() => draws.filter((d) => d.shopId === activeShopId), [draws, activeShopId]);
  function setShopDraws(updater) {
    setDraws((prev) => {
      const others = prev.filter((d) => d.shopId !== activeShopId);
      const mine = prev.filter((d) => d.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopExpenses = useMemo(() => expenses.filter((e) => e.shopId === activeShopId), [expenses, activeShopId]);
  function setShopExpenses(updater) {
    setExpenses((prev) => {
      const others = prev.filter((e) => e.shopId !== activeShopId);
      const mine = prev.filter((e) => e.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }
  const shopSuppliers = useMemo(() => suppliers.filter((s) => s.shopId === activeShopId), [suppliers, activeShopId]);
  function setShopSuppliers(updater) {
    setSuppliers((prev) => {
      const others = prev.filter((s) => s.shopId !== activeShopId);
      const mine = prev.filter((s) => s.shopId === activeShopId);
      const updatedMine = (typeof updater === "function" ? updater(mine) : updater).map((x) => ({ ...x, shopId: activeShopId }));
      return [...others, ...updatedMine];
    });
  }

  async function enableAlerts() {
    if (!notifySupported()) return showToast("This browser doesn't support device alerts", "err");
    const perm = await Notification.requestPermission();
    setNotifyPermission(perm);
    if (perm === "granted") {
      setNotifyEnabled(true);
      showToast("Low-stock alerts turned on");
      shopItems.filter((i) => i.stock <= i.lowAt).forEach((i) => sendDeviceAlert(i));
    } else {
      showToast("Alert permission was not granted", "warn");
    }
  }

  function checkLowStockCrossing(itemBefore, newStock) {
    const wasAbove = itemBefore.stock > itemBefore.lowAt;
    const nowAtOrBelow = newStock <= itemBefore.lowAt;
    if (wasAbove && nowAtOrBelow) {
      const updated = { ...itemBefore, stock: newStock };
      showToast(`Low stock: ${itemBefore.name} — refill before it runs out`, "warn");
      if (notifyEnabled) sendDeviceAlert(updated);
    }
  }

  const lowStockCount = useMemo(() => shopItems.filter((i) => i.stock <= i.lowAt).length, [shopItems]);
  const stockValue = useMemo(() => shopItems.reduce((s, i) => s + i.stock * i.price, 0), [shopItems]);
  const todaysBills = useMemo(() => {
    const t = new Date().toDateString();
    return shopBills.filter((b) => new Date(b.date).toDateString() === t);
  }, [shopBills]);
  const todaysSales = useMemo(() => todaysBills.reduce((s, b) => s + b.total, 0), [todaysBills]);
  const todaysCashSales = useMemo(() => todaysBills.filter((b) => b.paymentType !== "credit").reduce((s, b) => s + b.total, 0), [todaysBills]);
  const todaysDraws = useMemo(() => {
    const t = new Date().toDateString();
    return shopDraws.filter((d) => new Date(d.date).toDateString() === t).reduce((s, d) => s + d.amount, 0);
  }, [shopDraws]);
  const todaysProfit = useMemo(() => {
    return todaysBills.reduce((sum, b) => {
      const billProfit = b.items.reduce((s, line) => {
        const current = shopItems.find((i) => i.id === line.id);
        const cost = current ? current.costPrice ?? 0 : 0;
        return s + (line.price - cost) * line.qty;
      }, 0);
      return sum + billProfit;
    }, 0);
  }, [todaysBills, shopItems]);
  const todaysExpenses = useMemo(() => {
    const t = new Date().toDateString();
    return shopExpenses.filter((e) => new Date(e.date).toDateString() === t).reduce((s, e) => s + e.amount, 0);
  }, [shopExpenses]);
  const outstandingCredit = useMemo(() => {
    const phones = [...new Set(shopCredits.map((c) => c.phone))];
    return phones.reduce((s, ph) => s + Math.max(0, customerBalance(shopCredits, ph)), 0);
  }, [shopCredits]);

  if (!loaded || !activeShop) {
    return (
      <div className="ks-root flex items-center justify-center min-h-screen">
        <GlobalStyle />
        <p className="ks-mono text-sm text-[#6B7280]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="ks-root min-h-screen flex">
      <GlobalStyle />

      {/* Mobile top bar with hamburger */}
      <div className="ks-no-print ks-mobile-bar fixed top-0 left-0 right-0 z-30 bg-[#000000] text-white items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center">
          <Menu size={20} />
        </button>
        <span className="text-sm font-bold truncate px-2">{activeShop.name}</span>
        <div style={{ width: 32 }} />
      </div>

      {sidebarOpen && <div className="ks-no-print ks-mobile-overlay fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}

      <div className={`ks-no-print ks-sidebar-wrap${sidebarOpen ? " open" : ""}`}>
        <Sidebar
          shops={shops} activeShopId={activeShopId} setActiveShopId={setActiveShopId} tab={tab} setTab={setTab} lowStockCount={lowStockCount}
          onAddShop={() => setShowAddShop(true)}
          onOpenSettings={() => setShowStoreSettings(true)}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {showAddShop && <AddShopModal onClose={() => setShowAddShop(false)} onAdd={addShop} />}
      {showStoreSettings && (
        <StoreSettingsModal
          storeName={activeShop.name} setStoreName={renameActiveShop}
          gstin={activeShop.gstin} setGstin={setActiveShopGstin}
          upiId={activeShop.upiId} setUpiId={setActiveShopUpiId}
          ownerPhone={ownerPhone} setOwnerPhone={setOwnerPhone}
          onClose={() => setShowStoreSettings(false)}
        />
      )}

      <div className="ks-main flex-1 min-w-0">
        {!online && (
          <div className="ks-no-print ks-page-pad pt-4">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium" style={{ background: "#EAEBFD", color: "#4B4FC1" }}>
              📶 You're offline — the app keeps working on this device, and everything stays saved here.
            </div>
          </div>
        )}
        <AlertBanner lowStockCount={lowStockCount} notifyEnabled={notifyEnabled} notifyPermission={notifyPermission} onEnable={enableAlerts} setTab={setTab} />
        <div className="ks-page-pad pb-16 max-w-5xl">
          {tab === "dashboard" && (
            <Dashboard
              items={shopItems} bills={shopBills} lowStockCount={lowStockCount} stockValue={stockValue}
              todaysSales={todaysSales} todaysProfit={todaysProfit} todaysExpenses={todaysExpenses} outstandingCredit={outstandingCredit}
              todaysBills={todaysBills} movements={shopMovements} setTab={setTab}
              storeName={activeShop.name} ownerPhone={ownerPhone} setOwnerPhone={setOwnerPhone} showToast={showToast}
            />
          )}
          {tab === "inventory" && (
            <Inventory items={shopItems} setItems={setShopItems} movements={shopMovements} setMovements={setShopMovements} bills={shopBills} suppliers={shopSuppliers} showToast={showToast} checkLowStockCrossing={checkLowStockCrossing} />
          )}
          {tab === "billing" && (
            <Billing items={shopItems} setItems={setShopItems} bills={shopBills} setBills={setShopBills} credits={shopCredits} setCredits={setShopCredits} storeName={activeShop.name} gstin={activeShop.gstin} upiId={activeShop.upiId} showToast={showToast} checkLowStockCrossing={checkLowStockCrossing} />
          )}
          {tab === "history" && <History bills={shopBills} storeName={activeShop.name} gstin={activeShop.gstin} />}
          {tab === "credit" && <CreditBook credits={shopCredits} setCredits={setShopCredits} storeName={activeShop.name} upiId={activeShop.upiId} showToast={showToast} />}
          {tab === "dayclose" && (
            <DayClose
              todaysCashSales={todaysCashSales} todaysDraws={todaysDraws} draws={shopDraws} setDraws={setShopDraws}
              reconciliations={shopReconciliations} setReconciliations={setShopReconciliations}
            />
          )}
          {tab === "expenses" && <Expenses expenses={shopExpenses} setExpenses={setShopExpenses} showToast={showToast} />}
          {tab === "cashbook" && <Cashbook bills={shopBills} draws={shopDraws} expenses={shopExpenses} credits={shopCredits} movements={shopMovements} items={shopItems} />}
          {tab === "suppliers" && <Suppliers suppliers={shopSuppliers} setSuppliers={setShopSuppliers} movements={shopMovements} showToast={showToast} />}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} tone={toast.tone} />}
    </div>
  );
}

// ---------- Sidebar (shop dropdown + navigation) ----------
function Sidebar({ shops, activeShopId, setActiveShopId, onAddShop, tab, setTab, lowStockCount, onOpenSettings, onNavigate }) {
  const activeShop = shops.find((s) => s.id === activeShopId);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "billing", label: "New Bill", icon: Receipt },
    { id: "history", label: "History", icon: Clock },
    { id: "credit", label: "Udhaar", icon: Wallet },
    { id: "dayclose", label: "Day Close", icon: Calculator },
    { id: "expenses", label: "Expenses", icon: Wallet2 },
    { id: "cashbook", label: "Cashbook", icon: BookOpen },
    { id: "suppliers", label: "Suppliers", icon: Truck },
  ];

  return (
    <div className="h-full flex flex-col bg-[#000000] text-white">
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)" }}>
            <ShopTypeIcon type={activeShop.type} size={17} />
          </div>
          <div className="relative flex-1 min-w-0">
            <select
              value={activeShopId}
              onChange={(e) => setActiveShopId(e.target.value)}
              className="w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-sm font-bold bg-white/10 text-white border border-white/15 focus:outline-none focus:border-white/40"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id} style={{ color: "#000" }}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50" />
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-white/50">{shopTypeInfo(activeShop.type).label}</span>
          <button onClick={onAddShop} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#818CF8" }}>
            <Plus size={12} /> Add shop
          </button>
        </div>
      </div>

      <p className="px-5 pt-3 text-xs text-white/40">{greeting()} 👋</p>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto ks-scroll">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); onNavigate?.(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? "bg-[#4F46E5] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={17} />
              {item.label}
              {item.id === "inventory" && lowStockCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5484D] text-white text-[10px] font-bold">{lowStockCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="ks-mono text-[11px] text-white/40 px-3.5 pb-2">{todayStr()}</div>
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">
          <Settings size={17} /> Store settings
        </button>
      </div>
    </div>
  );
}

function AddShopModal({ onClose, onAdd }) {
  const [type, setType] = useState("kirana");
  const [name, setName] = useState(shopTypeInfo("kirana").sample);
  return (
    <Modal title="Add a new shop" onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Business type">
          <div className="grid grid-cols-2 gap-2">
            {SHOP_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setType(t.id); setName(t.sample); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  type === t.id ? "border-[#4F46E5] bg-[#EEF0FE] text-[#4F46E5]" : "border-[#E2E4F0] text-[#6B7280]"
                }`}
              >
                <ShopTypeIcon type={t.id} size={15} /> {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Shop name"><input className="ks-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <p className="text-xs text-[#6B7280]">We'll pre-fill a few starter items for this business type so it's ready to use right away.</p>
        <button disabled={!name.trim()} onClick={() => onAdd(name.trim(), type)} className="ks-btn-primary w-full">Create shop</button>
      </div>
    </Modal>
  );
}

function StoreSettingsModal({ storeName, setStoreName, gstin, setGstin, upiId, setUpiId, ownerPhone, setOwnerPhone, onClose }) {
  const [n, setN] = useState(storeName || "");
  const [g, setG] = useState(gstin || "");
  const [u, setU] = useState(upiId || "");
  const [p, setP] = useState(ownerPhone || "");
  return (
    <Modal title="Store settings" onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Store name"><input className="ks-input" value={n} onChange={(e) => setN(e.target.value)} /></Field>
        <Field label="UPI ID (optional — lets customers pay by scanning a QR code)">
          <input className="ks-input" value={u} onChange={(e) => setU(e.target.value)} placeholder="e.g. shopname@upi" />
        </Field>
        <Field label="GSTIN (optional — shows on printed/WhatsApp bills)">
          <input className="ks-input ks-mono" value={g} onChange={(e) => setG(e.target.value.toUpperCase())} placeholder="e.g. 07AAAAA0000A1Z5" />
        </Field>
        <Field label="Owner's WhatsApp number (for the weekly digest)">
          <input className="ks-input" value={p} onChange={(e) => setP(e.target.value)} placeholder="10-digit mobile number" />
        </Field>
        <button
          onClick={() => { setStoreName(n.trim() || storeName); setGstin(g.trim()); setUpiId(u.trim()); setOwnerPhone(p.trim()); onClose(); }}
          className="ks-btn-primary w-full"
        >
          Save settings
        </button>
      </div>
    </Modal>
  );
}

function AlertBanner({ lowStockCount, notifyEnabled, notifyPermission, onEnable, setTab }) {
  if (notifyEnabled) {
    if (lowStockCount === 0) return null;
    return (
      <div className="ks-no-print max-w-6xl mx-auto px-4 pt-4 ks-fade-up">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#FDEAEA" }}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-[#C13F45]" />
            <span className="text-sm font-medium text-[#8A2A2E]">
              {lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} running low — refill before it runs out.
            </span>
          </div>
          <button onClick={() => setTab("inventory")} className="text-xs font-bold text-[#C13F45] flex items-center gap-0.5 shrink-0">
            View items <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }
  if (notifyPermission === "unsupported") return null;
  return (
    <div className="ks-no-print max-w-6xl mx-auto px-4 pt-4">
      <div className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#FCEEDA" }}>
        <div className="flex items-center gap-2.5">
          <Bell size={18} className="text-[#B5720B]" />
          <span className="text-sm font-medium text-[#7A5209]">Turn on device alerts to get notified the moment any item runs low.</span>
        </div>
        <button onClick={onEnable} className="px-3.5 py-1.5 rounded-full bg-[#000000] text-white text-xs font-bold shrink-0">
          Enable alerts
        </button>
      </div>
    </div>
  );
}

function Toast({ msg, tone }) {
  const styles = {
    err: { bg: "#E5484D", icon: <AlertTriangle size={16} /> },
    warn: { bg: "#F2A93B", icon: <AlertTriangle size={16} /> },
    ok: { bg: "#4F46E5", icon: <Receipt size={16} /> },
  }[tone || "ok"];
  return (
    <div className="ks-no-print fixed bottom-5 right-5 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold z-50 flex items-center gap-2 ks-pop" style={{ background: styles.bg }}>
      {styles.icon}
      {msg}
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ items, bills, lowStockCount, stockValue, todaysSales, todaysProfit, outstandingCredit, todaysBills, movements, setTab, storeName, ownerPhone, setOwnerPhone, showToast }) {
  const lowItems = items.filter((i) => i.stock <= i.lowAt);
  const recentMoves = [...movements].slice(-6).reverse();
  const [detail, setDetail] = useState(null); // 'items' | 'value' | 'low' | 'profit'
  const [askPhone, setAskPhone] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);
  const bestCustomers = useMemo(() => topCustomers(bills, 5), [bills]);

  function sendDigest() {
    if (!ownerPhone) { setAskPhone(true); return; }
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekBills = bills.filter((b) => new Date(b.date).getTime() >= weekAgo);
    const text = weeklyDigestText(storeName, weekBills, items, lowStockCount, outstandingCredit);
    window.open(whatsappLink(ownerPhone, text), "_blank");
  }

  return (
    <div className="pt-6">
      <div className="ks-hero p-6 sm:p-7 mb-4">
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="ks-hero-chip inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <TrendingUp size={13} /> Today's sales
            </div>
            <div className="ks-display text-4xl sm:text-5xl font-extrabold">{rupee(todaysSales)}</div>
            <p className="text-sm text-white/80 mt-1.5">{todaysBills.length} bill{todaysBills.length === 1 ? "" : "s"} · profit ~{rupee(todaysProfit)} today</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => setTab("billing")} className="bg-white text-[#4F46E5] font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg hover:brightness-105 active:scale-95 transition">
              <Plus size={17} strokeWidth={2.5} /> New Bill
            </button>
            <button onClick={sendDigest} className="ks-hero-chip text-white text-xs font-semibold px-3.5 py-2 rounded-full flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition">
              <MessageCircle size={14} /> Send weekly digest
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        <StatCard icon={<Package size={18} />} iconBg="linear-gradient(135deg,#4F46E5,#818CF8)" label="Items in stock" value={items.length} onClick={() => setDetail("items")} />
        <StatCard icon={<Wallet size={18} />} iconBg="linear-gradient(135deg,#4B4FC1,#7A7DE0)" label="Stock value" value={rupee(stockValue)} onClick={() => setDetail("value")} />
        <StatCard icon={<AlertTriangle size={18} />} iconBg="linear-gradient(135deg,#E5484D,#F2828A)" label="Low stock" value={lowStockCount} onClick={() => setDetail("low")} />
        <StatCard icon={<TrendingUp size={18} />} iconBg="linear-gradient(135deg,#F2A93B,#F2C56B)" label="Today's profit" value={rupee(todaysProfit)} onClick={() => setDetail("profit")} />
        <StatCard icon={<Wallet size={18} />} iconBg="linear-gradient(135deg,#B5399C,#D97BC6)" label="Outstanding udhaar" value={rupee(outstandingCredit)} onClick={() => setTab("credit")} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-5">
        <div className="ks-card">
          <div className="px-5 py-4 border-b border-[#E7E9F3] flex items-center justify-between">
            <h2 className="ks-display font-bold">Running low</h2>
            <span className="ks-mono text-xs text-[#6B7280]">reorder soon</span>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto ks-scroll">
            {lowItems.length === 0 && <p className="text-sm text-[#6B7280]">Nothing running low right now. 🎉</p>}
            {lowItems.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] ks-pulse" />
                  <span className="font-medium">{i.name}</span>
                </div>
                <span className="ks-mono text-[#C13F45] font-semibold">{i.stock} {i.unit} left</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ks-card">
          <div className="px-5 py-4 border-b border-[#E7E9F3]">
            <h2 className="ks-display font-bold">Recent stock movement</h2>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto ks-scroll">
            {recentMoves.length === 0 && <p className="text-sm text-[#6B7280]">No stock movement logged yet.</p>}
            {recentMoves.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {m.type === "in" ? <ArrowUpCircle size={16} className="text-[#4F46E5]" /> : <ArrowDownCircle size={16} className="text-[#C13F45]" />}
                  <div>
                    <span className="font-medium">{m.itemName}</span>
                    <span className="text-[#6B7280] ks-mono text-xs ml-2">{m.reason}</span>
                  </div>
                </div>
                <span className={`ks-mono font-semibold ${m.type === "in" ? "text-[#4F46E5]" : "text-[#C13F45]"}`}>
                  {m.type === "in" ? "+" : "−"}{m.qty}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ks-card">
          <div className="px-5 py-4 border-b border-[#E7E9F3] flex items-center gap-2">
            <Users size={16} className="text-[#6B7280]" />
            <h2 className="ks-display font-bold">Top customers</h2>
          </div>
          <div className="p-5 space-y-1 max-h-72 overflow-y-auto ks-scroll">
            {bestCustomers.length === 0 && <p className="text-sm text-[#6B7280]">No customer purchases recorded yet.</p>}
            {bestCustomers.map((c, i) => (
              <button key={c.phone} onClick={() => setCustomerDetail(c)} className="w-full flex items-center justify-between text-sm py-1.5 -mx-1 px-1 rounded-lg hover:bg-[#F8F9FD] text-left">
                <div className="flex items-center gap-2">
                  <span className="ks-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E7E9F3", color: "#6B7280" }}>{i + 1}</span>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-[#6B7280]">{c.visits} visit{c.visits === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <span className="ks-mono font-semibold">{rupee(c.total)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {detail && <StatDetailModal mode={detail} items={items} bills={bills} todaysBills={todaysBills} stockValue={stockValue} onClose={() => setDetail(null)} onGoInventory={() => { setDetail(null); setTab("inventory"); }} />}
      {customerDetail && <CustomerDetailModal customer={customerDetail} bills={bills} onClose={() => setCustomerDetail(null)} />}
      {askPhone && (
        <Modal title="Add your WhatsApp number" onClose={() => setAskPhone(false)}>
          <AskOwnerPhone onSave={(p) => { setOwnerPhone(p); setAskPhone(false); showToast("Saved — tap 'Send weekly digest' again to send it"); }} />
        </Modal>
      )}
    </div>
  );
}

function AskOwnerPhone({ onSave }) {
  const [p, setP] = useState("");
  const valid = /^\d{10}$/.test(p.replace(/\D/g, ""));
  return (
    <div className="space-y-3.5">
      <Field label="Your WhatsApp number (to receive the digest)">
        <input autoFocus className="ks-input" value={p} onChange={(e) => setP(e.target.value)} placeholder="10-digit mobile number" />
      </Field>
      <button disabled={!valid} onClick={() => onSave(p.replace(/\D/g, ""))} className="ks-btn-primary w-full">Save</button>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, sub, onClick }) {
  return (
    <button onClick={onClick} className="ks-card text-left p-4 hover:-translate-y-0.5 active:scale-[.98] transition-transform" style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-white" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">{label}</div>
      <div className="ks-display text-2xl font-bold mt-0.5">{value}</div>
      {sub && <div className="text-xs text-[#6B7280] mt-0.5">{sub}</div>}
    </button>
  );
}

function StatDetailModal({ mode, items, bills, todaysBills, stockValue, onClose, onGoInventory }) {
  const titles = { items: "Items in stock", value: "Stock value breakdown", low: "Low stock items", profit: "Today's profit breakdown" };
  let rows = items;
  if (mode === "low") rows = items.filter((i) => i.stock <= i.lowAt);
  if (mode === "value") rows = [...items].sort((a, b) => b.stock * b.price - a.stock * a.price);

  let profitRows = [];
  let totalProfit = 0;
  if (mode === "profit") {
    const map = new Map();
    (todaysBills || []).forEach((b) => b.items.forEach((line) => {
      const item = items.find((i) => i.id === line.id);
      const cost = item ? item.costPrice ?? 0 : 0;
      const profit = (line.price - cost) * line.qty;
      const cur = map.get(line.id) || { name: line.name, code: line.code, profit: 0 };
      cur.profit += profit;
      map.set(line.id, cur);
    }));
    profitRows = [...map.values()].sort((a, b) => b.profit - a.profit);
    totalProfit = profitRows.reduce((s, r) => s + r.profit, 0);
  }

  return (
    <Modal title={titles[mode]} onClose={onClose}>
      <div className="space-y-3">
        {mode === "value" && (
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E9F3]">
            <span className="text-sm font-semibold text-[#6B7280]">Total stock value</span>
            <span className="ks-mono text-lg font-bold text-[#4F46E5]">{rupee(stockValue)}</span>
          </div>
        )}
        {mode === "profit" && (
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E9F3]">
            <span className="text-sm font-semibold text-[#6B7280]">Total profit today</span>
            <span className="ks-mono text-lg font-bold text-[#4F46E5]">{rupee(totalProfit)}</span>
          </div>
        )}

        {mode === "profit" ? (
          <div className="max-h-80 overflow-y-auto ks-scroll space-y-2.5 pr-1">
            {profitRows.length === 0 && <p className="text-sm text-[#6B7280] text-center py-6">No sales yet today.</p>}
            {profitRows.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: "#E7E9F3", color: "#6B7280" }}>{r.code}</span>
                  <span className="font-medium truncate">{r.name}</span>
                </div>
                <span className="ks-mono font-semibold shrink-0 ml-2 text-[#4F46E5]">{rupee(r.profit)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto ks-scroll space-y-2.5 pr-1">
            {rows.length === 0 && <p className="text-sm text-[#6B7280] text-center py-6">Nothing to show here. 🎉</p>}
            {rows.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: "#E7E9F3", color: "#6B7280" }}>{i.code}</span>
                  <span className="font-medium truncate">{i.name}</span>
                </div>
                {mode === "value" ? (
                  <span className="ks-mono font-semibold shrink-0 ml-2">{rupee(i.stock * i.price)}</span>
                ) : (
                  <span className={`ks-mono font-semibold shrink-0 ml-2 ${i.stock <= i.lowAt ? "text-[#C13F45]" : "text-[#000000]"}`}>{i.stock} {i.unit}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {mode === "low" && rows.length > 0 && (
          <button onClick={onGoInventory} className="ks-btn-primary w-full mt-1">Go to Inventory to restock</button>
        )}
      </div>
    </Modal>
  );
}

function CustomerDetailModal({ customer, bills, onClose }) {
  const custBills = bills
    .filter((b) => (b.customer?.phone || "").replace(/\D/g, "") === customer.phone)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <Modal title={customer.name} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E7E9F3]">
          <span className="text-sm text-[#6B7280]">{customer.phone} · {customer.visits} visit{customer.visits === 1 ? "" : "s"}</span>
          <span className="ks-mono text-lg font-bold text-[#4F46E5]">{rupee(customer.total)}</span>
        </div>
        <div className="max-h-80 overflow-y-auto ks-scroll space-y-2.5 pr-1">
          {custBills.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium ks-mono">{b.billNo}</div>
                <div className="text-[11px] text-[#6B7280]">{new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {b.items.length} item{b.items.length === 1 ? "" : "s"}</div>
              </div>
              <span className="ks-mono font-semibold">{rupee(b.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Inventory ----------
function reorderSuggestion(item, bills) {
  const days = new Set();
  let totalSold = 0;
  bills.forEach((b) => {
    const line = b.items.find((l) => l.id === item.id);
    if (line) {
      totalSold += line.qty;
      days.add(new Date(b.date).toDateString());
    }
  });
  if (totalSold === 0 || days.size === 0) return null;
  const avgPerDay = totalSold / days.size;
  if (avgPerDay <= 0) return null;
  return { avgPerDay, daysLeft: item.stock / avgPerDay, suggestedQty: Math.max(1, Math.ceil(avgPerDay * 7)) };
}

function Inventory({ items, setItems, movements, setMovements, bills, suppliers, showToast, checkLowStockCrossing }) {
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.code?.includes(query.trim()));

  function addItem(newItem) {
    setItems((prev) => [...prev, { ...newItem, id: uid("i") }]);
    setShowAdd(false);
    showToast(`${newItem.name} added to inventory`);
  }

  function logMovement(item, type, qty, reason, supplier) {
    if (type === "out") checkLowStockCrossing(item, Math.max(0, item.stock - qty));
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, stock: type === "in" ? p.stock + qty : Math.max(0, p.stock - qty) } : p)));
    setMovements((prev) => [...prev, { id: uid("m"), itemName: item.name, type, qty, reason, supplier: supplier || undefined, date: new Date().toISOString() }]);
    setAdjustItem(null);
    showToast(`${type === "in" ? "Stock added" : "Stock removed"}: ${item.name}`);
  }

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A996]" />
          <input placeholder="Search items..." value={query} onChange={(e) => setQuery(e.target.value)} className="ks-input pl-9" />
        </div>
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Add new item
        </button>
      </div>

      <div className="ks-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price / Margin</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Quick add</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const low = i.stock <= i.lowAt;
              const margin = i.costPrice != null ? i.price - i.costPrice : null;
              const suggestion = reorderSuggestion(i, bills);
              return (
                <tr key={i.id} className="border-b border-[#E7E9F3] last:border-0 hover:bg-[#F8F9FD]">
                  <td className="px-5 py-3">
                    <span className="ks-mono text-xs font-bold px-2 py-1 rounded-md" style={{ background: "#E7E9F3", color: "#6B7280" }}>{i.code}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <ItemThumb item={i} size={30} />
                      {i.name}
                    </div>
                  </td>
                  <td className="px-5 py-3"><CategoryChip category={i.category} /></td>
                  <td className="px-5 py-3 ks-mono">
                    {rupee(i.price)}
                    {margin != null && <div className="text-[11px] text-[#4F46E5] font-semibold">+{rupee(margin)} margin</div>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`ks-mono font-semibold ${low ? "text-[#C13F45]" : "text-[#000000]"}`}>{i.stock} {i.unit}</span>
                    {low && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#FDEAEA", color: "#C13F45" }}>LOW</span>}
                    {suggestion && suggestion.daysLeft <= 10 && (
                      <div className="text-[11px] text-[#B5720B] font-medium mt-0.5">⏳ ~{suggestion.daysLeft.toFixed(1)}d left · reorder {suggestion.suggestedQty}{i.unit}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setItems((prev) => prev.map((p) => (p.id === i.id ? { ...p, quick: !p.quick } : p)))}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: i.quick ? "#FCEEDA" : "#E7E9F3" }}
                      title={i.quick ? "Remove from quick add" : "Pin to quick add"}
                    >
                      <Star size={15} fill={i.quick ? "#F2A93B" : "none"} color={i.quick ? "#F2A93B" : "#B0A996"} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setAdjustItem({ item: i, type: "in" })} className="px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: "#E4F5F0", color: "#4F46E5" }}>
                        <ArrowUpCircle size={13} /> In
                      </button>
                      <button onClick={() => setAdjustItem({ item: i, type: "out" })} className="px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: "#FDEAEA", color: "#C13F45" }}>
                        <ArrowDownCircle size={13} /> Out
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[#6B7280] text-sm">No items match "{query}".</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddItemModal items={items} onClose={() => setShowAdd(false)} onAdd={addItem} />}
      {adjustItem && (
        <AdjustStockModal item={adjustItem.item} type={adjustItem.type} suppliers={suppliers} onClose={() => setAdjustItem(null)} onConfirm={(qty, reason, supplier) => logMovement(adjustItem.item, adjustItem.type, qty, reason, supplier)} />
      )}
    </div>
  );
}

function UpiQrCard({ upiId, payeeName, amount, note }) {
  if (!upiId) return null;
  const uri = upiUri(upiId, payeeName, amount, note);
  return (
    <div className="rounded-2xl p-4 flex flex-col items-center gap-2" style={{ background: "#F8F9FD", border: "1px dashed #D8CBAE" }}>
      <img src={upiQrImageUrl(uri)} alt="UPI QR code" width={140} height={140} style={{ borderRadius: 10 }} />
      <p className="text-xs text-[#6B7280] text-center">Scan to pay <span className="font-semibold text-[#000000]">{rupee(amount)}</span> via any UPI app</p>
      <a href={uri} className="text-[11px] font-semibold text-[#4F46E5]">Open in UPI app instead</a>
    </div>
  );
}

// ---------- QR / barcode scanner (native BarcodeDetector API, no external library) ----------
function barcodeScanSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

function BarcodeScannerModal({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let rafId;

    async function start() {
      if (!barcodeScanSupported()) {
        setError("Barcode scanning isn't supported in this browser — try Chrome or Edge on Android.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              onDetected(codes[0].rawValue);
              return;
            }
          } catch (e) {}
          rafId = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        setError(e?.name === "NotAllowedError" ? "Camera access was blocked — allow it for this site and try again." : "Couldn't access the camera on this device.");
      }
    }
    start();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <Modal title="Scan barcode / QR" onClose={onClose}>
      <div className="space-y-3">
        {error ? (
          <p className="text-sm text-[#C13F45] py-4 text-center">{error}</p>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-6 border-2 border-white/70 rounded-2xl pointer-events-none" />
          </div>
        )}
        <p className="text-xs text-[#6B7280] text-center">Point the camera at a barcode or QR code.</p>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="ks-no-print fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-[#E7E9F3] flex items-center justify-between shrink-0">
          <h3 className="ks-display font-bold">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#E7E9F3] flex items-center justify-center hover:bg-[#E4DFD2]">
            <X size={14} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto ks-scroll">{children}</div>
      </div>
    </div>
  );
}

function AddItemModal({ items, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", hindiName: "", category: "", unit: "pcs", price: "", costPrice: "", gst: "", stock: "", lowAt: "5", code: nextCode(items), image: "", barcode: "" });
  const [showScan, setShowScan] = useState(false);
  const valid = form.name.trim() && form.price !== "" && form.stock !== "" && /^\d{2}$/.test(form.code);
  return (
    <Modal title="Add new item" onClose={onClose}>
      <div className="space-y-3.5">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Code">
            <input className="ks-input ks-mono text-center" maxLength={2} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
          </Field>
          <div className="col-span-2">
            <Field label="Item name"><input className="ks-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          </div>
        </div>
        <Field label="Barcode (optional)">
          <div className="flex items-center gap-2">
            <input className="ks-input ks-mono" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or type" />
            <button type="button" onClick={() => setShowScan(true)} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EEF0FE", color: "#4F46E5" }} title="Scan barcode">
              <ScanLine size={18} />
            </button>
          </div>
        </Field>
        <Field label="Hindi / local name (optional — helps voice billing)"><input className="ks-input" value={form.hindiName} onChange={(e) => setForm({ ...form, hindiName: e.target.value })} placeholder="e.g. चीनी" /></Field>
        <Field label="Photo URL (optional)">
          <div className="flex items-center gap-2.5">
            {form.image && <img src={form.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={(e) => { e.target.style.display = "none"; }} />}
            <input className="ks-input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Paste an image link" />
          </div>
        </Field>
        <Field label="Category"><input className="ks-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Grocery" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit">
            <select className="ks-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {["pcs", "kg", "g", "l", "ml", "packet"].map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Selling price (₹)"><input type="number" className="ks-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchase price (₹, optional)"><input type="number" className="ks-input" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></Field>
          <Field label="GST % (optional)">
            <select className="ks-input" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })}>
              <option value="">None</option>
              {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opening stock"><input type="number" className="ks-input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
          <Field label="Low stock alert at"><input type="number" className="ks-input" value={form.lowAt} onChange={(e) => setForm({ ...form, lowAt: e.target.value })} /></Field>
        </div>
        <button
          disabled={!valid}
          onClick={() => onAdd({
            code: form.code.padStart(2, "0"), name: form.name.trim(), hindiName: form.hindiName.trim() || undefined,
            image: form.image.trim() || undefined, barcode: form.barcode.trim() || undefined,
            category: form.category.trim() || "General", unit: form.unit, price: Number(form.price),
            costPrice: form.costPrice !== "" ? Number(form.costPrice) : undefined,
            gst: form.gst !== "" ? Number(form.gst) : undefined,
            stock: Number(form.stock), lowAt: Number(form.lowAt) || 5,
          })}
          className="ks-btn-primary w-full"
        >
          Add item
        </button>
      </div>
      {showScan && (
        <BarcodeScannerModal
          onDetected={(code) => { setForm((f) => ({ ...f, barcode: code })); setShowScan(false); }}
          onClose={() => setShowScan(false)}
        />
      )}
    </Modal>
  );
}

function AdjustStockModal({ item, type, suppliers, onClose, onConfirm }) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(type === "in" ? "Purchase" : "Damage/Wastage");
  const [supplier, setSupplier] = useState("");
  const reasons = type === "in" ? ["Purchase", "Return from customer", "Correction"] : ["Damage/Wastage", "Personal use", "Correction"];
  const valid = Number(qty) > 0;
  return (
    <Modal title={`${type === "in" ? "Stock in" : "Stock out"}: ${item.name}`} onClose={onClose}>
      <div className="space-y-3.5">
        <p className="text-xs text-[#6B7280]">Current stock: <span className="ks-mono font-semibold text-[#000000]">{item.stock} {item.unit}</span></p>
        <Field label={`Quantity (${item.unit})`}><input autoFocus type="number" className="ks-input" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Reason">
          <select className="ks-input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        {type === "in" && reason === "Purchase" && (
          <Field label="Supplier (optional)">
            <input className="ks-input" list="ks-supplier-list" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Ramesh Distributors" />
            <datalist id="ks-supplier-list">
              {(suppliers || []).map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
          </Field>
        )}
        <button
          disabled={!valid}
          onClick={() => onConfirm(Number(qty), reason, supplier.trim())}
          className="w-full rounded-full text-white text-sm font-semibold py-2.5 disabled:opacity-40"
          style={{ background: type === "in" ? "#4F46E5" : "#C13F45" }}
        >
          Confirm {type === "in" ? "stock in" : "stock out"}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#6B7280] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// ---------- Billing ----------
function Billing({ items, setItems, bills, setBills, credits, setCredits, storeName, gstin, upiId, showToast, checkLowStockCrossing }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [billType, setBillType] = useState("cash"); // 'cash' | 'credit'
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [pickerItem, setPickerItem] = useState(null);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [showScan, setShowScan] = useState(false);
  const recognitionRef = useRef(null);
  const voiceSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const quickItems = items.filter((i) => i.quick);
  const categories = [...new Set(items.map((i) => i.category))];
  const categoryItems = activeCategory ? items.filter((i) => i.category === activeCategory) : [];
  const results = query
    ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.code === query.trim()).slice(0, 6)
    : [];

  function handleScannedCode(code) {
    setShowScan(false);
    const item = items.find((i) => i.barcode === code) || items.find((i) => i.code === code);
    if (!item) return showToast(`No item matches scanned code "${code}"`, "warn");
    setPickerItem(item);
  }

  const cleanPhone = (customer.phone || "").replace(/\D/g, "");
  const previousVisits = cleanPhone ? bills.filter((b) => (b.customer?.phone || "").replace(/\D/g, "") === cleanPhone).length : 0;
  const isLoyal = previousVisits >= 3;

  function startVoiceAdd() {
    if (!voiceSupported) return showToast("Voice input isn't supported in this browser", "err");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    try {
      recognition = new SR();
    } catch (e) {
      showToast("Couldn't start voice input on this device", "err");
      return;
    }
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onerror = (e) => {
      setListening(false);
      const messages = {
        "not-allowed": "Microphone access is blocked — allow it for this site in your browser settings",
        "service-not-allowed": "Microphone isn't available in this preview window — try it once the app is opened on its own page/tab",
        "audio-capture": "No microphone was found on this device",
        "no-speech": "Didn't hear anything — try again",
        "network": "Voice input needs an internet connection",
        "aborted": "Voice input was stopped",
      };
      showToast(messages[e.error] || `Voice input error: ${e.error || "unknown"}`, "err");
    };
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setLastHeard(transcript);
      handleVoiceTranscript(transcript);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setListening(false);
      showToast("Couldn't start listening — try tapping the mic again", "err");
    }
  }

  function handleVoiceTranscript(transcript) {
    const item = matchItemFromSpeech(items, transcript);
    if (!item) return showToast(`Couldn't match "${transcript}" to an item`, "warn");
    const qty = parseSpokenQuantity(transcript, item.unit);
    if (qty && qty > 0) {
      addToCart(item, qty);
      showToast(`🎙️ Added ${qty}${item.unit} ${item.name}`);
    } else {
      setPickerItem(item);
    }
  }

  function addToCart(item, qty = 1) {
    if (item.stock <= 0) return showToast(`${item.name} is out of stock`, "err");
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      const wanted = (exists ? exists.qty : 0) + qty;
      if (wanted > item.stock) {
        showToast(`Only ${item.stock} ${item.unit} of ${item.name} in stock`, "warn");
        const capped = item.stock;
        return exists ? prev.map((c) => (c.id === item.id ? { ...c, qty: capped } : c)) : [...prev, { id: item.id, code: item.code, name: item.name, price: item.price, unit: item.unit, gst: item.gst, qty: capped, stock: item.stock }];
      }
      if (exists) return prev.map((c) => (c.id === item.id ? { ...c, qty: wanted } : c));
      return [...prev, { id: item.id, code: item.code, name: item.name, price: item.price, unit: item.unit, gst: item.gst, qty, stock: item.stock }];
    });
    setQuery("");
  }

  function updateQty(id, qty) {
    const line = cart.find((c) => c.id === id);
    if (!line) return;
    if (qty > line.stock) { showToast(`Only ${line.stock} ${line.unit} in stock`, "warn"); qty = line.stock; }
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.id !== id));
    else setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
  }

  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const discountAmount = loyaltyDiscount ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - discountAmount;

  function generateBill() {
    if (cart.length === 0) return;
    if (billType === "credit" && !cleanPhone) return showToast("Add a customer mobile number for udhaar bills", "err");
    const billNo = `KS-${1000 + bills.length + 1}`;
    const bill = { id: uid("b"), billNo, date: new Date().toISOString(), customer, items: cart, total, subtotal, discountAmount, paymentType: billType };
    cart.forEach((line) => {
      const current = items.find((p) => p.id === line.id);
      if (current) checkLowStockCrossing(current, Math.max(0, current.stock - line.qty));
    });
    setItems((prev) => prev.map((p) => { const line = cart.find((c) => c.id === p.id); return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p; }));
    setBills((prev) => [...prev, bill]);
    if (billType === "credit") {
      setCredits((prev) => [...prev, { id: uid("cr"), phone: cleanPhone, name: customer.name || "Customer", amount: total, type: "charge", note: `Bill ${billNo}`, date: new Date().toISOString() }]);
      showToast(`Bill generated on udhaar — ${rupee(total)} added to ${customer.name || "customer"}'s balance`);
    } else {
      showToast("Bill generated");
    }
    setLastBill(bill);
    setCart([]);
    setCustomer({ name: "", phone: "" });
    setBillType("cash");
    setLoyaltyDiscount(false);
  }

  function printBill(bill) { setLastBill(bill); setTimeout(() => window.print(), 50); }

  return (
    <div className="pt-6 ks-billing-grid">
      <div>
        {quickItems.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star size={12} fill="#F2A93B" color="#F2A93B" /> Quick add
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickItems.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setPickerItem(r)}
                  disabled={r.stock <= 0}
                  className="ks-card text-left p-3 hover:-translate-y-0.5 transition-transform disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <div className="flex items-center gap-2">
                    <ItemThumb item={r} size={28} />
                    <div className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                      <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>{r.code}</span>
                      {r.name}
                    </div>
                  </div>
                  <div className="ks-mono text-xs text-[#6B7280] mt-1">{rupee(r.price)} · {r.stock} {r.unit} left</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0A996]" />
          <input placeholder="Search by name or 2-digit code..." value={query} onChange={(e) => setQuery(e.target.value)} className="ks-input pl-10 pr-20 py-3" />
          <button
            onClick={() => setShowScan(true)}
            title="Scan a barcode or QR code"
            className="absolute right-11 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#E7E9F3", color: "#6B7280" }}
          >
            <ScanLine size={15} />
          </button>
          <button
            onClick={startVoiceAdd}
            disabled={!voiceSupported}
            title={voiceSupported ? "Speak to add an item — e.g. \"2 kg sugar\"" : "Voice input not supported in this browser"}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${listening ? "ks-pulse" : ""}`}
            style={{ background: listening ? "#E5484D" : "#E7E9F3", color: listening ? "#fff" : "#6B7280" }}
          >
            <Mic size={15} />
          </button>
          {showScan && <BarcodeScannerModal onDetected={handleScannedCode} onClose={() => setShowScan(false)} />}
          {results.length > 0 && (
            <div className="absolute z-10 mt-1.5 w-full bg-white rounded-2xl overflow-hidden shadow-xl border border-[#E7E9F3]">
              {results.map((r) => (
                <button key={r.id} onClick={() => setPickerItem(r)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F8F9FD] flex items-center justify-between border-b border-[#E7E9F3] last:border-0">
                  <span className="flex items-center gap-2">
                    <ItemThumb item={r} size={24} />
                    <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>{r.code}</span>
                    <span className="font-medium">{r.name}</span>
                  </span>
                  <span className="ks-mono text-xs text-[#6B7280]">{rupee(r.price)} · {r.stock} {r.unit} left</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {listening && <p className="text-xs text-[#C13F45] font-medium mt-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] ks-pulse" /> Listening ({voiceLang === "hi-IN" ? "Hindi" : "English"})... try "250 grams sugar" or "1.5 liters oil"</p>}
        {!listening && lastHeard && <p className="text-xs text-[#6B7280] mt-1.5">Heard: "{lastHeard}"</p>}
        {voiceSupported && (
          <div className="flex items-center gap-1.5 mt-2">
            <Languages size={13} className="text-[#6B7280]" />
            <button onClick={() => setVoiceLang("en-IN")} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${voiceLang === "en-IN" ? "bg-[#000000] text-white" : "bg-[#E7E9F3] text-[#6B7280]"}`}>English</button>
            <button onClick={() => setVoiceLang("hi-IN")} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${voiceLang === "hi-IN" ? "bg-[#000000] text-white" : "bg-[#E7E9F3] text-[#6B7280]"}`}>हिन्दी</button>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          {categories.map((cat) => {
            const c = categoryColor(cat);
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(active ? null : cat)}
                className="text-xs font-semibold px-2.5 py-1 rounded-full transition-transform"
                style={{ background: active ? c.text : c.bg, color: active ? "#fff" : c.text, transform: active ? "scale(1.04)" : "none" }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {activeCategory && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {categoryItems.map((r) => (
              <button
                key={r.id}
                onClick={() => setPickerItem(r)}
                disabled={r.stock <= 0}
                className="ks-card text-left p-3 hover:-translate-y-0.5 transition-transform disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <div className="flex items-center gap-1.5">
                  <ItemThumb item={r} size={22} />
                  <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>{r.code}</span>
                  <span className="font-semibold text-sm leading-tight">{r.name}</span>
                </div>
                <div className="ks-mono text-xs text-[#6B7280] mt-1">{rupee(r.price)} · {r.stock} {r.unit} left</div>
              </button>
            ))}
          </div>
        )}

        <div className="ks-card mt-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E7E9F3]"><h2 className="ks-display font-bold">Bill items</h2></div>
          {cart.length === 0 ? (
            <p className="text-sm text-[#6B7280] p-8 text-center">Search and tap an item above to add it to the bill.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {cart.map((c) => (
                  <tr key={c.id} className="border-b border-[#E7E9F3] last:border-0">
                    <td className="px-5 py-3 font-medium">
                      <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5" style={{ background: "#E7E9F3", color: "#6B7280" }}>{c.code}</span>
                      {c.name}
                    </td>
                    <td className="px-2 py-3 ks-mono text-[#6B7280]">{rupee(c.price)}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.id, c.qty - 1)} className="ks-qtybtn"><Minus size={13} /></button>
                        <span className="ks-mono w-7 text-center font-semibold">{c.qty}</span>
                        <button onClick={() => updateQty(c.id, c.qty + 1)} className="ks-qtybtn"><Plus size={13} /></button>
                      </div>
                    </td>
                    <td className="px-5 py-3 ks-mono font-bold text-right">{rupee(c.qty * c.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <div className="ks-card p-5 sticky top-40">
          <h2 className="ks-display font-bold mb-3">Customer (optional)</h2>
          <div className="space-y-2.5 mb-3">
            <input placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="ks-input" />
            <input placeholder="Phone number" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="ks-input" />
          </div>

          {isLoyal && (
            <div className="rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between gap-2" style={{ background: "#FCEEDA" }}>
              <span className="text-xs font-semibold text-[#7A5209] flex items-center gap-1.5">⭐ Loyal customer · visit #{previousVisits + 1}</span>
              <button
                onClick={() => setLoyaltyDiscount((v) => !v)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: loyaltyDiscount ? "#F2A93B" : "#fff", color: loyaltyDiscount ? "#fff" : "#B5720B" }}
              >
                {loyaltyDiscount ? "5% applied ✓" : "Apply 5% off"}
              </button>
            </div>
          )}

          <div className="flex gap-1.5 mb-4 bg-[#E7E9F3] p-1 rounded-full">
            <button onClick={() => setBillType("cash")} className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors ${billType === "cash" ? "bg-[#000000] text-white" : "text-[#6B7280]"}`}>Cash / Paid</button>
            <button onClick={() => setBillType("credit")} className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors ${billType === "credit" ? "bg-[#B5399C] text-white" : "text-[#6B7280]"}`}>Udhaar (Credit)</button>
          </div>
          {billType === "credit" && !cleanPhone && (
            <p className="text-[11px] text-[#C13F45] font-medium -mt-2.5 mb-3">Add a mobile number to bill this on udhaar.</p>
          )}

          <div className="py-4 border-t border-b border-[#E7E9F3] mb-4 space-y-1.5">
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Subtotal</span>
                <span className="ks-mono">{rupee(subtotal)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs" style={{ color: "#B5720B" }}>
                <span>Loyalty discount (5%)</span>
                <span className="ks-mono">−{rupee(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="ks-display font-bold">Total</span>
              <span className="ks-mono text-2xl font-bold text-[#4F46E5]">{rupee(total)}</span>
            </div>
          </div>
          <button disabled={cart.length === 0} onClick={generateBill} className="ks-btn-primary w-full">
            {billType === "credit" ? "Generate udhaar bill" : "Generate bill"}
          </button>

          {lastBill && (
            <div className="mt-4 pt-4 border-t border-[#E7E9F3] ks-pop">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-[#4F46E5]" />
                <p className="text-sm font-bold text-[#4F46E5]">Bill generated!</p>
              </div>
              <p className="text-xs text-[#6B7280] mb-2.5">Bill: <span className="ks-mono font-semibold text-[#000000]">{lastBill.billNo}</span> · {rupee(lastBill.total)}</p>
              {taxBreakup(lastBill.items).taxAmt > 0 && (
                <p className="text-[11px] text-[#6B7280] mb-2.5 ks-mono">Taxable {rupee(taxBreakup(lastBill.items).taxable)} + GST {rupee(taxBreakup(lastBill.items).taxAmt)}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => printBill(lastBill)} className="ks-btn-outline w-full flex items-center justify-center gap-1.5">
                  <Printer size={15} /> Print
                </button>
                <button
                  onClick={() => window.open(whatsappLink(lastBill.customer?.phone, billMessageText(lastBill, storeName, gstin)), "_blank")}
                  disabled={!lastBill.customer?.phone}
                  title={!lastBill.customer?.phone ? "Add a customer mobile number to send the bill" : "Send via WhatsApp"}
                  className="w-full rounded-full text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: "#25D366" }}
                >
                  <MessageCircle size={15} /> Send bill
                </button>
              </div>
              {!lastBill.customer?.phone && (
                <p className="text-[11px] text-[#6B7280] mt-1.5">Add a customer mobile number next time to send the bill directly.</p>
              )}
              {upiId && lastBill.paymentType !== "credit" && (
                <div className="mt-3">
                  <UpiQrCard upiId={upiId} payeeName={storeName} amount={lastBill.total} note={lastBill.billNo} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lastBill && (
        <div className="ks-print-only">
          <PrintBillContent bill={lastBill} storeName={storeName} gstin={gstin} />
        </div>
      )}
      {pickerItem && (
        <QtyPickerModal
          item={pickerItem}
          onClose={() => setPickerItem(null)}
          onConfirm={(qty) => { addToCart(pickerItem, qty); setPickerItem(null); }}
        />
      )}
    </div>
  );
}

const SMALLER_UNIT = { kg: "g", l: "ml" };
const UNIT_FACTOR = { g: 1000, ml: 1000 }; // how many of the smaller unit make 1 of the base unit

function QtyPickerModal({ item, onClose, onConfirm }) {
  const smallerUnit = SMALLER_UNIT[item.unit]; // 'g' for kg items, 'ml' for l items, undefined otherwise
  const [inputUnit, setInputUnit] = useState(item.unit);
  const isMeasured = ["kg", "g", "l", "ml"].includes(item.unit);
  const step = inputUnit === item.unit ? (isMeasured ? 0.1 : 1) : 1;
  const [qty, setQty] = useState("1");
  const rawNum = Number(qty);
  // Convert whatever was typed into the item's actual stock unit
  const num = inputUnit === item.unit ? rawNum : rawNum / (UNIT_FACTOR[inputUnit] || 1);
  const valid = rawNum > 0 && num <= item.stock;

  return (
    <Modal title={item.name} onClose={onClose}>
      <div className="space-y-3.5">
        <p className="text-xs text-[#6B7280]">
          Available: <span className="ks-mono font-semibold text-[#000000]">{item.stock} {item.unit}</span> · {rupee(item.price)} / {item.unit}
        </p>

        {smallerUnit && (
          <div className="flex gap-1.5 bg-[#E7E9F3] p-1 rounded-full w-fit">
            {[item.unit, smallerUnit].map((u) => (
              <button
                key={u}
                onClick={() => { setInputUnit(u); setQty("1"); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${inputUnit === u ? "bg-[#000000] text-white" : "text-[#6B7280]"}`}
              >
                {u}
              </button>
            ))}
          </div>
        )}

        <Field label={`How many ${inputUnit} to add?`}>
          <input
            autoFocus
            type="number"
            step={step}
            min={step}
            className="ks-input text-lg font-semibold ks-mono"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && onConfirm(num)}
          />
        </Field>
        {inputUnit !== item.unit && rawNum > 0 && (
          <p className="text-xs text-[#6B7280]">= <span className="ks-mono font-semibold text-[#000000]">{num} {item.unit}</span></p>
        )}
        {num > item.stock && <p className="text-xs text-[#C13F45] font-medium">Only {item.stock} {item.unit} in stock.</p>}
        <div className="flex items-center justify-between py-2 border-t border-[#E7E9F3]">
          <span className="text-sm font-semibold text-[#6B7280]">Line total</span>
          <span className="ks-mono text-lg font-bold text-[#4F46E5]">{rupee((num > 0 ? num : 0) * item.price)}</span>
        </div>
        <button disabled={!valid} onClick={() => onConfirm(num)} className="ks-btn-primary w-full">
          Add to bill
        </button>
      </div>
    </Modal>
  );
}

function PrintBillContent({ bill, storeName, gstin }) {
  const { taxable, taxAmt } = taxBreakup(bill.items);
  return (
    <div style={{ width: "300px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#000", padding: "16px" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{storeName}</div>
        <div>Local Stores · Retail Bill</div>
        {gstin && <div>GSTIN: {gstin}</div>}
      </div>
      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "6px 0", margin: "6px 0" }}>
        <div>Bill No: {bill.billNo}</div>
        <div>Date: {new Date(bill.date).toLocaleString("en-IN")}</div>
        {bill.customer?.name && <div>Customer: {bill.customer.name}</div>}
        {bill.customer?.phone && <div>Phone: {bill.customer.phone}</div>}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <td style={{ paddingBottom: 4 }}>Item</td>
            <td style={{ paddingBottom: 4, textAlign: "center" }}>Qty</td>
            <td style={{ paddingBottom: 4, textAlign: "right" }}>Amt</td>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((it) => (
            <tr key={it.id}>
              <td style={{ padding: "2px 0" }}>{it.name}</td>
              <td style={{ padding: "2px 0", textAlign: "center" }}>{it.qty}{it.unit}</td>
              <td style={{ padding: "2px 0", textAlign: "right" }}>{it.qty * it.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {taxAmt > 0 && (
        <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Taxable value</span><span>{rupee(taxable)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>GST</span><span>{rupee(taxAmt)}</span></div>
        </div>
      )}
      <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
        <span>TOTAL</span>
        <span>{rupee(bill.total)}</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}>Thank you, visit again!</div>
    </div>
  );
}

// ---------- History ----------
function History({ bills, storeName, gstin }) {
  const [open, setOpen] = useState(null);
  const [printing, setPrinting] = useState(null);
  const sorted = [...bills].reverse();

  function doPrint(bill) { setPrinting(bill); setTimeout(() => window.print(), 50); }

  return (
    <div className="pt-6">
      <div className="ks-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Bill No.</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <React.Fragment key={b.id}>
                <tr className="border-b border-[#E7E9F3] cursor-pointer hover:bg-[#F8F9FD]" onClick={() => setOpen(open === b.id ? null : b.id)}>
                  <td className="px-5 py-3 ks-mono font-bold">{b.billNo}</td>
                  <td className="px-5 py-3 text-[#6B7280]">{new Date(b.date).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3">
                    {b.customer?.name || "—"}
                    {b.paymentType === "credit" && <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FDEAF6", color: "#B5399C" }}>UDHAAR</span>}
                  </td>
                  <td className="px-5 py-3">{b.items.length}</td>
                  <td className="px-5 py-3 ks-mono font-bold">{rupee(b.total)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); doPrint(b); }} className="text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1" style={{ background: "#E7E9F3", color: "#000000" }}>
                        <Printer size={13} /> Print
                      </button>
                      {b.customer?.phone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(whatsappLink(b.customer.phone, billMessageText(b, storeName, gstin)), "_blank"); }}
                          className="text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1 text-white"
                          style={{ background: "#25D366" }}
                        >
                          <MessageCircle size={13} /> Send
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {open === b.id && (
                  <tr className="bg-[#F8F9FD] border-b border-[#E7E9F3]">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-1.5">
                        {b.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-xs ks-mono">
                            <span>{it.name} × {it.qty}{it.unit}</span>
                            <span>{rupee(it.qty * it.price)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-[#6B7280] text-sm">🧾 No bills yet — generate one from the "New Bill" tab.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {printing && (
        <div className="ks-print-only">
          <PrintBillContent bill={printing} storeName={storeName} gstin={gstin} />
        </div>
      )}
    </div>
  );
}

// ---------- Credit Book (Udhaar) ----------
function CreditBook({ credits, setCredits, storeName, upiId, showToast }) {
  const [showNew, setShowNew] = useState(false);
  const [payFor, setPayFor] = useState(null); // { phone, name }
  const [showBulk, setShowBulk] = useState(false);

  const customers = useMemo(() => {
    const map = new Map();
    credits.forEach((c) => {
      if (!map.has(c.phone)) map.set(c.phone, { phone: c.phone, name: c.name });
    });
    return [...map.values()].map((c) => ({ ...c, balance: customerBalance(credits, c.phone) })).sort((a, b) => b.balance - a.balance);
  }, [credits]);

  const overdue = customers.filter((c) => c.balance > 0);
  const totalOutstanding = overdue.reduce((s, c) => s + c.balance, 0);

  function addEntry(entry) {
    setCredits((prev) => [...prev, { id: uid("cr"), ...entry, date: new Date().toISOString() }]);
    setShowNew(false);
    setPayFor(null);
    showToast(entry.type === "charge" ? "Credit sale recorded" : "Payment recorded");
  }

  return (
    <div className="pt-6">
      <div className="ks-card p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Total outstanding udhaar</div>
          <div className="ks-display text-3xl font-bold" style={{ color: "#B5399C" }}>{rupee(totalOutstanding)}</div>
        </div>
        <div className="flex gap-2">
          {overdue.length > 0 && (
            <button onClick={() => setShowBulk(true)} className="ks-btn-outline flex items-center gap-1.5">
              <MessageCircle size={15} /> Remind all ({overdue.length})
            </button>
          )}
          <button onClick={() => setShowNew(true)} className="ks-btn-primary flex items-center gap-1.5"><Plus size={16} /> New credit entry</button>
        </div>
      </div>

      <div className="ks-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Balance</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.phone} className="border-b border-[#E7E9F3] last:border-0">
                <td className="px-5 py-3 font-semibold">{c.name}</td>
                <td className="px-5 py-3 ks-mono text-[#6B7280]">{c.phone}</td>
                <td className="px-5 py-3 ks-mono font-bold" style={{ color: c.balance > 0 ? "#C13F45" : "#4F46E5" }}>{rupee(c.balance)}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    {c.balance > 0 && (
                      <>
                        <button onClick={() => setPayFor(c)} className="text-xs px-2.5 py-1.5 rounded-full font-semibold" style={{ background: "#E4F5F0", color: "#4F46E5" }}>Record payment</button>
                        <button
                          onClick={() => window.open(whatsappLink(c.phone, creditReminderText(storeName, c.name, c.balance)), "_blank")}
                          className="text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1 text-white"
                          style={{ background: "#25D366" }}
                        >
                          <MessageCircle size={13} /> Remind
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[#6B7280] text-sm">No udhaar entries yet — bill on credit or add one manually.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && <NewCreditModal onClose={() => setShowNew(false)} onAdd={(e) => addEntry({ ...e, type: "charge" })} />}
      {payFor && (
        <RecordPaymentModal
          customer={payFor}
          upiId={upiId}
          storeName={storeName}
          onClose={() => setPayFor(null)}
          onAdd={(amount) => addEntry({ phone: payFor.phone, name: payFor.name, amount, type: "payment", note: "Payment received" })}
        />
      )}
      {showBulk && <BulkReminderModal customers={overdue} storeName={storeName} onClose={() => setShowBulk(false)} />}
    </div>
  );
}

function BulkReminderModal({ customers, storeName, onClose }) {
  const [selected, setSelected] = useState(() => new Set(customers.map((c) => c.phone)));
  const [sent, setSent] = useState(() => new Set());

  function toggle(phone) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  }

  function sendAll() {
    const targets = customers.filter((c) => selected.has(c.phone));
    targets.forEach((c, i) => {
      setTimeout(() => {
        window.open(whatsappLink(c.phone, creditReminderText(storeName, c.name, c.balance)), "_blank");
        setSent((prev) => new Set(prev).add(c.phone));
      }, i * 700); // staggered so the browser doesn't block rapid popups
    });
  }

  return (
    <Modal title="Remind all overdue customers" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-[#6B7280]">Opens a WhatsApp chat per customer with their reminder pre-filled — you'll still need to hit send in each chat. Your browser may ask to allow multiple pop-ups.</p>
        <div className="max-h-64 overflow-y-auto ks-scroll space-y-2 pr-1">
          {customers.map((c) => (
            <label key={c.phone} className="flex items-center justify-between text-sm py-1">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggle(c.phone)} className="w-4 h-4" />
                <span className={sent.has(c.phone) ? "text-[#6B7280]" : "font-medium"}>{c.name}</span>
                {sent.has(c.phone) && <CheckCircle2 size={13} className="text-[#4F46E5]" />}
              </span>
              <span className="ks-mono text-[#C13F45] font-semibold">{rupee(c.balance)}</span>
            </label>
          ))}
        </div>
        <button disabled={selected.size === 0} onClick={sendAll} className="ks-btn-primary w-full flex items-center justify-center gap-1.5">
          <MessageCircle size={15} /> Send to {selected.size} customer{selected.size === 1 ? "" : "s"}
        </button>
      </div>
    </Modal>
  );
}

function NewCreditModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", amount: "", note: "" });
  const valid = form.name.trim() && /^\d{10}$/.test(form.phone.replace(/\D/g, "")) && Number(form.amount) > 0;
  return (
    <Modal title="New credit (udhaar) entry" onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Customer name"><input className="ks-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Phone number"><input className="ks-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Amount (₹)"><input type="number" className="ks-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Note (optional)"><input className="ks-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Groceries for the week" /></Field>
        <button
          disabled={!valid}
          onClick={() => onAdd({ name: form.name.trim(), phone: form.phone.replace(/\D/g, ""), amount: Number(form.amount), note: form.note.trim() || "Credit sale" })}
          className="ks-btn-primary w-full"
        >
          Add entry
        </button>
      </div>
    </Modal>
  );
}

function RecordPaymentModal({ customer, upiId, storeName, onClose, onAdd }) {
  const [amount, setAmount] = useState(String(customer.balance));
  const valid = Number(amount) > 0;
  return (
    <Modal title={`Record payment: ${customer.name}`} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Amount received (₹)"><input autoFocus type="number" className="ks-input" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        {upiId && Number(amount) > 0 && (
          <UpiQrCard upiId={upiId} payeeName={storeName} amount={Number(amount)} note={`Udhaar - ${customer.name}`} />
        )}
        <button disabled={!valid} onClick={() => onAdd(Number(amount))} className="ks-btn-primary w-full">Record payment</button>
      </div>
    </Modal>
  );
}

// ---------- Day Close (cash reconciliation) ----------
function DayClose({ todaysCashSales, todaysDraws, draws, setDraws, reconciliations, setReconciliations }) {
  const [cashCounted, setCashCounted] = useState("");
  const [showDraw, setShowDraw] = useState(false);
  const expectedCash = todaysCashSales - todaysDraws;
  const diff = cashCounted !== "" ? Number(cashCounted) - expectedCash : null;
  const sorted = [...reconciliations].reverse();
  const todaysDrawList = draws.filter((d) => new Date(d.date).toDateString() === new Date().toDateString()).reverse();

  function saveClose() {
    if (cashCounted === "") return;
    setReconciliations((prev) => [...prev, { id: uid("rc"), date: new Date().toISOString(), digitalTotal: expectedCash, cashCounted: Number(cashCounted), diff: Number(cashCounted) - expectedCash }]);
    setCashCounted("");
  }

  function addDraw(amount, note) {
    setDraws((prev) => [...prev, { id: uid("dr"), amount, note, date: new Date().toISOString() }]);
    setShowDraw(false);
  }

  return (
    <div className="pt-6 grid md:grid-cols-2 gap-5">
      <div className="space-y-4">
        <div className="ks-card p-5">
          <h2 className="ks-display font-bold mb-4">Today's cash reconciliation</h2>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#6B7280] font-medium">Cash sales today (app)</span>
            <span className="ks-mono font-bold">{rupee(todaysCashSales)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-[#6B7280] font-medium">Less: personal draws</span>
            <span className="ks-mono font-bold" style={{ color: "#C13F45" }}>−{rupee(todaysDraws)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3 pt-2 border-t border-[#E7E9F3]">
            <span className="font-semibold">Expected cash in register</span>
            <span className="ks-mono font-bold">{rupee(expectedCash)}</span>
          </div>
          <Field label="Cash actually counted in register (₹)">
            <input type="number" autoFocus className="ks-input text-lg font-semibold ks-mono" value={cashCounted} onChange={(e) => setCashCounted(e.target.value)} />
          </Field>
          {diff !== null && (
            <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center justify-between" style={{ background: diff === 0 ? "#E4F5F0" : "#FDEAEA" }}>
              <span className="text-xs font-semibold" style={{ color: diff === 0 ? "#4F46E5" : "#C13F45" }}>
                {diff === 0 ? "Matches perfectly ✓" : diff > 0 ? "Extra cash in register" : "Cash short"}
              </span>
              <span className="ks-mono font-bold" style={{ color: diff === 0 ? "#4F46E5" : "#C13F45" }}>{diff > 0 ? "+" : ""}{rupee(diff)}</span>
            </div>
          )}
          <button disabled={cashCounted === ""} onClick={saveClose} className="ks-btn-primary w-full mt-4">Save today's close</button>
        </div>

        <div className="ks-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="ks-display font-bold">Personal draws today</h2>
            <button onClick={() => setShowDraw(true)} className="text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1" style={{ background: "#E7E9F3", color: "#000000" }}>
              <Plus size={13} /> Add draw
            </button>
          </div>
          <div className="space-y-2">
            {todaysDrawList.length === 0 && <p className="text-sm text-[#6B7280]">No money taken out for personal use today.</p>}
            {todaysDrawList.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">{d.note || "Personal draw"}</span>
                <span className="ks-mono font-semibold" style={{ color: "#C13F45" }}>−{rupee(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ks-card overflow-hidden h-fit">
        <div className="px-5 py-4 border-b border-[#E7E9F3]"><h2 className="ks-display font-bold">Past reconciliations</h2></div>
        <div className="p-5 space-y-3 max-h-96 overflow-y-auto ks-scroll">
          {sorted.length === 0 && <p className="text-sm text-[#6B7280]">No closes saved yet.</p>}
          {sorted.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                <div className="text-xs text-[#6B7280] ks-mono">Expected {rupee(r.digitalTotal)} · Cash {rupee(r.cashCounted)}</div>
              </div>
              <span className="ks-mono font-bold" style={{ color: r.diff === 0 ? "#4F46E5" : "#C13F45" }}>{r.diff > 0 ? "+" : ""}{rupee(r.diff)}</span>
            </div>
          ))}
        </div>
      </div>

      {showDraw && <AddDrawModal onClose={() => setShowDraw(false)} onAdd={addDraw} />}
    </div>
  );
}

function AddDrawModal({ onClose, onAdd }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const valid = Number(amount) > 0;
  return (
    <Modal title="Personal draw from till" onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Amount taken (₹)"><input autoFocus type="number" className="ks-input" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Note (optional)"><input className="ks-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Home groceries" /></Field>
        <button disabled={!valid} onClick={() => onAdd(Number(amount), note.trim() || "Personal draw")} className="ks-btn-primary w-full">Log draw</button>
      </div>
    </Modal>
  );
}

// ---------- Daily Shop Expenses ----------
const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Staff salary", "Transport", "Maintenance", "Other"];

function Expenses({ expenses, setExpenses, showToast }) {
  const [showAdd, setShowAdd] = useState(false);
  const todayKey = new Date().toDateString();
  const todaysExpenses = expenses.filter((e) => new Date(e.date).toDateString() === todayKey);
  const todaysTotal = todaysExpenses.reduce((s, e) => s + e.amount, 0);
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses.filter((e) => e.date.slice(0, 7) === monthKey).reduce((s, e) => s + e.amount, 0);
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  function addExpense(entry) {
    setExpenses((prev) => [...prev, { id: uid("ex"), ...entry, date: new Date().toISOString() }]);
    setShowAdd(false);
    showToast("Expense logged");
  }

  return (
    <div className="pt-6">
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <div className="ks-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Today's expenses</div>
          <div className="ks-display text-2xl font-bold mt-0.5" style={{ color: "#C13F45" }}>{rupee(todaysTotal)}</div>
        </div>
        <div className="ks-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">This month</div>
          <div className="ks-display text-2xl font-bold mt-0.5">{rupee(monthTotal)}</div>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5"><Plus size={16} /> Log expense</button>
      </div>

      <div className="ks-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Note</th>
              <th className="px-5 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.id} className="border-b border-[#E7E9F3] last:border-0">
                <td className="px-5 py-3 text-[#6B7280]">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                <td className="px-5 py-3"><CategoryChip category={e.category} /></td>
                <td className="px-5 py-3">{e.note || "—"}</td>
                <td className="px-5 py-3 ks-mono font-bold" style={{ color: "#C13F45" }}>−{rupee(e.amount)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[#6B7280] text-sm">No expenses logged yet — rent, electricity, salaries, etc.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={addExpense} />}
    </div>
  );
}

function AddExpenseModal({ onClose, onAdd }) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const valid = Number(amount) > 0;
  return (
    <Modal title="Log an expense" onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Category">
          <select className="ks-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)"><input autoFocus type="number" className="ks-input" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Note (optional)"><input className="ks-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. June electricity bill" /></Field>
        <button disabled={!valid} onClick={() => onAdd({ category, amount: Number(amount), note: note.trim() })} className="ks-btn-primary w-full">Log expense</button>
      </div>
    </Modal>
  );
}

// ---------- Cashbook ----------
function Cashbook({ bills, draws, expenses, credits, movements, items }) {
  const [range, setRange] = useState("30"); // days

  const entries = useMemo(() => {
    const rows = [];
    bills.forEach((b) => {
      if (b.paymentType !== "credit") rows.push({ id: b.id, date: b.date, type: "in", label: `Sale — ${b.billNo}`, amount: b.total });
    });
    credits.filter((c) => c.type === "payment").forEach((c) => {
      rows.push({ id: c.id, date: c.date, type: "in", label: `Udhaar payment — ${c.name}`, amount: c.amount });
    });
    draws.forEach((d) => {
      rows.push({ id: d.id, date: d.date, type: "out", label: d.note || "Personal draw", amount: d.amount });
    });
    expenses.forEach((e) => {
      rows.push({ id: e.id, date: e.date, type: "out", label: `${e.category}${e.note ? " — " + e.note : ""}`, amount: e.amount });
    });
    movements.filter((m) => m.type === "in" && m.reason === "Purchase").forEach((m) => {
      const item = items.find((i) => i.name === m.itemName);
      const cost = item ? (item.costPrice ?? item.price) * m.qty : 0;
      if (cost > 0) rows.push({ id: m.id, date: m.date, type: "out", label: `Stock purchase — ${m.itemName}${m.supplier ? " (" + m.supplier + ")" : ""}`, amount: cost });
    });
    return rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [bills, draws, expenses, credits, movements, items]);

  const cutoff = Date.now() - Number(range) * 24 * 60 * 60 * 1000;
  const visible = entries.filter((e) => new Date(e.date).getTime() >= cutoff);

  let running = 0;
  const withBalance = visible.map((e) => {
    running += e.type === "in" ? e.amount : -e.amount;
    return { ...e, balance: running };
  });
  const totalIn = visible.filter((e) => e.type === "in").reduce((s, e) => s + e.amount, 0);
  const totalOut = visible.filter((e) => e.type === "out").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <div className="ks-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Cash in</div>
            <div className="ks-display text-xl font-bold mt-0.5" style={{ color: "#4F46E5" }}>{rupee(totalIn)}</div>
          </div>
          <div className="ks-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Cash out</div>
            <div className="ks-display text-xl font-bold mt-0.5" style={{ color: "#C13F45" }}>{rupee(totalOut)}</div>
          </div>
          <div className="ks-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Net</div>
            <div className="ks-display text-xl font-bold mt-0.5">{rupee(totalIn - totalOut)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3 bg-[#F1EEE6] p-1 rounded-full w-fit">
        {[{ v: "7", l: "7 days" }, { v: "30", l: "30 days" }, { v: "90", l: "90 days" }].map((r) => (
          <button key={r.v} onClick={() => setRange(r.v)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${range === r.v ? "bg-[#000000] text-white" : "text-[#6B7280]"}`}>
            {r.l}
          </button>
        ))}
      </div>

      <div className="ks-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Entry</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {[...withBalance].reverse().map((e) => (
              <tr key={e.id} className="border-b border-[#E7E9F3] last:border-0">
                <td className="px-5 py-3 text-[#6B7280]">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                <td className="px-5 py-3">{e.label}</td>
                <td className="px-5 py-3 ks-mono font-semibold" style={{ color: e.type === "in" ? "#4F46E5" : "#C13F45" }}>
                  {e.type === "in" ? "+" : "−"}{rupee(e.amount)}
                </td>
                <td className="px-5 py-3 ks-mono font-bold">{rupee(e.balance)}</td>
              </tr>
            ))}
            {withBalance.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[#6B7280] text-sm">Nothing in this period yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Suppliers ----------
function Suppliers({ suppliers, setSuppliers, movements, showToast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [viewSupplier, setViewSupplier] = useState(null);

  function addSupplier(entry) {
    setSuppliers((prev) => [...prev, { id: uid("sup"), ...entry }]);
    setShowAdd(false);
    showToast("Supplier added");
  }

  const purchaseCount = (name) => movements.filter((m) => m.type === "in" && m.supplier === name).length;

  return (
    <div className="pt-6">
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5"><Plus size={16} /> Add supplier</button>
      </div>

      <div className="ks-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Supplier</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Supplies</th>
              <th className="px-5 py-3 font-medium">Purchases logged</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-[#E7E9F3] last:border-0 hover:bg-[#F8F9FD]">
                <td className="px-5 py-3 font-semibold">{s.name}</td>
                <td className="px-5 py-3 ks-mono text-[#6B7280]">{s.phone || "—"}</td>
                <td className="px-5 py-3 text-[#6B7280]">{s.items || "—"}</td>
                <td className="px-5 py-3 ks-mono">{purchaseCount(s.name)}</td>
                <td className="px-5 py-3">
                  {s.phone && (
                    <button
                      onClick={() => window.open(whatsappLink(s.phone, `Hi ${s.name}, `), "_blank")}
                      className="text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1 text-white"
                      style={{ background: "#25D366" }}
                    >
                      <MessageCircle size={13} /> Message
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[#6B7280] text-sm">No suppliers added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddSupplierModal onClose={() => setShowAdd(false)} onAdd={addSupplier} />}
    </div>
  );
}

function AddSupplierModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", items: "" });
  const valid = form.name.trim();
  return (
    <Modal title="Add supplier" onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Supplier / business name"><input className="ks-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Phone (optional)"><input className="ks-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile number" /></Field>
        <Field label="What they supply (optional)"><input className="ks-input" value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} placeholder="e.g. Rice, dal, oil" /></Field>
        <button disabled={!valid} onClick={() => onAdd({ name: form.name.trim(), phone: form.phone.replace(/\D/g, ""), items: form.items.trim() })} className="ks-btn-primary w-full">Add supplier</button>
      </div>
    </Modal>
  );
}
