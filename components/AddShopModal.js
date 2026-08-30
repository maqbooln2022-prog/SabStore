"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import ShopTypeIcon from "@/components/ShopTypeIcon";
import { SHOP_TYPES, shopTypeInfo } from "@/lib/shopTypes";

// Body shared by the modal (existing user adding a 2nd+ shop) and the
// full-page onboarding screen (brand-new account with zero shops).
function AddShopForm({ onAdd, onSuccess }) {
  const [type, setType] = useState("kirana");
  const [name, setName] = useState(shopTypeInfo("kirana").sample);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    setSaving(true);
    setError("");
    try {
      await onAdd(name.trim(), type);
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
              onClick={() => {
                setType(t.id);
                setName(t.sample);
              }}
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
        <input className="ks-input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <p className="text-xs text-[#6B7280]">
        We&apos;ll pre-fill a few starter items for this business type so it&apos;s ready to use right away.
      </p>
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
