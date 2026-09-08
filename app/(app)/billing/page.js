"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Mic,
  Languages,
  Star,
  Printer,
  MessageCircle,
  CheckCircle2,
  Loader2,
  ScanLine,
  AlertTriangle,
  Tag,
  History,
} from "lucide-react";
import { useShop } from "@/components/ShopContext";
import ItemThumb from "@/components/ItemThumb";
import { categoryColor } from "@/components/CategoryChip";
import QtyPickerModal from "@/components/QtyPickerModal";
import UpiQrCard from "@/components/UpiQrCard";
import PrintBillContent from "@/components/PrintBillContent";
import { rupee } from "@/lib/format";
import { whatsappLink, billMessageText, taxBreakup } from "@/lib/messaging";
import { parseSpokenQuantity, matchItemFromSpeech } from "@/lib/voiceHelpers";
import VoiceBillingModal from "@/components/VoiceBillingModal";
import { fetchShopItems } from "@/lib/products";
import { fetchActiveOffers, activeDiscountMap, clearancePrice } from "@/lib/clearance";
import { cacheProducts, getCachedProducts, cacheBills, getCachedBills } from "@/lib/productCache";
import ModuleGuard from "@/components/ModuleGuard";

export default function BillingPage() {
  return (
    <ModuleGuard module="billing">
      <BillingPageInner />
    </ModuleGuard>
  );
}

function BillingPageInner() {
  const { supabase, activeShopId, activeShop, showToast, runQueued } = useShop();
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [discountMap, setDiscountMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [billType, setBillType] = useState("cash");
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(false);
  const [manualDiscount, setManualDiscount] = useState({ type: "pct", value: "" });
  const [lastBill, setLastBill] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [pickerItem, setPickerItem] = useState(null);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [generating, setGenerating] = useState(false);
  const [showVoiceBilling, setShowVoiceBilling] = useState(false);
  const recognitionRef = useRef(null);
  const voiceSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      // Serve products and bills from localStorage — enough to make a bill
      // and do loyal-customer detection without any network call.
      const cachedItems = getCachedProducts(activeShopId);
      const cachedBillsList = getCachedBills(activeShopId);
      if (cachedItems) setItems(cachedItems);
      if (cachedBillsList) setBills(cachedBillsList);
      setLoading(false);
      return;
    }

    const [itemsData, { data: billsData }, offersData] = await Promise.all([
      fetchShopItems(supabase, activeShopId),
      supabase.from("bills").select("*").eq("shop_id", activeShopId).order("date", { ascending: false }),
      fetchActiveOffers(supabase, activeShopId),
    ]);
    setItems(itemsData);
    setBills(billsData || []);
    setDiscountMap(activeDiscountMap(offersData));

    // Write to cache so the next offline session has fresh data
    cacheProducts(activeShopId, itemsData);
    cacheBills(activeShopId, billsData || []);

    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  // Items priced for sale right now — clearance offers whose date range
  // covers today are baked in here so every tile, search result, and the
  // voice-match list all see the discounted price with no separate path.
  const pricedItems = useMemo(
    () =>
      items.map((i) => {
        const offer = discountMap.get(i.id);
        if (!offer) return i;
        return { ...i, price: clearancePrice(i.price, offer.pct), originalPrice: i.price, clearancePct: offer.pct };
      }),
    [items, discountMap]
  );

  const quickItems = pricedItems.filter((i) => i.quick);
  const categories = [...new Set(pricedItems.map((i) => i.category))];
  const categoryItems = activeCategory ? pricedItems.filter((i) => i.category === activeCategory) : [];
  const results = query
    ? pricedItems.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.code === query.trim()).slice(0, 6)
    : [];

  const cleanPhone = (customer.phone || "").replace(/\D/g, "");
  const previousVisits = cleanPhone ? bills.filter((b) => (b.customer_phone || "").replace(/\D/g, "") === cleanPhone).length : 0;
  const isLoyal = previousVisits >= 3;

  function handleVoiceTranscript(transcript) {
    const item = matchItemFromSpeech(pricedItems, transcript);
    if (!item) return showToast(`Couldn't match "${transcript}" to an item`, "warn");
    const qty = parseSpokenQuantity(transcript, item.unit);
    if (qty && qty > 0) {
      addToCart(item, qty);
      showToast(`🎙️ Added ${qty}${item.unit} ${item.name}`);
    } else {
      setPickerItem(item);
    }
  }

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
        network: "Voice input needs an internet connection",
        aborted: "Voice input was stopped",
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

  function addToCart(item, qty = 1) {
    if (item.stock <= 0) return showToast(`${item.name} is out of stock`, "err");
    setCart((prev) => {
      const exists = prev.find((c) => c.shop_product_id === item.id);
      const wanted = (exists ? exists.qty : 0) + qty;
      if (wanted > item.stock) {
        showToast(`Only ${item.stock} ${item.unit} of ${item.name} in stock`, "warn");
        const capped = item.stock;
        return exists
          ? prev.map((c) => (c.shop_product_id === item.id ? { ...c, qty: capped } : c))
          : [
              ...prev,
              {
                shop_product_id: item.id,
                code: item.code,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice || null,
                clearancePct: item.clearancePct || null,
                unit: item.unit,
                gst: item.gst,
                qty: capped,
                stock: item.stock,
              },
            ];
      }
      if (exists) return prev.map((c) => (c.shop_product_id === item.id ? { ...c, qty: wanted } : c));
      return [
        ...prev,
        {
          shop_product_id: item.id,
          code: item.code,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice || null,
          clearancePct: item.clearancePct || null,
          unit: item.unit,
          gst: item.gst,
          qty,
          stock: item.stock,
        },
      ];
    });
    setQuery("");
  }

  function updateQty(id, qty) {
    const line = cart.find((c) => c.shop_product_id === id);
    if (!line) return;
    if (qty > line.stock) {
      showToast(`Only ${line.stock} ${line.unit} in stock`, "warn");
      qty = line.stock;
    }
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.shop_product_id !== id));
    else setCart((prev) => prev.map((c) => (c.shop_product_id === id ? { ...c, qty } : c)));
  }

  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const loyaltyDiscountAmount = loyaltyDiscount ? Math.round(subtotal * 0.05) : 0;
  const manualDiscountAmount = (() => {
    const v = parseFloat(manualDiscount.value) || 0;
    if (v <= 0) return 0;
    const raw = manualDiscount.type === "pct" ? Math.round((v / 100) * subtotal) : Math.round(v);
    return Math.min(raw, subtotal);
  })();
  const discountAmount = loyaltyDiscountAmount + manualDiscountAmount;
  const total = subtotal - discountAmount;
  const clearanceSavings = cart.reduce((s, c) => s + (c.originalPrice ? (c.originalPrice - c.price) * c.qty : 0), 0);

  async function generateBill() {
    if (cart.length === 0) return;
    if (billType === "credit" && !cleanPhone) return showToast("Add a customer mobile number for udhaar bills", "err");

    setGenerating(true);
    try {
      const billNo = `KS-${1000 + bills.length + 1}`;
      const billItems = cart.map(({ shop_product_id, code, name, price, unit, gst, qty }) => {
        const inv = items.find((i) => i.id === shop_product_id);
        return { shop_product_id, code, name, price, unit, gst, qty, cost_price: inv?.cost_price ?? null };
      });
      // Built client-side (including the id) so a queued/offline bill can
      // be shown, printed, and sent immediately — it reconciles with the
      // real row once runQueued's background flush actually writes it.
      const bill = {
        id: crypto.randomUUID(),
        shop_id: activeShopId,
        bill_no: billNo,
        customer_name: customer.name || null,
        customer_phone: cleanPhone || null,
        items: billItems,
        subtotal,
        discount_amount: discountAmount,
        total,
        payment_type: billType,
        date: new Date().toISOString(),
      };

      const billResult = await runQueued({ type: "insert", table: "bills", rows: [bill] });
      const stockResult = await runQueued({
        type: "rpc",
        fn: "sell_items",
        args: { p_shop_id: activeShopId, p_lines: billItems },
      });
      const offline = billResult.queued || stockResult.queued;

      if (billType === "credit") {
        await runQueued({
          type: "insert",
          table: "credits",
          rows: [{ shop_id: activeShopId, phone: cleanPhone, name: customer.name || "Customer", amount: total, type: "charge", note: `Bill ${billNo}` }],
        });
      }

      if (offline) {
        showToast("You're offline — this bill will sync automatically once you're back online", "warn");
      } else if (billType === "credit") {
        showToast(`Bill generated on udhaar — ${rupee(total)} added to ${customer.name || "customer"}'s balance`);
      } else {
        showToast("Bill generated");
      }

      setItems((prev) =>
        prev.map((p) => {
          const line = cart.find((c) => c.shop_product_id === p.id);
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
        })
      );
      setBills((prev) => [bill, ...prev]);
      setLastBill(bill);
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setBillType("cash");
      setLoyaltyDiscount(false);
      setManualDiscount({ type: "pct", value: "" });
    } catch (err) {
      showToast(err.message, "err");
    } finally {
      setGenerating(false);
    }
  }

  function handleVoiceBillingConfirm(voiceCart, voiceBillType) {
    setCart(voiceCart.map(({ item, qty }) => ({
      shop_product_id: item.id,
      code: item.code,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice || null,
      clearancePct: item.clearancePct || null,
      unit: item.unit,
      gst: item.gst,
      qty,
      stock: item.stock,
    })));
    setBillType(voiceBillType);
    setShowVoiceBilling(false);
  }

  function startBarcodeScanner() {
    if (!("BarcodeDetector" in window)) {
      showToast("Barcode scanner not supported in this browser — search by code or name instead", "warn");
      return;
    }
    setScannerActive(true);
    let active = true;
    const detector = new window.BarcodeDetector({ formats: ["code_128", "ean_13", "ean_8", "code_39", "qr_code"] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      const scan = () => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        detector.detect(video).then((codes) => {
          if (codes.length > 0) {
            const val = codes[0].rawValue;
            stream.getTracks().forEach((t) => t.stop());
            active = false;
            setScannerActive(false);
            const matched = pricedItems.find((i) => i.barcode === val || i.code === val || i.code === val.slice(-2));
            if (matched) {
              setPickerItem(matched);
            } else {
              setQuery(val);
              showToast(`Scanned: ${val} — no exact match, showing search results`);
            }
          } else {
            requestAnimationFrame(scan);
          }
        }).catch(() => requestAnimationFrame(scan));
      };
      video.onloadeddata = scan;
    }).catch(() => {
      active = false;
      setScannerActive(false);
      showToast("Camera access denied — allow it in browser settings", "err");
    });
  }

  function printBill(bill) {
    setLastBill(bill);
    setTimeout(() => window.print(), 50);
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading billing…
      </div>
    );
  }

  const lowStockItems = pricedItems.filter((i) => i.low_at > 0 && i.stock <= i.low_at);

  // Items shown in the product grid — all items, filtered by search or category
  const displayItems = query
    ? pricedItems.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.code === query.trim())
    : activeCategory
    ? pricedItems.filter((i) => i.category === activeCategory)
    : pricedItems;

  // GST extracted from cart (prices are GST-inclusive)
  const cartGst = cart.reduce((s, c) => {
    if (!c.gst) return s;
    return s + Math.round(c.qty * c.price * c.gst / (100 + c.gst));
  }, 0);

  const nextBillNo = `KS-${1000 + bills.length + 1}`;

  function clearCart() {
    setCart([]);
    setCustomer({ name: "", phone: "" });
    setBillType("cash");
    setLoyaltyDiscount(false);
    setManualDiscount({ type: "pct", value: "" });
    setLastBill(null);
    setQuery("");
    setActiveCategory(null);
  }

  return (
    <div className="pt-4">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="ks-display font-bold text-xl">New Sale</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <button onClick={clearCart} className="ks-btn-primary flex items-center gap-1.5 text-sm py-2">
            <Plus size={14} /> New Sale
          </button>
        </div>
      </div>

      <div className="ks-billing-grid">
        {/* ── Left: product grid ── */}
        <div>
          {/* Search + category + voice */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
              <input
                className="ks-input"
                style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={startBarcodeScanner}
                title="Scan barcode"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center ${scannerActive ? "ks-pulse" : ""}`}
                style={{ background: scannerActive ? "#4F46E5" : "transparent", color: scannerActive ? "#fff" : "var(--text-secondary)" }}
              >
                <ScanLine size={14} />
              </button>
            </div>
            <select
              className="ks-input shrink-0"
              style={{ width: "148px" }}
              value={activeCategory || ""}
              onChange={(e) => setActiveCategory(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={() => setShowVoiceBilling(true)}
              title="Voice billing"
              className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Mic size={16} />
            </button>
          </div>

          {/* Low stock alert */}
          {lowStockItems.length > 0 && (
            <div className="ks-card p-2.5 mb-3 flex items-center gap-2 flex-wrap" style={{ borderLeft: "3px solid #C13F45" }}>
              <AlertTriangle size={13} style={{ color: "#C13F45" }} className="shrink-0" />
              <span className="text-xs font-semibold" style={{ color: "#C13F45" }}>Low stock:</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {lowStockItems.slice(0, 4).map((i) => `${i.name} (${i.stock})`).join(" · ")}
                {lowStockItems.length > 4 && ` +${lowStockItems.length - 4} more`}
              </span>
            </div>
          )}

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.stock > 0 && setPickerItem(item)}
                disabled={item.stock <= 0}
                className="ks-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {item.clearancePct && (
                  <span className="ks-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 inline-block" style={{ background: "#C13F45", color: "#fff" }}>
                    −{item.clearancePct}%
                  </span>
                )}
                <p className="font-bold text-sm leading-tight line-clamp-2 mb-0.5">{item.name}</p>
                <p className="text-[11px] mb-2" style={{ color: "var(--text-secondary)" }}>{item.category}</p>
                <p className="font-bold text-sm" style={{ color: "#D97706" }}>
                  {item.originalPrice && (
                    <span className="line-through mr-1 font-normal opacity-60">{rupee(item.originalPrice)}</span>
                  )}
                  {rupee(item.price)}
                  <span className="font-normal text-[11px] ml-0.5">/{item.unit}</span>
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                </p>
              </button>
            ))}
            {displayItems.length === 0 && (
              <div className="col-span-3 py-12 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                No products found
              </div>
            )}
          </div>
        </div>

        {/* ── Right: current bill panel ── */}
        <div>
          <div className="ks-card p-5 sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base">Current Bill</h2>
              <span className="ks-mono text-sm font-bold" style={{ color: "#D97706" }}>{nextBillNo}</span>
            </div>

            {/* Cart items */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                Tap a product to add it
              </div>
            ) : (
              <div className="space-y-2.5 mb-4 max-h-52 overflow-y-auto ks-scroll">
                {cart.map((c) => (
                  <div key={c.shop_product_id} className="flex items-center gap-2">
                    <span className="text-sm flex-1 font-medium truncate">{c.name}</span>
                    {c.clearancePct && (
                      <span className="ks-mono text-[9px] font-bold px-1 py-0.5 rounded-full shrink-0" style={{ background: "#C13F45", color: "#fff" }}>
                        −{c.clearancePct}%
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(c.shop_product_id, c.qty - 1)} className="ks-qtybtn"><Minus size={11} /></button>
                      <span className="ks-mono w-5 text-center text-xs font-bold">{c.qty}</span>
                      <button onClick={() => updateQty(c.shop_product_id, c.qty + 1)} className="ks-qtybtn"><Plus size={11} /></button>
                    </div>
                    <span className="ks-mono text-xs font-semibold w-14 text-right shrink-0">{rupee(c.qty * c.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {cart.length > 0 && (
              <div className="py-3 border-t border-b mb-4 space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="ks-mono">{rupee(subtotal)}</span>
                </div>
                {cartGst > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span>GST</span>
                    <span className="ks-mono">{rupee(cartGst)}</span>
                  </div>
                )}
                {clearanceSavings > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: "#C13F45" }}>
                    <span>Clearance savings</span>
                    <span className="ks-mono">−{rupee(clearanceSavings)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: "#D97706" }}>
                    <span>Discount</span>
                    <span className="ks-mono">−{rupee(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="ks-mono">{rupee(total)}</span>
                </div>
              </div>
            )}

            {/* Customer */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Customer Name (Optional)
            </p>
            <input
              className="ks-input mb-2"
              placeholder="Walk-in Customer"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
            <input
              className="ks-input mb-3"
              placeholder="Phone number"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />

            {/* Loyalty */}
            {isLoyal && (
              <div className="rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-2" style={{ background: "#FCEEDA" }}>
                <span className="text-xs font-semibold text-[#7A5209]">⭐ Loyal · visit #{previousVisits + 1}</span>
                <button
                  onClick={() => setLoyaltyDiscount((v) => !v)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: loyaltyDiscount ? "#F2A93B" : "#fff", color: loyaltyDiscount ? "#fff" : "#B5720B" }}
                >
                  {loyaltyDiscount ? "5% ✓" : "Apply 5%"}
                </button>
              </div>
            )}

            {/* Extra discount */}
            <div className="flex gap-1.5 items-center mb-3">
              <button
                onClick={() => setManualDiscount((d) => ({ ...d, type: "pct" }))}
                className="text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0"
                style={{ background: manualDiscount.type === "pct" ? "var(--text-primary)" : "var(--bg-surface-alt)", color: manualDiscount.type === "pct" ? "#fff" : "var(--text-secondary)" }}
              >%</button>
              <button
                onClick={() => setManualDiscount((d) => ({ ...d, type: "amt" }))}
                className="text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0"
                style={{ background: manualDiscount.type === "amt" ? "var(--text-primary)" : "var(--bg-surface-alt)", color: manualDiscount.type === "amt" ? "#fff" : "var(--text-secondary)" }}
              >₹</button>
              <input
                type="number"
                min="0"
                placeholder="Discount"
                value={manualDiscount.value}
                onChange={(e) => setManualDiscount((d) => ({ ...d, value: e.target.value }))}
                className="ks-input text-sm py-1.5 flex-1"
              />
            </div>

            {/* Payment type */}
            <div className="flex gap-1.5 mb-3 p-1 rounded-full" style={{ background: "var(--bg-surface-alt)" }}>
              <button
                onClick={() => setBillType("cash")}
                className="flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors"
                style={{ background: billType === "cash" ? "var(--text-primary)" : "transparent", color: billType === "cash" ? "#fff" : "var(--text-secondary)" }}
              >
                Cash / Paid
              </button>
              <button
                onClick={() => setBillType("credit")}
                className="flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors"
                style={{ background: billType === "credit" ? "#B5399C" : "transparent", color: billType === "credit" ? "#fff" : "var(--text-secondary)" }}
              >
                Udhaar
              </button>
            </div>
            {billType === "credit" && !cleanPhone && (
              <p className="text-[11px] font-medium mb-2" style={{ color: "#C13F45" }}>Add a phone number for udhaar.</p>
            )}

            {/* Generate Bill */}
            <button
              disabled={cart.length === 0 || generating}
              onClick={generateBill}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm mb-2 disabled:opacity-40 transition-opacity"
              style={{ background: "var(--text-primary)", color: "#fff" }}
            >
              {generating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {billType === "credit" ? "Generate Udhaar Bill" : "Generate Bill"}
            </button>

            {cart.length > 0 && (
              <button onClick={clearCart} className="w-full text-sm text-center py-1" style={{ color: "var(--text-secondary)" }}>
                Clear Cart
              </button>
            )}

            {/* Last bill actions */}
            {lastBill && (
              <div className="mt-4 pt-4 border-t ks-pop" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} style={{ color: "#4F46E5" }} />
                  <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>Bill generated!</p>
                  <span className="ks-mono text-xs ml-auto" style={{ color: "var(--text-secondary)" }}>{lastBill.bill_no} · {rupee(lastBill.total)}</span>
                </div>
                {taxBreakup(lastBill.items).taxAmt > 0 && (
                  <p className="text-[11px] mb-2 ks-mono" style={{ color: "var(--text-secondary)" }}>
                    GST {rupee(taxBreakup(lastBill.items).taxAmt)} included
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => printBill(lastBill)} className="ks-btn-outline flex items-center justify-center gap-1.5 text-xs py-2">
                    <Printer size={13} /> Print
                  </button>
                  <button
                    onClick={() => window.open(whatsappLink(lastBill.customer_phone, billMessageText(lastBill, activeShop?.name, activeShop?.gstin)), "_blank")}
                    disabled={!lastBill.customer_phone}
                    className="flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl font-semibold disabled:opacity-40"
                    style={{ background: "#25D366", color: "#fff" }}
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                </div>
                {activeShop?.upi_id && lastBill.payment_type !== "credit" && (
                  <div className="mt-3">
                    <UpiQrCard upiId={activeShop.upi_id} payeeName={activeShop.name} amount={lastBill.total} note={lastBill.bill_no} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {lastBill && (
        <div className="ks-print-only">
          <PrintBillContent bill={lastBill} storeName={activeShop?.name} gstin={activeShop?.gstin} />
        </div>
      )}

      {showVoiceBilling && (
        <VoiceBillingModal items={pricedItems} onConfirm={handleVoiceBillingConfirm} onClose={() => setShowVoiceBilling(false)} />
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
