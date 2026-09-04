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

  function billProfit(bill) {
    return (bill.items || []).reduce((s, line) => {
      const cost = line.cost_price ?? items.find((i) => i.id === line.shop_product_id)?.cost_price ?? null;
      if (cost == null) return s;
      return s + (line.price - cost) * line.qty;
    }, 0);
  }

  return (
    <div className="pt-6 ks-billing-grid">
      <div>
        {lowStockItems.length > 0 && (
          <div className="ks-card p-3 mb-4 flex items-center gap-2 flex-wrap" style={{ borderLeft: "4px solid #C13F45" }}>
            <AlertTriangle size={14} style={{ color: "#C13F45" }} className="shrink-0" />
            <span className="text-xs font-semibold" style={{ color: "#C13F45" }}>Low stock:</span>
            <span className="text-xs text-[#6B7280] flex-1">
              {lowStockItems.slice(0, 5).map((i) => `${i.name} (${i.stock} ${i.unit})`).join(" · ")}
              {lowStockItems.length > 5 && ` · +${lowStockItems.length - 5} more`}
            </span>
          </div>
        )}
        {quickItems.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star size={12} fill="#F2A93B" color="#F2A93B" /> Quick add
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickItems.map((r) => {
                const c = categoryColor(r.category);
                return (
                  <button
                    key={r.id}
                    onClick={() => setPickerItem(r)}
                    disabled={r.stock <= 0}
                    className="text-left p-3 rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{ background: c.bg }}
                  >
                    {r.clearancePct && (
                      <span className="ks-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 inline-block" style={{ background: "#C13F45", color: "#fff" }}>
                        −{r.clearancePct}%
                      </span>
                    )}
                    <p className="font-bold text-sm leading-tight" style={{ color: c.text }}>{r.name}</p>
                    <p className="ks-mono text-xs mt-0.5" style={{ color: c.text, opacity: 0.7 }}>
                      {r.originalPrice && <span className="line-through mr-1">{rupee(r.originalPrice)}</span>}
                      {rupee(r.price)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowVoiceBilling(true)}
          className="w-full flex items-center gap-3 mb-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-transform active:scale-[0.98]"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Mic size={18} />
          <span>Voice billing mode</span>
          <span className="ml-auto text-xs font-normal opacity-75">Speak to add items &amp; print</span>
        </button>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0A996]" />
          <input
            placeholder="Search by name or 2-digit code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ks-input py-3"
            style={{ paddingLeft: "2.5rem", paddingRight: "3rem" }}
          />
          <button
            onClick={startBarcodeScanner}
            title="Scan barcode with camera"
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${scannerActive ? "ks-pulse" : ""}`}
            style={{ background: scannerActive ? "#4F46E5" : "#E7E9F3", color: scannerActive ? "#fff" : "#6B7280" }}
          >
            <ScanLine size={15} />
          </button>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1.5 w-full bg-white rounded-2xl overflow-hidden shadow-xl border border-[#E7E9F3]">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setPickerItem(r)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F8F9FD] flex items-center justify-between border-b border-[#E7E9F3] last:border-0"
                >
                  <span className="flex items-center gap-2">
                    <ItemThumb item={r} size={24} />
                    <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                      {r.code}
                    </span>
                    <span className="font-medium">{r.name}</span>
                    {r.clearancePct && (
                      <span className="ks-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#C13F45", color: "#fff" }}>
                        −{r.clearancePct}%
                      </span>
                    )}
                  </span>
                  <span className="ks-mono text-xs text-[#6B7280]">
                    {r.originalPrice && <span className="line-through mr-1">{rupee(r.originalPrice)}</span>}
                    {rupee(r.price)} · {r.stock} {r.unit} left
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>


        <div className="ks-card mt-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E7E9F3]">
            <h2 className="ks-display font-bold">Bill items</h2>
          </div>
          {cart.length === 0 ? (
            <p className="text-sm text-[#6B7280] p-8 text-center">Search and tap an item above to add it to the bill.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {cart.map((c) => (
                  <tr key={c.shop_product_id} className="border-b border-[#E7E9F3] last:border-0">
                    <td className="px-5 py-3 font-medium">
                      <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                        {c.code}
                      </span>
                      {c.name}
                      {c.clearancePct && (
                        <span className="ml-1.5 ks-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#C13F45", color: "#fff" }}>
                          −{c.clearancePct}%
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 ks-mono text-[#6B7280]">
                      {c.originalPrice && <span className="line-through mr-1">{rupee(c.originalPrice)}</span>}
                      {rupee(c.price)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.shop_product_id, c.qty - 1)} className="ks-qtybtn">
                          <Minus size={13} />
                        </button>
                        <span className="ks-mono w-7 text-center font-semibold">{c.qty}</span>
                        <button onClick={() => updateQty(c.shop_product_id, c.qty + 1)} className="ks-qtybtn">
                          <Plus size={13} />
                        </button>
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
            <input
              placeholder="Customer name"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="ks-input"
            />
            <input
              placeholder="Phone number"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="ks-input"
            />
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

          <div className="mb-3">
            <p className="text-xs font-semibold text-[#6B7280] mb-1.5 flex items-center gap-1">
              <Tag size={11} /> Extra discount (optional)
            </p>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setManualDiscount((d) => ({ ...d, type: "pct" }))}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0 ${manualDiscount.type === "pct" ? "bg-[#000000] text-white" : "bg-[#E7E9F3] text-[#6B7280]"}`}
              >
                %
              </button>
              <button
                onClick={() => setManualDiscount((d) => ({ ...d, type: "amt" }))}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-full shrink-0 ${manualDiscount.type === "amt" ? "bg-[#000000] text-white" : "bg-[#E7E9F3] text-[#6B7280]"}`}
              >
                ₹
              </button>
              <input
                type="number"
                min="0"
                placeholder={manualDiscount.type === "pct" ? "e.g. 10 for 10%" : "e.g. 50"}
                value={manualDiscount.value}
                onChange={(e) => setManualDiscount((d) => ({ ...d, value: e.target.value }))}
                className="ks-input text-sm py-1.5 flex-1"
              />
            </div>
          </div>

          <div className="flex gap-1.5 mb-4 bg-[#E7E9F3] p-1 rounded-full">
            <button
              onClick={() => setBillType("cash")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors ${billType === "cash" ? "bg-[#000000] text-white" : "text-[#6B7280]"}`}
            >
              Cash / Paid
            </button>
            <button
              onClick={() => setBillType("credit")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-colors ${billType === "credit" ? "bg-[#B5399C] text-white" : "text-[#6B7280]"}`}
            >
              Udhaar (Credit)
            </button>
          </div>
          {billType === "credit" && !cleanPhone && (
            <p className="text-[11px] text-[#C13F45] font-medium -mt-2.5 mb-3">Add a mobile number to bill this on udhaar.</p>
          )}

          <div className="py-4 border-t border-b border-[#E7E9F3] mb-4 space-y-1.5">
            {clearanceSavings > 0 && (
              <div className="flex items-center justify-between text-xs" style={{ color: "#C13F45" }}>
                <span>🏷️ Clearance savings</span>
                <span className="ks-mono">−{rupee(clearanceSavings)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Subtotal</span>
                <span className="ks-mono">{rupee(subtotal)}</span>
              </div>
            )}
            {loyaltyDiscountAmount > 0 && (
              <div className="flex items-center justify-between text-xs" style={{ color: "#B5720B" }}>
                <span>Loyalty discount (5%)</span>
                <span className="ks-mono">−{rupee(loyaltyDiscountAmount)}</span>
              </div>
            )}
            {manualDiscountAmount > 0 && (
              <div className="flex items-center justify-between text-xs" style={{ color: "#B5720B" }}>
                <span>Extra discount{manualDiscount.type === "pct" ? ` (${manualDiscount.value}%)` : ""}</span>
                <span className="ks-mono">−{rupee(manualDiscountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="ks-display font-bold">Total</span>
              <span className="ks-mono text-2xl font-bold text-[#4F46E5]">{rupee(total)}</span>
            </div>
          </div>
          <button disabled={cart.length === 0 || generating} onClick={generateBill} className="ks-btn-primary w-full flex items-center justify-center gap-2">
            {generating && <Loader2 size={16} className="animate-spin" />}
            {billType === "credit" ? "Generate udhaar bill" : "Generate bill"}
          </button>

          {lastBill && (
            <div className="mt-4 pt-4 border-t border-[#E7E9F3] ks-pop">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-[#4F46E5]" />
                <p className="text-sm font-bold text-[#4F46E5]">Bill generated!</p>
              </div>
              <p className="text-xs text-[#6B7280] mb-2.5">
                Bill: <span className="ks-mono font-semibold text-[#000000]">{lastBill.bill_no}</span> · {rupee(lastBill.total)}
              </p>
              {taxBreakup(lastBill.items).taxAmt > 0 && (
                <p className="text-[11px] text-[#6B7280] mb-2.5 ks-mono">
                  Taxable {rupee(taxBreakup(lastBill.items).taxable)} + GST {rupee(taxBreakup(lastBill.items).taxAmt)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => printBill(lastBill)} className="ks-btn-outline w-full flex items-center justify-center gap-1.5">
                  <Printer size={15} /> Print
                </button>
                <button
                  onClick={() => window.open(whatsappLink(lastBill.customer_phone, billMessageText(lastBill, activeShop?.name, activeShop?.gstin)), "_blank")}
                  disabled={!lastBill.customer_phone}
                  title={!lastBill.customer_phone ? "Add a customer mobile number to send the bill" : "Send via WhatsApp"}
                  className="w-full rounded-full text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: "#25D366" }}
                >
                  <MessageCircle size={15} /> Send bill
                </button>
              </div>
              {!lastBill.customer_phone && (
                <p className="text-[11px] text-[#6B7280] mt-1.5">Add a customer mobile number next time to send the bill directly.</p>
              )}
              {activeShop?.upi_id && lastBill.payment_type !== "credit" && (
                <div className="mt-3">
                  <UpiQrCard upiId={activeShop.upi_id} payeeName={activeShop.name} amount={lastBill.total} note={lastBill.bill_no} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {lastBill && (
        <div className="ks-print-only">
          <PrintBillContent bill={lastBill} storeName={activeShop?.name} gstin={activeShop?.gstin} />
        </div>
      )}

      <div className="mt-6 ks-no-print" style={{ gridColumn: "1 / -1" }}>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          <History size={15} />
          Recent bills ({bills.length})
          <span className="text-xs font-normal">{showHistory ? "▲ hide" : "▼ show"}</span>
        </button>
        {showHistory && (
          <div className="ks-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
                  <th className="px-4 py-3 font-medium">Bill #</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Profit</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {bills.slice(0, 50).map((b) => {
                  const profit = billProfit(b);
                  const hasProfit = (b.items || []).some((l) => l.cost_price != null || items.find((i) => i.id === l.shop_product_id)?.cost_price != null);
                  return (
                    <tr key={b.id} className="border-b border-[#E7E9F3] last:border-0 hover:bg-[#F8F9FD]">
                      <td className="px-4 py-2.5 ks-mono font-bold text-xs">{b.bill_no}</td>
                      <td className="px-4 py-2.5 text-xs text-[#6B7280]">
                        {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{b.customer_name || <span className="text-[#B0A996]">—</span>}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: b.payment_type === "credit" ? "#F3E8FD" : "#E4F5F0", color: b.payment_type === "credit" ? "#B5399C" : "#4F46E5" }}
                        >
                          {b.payment_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 ks-mono font-semibold text-right">{rupee(b.total)}</td>
                      <td className="px-4 py-2.5 ks-mono text-right text-xs">
                        {hasProfit ? (
                          <span className="font-semibold" style={{ color: profit >= 0 ? "#4F46E5" : "#C13F45" }}>
                            {profit >= 0 ? "+" : ""}{rupee(profit)}
                          </span>
                        ) : (
                          <span className="text-[#B0A996]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => printBill(b)}
                          className="text-[10px] px-2 py-1 rounded-full font-semibold"
                          style={{ background: "#E7E9F3", color: "#6B7280" }}
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6B7280]">No bills yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showVoiceBilling && (
        <VoiceBillingModal
          items={pricedItems}
          onConfirm={handleVoiceBillingConfirm}
          onClose={() => setShowVoiceBilling(false)}
        />
      )}
      {pickerItem && (
        <QtyPickerModal
          item={pickerItem}
          onClose={() => setPickerItem(null)}
          onConfirm={(qty) => {
            addToCart(pickerItem, qty);
            setPickerItem(null);
          }}
        />
      )}
    </div>
  );
}
