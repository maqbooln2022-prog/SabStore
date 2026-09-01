"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";
import CategoryChip from "@/components/CategoryChip";
import AddExpenseModal from "@/components/AddExpenseModal";
import FixedExpenseModal from "@/components/FixedExpenseModal";
import { rupee } from "@/lib/format";
import ModuleGuard from "@/components/ModuleGuard";

export default function ExpensesPage() {
  return (
    <ModuleGuard module="expenses">
      <ExpensesPageInner />
    </ModuleGuard>
  );
}

const ordinal = (n) => (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");

function ExpensesPageInner() {
  const { supabase, activeShopId, showToast } = useShop();
  const [tab, setTab] = useState("log"); // 'log' | 'fixed'
  const [expenses, setExpenses] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [fixedModal, setFixedModal] = useState(null); // { editing: row|null } while open

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const [{ data: expData }, { data: fixedData }] = await Promise.all([
      supabase.from("expenses").select("*").eq("shop_id", activeShopId).order("date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").eq("shop_id", activeShopId).order("due_day"),
    ]);
    setExpenses(expData || []);
    setFixedExpenses(fixedData || []);
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

  const fixedTotal = useMemo(() => fixedExpenses.reduce((s, e) => s + Number(e.amount), 0), [fixedExpenses]);

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

  async function saveFixedExpense(fields) {
    if (fixedModal.editing) {
      const { data, error } = await supabase.from("fixed_expenses").update(fields).eq("id", fixedModal.editing.id).select().single();
      if (error) throw error;
      setFixedExpenses((prev) => prev.map((f) => (f.id === data.id ? data : f)).sort((a, b) => a.due_day - b.due_day));
      showToast("Fixed expense updated");
    } else {
      const { data, error } = await supabase
        .from("fixed_expenses")
        .insert({ ...fields, shop_id: activeShopId })
        .select()
        .single();
      if (error) throw error;
      setFixedExpenses((prev) => [...prev, data].sort((a, b) => a.due_day - b.due_day));
      showToast("Fixed expense added");
    }
    setFixedModal(null);
  }

  async function deleteFixedExpense(id) {
    const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
    if (error) {
      showToast(error.message, "err");
      return;
    }
    setFixedExpenses((prev) => prev.filter((f) => f.id !== id));
    showToast("Fixed expense removed");
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
      <div className="flex gap-1.5 mb-4 bg-[#F1EEE6] p-1 rounded-full w-fit">
        {[
          { v: "log", l: "Expense log" },
          { v: "fixed", l: "Fixed monthly costs" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${tab === t.v ? "bg-[#000000] text-white" : "text-[#6B7280]"}`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "log" ? (
        <>
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
        </>
      ) : (
        <>
          <div className="ks-card p-4 mb-4 w-fit">
            <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Fixed costs, every month</div>
            <div className="ks-display text-2xl font-bold mt-0.5">{rupee(fixedTotal)}</div>
          </div>

          <div className="flex justify-end mb-3">
            <button onClick={() => setFixedModal({ editing: null })} className="ks-btn-primary flex items-center gap-1.5">
              <Plus size={16} /> Add fixed expense
            </button>
          </div>

          <div className="ks-card overflow-hidden divide-y divide-[#E7E9F3]">
            {fixedExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{exp.name}</span>
                    <CategoryChip category={exp.category} />
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Due on the {exp.due_day}
                    {ordinal(exp.due_day)} of each month
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="ks-mono font-bold">{rupee(exp.amount)}</span>
                  <button
                    onClick={() => setFixedModal({ editing: exp })}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-[#E7E9F3] text-[#6B7280]"
                    aria-label="Edit expense"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteFixedExpense(exp.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "#FDEAEA", color: "#C13F45" }}
                    aria-label="Remove expense"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {fixedExpenses.length === 0 && (
              <p className="px-5 py-10 text-center text-[#6B7280] text-sm">
                No fixed costs set up yet — rent, salaries, subscriptions, loan EMIs.
              </p>
            )}
          </div>
        </>
      )}

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={addExpense} />}
      {fixedModal && <FixedExpenseModal editing={fixedModal.editing} onClose={() => setFixedModal(null)} onSave={saveFixedExpense} />}
    </div>
  );
}
