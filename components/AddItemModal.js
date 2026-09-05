"use client";

import { useRef, useState } from "react";
import { Loader2, Mic } from "lucide-react";
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
  const [listeningField, setListeningField] = useState(null); // 'name' | 'hindi_name'
  const recogRef = useRef(null);

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
  const valid = form.name.trim() && form.price !== "" && form.stock !== "" && /^\d{2}$/.test(form.code);

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
                  placeholder="Speak or type"
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
              </div>
            </Field>
          </div>
        </div>
        <Field label="Barcode (optional)">
          <input
            className="ks-input ks-mono"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            placeholder="Type or paste"
          />
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
                onError={(e) => {
                  e.target.style.display = "none";
                }}
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
                <option key={r} value={r}>
                  {r}%
                </option>
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
