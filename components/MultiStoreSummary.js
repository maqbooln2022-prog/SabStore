"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ShopTypeIcon from "@/components/ShopTypeIcon";
import { shopTypeInfo } from "@/lib/shopTypes";
import { fetchShopItems } from "@/lib/products";
import { rupee } from "@/lib/format";

// Cycling accent palette pulled from colors already used elsewhere in the
// app (StatCard icon gradients, RoleBadge, etc.) rather than introducing
// new brand colors just for this.
const PALETTE = ["#4F46E5", "#F2A93B", "#B5399C", "#0F6E56", "#4B4FC1", "#C13F45"];
const colorFor = (idx) => PALETTE[idx % PALETTE.length];

// Only rendered when the owner has 2+ shops — a single-shop account never
// sees this, since there's nothing to combine (matches app-summary.md's
// "no in-app toggle, store count decides the UI" rule). Shows today's
// combined profit across every shop plus a per-shop breakdown grid;
// clicking a card switches the active shop, so the rest of the dashboard
// below updates to that shop's detail.
export default function MultiStoreSummary({ supabase, shops, activeShopId, onSelectShop }) {
  const [perShop, setPerShop] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAll() {
      setLoading(true);
      const todayStr = new Date().toDateString();
      const results = await Promise.all(
        shops.map(async (s) => {
          const [itemsData, { data: billsData }] = await Promise.all([
            fetchShopItems(supabase, s.id, { orderByCode: false }),
            supabase.from("bills").select("total, items, date").eq("shop_id", s.id),
          ]);
          const todaysBills = (billsData || []).filter((b) => new Date(b.date).toDateString() === todayStr);
          const revenue = todaysBills.reduce((sum, b) => sum + b.total, 0);
          const profit = todaysBills.reduce((sum, b) => {
            const billProfit = (b.items || []).reduce((lineSum, line) => {
              const current = itemsData.find((i) => i.id === line.shop_product_id);
              const cost = current ? current.cost_price ?? 0 : 0;
              return lineSum + (line.price - cost) * line.qty;
            }, 0);
            return sum + billProfit;
          }, 0);
          return [s.id, { revenue, profit }];
        })
      );
      if (active) {
        setPerShop(Object.fromEntries(results));
        setLoading(false);
      }
    }
    loadAll();
    return () => {
      active = false;
    };
  }, [supabase, shops]);

  const combinedProfit = Object.values(perShop).reduce((s, v) => s + (v?.profit || 0), 0);

  return (
    <div className="mb-5">
      <div
        className="rounded-3xl p-6 sm:p-7 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, #211A36, #4F46E5)" }}
      >
        <p className="text-sm text-white/70 mb-1">Combined profit · {shops.length} stores · today</p>
        <div className="ks-display text-4xl sm:text-5xl font-extrabold flex items-center gap-3">
          {loading ? <Loader2 size={32} className="animate-spin" /> : rupee(combinedProfit)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {shops.map((s, idx) => {
          const color = colorFor(idx);
          const active = s.id === activeShopId;
          const stats = perShop[s.id];
          return (
            <button
              key={s.id}
              onClick={() => onSelectShop(s.id)}
              className="ks-card p-4 text-left relative overflow-hidden transition-transform hover:-translate-y-0.5"
              style={{ border: active ? `1.5px solid ${color}` : "1.5px solid transparent", boxShadow: active ? `0 8px 20px ${color}33` : undefined }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1A`, color }}>
                  <ShopTypeIcon type={s.type} size={14} />
                </span>
                <span className="text-xs font-semibold text-[#6B7280] truncate">{shopTypeInfo(s.type).label}</span>
              </div>
              <p className="font-semibold text-sm truncate mb-1">{s.name}</p>
              <p className="ks-mono text-sm font-bold" style={{ color }}>
                {loading || !stats ? "…" : rupee(stats.profit)}
              </p>
              <p className="text-[11px] text-[#6B7280]">profit today</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
