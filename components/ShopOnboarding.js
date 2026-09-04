"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Field from "@/components/ui/Field";
import ShopTypeIcon from "@/components/ShopTypeIcon";
import { SHOP_TYPES } from "@/lib/shopTypes";

// One owner, one shop, chosen right here at signup — there's no "add
// another shop" flow, so this only ever renders once, for a brand-new
// account with zero shops (see app/(app)/layout.js).
export function AddShopOnboarding({ onAdd }) {
  const [type, setType] = useState("kirana");
  const [name, setName] = useState("");
  const [seedTemplate, setSeedTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      await onAdd(name.trim(), type, { seedTemplate });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 text-center">
          <h1 className="ks-display text-2xl font-bold">Set up your shop</h1>
          <p className="text-sm text-muted mt-1">One last step before you start billing.</p>
        </div>
        <div className="ks-card p-6 space-y-3.5">
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
          <label className="flex items-start gap-2 text-xs text-[#6B7280] cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={seedTemplate}
              onChange={(e) => setSeedTemplate(e.target.checked)}
            />
            Add a few starter items for this business type, so it&apos;s ready to use right away.
          </label>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            disabled={!name.trim() || saving}
            onClick={handleCreate}
            className="ks-btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Create shop
          </button>
        </div>
      </div>
    </main>
  );
}
