"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import { MODULES } from "@/lib/modules";

export default function EditStaffModal({ member, onClose, onSave }) {
  const [name, setName] = useState(member.name);
  const [permissions, setPermissions] = useState(member.permissions || {});
  const [resetPin, setResetPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pinTooShort = resetPin && newPin.length > 0 && newPin.length < 6;
  const valid = name.trim() && (!resetPin || /^\d{6,}$/.test(newPin));

  function togglePermission(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), permissions, newPin: resetPin ? newPin : undefined });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit ${member.name}`} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label="Worker's name">
          <input className="ks-input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="What can they access?">
          <div className="grid grid-cols-2 gap-2">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 cursor-pointer transition-colors"
                style={
                  permissions[m.key]
                    ? { borderColor: "#4F46E5", background: "#EEF0FE", color: "#4F46E5" }
                    : { borderColor: "#E2E4F0", color: "#6B7280" }
                }
              >
                <input type="checkbox" className="hidden" checked={!!permissions[m.key]} onChange={() => togglePermission(m.key)} />
                {m.label}
              </label>
            ))}
          </div>
        </Field>
        {!resetPin ? (
          <button type="button" onClick={() => setResetPin(true)} className="text-xs font-semibold text-[#4F46E5]">
            Reset their PIN
          </button>
        ) : (
          <Field label="New PIN (6+ digits)">
            <input
              className="ks-input ks-mono"
              inputMode="numeric"
              autoFocus
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 583920"
            />
            {pinTooShort && (
              <p className="text-xs text-[#C13F45] font-medium mt-1">
                {6 - newPin.length} more digit{6 - newPin.length === 1 ? "" : "s"} needed
              </p>
            )}
          </Field>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        <button disabled={!valid || saving} onClick={handleSave} className="ks-btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </Modal>
  );
}
