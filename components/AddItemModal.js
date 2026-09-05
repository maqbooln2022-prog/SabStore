"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, ScanBarcode } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import { nextCode } from "@/lib/inventoryHelpers";

export default function AddItemModal({ items, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    hindi_name: "",
    category: "",
    unit: "pcs",
    price: "",
    cost_price: "",
    gst: "",
    stock: "",
    low_at: "5",
    code: nextCode(items),
    image_url: "",
    barcode: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listeningField, setListeningField] = useState(null);
  const [suggestions, setSuggestions] = useState(null); // null = no search run yet, [] = searched but empty
  const [suggestLoading, setSuggestLoading] = useState(false);
  const recogRef = useRef(null);
  const abortRef = useRef(null);
  const valid = form.name.trim() && form.price !== "" && form.stock !== "" && /^\d{2}$/.test(form.code);

  // Debounced product lookup from Open Food Facts as user types the name
  useEffect(() => {
    const q = form.name.trim();
    if (q.length < 3) { setSuggestions(null); return; }
    if (form.barcode) { setSuggestions(null); return; } // already filled

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSuggestLoading(true);
      try {
        const fields = "code,product_name,image_front_small_url";
        const base = `action=process&json=1&search_simple=1&page_size=20&fields=${fields}`;
        // Fetch from India DB first, then world DB in parallel
        const [resIn, resWorld] = await Promise.all([
          fetch(`https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&${base}`, { signal: ctrl.signal }),
          fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&${base}`, { signal: ctrl.signal }),
        ]);
        const [jsonIn, jsonWorld] = await Promise.all([resIn.json(), resWorld.json()]);

        // Most specific word = longest word in query (e.g. "sunflower" from "sunflower oil")
        const qLower = q.toLowerCase();
        const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
        const primary = [...qWords].sort((a, b) => b.length - a.length)[0] || qLower;

        const seen = new Set();
        const merged = [...(jsonIn.products || []), ...(jsonWorld.products || [])]
          .filter((p) => {
            if (!p.code || !p.product_name) return false;
            if (seen.has(p.code)) return false;
            seen.add(p.code);
            // Require the most specific word to appear in the product name
            return p.product_name.toLowerCase().includes(primary);
          })
          .slice(0, 6)
          .map((p) => ({ barcode: p.code, name: p.product_name, image: p.image_front_small_url || "" }));
        setSuggestions(merged);
      } catch (e) {
        if (e?.name !== "AbortError") setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  function pickSuggestion(s) {
    setForm((prev) => ({
      ...prev,
      barcode: s.barcode,
      image_url: prev.image_url || s.image,
    }));
    setSuggestions(null);
  }

  function startVoice(field) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recogRef.current) { recogRef.current.abort(); recogRef.current = null; }
    if (listeningField === field) { setListeningField(null); return; }
    const r = new SR();
    r.lang = field === "hindi_name" ? "hi-IN" : "en-IN";
    r.interimResults = false;
    r.maxAlternatives = 1;
    recogRef.current = r;
    setListeningField(field);
    r.onresult = (e) => {
      setForm((prev) => ({ ...prev, [field]: e.results[0][0].transcript.trim() }));
      setListeningField(null);
      recogRef.current = null;
    };
    r.onerror = () => { setListeningField(null); recogRef.current = null; };
    r.onend = () => { setListeningField(null); recogRef.current = null; };
    r.start();
  }

  async function handleAdd() {
    setSaving(true);
    setError("");
    try {
      await onAdd({
        code: form.code.padStart(2, "0"),
        name: form.name.trim(),
        hindi_name: form.hindi_name.trim() || null,
        image_url: form.image_url.trim() || null,
        barcode: form.barcode.trim() || null,
        category: form.category.trim() || "General",
        unit: form.unit,
        price: Number(form.price),
        cost_price: form.cost_price !== "" ? Number(form.cost_price) : null,
        gst: form.gst !== "" ? Number(form.gst) : null,
        stock: Number(form.stock),
        low_at: Number(form.low_at) || 5,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Add new item" onClose={onClose}>
      <div className="space-y-3.5">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Code">
            <input
              className="ks-input ks-mono text-center"
              maxLength={2}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 2) })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Item name">
              <div className="relative">
                <input
                  className="ks-input"
                  style={{ paddingRight: "2.5rem" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Speak or type — barcode auto-fills"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => startVoice("name")}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${listeningField === "name" ? "ks-pulse" : ""}`}
                  style={{ background: listeningField === "name" ? "#C13F45" : "#E7E9F3", color: listeningField === "name" ? "#fff" : "#6B7280" }}
                  title="Speak item name"
                >
                  <Mic size={13} />
                </button>

                {/* Product suggestions dropdown */}
                {!form.barcode && (suggestLoading || suggestions !== null) && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-[#E7E9F3] overflow-hidden">
                    {suggestLoading && (
                      <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#6B7280]">
                        <Loader2 size={13} className="animate-spin" /> Looking up barcode…
                      </div>
                    )}
                    {!suggestLoading && suggestions !== null && suggestions.length === 0 && (
                      <div className="px-4 py-3 text-xs text-[#6B7280]">
                        Not found in product database — enter barcode manually if you have it.
                      </div>
                    )}
                    {(suggestions || []).map((s) => (
                      <button
                        key={s.barcode}
                        type="button"
                        onClick={() => pickSuggestion(s)}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FD] border-b border-[#E7E9F3] last:border-0"
                      >
                        {s.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#E7E9F3" }}>
                            <ScanBarcode size={14} style={{ color: "#6B7280" }} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{s.name}</p>
                          <p className="text-xs text-[#6B7280] ks-mono">{s.barcode}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>

        {/* Show barcode filled badge */}
        <Field label="Barcode">
          <div className="relative">
            <input
              className="ks-input ks-mono"
              style={{ paddingLeft: form.barcode ? "2rem" : undefined }}
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              placeholder="Auto-filled from product name, or type/paste"
            />
            {form.barcode && (
              <ScanBarcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4F46E5" }} />
            )}
          </div>
        </Field>

        <Field label="Hindi / local name (optional — helps voice billing)">
          <div className="relative">
            <input
              className="ks-input"
              style={{ paddingRight: "2.5rem" }}
              value={form.hindi_name}
              onChange={(e) => setForm({ ...form, hindi_name: e.target.value })}
              placeholder="e.g. चीनी — tap mic to speak in Hindi"
            />
            <button
              type="button"
              onClick={() => startVoice("hindi_name")}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${listeningField === "hindi_name" ? "ks-pulse" : ""}`}
              style={{ background: listeningField === "hindi_name" ? "#4F46E5" : "#E7E9F3", color: listeningField === "hindi_name" ? "#fff" : "#6B7280" }}
              title="बोलकर हिंदी नाम भरें"
            >
              <Mic size={13} />
            </button>
          </div>
        </Field>

        <Field label="Photo URL (optional)">
          <div className="flex items-center gap-2.5">
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <input
              className="ks-input"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="Paste an image link"
            />
          </div>
        </Field>

        <Field label="Category">
          <input
            className="ks-input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Grocery"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit">
            <select className="ks-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {["pcs", "kg", "g", "l", "ml", "packet"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Selling price (₹)">
            <input type="number" className="ks-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchase price (₹, optional)">
            <input
              type="number"
              className="ks-input"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            />
          </Field>
          <Field label="GST % (optional)">
            <select className="ks-input" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })}>
              <option value="">None</option>
              {[0, 5, 12, 18, 28].map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Opening stock">
            <input type="number" className="ks-input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
          <Field label="Low stock alert at">
            <input type="number" className="ks-input" value={form.low_at} onChange={(e) => setForm({ ...form, low_at: e.target.value })} />
          </Field>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        <button disabled={!valid || saving} onClick={handleAdd} className="ks-btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Add item
        </button>
      </div>
    </Modal>
  );
}
