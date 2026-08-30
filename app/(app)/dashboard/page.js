"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Users,
  Loader2,
} from "lucide-react";
import { useShop } from "@/components/ShopContext";
import StatCard from "@/components/StatCard";
import StatDetailModal from "@/components/StatDetailModal";
import CustomerDetailModal from "@/components/CustomerDetailModal";
import { rupee, greeting, displayName } from "@/lib/format";
import { customerBalance, topCustomers } from "@/lib/dashboardHelpers";
import { fetchShopItems } from "@/lib/products";

export default function DashboardPage() {
  const { supabase, activeShopId, activeShop, user } = useShop();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [movements, setMovements] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // 'items' | 'value' | 'low' | 'profit'
  const [customerDetail, setCustomerDetail] = useState(null);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const [itemsData, { data: billsData }, { data: movesData }, { data: creditsData }] = await Promise.all([
      fetchShopItems(supabase, activeShopId, { orderByCode: false }),
      supabase.from("bills").select("*").eq("shop_id", activeShopId).order("date", { ascending: false }),
      supabase.from("movements").select("*").eq("shop_id", activeShopId).order("date", { ascending: false }).limit(6),
      supabase.from("credits").select("*").eq("shop_id", activeShopId),
    ]);
    setItems(itemsData);
    setBills(billsData || []);
    setMovements(movesData || []);
    setCredits(creditsData || []);
    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  const lowItems = items.filter((i) => i.stock <= i.low_at);
  const lowStockCount = lowItems.length;
  const stockValue = items.reduce((s, i) => s + i.stock * i.price, 0);

  const todaysBills = useMemo(() => {
    const t = new Date().toDateString();
    return bills.filter((b) => new Date(b.date).toDateString() === t);
  }, [bills]);
  const todaysSales = todaysBills.reduce((s, b) => s + b.total, 0);
  const todaysProfit = useMemo(() => {
    return todaysBills.reduce((sum, b) => {
      const billProfit = (b.items || []).reduce((s, line) => {
        const current = items.find((i) => i.id === line.shop_product_id);
        const cost = current ? current.cost_price ?? 0 : 0;
        return s + (line.price - cost) * line.qty;
      }, 0);
      return sum + billProfit;
    }, 0);
  }, [todaysBills, items]);

  const outstandingCredit = useMemo(() => {
    const phones = [...new Set(credits.map((c) => c.phone))];
    return phones.reduce((s, ph) => s + Math.max(0, customerBalance(credits, ph)), 0);
  }, [credits]);

  const bestCustomers = useMemo(() => topCustomers(bills, 5), [bills]);

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="ks-hero p-6 sm:p-7 mb-4">
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-white/80 mb-2">
              {greeting()}{displayName(user) ? `, ${displayName(user)}` : ""} 👋
            </p>
            <div className="ks-hero-chip inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <TrendingUp size={13} /> Today&apos;s sales
            </div>
            <div className="ks-display text-4xl sm:text-5xl font-extrabold">{rupee(todaysSales)}</div>
            <p className="text-sm text-white/80 mt-1.5">
              {todaysBills.length} bill{todaysBills.length === 1 ? "" : "s"} · profit ~{rupee(todaysProfit)} today
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => router.push("/billing")}
              className="bg-white text-[#4F46E5] font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg hover:brightness-105 active:scale-95 transition"
            >
              <Plus size={17} strokeWidth={2.5} /> New Bill
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        <StatCard
          icon={<Package size={18} />}
          iconBg="linear-gradient(135deg,#4F46E5,#818CF8)"
          label="Items in stock"
          value={items.length}
          onClick={() => setDetail("items")}
        />
        <StatCard
          icon={<Wallet size={18} />}
          iconBg="linear-gradient(135deg,#4B4FC1,#7A7DE0)"
          label="Stock value"
          value={rupee(stockValue)}
          onClick={() => setDetail("value")}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          iconBg="linear-gradient(135deg,#E5484D,#F2828A)"
          label="Low stock"
          value={lowStockCount}
          onClick={() => setDetail("low")}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          iconBg="linear-gradient(135deg,#F2A93B,#F2C56B)"
          label="Today's profit"
          value={rupee(todaysProfit)}
          onClick={() => setDetail("profit")}
        />
        <StatCard
          icon={<Wallet size={18} />}
          iconBg="linear-gradient(135deg,#B5399C,#D97BC6)"
          label="Outstanding udhaar"
          value={rupee(outstandingCredit)}
          onClick={() => router.push("/credit")}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-5">
        <div className="ks-card">
          <div className="px-5 py-4 border-b border-[#E7E9F3] flex items-center justify-between">
            <h2 className="ks-display font-bold">Running low</h2>
            <span className="ks-mono text-xs text-[#6B7280]">reorder soon</span>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto ks-scroll">
            {lowItems.length === 0 && <p className="text-sm text-[#6B7280]">Nothing running low right now. 🎉</p>}
            {lowItems.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] ks-pulse" />
                  <span className="font-medium">{i.name}</span>
                </div>
                <span className="ks-mono text-[#C13F45] font-semibold">
                  {i.stock} {i.unit} left
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ks-card">
          <div className="px-5 py-4 border-b border-[#E7E9F3]">
            <h2 className="ks-display font-bold">Recent stock movement</h2>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto ks-scroll">
            {movements.length === 0 && <p className="text-sm text-[#6B7280]">No stock movement logged yet.</p>}
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {m.type === "in" ? (
                    <ArrowUpCircle size={16} className="text-[#4F46E5]" />
                  ) : (
                    <ArrowDownCircle size={16} className="text-[#C13F45]" />
                  )}
                  <div>
                    <span className="font-medium">{m.item_name}</span>
                    <span className="text-[#6B7280] ks-mono text-xs ml-2">{m.reason}</span>
                  </div>
                </div>
                <span className={`ks-mono font-semibold ${m.type === "in" ? "text-[#4F46E5]" : "text-[#C13F45]"}`}>
                  {m.type === "in" ? "+" : "−"}
                  {m.qty}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ks-card">
          <div className="px-5 py-4 border-b border-[#E7E9F3] flex items-center gap-2">
            <Users size={16} className="text-[#6B7280]" />
            <h2 className="ks-display font-bold">Top customers</h2>
          </div>
          <div className="p-5 space-y-1 max-h-72 overflow-y-auto ks-scroll">
            {bestCustomers.length === 0 && <p className="text-sm text-[#6B7280]">No customer purchases recorded yet.</p>}
            {bestCustomers.map((c, i) => (
              <button
                key={c.phone}
                onClick={() => setCustomerDetail(c)}
                className="w-full flex items-center justify-between text-sm py-1.5 -mx-1 px-1 rounded-lg hover:bg-[#F8F9FD] text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="ks-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#E7E9F3", color: "#6B7280" }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-[#6B7280]">
                      {c.visits} visit{c.visits === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <span className="ks-mono font-semibold">{rupee(c.total)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {detail && (
        <StatDetailModal
          mode={detail}
          items={items}
          todaysBills={todaysBills}
          stockValue={stockValue}
          onClose={() => setDetail(null)}
          onGoInventory={() => {
            setDetail(null);
            router.push("/inventory");
          }}
        />
      )}
      {customerDetail && <CustomerDetailModal customer={customerDetail} bills={bills} onClose={() => setCustomerDetail(null)} />}
    </div>
  );
}
