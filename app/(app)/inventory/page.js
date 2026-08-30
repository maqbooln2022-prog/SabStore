"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, Star, Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";
import ItemThumb from "@/components/ItemThumb";
import CategoryChip from "@/components/CategoryChip";
import AddItemModal from "@/components/AddItemModal";
import AdjustStockModal from "@/components/AdjustStockModal";
import { reorderSuggestion } from "@/lib/inventoryHelpers";
import { rupee } from "@/lib/format";

export default function InventoryPage() {
  const { supabase, activeShopId, showToast } = useShop();
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const [{ data: itemsData }, { data: billsData }, { data: suppliersData }] = await Promise.all([
      supabase.from("items").select("*").eq("shop_id", activeShopId).order("code"),
      supabase.from("bills").select("items, date").eq("shop_id", activeShopId),
      supabase.from("suppliers").select("*").eq("shop_id", activeShopId),
    ]);
    setItems(itemsData || []);
    setBills(billsData || []);
    setSuppliers(suppliersData || []);
    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter(
    (i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.code?.includes(query.trim())
  );

  async function addItem(newItem) {
    const { data, error } = await supabase.from("items").insert({ ...newItem, shop_id: activeShopId }).select().single();
    if (error) throw error;
    setItems((prev) => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
    setShowAdd(false);
    showToast(`${data.name} added to inventory`);
  }

  async function toggleQuick(item) {
    const { data, error } = await supabase.from("items").update({ quick: !item.quick }).eq("id", item.id).select().single();
    if (error) {
      showToast(error.message, "err");
      return;
    }
    setItems((prev) => prev.map((p) => (p.id === item.id ? data : p)));
  }

  async function logMovement(item, type, qty, reason, supplier) {
    const newStock = type === "in" ? Number(item.stock) + qty : Math.max(0, Number(item.stock) - qty);
    const { data: updatedItem, error: updateError } = await supabase
      .from("items")
      .update({ stock: newStock })
      .eq("id", item.id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { error: moveError } = await supabase.from("movements").insert({
      shop_id: activeShopId,
      item_id: item.id,
      item_name: item.name,
      type,
      qty,
      reason,
      supplier: supplier || null,
    });
    if (moveError) throw moveError;

    setItems((prev) => prev.map((p) => (p.id === item.id ? updatedItem : p)));
    setAdjustItem(null);
    showToast(`${type === "in" ? "Stock added" : "Stock removed"}: ${item.name}`);
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading inventory…
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A996]" />
          <input
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ks-input pl-9"
          />
        </div>
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Add new item
        </button>
      </div>

      <div className="ks-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price / Margin</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Quick add</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const low = i.stock <= i.low_at;
              const margin = i.cost_price != null ? i.price - i.cost_price : null;
              const suggestion = reorderSuggestion(i, bills);
              return (
                <tr key={i.id} className="border-b border-[#E7E9F3] last:border-0 hover:bg-[#F8F9FD]">
                  <td className="px-5 py-3">
                    <span className="ks-mono text-xs font-bold px-2 py-1 rounded-md" style={{ background: "#E7E9F3", color: "#6B7280" }}>
                      {i.code}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <ItemThumb item={i} size={30} />
                      {i.name}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <CategoryChip category={i.category} />
                  </td>
                  <td className="px-5 py-3 ks-mono">
                    {rupee(i.price)}
                    {margin != null && <div className="text-[11px] text-[#4F46E5] font-semibold">+{rupee(margin)} margin</div>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`ks-mono font-semibold ${low ? "text-[#C13F45]" : "text-[#000000]"}`}>
                      {i.stock} {i.unit}
                    </span>
                    {low && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#FDEAEA", color: "#C13F45" }}>
                        LOW
                      </span>
                    )}
                    {suggestion && suggestion.daysLeft <= 10 && (
                      <div className="text-[11px] text-[#B5720B] font-medium mt-0.5">
                        ⏳ ~{suggestion.daysLeft.toFixed(1)}d left · reorder {suggestion.suggestedQty}
                        {i.unit}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleQuick(i)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: i.quick ? "#FCEEDA" : "#E7E9F3" }}
                      title={i.quick ? "Remove from quick add" : "Pin to quick add"}
                    >
                      <Star size={15} fill={i.quick ? "#F2A93B" : "none"} color={i.quick ? "#F2A93B" : "#B0A996"} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setAdjustItem({ item: i, type: "in" })}
                        className="px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{ background: "#E4F5F0", color: "#4F46E5" }}
                      >
                        <ArrowUpCircle size={13} /> In
                      </button>
                      <button
                        onClick={() => setAdjustItem({ item: i, type: "out" })}
                        className="px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{ background: "#FDEAEA", color: "#C13F45" }}
                      >
                        <ArrowDownCircle size={13} /> Out
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#6B7280] text-sm">
                  No items match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddItemModal items={items} onClose={() => setShowAdd(false)} onAdd={addItem} />}
      {adjustItem && (
        <AdjustStockModal
          item={adjustItem.item}
          type={adjustItem.type}
          suppliers={suppliers}
          onClose={() => setAdjustItem(null)}
          onConfirm={(qty, reason, supplier) => logMovement(adjustItem.item, adjustItem.type, qty, reason, supplier)}
        />
      )}
    </div>
  );
}
