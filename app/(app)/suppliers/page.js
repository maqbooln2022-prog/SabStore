"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Link2, MessageCircle, Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";
import AddSupplierModal from "@/components/AddSupplierModal";
import LinkSupplierModal from "@/components/LinkSupplierModal";
import { whatsappLink } from "@/lib/messaging";

export default function SuppliersPage() {
  const { supabase, activeShopId, showToast } = useShop();
  const [allSuppliers, setAllSuppliers] = useState([]); // every supplier this owner has, any shop
  const [linkedIds, setLinkedIds] = useState(new Set()); // supplier ids linked to the active shop
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const load = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [{ data: suppliersData }, { data: linksData }, { data: movesData }] = await Promise.all([
      supabase.from("suppliers").select("*").eq("owner_id", user.id).order("created_at"),
      supabase.from("shop_suppliers").select("supplier_id").eq("shop_id", activeShopId),
      supabase.from("movements").select("type, supplier").eq("shop_id", activeShopId),
    ]);
    setAllSuppliers(suppliersData || []);
    setLinkedIds(new Set((linksData || []).map((l) => l.supplier_id)));
    setMovements(movesData || []);
    setLoading(false);
  }, [supabase, activeShopId]);

  useEffect(() => {
    load();
  }, [load]);

  const suppliers = useMemo(() => allSuppliers.filter((s) => linkedIds.has(s.id)), [allSuppliers, linkedIds]);
  const linkableSuppliers = useMemo(() => allSuppliers.filter((s) => !linkedIds.has(s.id)), [allSuppliers, linkedIds]);

  const purchaseCount = (name) => movements.filter((m) => m.type === "in" && m.supplier === name).length;

  async function addSupplier(entry) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({ ...entry, owner_id: user.id })
      .select()
      .single();
    if (error) throw error;

    const { error: linkError } = await supabase.from("shop_suppliers").insert({ shop_id: activeShopId, supplier_id: supplier.id });
    if (linkError) throw linkError;

    setAllSuppliers((prev) => [...prev, supplier]);
    setLinkedIds((prev) => new Set(prev).add(supplier.id));
    setShowAdd(false);
    showToast("Supplier added");
  }

  async function linkSupplier(supplier) {
    const { error } = await supabase.from("shop_suppliers").insert({ shop_id: activeShopId, supplier_id: supplier.id });
    if (error) throw error;
    setLinkedIds((prev) => new Set(prev).add(supplier.id));
    showToast(`${supplier.name} linked to this shop`);
  }

  if (loading) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading suppliers…
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex justify-end gap-2 mb-3">
        {linkableSuppliers.length > 0 && (
          <button onClick={() => setShowLink(true)} className="ks-btn-outline flex items-center gap-1.5">
            <Link2 size={15} /> Link existing
          </button>
        )}
        <button onClick={() => setShowAdd(true)} className="ks-btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Add supplier
        </button>
      </div>

      <div className="ks-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left ks-mono text-[11px] uppercase tracking-wide text-[#6B7280] border-b border-[#E7E9F3]">
              <th className="px-5 py-3 font-medium">Supplier</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Supplies</th>
              <th className="px-5 py-3 font-medium">Purchases logged</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-[#E7E9F3] last:border-0 hover:bg-[#F8F9FD]">
                <td className="px-5 py-3 font-semibold">{s.name}</td>
                <td className="px-5 py-3 ks-mono text-[#6B7280]">{s.phone || "—"}</td>
                <td className="px-5 py-3 text-[#6B7280]">{s.items || "—"}</td>
                <td className="px-5 py-3 ks-mono">{purchaseCount(s.name)}</td>
                <td className="px-5 py-3">
                  {s.phone && (
                    <button
                      onClick={() => window.open(whatsappLink(s.phone, `Hi ${s.name}, `), "_blank")}
                      className="text-xs px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1 text-white"
                      style={{ background: "#25D366" }}
                    >
                      <MessageCircle size={13} /> Message
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[#6B7280] text-sm">
                  No suppliers linked to this shop yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddSupplierModal onClose={() => setShowAdd(false)} onAdd={addSupplier} />}
      {showLink && <LinkSupplierModal availableSuppliers={linkableSuppliers} onClose={() => setShowLink(false)} onLink={linkSupplier} />}
    </div>
  );
}
