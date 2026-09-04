"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Ban,
  UserCheck,
  Trash2,
  Loader2,
  Store,
  AlertTriangle,
  ChevronDown,
  Pencil,
  ArrowUpCircle,
  Users,
  LogOut,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import { createClient } from "@/lib/supabaseClient";
import { callApi } from "@/lib/apiClient";
import { MODULES } from "@/lib/modules";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function AdminPage() {
  return (
    <AuthGuard redirectTo="/admin/login">
      <AdminPageInner />
    </AuthGuard>
  );
}

function AdminPageInner() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedShopId, setExpandedShopId] = useState(null);
  const [confirmSuspend, setConfirmSuspend] = useState(null); // owner object
  const [confirmDeleteShop, setConfirmDeleteShop] = useState(null); // shop object
  const [editMember, setEditMember] = useState(null); // member object
  const [confirmTransfer, setConfirmTransfer] = useState(null); // { shop, member }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await callApi(supabase, "/api/admin/overview", null, "GET");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;
    supabase.rpc("is_platform_admin").then(async ({ data: isAdmin }) => {
      if (!active) return;
      if (!isAdmin) {
        // Whoever this is, they don't belong in the regular shop app either
        // — /admin/login is a dead-end door, not a side entrance into it.
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }
      setAllowed(true);
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function suspendOwner(owner) {
    setBusyId(owner.id);
    try {
      await callApi(supabase, "/api/admin/suspend-owner", { ownerId: owner.id });
      setConfirmSuspend(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reinstateOwner(owner) {
    setBusyId(owner.id);
    try {
      await callApi(supabase, "/api/admin/reinstate-owner", { ownerId: owner.id });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteShop(shop) {
    setBusyId(shop.id);
    try {
      await callApi(supabase, "/api/admin/delete-shop", { shopId: shop.id });
      setConfirmDeleteShop(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function saveMember(memberId, fields) {
    await callApi(supabase, "/api/admin/update-member", { memberId, ...fields });
    setEditMember(null);
    await load();
  }

  async function transferOwnership(shop, member) {
    setBusyId(member.id);
    try {
      await callApi(supabase, "/api/admin/transfer-ownership", { shopId: shop.id, newOwnerUserId: member.user_id });
      setConfirmTransfer(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (checking || !allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  return (
    <main className="min-h-screen ks-page-pad py-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="ks-display text-xl font-bold flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#4F46E5]" /> Platform admin
        </h1>
        <button
          onClick={handleSignOut}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] px-3 py-1.5 rounded-full bg-[#E7E9F3]"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
      <p className="text-sm text-[#6B7280] mb-5">Every owner and shop on SabStore.</p>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="ks-card p-4">
              <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide">Owner logins</div>
              <div className="ks-mono text-2xl font-bold mt-1">{data.totals.ownerCount}</div>
            </div>
            <div className="ks-card p-4">
              <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide">Staff logins</div>
              <div className="ks-mono text-2xl font-bold mt-1">{data.totals.staffCount}</div>
            </div>
            <div className="ks-card p-4">
              <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide">Shops</div>
              <div className="ks-mono text-2xl font-bold mt-1">{data.totals.shopCount}</div>
            </div>
            <div className="ks-card p-4">
              <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide">Bills</div>
              <div className="ks-mono text-2xl font-bold mt-1">{data.totals.billCount}</div>
            </div>
          </div>

          <div className="space-y-3">
            {data.owners.map((owner) => (
              <div key={owner.id} className="ks-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {owner.email}
                      {owner.banned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FDEAEA", color: "#C13F45" }}>
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6B7280]">Joined {fmtDate(owner.created_at)}</div>
                  </div>
                  {owner.banned ? (
                    <button
                      onClick={() => reinstateOwner(owner)}
                      disabled={busyId === owner.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{ background: "#E4F5F0", color: "#0F6E56" }}
                    >
                      {busyId === owner.id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                      Reinstate
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmSuspend(owner)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{ background: "#FDEAEA", color: "#C13F45" }}
                    >
                      <Ban size={13} /> Suspend
                    </button>
                  )}
                </div>

                <div className="mt-3 divide-y divide-[#F1F1F7] border-t border-[#F1F1F7]">
                  {owner.shops.map((shop) => {
                    const expanded = expandedShopId === shop.id;
                    return (
                      <div key={shop.id}>
                        <button
                          onClick={() => setExpandedShopId(expanded ? null : shop.id)}
                          className="w-full flex items-center justify-between gap-3 py-2 text-sm text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Store size={14} className="text-[#B0A996] shrink-0" />
                            <span className="font-medium truncate">{shop.name}</span>
                            <span className="text-xs text-[#6B7280] shrink-0">{fmtDate(shop.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[#6B7280]">
                              1 owner · {shop.staff_count} staff · {shop.bill_count} bill{shop.bill_count === 1 ? "" : "s"}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteShop(shop);
                              }}
                              role="button"
                              className="w-7 h-7 rounded-full flex items-center justify-center"
                              style={{ background: "#FDEAEA", color: "#C13F45" }}
                              title="Delete this shop"
                            >
                              <Trash2 size={13} />
                            </span>
                            <ChevronDown size={15} className={`text-[#B0A996] transition-transform ${expanded ? "rotate-180" : ""}`} />
                          </div>
                        </button>

                        {expanded && (
                          <div className="pb-3 pl-6 space-y-1.5">
                            {shop.members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between gap-2 text-xs bg-[#FAFAFD] rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Users size={12} className="text-[#B0A996] shrink-0" />
                                  <span className="font-semibold truncate">{m.name}</span>
                                  <span className="text-[#6B7280] truncate">{m.email}</span>
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                    style={
                                      m.role === "owner" ? { background: "#EEF0FE", color: "#4F46E5" } : { background: "#E7E9F3", color: "#6B7280" }
                                    }
                                  >
                                    {m.role.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setEditMember(m)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center bg-[#E7E9F3] text-[#6B7280]"
                                    title="Edit"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  {m.role === "staff" && (
                                    <button
                                      onClick={() => setConfirmTransfer({ shop, member: m })}
                                      className="w-6 h-6 rounded-full flex items-center justify-center"
                                      style={{ background: "#E4F5F0", color: "#0F6E56" }}
                                      title="Make owner"
                                    >
                                      <ArrowUpCircle size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {data.owners.length === 0 && <p className="text-sm text-[#6B7280] text-center py-10">No shops on the platform yet.</p>}
          </div>
        </>
      )}

      {confirmSuspend && (
        <Modal title="Suspend this owner?" onClose={() => setConfirmSuspend(null)}>
          <div className="space-y-3.5">
            <div className="flex items-start gap-2 text-xs text-[#C13F45] bg-[#FDEAEA] rounded-lg px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>{confirmSuspend.email}</strong> won&apos;t be able to sign in until reinstated. Their shops and
                data are untouched.
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSuspend(null)} className="ks-btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={() => suspendOwner(confirmSuspend)}
                disabled={busyId === confirmSuspend.id}
                className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "#C13F45" }}
              >
                {busyId === confirmSuspend.id && <Loader2 size={16} className="animate-spin" />}
                Suspend
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDeleteShop && (
        <DeleteShopModal
          shop={confirmDeleteShop}
          busy={busyId === confirmDeleteShop.id}
          onClose={() => setConfirmDeleteShop(null)}
          onConfirm={() => deleteShop(confirmDeleteShop)}
        />
      )}

      {editMember && (
        <EditMemberModal member={editMember} onClose={() => setEditMember(null)} onSave={(fields) => saveMember(editMember.id, fields)} />
      )}

      {confirmTransfer && (
        <Modal title="Transfer ownership?" onClose={() => setConfirmTransfer(null)}>
          <div className="space-y-3.5">
            <div className="flex items-start gap-2 text-xs text-[#C13F45] bg-[#FDEAEA] rounded-lg px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>{confirmTransfer.member.name}</strong> ({confirmTransfer.member.email}) becomes the owner of{" "}
                <strong>{confirmTransfer.shop.name}</strong>. The current owner is demoted to staff on this shop —
                their other shops are untouched.
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTransfer(null)} className="ks-btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={() => transferOwnership(confirmTransfer.shop, confirmTransfer.member)}
                disabled={busyId === confirmTransfer.member.id}
                className="ks-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {busyId === confirmTransfer.member.id && <Loader2 size={16} className="animate-spin" />}
                Transfer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function DeleteShopModal({ shop, busy, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const matches = confirmText.trim() === shop.name;

  return (
    <Modal title="Delete this shop?" onClose={onClose}>
      <div className="space-y-3.5">
        <div className="flex items-start gap-2 text-xs text-[#C13F45] bg-[#FDEAEA] rounded-lg px-3 py-2.5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            This permanently deletes <strong>{shop.name}</strong> and everything in it — items, bills, udhaar,
            day-close history, expenses. This cannot be undone.
          </span>
        </div>
        <Field label={`Type "${shop.name}" to confirm`}>
          <input className="ks-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <button onClick={onClose} className="ks-btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches || busy}
            className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "#C13F45" }}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Delete permanently
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditMemberModal({ member, onClose, onSave }) {
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
        <Field label="Name">
          <input className="ks-input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        {member.role === "staff" && (
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
        )}
        {!resetPin ? (
          <button type="button" onClick={() => setResetPin(true)} className="text-xs font-semibold text-[#4F46E5]">
            Reset their password / PIN
          </button>
        ) : (
          <Field label="New password / PIN (6+ digits)">
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
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <button disabled={!valid || saving} onClick={handleSave} className="ks-btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </Modal>
  );
}
