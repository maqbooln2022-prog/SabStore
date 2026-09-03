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
import { fetchShopItems } from "@/lib/products";
import { fetchActiveOffers, activeDiscountMap, clearancePrice } from "@/lib/clearance";
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
  const [lastBill, setLastBill] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [pickerItem, setPickerItem] = useState(null);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [generating, setGenerating] = useState(false);
  const recognitionRef = useRef(null);
  const voiceSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const [itemsData, { data: billsData }, offersData] = await Promise.all([
      fetchShopItems(supabase, activeShopId),
      supabase.from("bills").select("*").eq("shop_id", activeShopId).order("date", { ascending: false }),
      fetchActiveOffers(supabase, activeShopId),
    ]);
    setItems(itemsData);
    setBills(billsData || []);
    setDiscountMap(activeDiscountMap(offersData));
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
  const discountAmount = loyaltyDiscount ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - discountAmount;
  const clearanceSavings = cart.reduce((s, c) => s + (c.originalPrice ? (c.originalPrice - c.price) * c.qty : 0), 0);

  async function generateBill() {
    if (cart.length === 0) return;
    if (billType === "credit" && !cleanPhone) return showToast("Add a customer mobile number for udhaar bills", "err");

    setGenerating(true);
    try {
      const billNo = `KS-${1000 + bills.length + 1}`;
      const billItems = cart.map(({ shop_product_id, code, name, price, unit, gst, qty }) => ({ shop_product_id, code, name, price, unit, gst, qty }));
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
    } catch (err) {
      showToast(err.message, "err");
    } finally {
      setGenerating(false);
    }
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
                      <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                        {r.code}
                      </span>
                      {r.name}
                    </div>
                    {r.clearancePct && (
                      <span className="ks-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#C13F45", color: "#fff" }}>
                        −{r.clearancePct}%
                      </span>
                    )}
                  </div>
                  <div className="ks-mono text-xs text-[#6B7280] mt-1">
                    {r.originalPrice && <span className="line-through mr-1">{rupee(r.originalPrice)}</span>}
                    {rupee(r.price)} · {r.stock} {r.unit} left
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0A996]" />
          <input
            placeholder="Search by name or 2-digit code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ks-input pl-10 pr-11 py-3"
          />
          <button
            onClick={startVoiceAdd}
            disabled={!voiceSupported}
            title={voiceSupported ? 'Speak to add an item — e.g. "2 kg sugar"' : "Voice input not supported in this browser"}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${listening ? "ks-pulse" : ""}`}
            style={{ background: listening ? "#E5484D" : "#E7E9F3", color: listening ? "#fff" : "#6B7280" }}
          >
            <Mic size={15} />
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
        {listening && (
          <p className="text-xs text-[#C13F45] font-medium mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] ks-pulse" /> Listening ({voiceLang === "hi-IN" ? "Hindi" : "English"})... try
            &quot;250 grams sugar&quot; or &quot;1.5 liters oil&quot;
          </p>
        )}
        {!listening && lastHeard && <p className="text-xs text-[#6B7280] mt-1.5">Heard: &quot;{lastHeard}&quot;</p>}
        {voiceSupported && (
          <div className="flex items-center gap-1.5 mt-2">
            <Languages size={13} className="text-[#6B7280]" />
            <button
              onClick={() => setVoiceLang("en-IN")}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${voiceLang === "en-IN" ? "bg-[#000000] text-white" : "bg-[#E7E9F3] text-[#6B7280]"}`}
            >
              English
            </button>
            <button
              onClick={() => setVoiceLang("hi-IN")}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${voiceLang === "hi-IN" ? "bg-[#000000] text-white" : "bg-[#E7E9F3] text-[#6B7280]"}`}
            >
              हिन्दी
            </button>
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
                  <span className="ks-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                    {r.code}
                  </span>
                  <span className="font-semibold text-sm leading-tight">{r.name}</span>
                  {r.clearancePct && (
                    <span className="ks-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#C13F45", color: "#fff" }}>
                      −{r.clearancePct}%
                    </span>
                  )}
                </div>
                <div className="ks-mono text-xs text-[#6B7280] mt-1">
                  {r.originalPrice && <span className="line-through mr-1">{rupee(r.originalPrice)}</span>}
                  {rupee(r.price)} · {r.stock} {r.unit} left
                </div>
              </button>
            ))}
          </div>
        )}

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
