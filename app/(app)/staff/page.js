"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";
import AddStaffModal from "@/components/AddStaffModal";
import EditStaffModal from "@/components/EditStaffModal";
import StaffCreatedModal from "@/components/StaffCreatedModal";
import Modal from "@/components/ui/Modal";
import { MODULES } from "@/lib/modules";

export default function StaffPage() {
  const { supabase, activeShopId, currentMember, isOwner, callStaffApi, showToast } = useShop();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [created, setCreated] = useState(null); // { name, staffCode, pin }
  const [removing, setRemoving] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    // Wait for currentMember to actually resolve before deciding — on a
    // fresh page load it starts null, and isOwner is falsy until then,
    // which would otherwise bounce the real owner away too.
    if (currentMember && !isOwner) router.replace("/dashboard");
  }, [currentMember, isOwner, router]);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const { data } = await supabase.from("shop_members").select("*").eq("shop_id", activeShopId).order("created_at");
    setMembers(data || []);
    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd({ name, pin, permissions }) {
    const { staffCode } = await callStaffApi("/api/staff/create", { shopId: activeShopId, name, pin, permissions });
    setShowAdd(false);
    setCreated({ name, staffCode, pin });
    load();
  }

  async function handleSave({ name, permissions, newPin }) {
    await callStaffApi("/api/staff/update", { memberId: editing.id, name, permissions, newPin });
    setEditing(null);
    showToast("Staff member updated");
    load();
  }

  async function confirmRemove() {
    setRemoveLoading(true);
    try {
      await callStaffApi("/api/staff/delete", { memberId: removing.id });
      showToast(`${removing.name} removed`);
      setRemoving(null);
      load();
    } finally {
      setRemoveLoading(false);
    }
  }

  if (!currentMember || !isOwner) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading staff…
      </div>
    );
  }

  const staff = members.filter((m) => m.role === "staff");
  const owner = members.find((m) => m.role === "owner");

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <p className="text-sm text-[#6B7280] max-w-md">
          Workers sign in with a staff code and PIN — from the login screen&apos;s &quot;Staff sign in&quot; tab — and only see
          the sections you allow.
        </p>
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5 shrink-0">
          <Plus size={16} /> Add staff member
        </button>
      </div>

      <div className="ks-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Staff code</th>
              <th className="px-5 py-3 font-medium">Access</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {owner && (
              <tr className="border-b border-[#E7E9F3]">
                <td className="px-5 py-3 font-semibold">{owner.name}</td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EEF0FE", color: "#4F46E5" }}>
                    OWNER
                  </span>
                </td>
                <td className="px-5 py-3 ks-mono text-[#6B7280]">—</td>
                <td className="px-5 py-3 text-[#6B7280]">Everything</td>
                <td className="px-5 py-3"></td>
              </tr>
            )}
            {staff.map((m) => (
              <tr key={m.id} className="border-b border-[#E7E9F3] last:border-0 hover:bg-[#F8F9FD]">
                <td className="px-5 py-3 font-semibold">{m.name}</td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                    STAFF
                  </span>
                </td>
                <td className="px-5 py-3 ks-mono font-semibold">{m.staff_code}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {MODULES.filter((mod) => m.permissions?.[mod.key]).map((mod) => (
                      <span key={mod.key} className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                        {mod.label}
                      </span>
                    ))}
                    {MODULES.every((mod) => !m.permissions?.[mod.key]) && <span className="text-xs text-[#6B7280]">None yet</span>}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditing(m)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "#E7E9F3", color: "#000000" }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setRemoving(m)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "#FDEAEA", color: "#C13F45" }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[#6B7280] text-sm">
                  No staff added yet — everyone signing in is you.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {editing && <EditStaffModal member={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {created && (
        <StaffCreatedModal name={created.name} staffCode={created.staffCode} pin={created.pin} onClose={() => setCreated(null)} />
      )}
      {removing && (
        <Modal title={`Remove ${removing.name}?`} onClose={() => setRemoving(null)}>
          <div className="space-y-3.5">
            <p className="text-sm text-[#6B7280]">
              They&apos;ll immediately lose access — their staff code and PIN stop working. This can&apos;t be undone; you&apos;d need
              to add them again with a new code.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRemoving(null)} className="ks-btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removeLoading}
                className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "#C13F45" }}
              >
                {removeLoading && <Loader2 size={16} className="animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
