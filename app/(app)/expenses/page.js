"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";
import CategoryChip from "@/components/CategoryChip";
import AddExpenseModal from "@/components/AddExpenseModal";
import { rupee } from "@/lib/format";

export default function ExpensesPage() {
  const { supabase, activeShopId, showToast } = useShop();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const { data } = await supabase.from("expenses").select("*").eq("shop_id", activeShopId).order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  const todaysTotal = useMemo(() => {
    const t = new Date().toDateString();
    return expenses.filter((e) => new Date(e.date).toDateString() === t).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const monthTotal = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return expenses.filter((e) => e.date.slice(0, 7) === monthKey).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  async function addExpense(entry) {
    const { data, error } = await supabase
      .from("expenses")
      .insert({ ...entry, shop_id: activeShopId })
      .select()
      .single();
    if (error) throw error;
    setExpenses((prev) => [data, ...prev]);
    setShowAdd(false);
    showToast("Expense logged");
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading expenses…
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <div className="ks-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Today&apos;s expenses</div>
          <div className="ks-display text-2xl font-bold mt-0.5" style={{ color: "#C13F45" }}>
            {rupee(todaysTotal)}
          </div>
        </div>
        <div className="ks-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">This month</div>
          <div className="ks-display text-2xl font-bold mt-0.5">{rupee(monthTotal)}</div>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Log expense
        </button>
      </div>

      <div className="ks-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Note</th>
              <th className="px-5 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-[#E7E9F3] last:border-0">
                <td className="px-5 py-3 text-[#6B7280]">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                <td className="px-5 py-3">
                  <CategoryChip category={e.category} />
                </td>
                <td className="px-5 py-3">{e.note || "—"}</td>
                <td className="px-5 py-3 ks-mono font-bold" style={{ color: "#C13F45" }}>
                  −{rupee(e.amount)}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[#6B7280] text-sm">
                  No expenses logged yet — rent, electricity, salaries, etc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={addExpense} />}
    </div>
  );
}
