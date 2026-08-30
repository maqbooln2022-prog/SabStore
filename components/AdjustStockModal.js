"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";

export default function AdjustStockModal({ item, type, suppliers, onClose, onConfirm }) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(type === "in" ? "Purchase" : "Damage/Wastage");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const reasons = type === "in" ? ["Purchase", "Return from customer", "Correction"] : ["Damage/Wastage", "Personal use", "Correction"];
  const valid = Number(qty) > 0;

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      await onConfirm(Number(qty), reason, supplier.trim());
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={`${type === "in" ? "Stock in" : "Stock out"}: ${item.name}`} onClose={onClose}>
      <div className="space-y-3.5">
        <p className="text-xs text-[#6B7280]">
          Current stock: <span className="ks-mono font-semibold text-[#000000]">{item.stock} {item.unit}</span>
        </p>
        <Field label={`Quantity (${item.unit})`}>
          <input autoFocus type="number" className="ks-input" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Reason">
          <select className="ks-input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        {type === "in" && reason === "Purchase" && (
          <Field label="Supplier (optional)">
            <input
              className="ks-input"
              list="ks-supplier-list"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Ramesh Distributors"
            />
            <datalist id="ks-supplier-list">
              {(suppliers || []).map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </Field>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          disabled={!valid || saving}
          onClick={handleConfirm}
          className="w-full rounded-full text-white text-sm font-semibold py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: type === "in" ? "#4F46E5" : "#C13F45" }}
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Confirm {type === "in" ? "stock in" : "stock out"}
        </button>
      </div>
    </Modal>
  );
}
