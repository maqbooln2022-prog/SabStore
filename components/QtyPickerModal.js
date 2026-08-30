"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import { rupee } from "@/lib/format";
import { SMALLER_UNIT, UNIT_FACTOR } from "@/lib/voiceHelpers";

export default function QtyPickerModal({ item, onClose, onConfirm }) {
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
                onClick={() => {
                  setInputUnit(u);
                  setQty("1");
                }}
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
          <p className="text-xs text-[#6B7280]">
            = <span className="ks-mono font-semibold text-[#000000]">{num} {item.unit}</span>
          </p>
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
