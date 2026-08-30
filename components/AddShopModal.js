"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import ShopTypeIcon from "@/components/ShopTypeIcon";
import { SHOP_TYPES } from "@/lib/shopTypes";
import { useShop } from "@/components/ShopContext";
import { fetchShopItems } from "@/lib/products";

// Body shared by the modal (existing user adding a 2nd+ shop) and the
// full-page onboarding screen (brand-new account with zero shops). Every
// new shop starts empty by default — no pre-filled name, no auto-seeded
// items — with two opt-in ways to skip manual setup: a generic starter
// catalog for the business type, or importing items already set up in
// one of the owner's other shops.
function AddShopForm({ onAdd, onSuccess }) {
  const { supabase, shops } = useShop();
  const [type, setType] = useState("kirana");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("fresh"); // "fresh" | "import"
  const [seedTemplate, setSeedTemplate] = useState(false);

  const [sourceShopId, setSourceShopId] = useState("");
  const [sourceItems, setSourceItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loadingItems, setLoadingItems] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function pickSourceShop(id) {
    setSourceShopId(id);
    setSourceItems([]);
    setSelectedIds(new Set());
    if (!id) return;
    setLoadingItems(true);
    try {
      const items = await fetchShopItems(supabase, id);
      setSourceItems(items);
      setSelectedIds(new Set(items.map((i) => i.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingItems(false);
    }
  }

  function toggleItem(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === sourceItems.length ? new Set() : new Set(sourceItems.map((i) => i.id))));
  }

  async function handleAdd() {
    setSaving(true);
    setError("");
    try {
      const importItems = mode === "import" ? sourceItems.filter((i) => selectedIds.has(i.id)) : [];
      await onAdd(name.trim(), type, { seedTemplate: mode === "fresh" && seedTemplate, importItems });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3.5">
      <Field label="Business type">
        <div className="grid grid-cols-2 gap-2">
          {SHOP_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors ${
                type === t.id ? "border-[#4F46E5] bg-[#EEF0FE] text-[#4F46E5]" : "border-[#E2E4F0] text-[#6B7280]"
              }`}
            >
              <ShopTypeIcon type={t.id} size={15} /> {t.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Shop name">
        <input
          className="ks-input"
          placeholder="e.g. Sharma General Store"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      {shops.length > 0 && (
        <div className="flex rounded-xl border-2 border-[#E2E4F0] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("fresh")}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === "fresh" ? "bg-[#4F46E5] text-white" : "text-[#6B7280]"
            }`}
          >
            Start fresh
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === "import" ? "bg-[#4F46E5] text-white" : "text-[#6B7280]"
            }`}
          >
            Import from a shop
          </button>
        </div>
      )}

      {mode === "fresh" && (
        <label className="flex items-start gap-2 text-xs text-[#6B7280] cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={seedTemplate}
            onChange={(e) => setSeedTemplate(e.target.checked)}
          />
          Add a few starter items for this business type, so it&apos;s ready to use right away.
        </label>
      )}

      {mode === "import" && (
        <div className="space-y-2">
          <Field label="Copy items from">
            <select className="ks-input" value={sourceShopId} onChange={(e) => pickSourceShop(e.target.value)}>
              <option value="">Choose a shop…</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          {loadingItems && (
            <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" /> Loading items…
            </p>
          )}

          {!loadingItems && sourceShopId && sourceItems.length === 0 && (
            <p className="text-xs text-[#6B7280]">That shop has no items yet.</p>
          )}

          {!loadingItems && sourceItems.length > 0 && (
            <div className="border-2 border-[#E2E4F0] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={toggleAll}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#4F46E5] bg-[#F7F7FB] border-b border-[#E2E4F0]"
              >
                {selectedIds.size} of {sourceItems.length} selected
                <span>{selectedIds.size === sourceItems.length ? "Clear all" : "Select all"}</span>
              </button>
              <div className="max-h-40 overflow-y-auto divide-y divide-[#F1F1F7]">
                {sourceItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#FAFAFD]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-[#6B7280]">₹{item.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-[#6B7280]">Stock starts at 0 — prices and item details carry over.</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        disabled={!name.trim() || saving}
        onClick={handleAdd}
        className="ks-btn-primary w-full flex items-center justify-center gap-2"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Create shop
      </button>
    </div>
  );
}

export function AddShopModal({ onClose, onAdd }) {
  return (
    <Modal title="Add a new shop" onClose={onClose}>
      <AddShopForm onAdd={onAdd} onSuccess={onClose} />
    </Modal>
  );
}

// Full-page variant for a signed-in user with no shops yet — no backdrop,
// no dismiss button, since they must create one to proceed.
export function AddShopOnboarding({ onAdd }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 text-center">
          <h1 className="ks-display text-2xl font-bold">Set up your shop</h1>
          <p className="text-sm text-muted mt-1">One last step before you start billing.</p>
        </div>
        <div className="ks-card p-6">
          <AddShopForm onAdd={onAdd} />
        </div>
      </div>
    </main>
  );
}
