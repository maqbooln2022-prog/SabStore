"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Ban, UserCheck, Trash2, Loader2, Store, ArrowLeft, AlertTriangle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import { createClient } from "@/lib/supabaseClient";
import { callApi } from "@/lib/apiClient";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function AdminPage() {
  return (
    <AuthGuard>
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
  const [busyOwnerId, setBusyOwnerId] = useState(null);
  const [confirmSuspend, setConfirmSuspend] = useState(null); // owner object
  const [confirmDeleteShop, setConfirmDeleteShop] = useState(null); // shop object

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
    supabase.rpc("is_platform_admin").then(({ data: isAdmin }) => {
      if (!active) return;
      if (!isAdmin) {
        router.replace("/dashboard");
        return;
      }
      setAllowed(true);
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [supabase, router]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function suspendOwner(owner) {
    setBusyOwnerId(owner.id);
    try {
      await callApi(supabase, "/api/admin/suspend-owner", { ownerId: owner.id });
      setConfirmSuspend(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyOwnerId(null);
    }
  }

  async function reinstateOwner(owner) {
    setBusyOwnerId(owner.id);
    try {
      await callApi(supabase, "/api/admin/reinstate-owner", { ownerId: owner.id });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyOwnerId(null);
    }
  }

  async function deleteShop(shop) {
    setBusyOwnerId(shop.id);
    try {
      await callApi(supabase, "/api/admin/delete-shop", { shopId: shop.id });
      setConfirmDeleteShop(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyOwnerId(null);
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
        <button onClick={() => router.push("/dashboard")} className="w-8 h-8 rounded-full bg-[#E7E9F3] flex items-center justify-center">
          <ArrowLeft size={15} />
        </button>
        <h1 className="ks-display text-xl font-bold flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#4F46E5]" /> Platform admin
        </h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-5 pl-11">Every owner and shop on SabStore, not just your own.</p>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="ks-card p-4">
              <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wide">Owners</div>
              <div className="ks-mono text-2xl font-bold mt-1">{data.totals.ownerCount}</div>
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
                      disabled={busyOwnerId === owner.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{ background: "#E4F5F0", color: "#0F6E56" }}
                    >
                      {busyOwnerId === owner.id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
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
                  {owner.shops.map((shop) => (
                    <div key={shop.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store size={14} className="text-[#B0A996] shrink-0" />
                        <span className="font-medium truncate">{shop.name}</span>
                        <span className="text-xs text-[#6B7280] shrink-0">{fmtDate(shop.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-[#6B7280]">{shop.bill_count} bill{shop.bill_count === 1 ? "" : "s"}</span>
                        <button
                          onClick={() => setConfirmDeleteShop(shop)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "#FDEAEA", color: "#C13F45" }}
                          title="Delete this shop"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
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
                disabled={busyOwnerId === confirmSuspend.id}
                className="flex-1 rounded-full text-white text-sm font-semibold py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "#C13F45" }}
              >
                {busyOwnerId === confirmSuspend.id && <Loader2 size={16} className="animate-spin" />}
                Suspend
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDeleteShop && (
        <DeleteShopModal shop={confirmDeleteShop} busy={busyOwnerId === confirmDeleteShop.id} onClose={() => setConfirmDeleteShop(null)} onConfirm={() => deleteShop(confirmDeleteShop)} />
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
