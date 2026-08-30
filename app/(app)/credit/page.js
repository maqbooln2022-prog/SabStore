"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, MessageCircle, Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";
import { rupee } from "@/lib/format";
import { customerBalance } from "@/lib/dashboardHelpers";
import { whatsappLink, creditReminderText } from "@/lib/messaging";
import NewCreditModal from "@/components/NewCreditModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function CreditPage() {
  const { supabase, activeShopId, activeShop, showToast } = useShop();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [payFor, setPayFor] = useState(null);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const { data } = await supabase.from("credits").select("*").eq("shop_id", activeShopId).order("date");
    setCredits(data || []);
    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  const customers = useMemo(() => {
    const map = new Map();
    credits.forEach((c) => {
      if (!map.has(c.phone)) map.set(c.phone, { phone: c.phone, name: c.name });
    });
    return [...map.values()].map((c) => ({ ...c, balance: customerBalance(credits, c.phone) })).sort((a, b) => b.balance - a.balance);
  }, [credits]);

  const overdue = customers.filter((c) => c.balance > 0);
  const totalOutstanding = overdue.reduce((s, c) => s + c.balance, 0);

  async function addEntry(entry) {
    const { data, error } = await supabase
      .from("credits")
      .insert({ ...entry, shop_id: activeShopId })
      .select()
      .single();
    if (error) throw error;
    setCredits((prev) => [...prev, data]);
    setShowNew(false);
    setPayFor(null);
    showToast(entry.type === "charge" ? "Credit sale recorded" : "Payment recorded");
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading udhaar…
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="ks-card p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">Total outstanding udhaar</div>
          <div className="ks-display text-3xl font-bold" style={{ color: "#B5399C" }}>
            {rupee(totalOutstanding)}
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="ks-btn-primary flex items-center gap-1.5">
          <Plus size={16} /> New credit entry
        </button>
      </div>

      <div className="ks-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Balance</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.phone} className="border-b border-[#E7E9F3] last:border-0">
                <td className="px-5 py-3 font-semibold">{c.name}</td>
                <td className="px-5 py-3 ks-mono text-[#6B7280]">{c.phone}</td>
                <td className="px-5 py-3 ks-mono font-bold" style={{ color: c.balance > 0 ? "#C13F45" : "#4F46E5" }}>
                  {rupee(c.balance)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    {c.balance > 0 && (
                      <>
                        <button
                          onClick={() => setPayFor(c)}
                          className="text-xs px-2.5 py-1.5 rounded-full font-semibold"
                          style={{ background: "#E4F5F0", color: "#4F46E5" }}
                        >
                          Record payment
                        </button>
                        <button
                          onClick={() => window.open(whatsappLink(c.phone, creditReminderText(activeShop?.name, c.name, c.balance)), "_blank")}
                          className="text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1 text-white"
                          style={{ background: "#25D366" }}
                        >
                          <MessageCircle size={13} /> Remind
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[#6B7280] text-sm">
                  No udhaar entries yet — bill on credit or add one manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && <NewCreditModal onClose={() => setShowNew(false)} onAdd={(e) => addEntry({ ...e, type: "charge" })} />}
      {payFor && (
        <RecordPaymentModal
          customer={payFor}
          upiId={activeShop?.upi_id}
          storeName={activeShop?.name}
          onClose={() => setPayFor(null)}
          onAdd={(amount) => addEntry({ phone: payFor.phone, name: payFor.name, amount, type: "payment", note: "Payment received" })}
        />
      )}
    </div>
  );
}
