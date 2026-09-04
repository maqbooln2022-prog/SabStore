"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Ban,
  UserCheck,
  Trash2,
  Loader2,
  Store,
  UserCog,
  Receipt,
  AlertTriangle,
  ChevronDown,
  Pencil,
  ArrowUpCircle,
  Users,
  LogOut,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import AuthGuard from "@/components/AuthGuard";
import Modal from "@/components/ui/Modal";
import Field from "@/components/ui/Field";
import { createClient } from "@/lib/supabaseClient";
import { callApi } from "@/lib/apiClient";
import { MODULES } from "@/lib/modules";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const DANGER_BG = "rgba(226,75,74,0.14)";
const DANGER_TEXT = "#F29C9C";
const SUCCESS_BG = "rgba(34,197,148,0.14)";
const SUCCESS_TEXT = "#7FE0B8";

// Chart palette — fixed to dark theme since admin always forces it
const CHART_ACCENT = "#5B7CFA";
const CHART_GRID = "#23263A";
const CHART_TICK = "#6B7280";
const TYPE_COLORS = {
  kirana: "#5B7CFA",
  supermarket: "#7FE0B8",
  automobile: "#F2A93B",
  clothing: "#E26B73",
  pharmacy: "#A78BFA",
  electronics: "#38BDF8",
  other: "#94A3B8",
};
const TYPE_COLOR_LIST = Object.values(TYPE_COLORS);

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
  const [confirmSuspend, setConfirmSuspend] = useState(null);
  const [confirmDeleteShop, setConfirmDeleteShop] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [confirmTransfer, setConfirmTransfer] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);

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

  // Derived chart data
  const chartData = useMemo(() => {
    if (!data) return null;

    // Shop types donut
    const typeCounts = {};
    data.owners.forEach((o) =>
      o.shops.forEach((s) => {
        const t = s.type || "other";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      })
    );
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // Top shops by bills
    const topShops = data.owners
      .flatMap((o) => o.shops.map((s) => ({ name: s.name, bills: s.bill_count })))
      .sort((a, b) => b.bills - a.bills)
      .slice(0, 7);

    // Signups over time (by month)
    const monthCounts = {};
    data.owners.forEach((o) => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthCounts[key] = { label, count: (monthCounts[key]?.count || 0) + 1 };
    });
    const signupData = Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    return { typeData, topShops, signupData };
  }, [data]);

  if (checking || !allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent)" }} />
      </main>
    );
  }

  const STATS = data
    ? [
        { label: "Owners", value: data.totals.ownerCount, icon: ShieldCheck },
        { label: "Staff", value: data.totals.staffCount, icon: UserCog },
        { label: "Shops", value: data.totals.shopCount, icon: Store },
        { label: "Bills", value: data.totals.billCount, icon: Receipt },
      ]
    : [];

  const TABS = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "shops", label: "Owners & Shops", icon: Building2 },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-page)" }}>
      {/* Top header */}
      <header
        className="flex items-center gap-3 px-6 py-3 border-b"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--accent-soft-bg)" }}
        >
          <ShieldCheck size={16} style={{ color: "var(--accent)" }} />
        </div>
        <span className="font-bold text-sm">Platform Admin</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--accent-soft-bg)", color: "var(--accent)" }}>
          SabStore
        </span>
        <button
          onClick={handleSignOut}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: "var(--bg-surface-alt)", color: "var(--text-secondary)" }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar nav */}
        <nav
          className="w-52 shrink-0 border-r flex flex-col pt-4 pb-6 gap-1 px-3"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors"
                style={
                  active
                    ? { background: "var(--accent-soft-bg)", color: "var(--accent)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {loading && (
              <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            )}
            {error && (
              <p className="text-sm rounded-lg px-3 py-2 mb-4" style={{ background: DANGER_BG, color: DANGER_TEXT }}>
                {error}
              </p>
            )}

            {data && activeTab === "overview" && (
              <OverviewTab stats={STATS} chartData={chartData} />
            )}

            {data && activeTab === "shops" && (
              <ShopsTab
                owners={data.owners}
                expandedShopId={expandedShopId}
                setExpandedShopId={setExpandedShopId}
                busyId={busyId}
                reinstateOwner={reinstateOwner}
                setConfirmSuspend={setConfirmSuspend}
                setConfirmDeleteShop={setConfirmDeleteShop}
                setEditMember={setEditMember}
                setConfirmTransfer={setConfirmTransfer}
              />
            )}
          </div>
        </main>
      </div>

      {confirmSuspend && (
        <Modal title="Suspend this owner?" onClose={() => setConfirmSuspend(null)}>
          <div className="space-y-3.5">
            <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2.5" style={{ background: DANGER_BG, color: DANGER_TEXT }}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>{confirmSuspend.email}</strong> won&apos;t be able to sign in until reinstated. Their shops and data are untouched.
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSuspend(null)} className="ks-btn-outline flex-1">Cancel</button>
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
            <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2.5" style={{ background: DANGER_BG, color: DANGER_TEXT }}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>{confirmTransfer.member.name}</strong> ({confirmTransfer.member.email}) becomes the owner of{" "}
                <strong>{confirmTransfer.shop.name}</strong>. The current owner is demoted to staff.
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTransfer(null)} className="ks-btn-outline flex-1">Cancel</button>
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
    </div>
  );
}

function OverviewTab({ stats, chartData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-lg mb-1">Overview</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Platform-wide snapshot</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="ks-card p-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
              style={{ background: "var(--accent-soft-bg)", color: "var(--accent-soft-text)" }}
            >
              <s.icon size={15} />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </div>
            <div className="ks-mono text-2xl font-bold mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Shop types donut */}
          <div className="ks-card p-5">
            <h3 className="text-sm font-semibold mb-4">Shop types</h3>
            {chartData.typeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.typeData.map((entry, i) => (
                          <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || TYPE_COLOR_LIST[i % TYPE_COLOR_LIST.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#12141B", border: "1px solid #23263A", borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: "#E2E8F0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 min-w-0">
                  {chartData.typeData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: TYPE_COLORS[entry.name] || TYPE_COLOR_LIST[i % TYPE_COLOR_LIST.length] }}
                      />
                      <span className="capitalize truncate" style={{ color: "var(--text-secondary)" }}>{entry.name}</span>
                      <span className="ml-auto font-semibold tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No shops yet</p>
            )}
          </div>

          {/* Signups over time */}
          <div className="ks-card p-5">
            <h3 className="text-sm font-semibold mb-4">Owner signups over time</h3>
            {chartData.signupData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData.signupData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#12141B", border: "1px solid #23263A", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "#E2E8F0" }}
                    labelStyle={{ color: CHART_TICK }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Signups"
                    stroke={CHART_ACCENT}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_ACCENT, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Top shops by bills */}
      {chartData && chartData.topShops.length > 0 && (
        <div className="ks-card p-5">
          <h3 className="text-sm font-semibold mb-4">Top shops by bill count</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.topShops} margin={{ top: 4, right: 8, bottom: 4, left: -20 }} barSize={32}>
              <CartesianGrid vertical={false} stroke={CHART_GRID} />
              <XAxis dataKey="name" tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#12141B", border: "1px solid #23263A", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#E2E8F0" }}
                labelStyle={{ color: "#E2E8F0", fontWeight: 600 }}
                cursor={{ fill: "rgba(91,124,250,0.08)" }}
              />
              <Bar dataKey="bills" name="Bills" fill={CHART_ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ShopsTab({ owners, expandedShopId, setExpandedShopId, busyId, reinstateOwner, setConfirmSuspend, setConfirmDeleteShop, setEditMember, setConfirmTransfer }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg mb-1">Owners & Shops</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Every owner on the platform with their shops and staff.</p>
      </div>

      <div className="space-y-3">
        {owners.map((owner) => (
          <div key={owner.id} className="ks-card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  {owner.email}
                  {owner.banned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: DANGER_BG, color: DANGER_TEXT }}>
                      SUSPENDED
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Joined {fmtDate(owner.created_at)}
                </div>
              </div>
              {owner.banned ? (
                <button
                  onClick={() => reinstateOwner(owner)}
                  disabled={busyId === owner.id}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ background: SUCCESS_BG, color: SUCCESS_TEXT }}
                >
                  {busyId === owner.id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                  Reinstate
                </button>
              ) : (
                <button
                  onClick={() => setConfirmSuspend(owner)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{ background: DANGER_BG, color: DANGER_TEXT }}
                >
                  <Ban size={13} /> Suspend
                </button>
              )}
            </div>

            <div className="mt-3 divide-y" style={{ borderTop: "1px solid var(--border)", borderColor: "var(--border)" }}>
              {owner.shops.map((shop) => {
                const expanded = expandedShopId === shop.id;
                return (
                  <div key={shop.id} style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => setExpandedShopId(expanded ? null : shop.id)}
                      className="w-full flex items-center justify-between gap-3 py-2 text-sm text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Store size={14} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
                        <span className="font-medium truncate">{shop.name}</span>
                        <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                          {fmtDate(shop.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          1 owner · {shop.staff_count} staff · {shop.bill_count} bill{shop.bill_count === 1 ? "" : "s"}
                        </span>
                        <span
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteShop(shop); }}
                          role="button"
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: DANGER_BG, color: DANGER_TEXT }}
                          title="Delete this shop"
                        >
                          <Trash2 size={13} />
                        </span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                          style={{ color: "var(--text-secondary)" }}
                        />
                      </div>
                    </button>

                    {expanded && (
                      <div className="pb-3 pl-6 space-y-1.5">
                        {shop.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-2 text-xs rounded-lg px-3 py-2"
                            style={{ background: "var(--bg-surface-alt)" }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Users size={12} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
                              <span className="font-semibold truncate">{m.name}</span>
                              <span className="truncate" style={{ color: "var(--text-secondary)" }}>{m.email}</span>
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                style={
                                  m.role === "owner"
                                    ? { background: "var(--accent-soft-bg)", color: "var(--accent-soft-text)" }
                                    : { background: "var(--border)", color: "var(--text-secondary)" }
                                }
                              >
                                {m.role.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setEditMember(m)}
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: "var(--border)", color: "var(--text-secondary)" }}
                                title="Edit"
                              >
                                <Pencil size={11} />
                              </button>
                              {m.role === "staff" && (
                                <button
                                  onClick={() => setConfirmTransfer({ shop, member: m })}
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ background: SUCCESS_BG, color: SUCCESS_TEXT }}
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
        {owners.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: "var(--text-secondary)" }}>
            No shops on the platform yet.
          </p>
        )}
      </div>
    </div>
  );
}

function DeleteShopModal({ shop, busy, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const matches = confirmText.trim() === shop.name;

  return (
    <Modal title="Delete this shop?" onClose={onClose}>
      <div className="space-y-3.5">
        <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2.5" style={{ background: DANGER_BG, color: DANGER_TEXT }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            This permanently deletes <strong>{shop.name}</strong> and everything in it — items, bills, udhaar, day-close history, expenses. This cannot be undone.
          </span>
        </div>
        <Field label={`Type "${shop.name}" to confirm`}>
          <input className="ks-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <button onClick={onClose} className="ks-btn-outline flex-1">Cancel</button>
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
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft-bg)", color: "var(--accent-soft-text)" }
                      : { borderColor: "var(--border)", color: "var(--text-secondary)" }
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
          <button type="button" onClick={() => setResetPin(true)} className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
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
              <p className="text-xs font-medium mt-1" style={{ color: DANGER_TEXT }}>
                {6 - newPin.length} more digit{6 - newPin.length === 1 ? "" : "s"} needed
              </p>
            )}
          </Field>
        )}
        {error && (
          <p className="text-sm rounded-lg px-3 py-2" style={{ background: DANGER_BG, color: DANGER_TEXT }}>
            {error}
          </p>
        )}
        <button disabled={!valid || saving} onClick={handleSave} className="ks-btn-primary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </Modal>
  );
}
