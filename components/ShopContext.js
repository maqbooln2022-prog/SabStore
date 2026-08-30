"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { seedItemsForShop } from "@/lib/shopTypes";

const ShopContext = createContext(null);

const ACTIVE_SHOP_KEY = "sabstore.activeShopId";

export function ShopProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [shops, setShops] = useState([]);
  const [activeShopId, setActiveShopIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, tone = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const loadShops = useCallback(async () => {
    const { data, error } = await supabase.from("shops").select("*").order("created_at", { ascending: true });
    if (!error) {
      setShops(data || []);
      setActiveShopIdState((prev) => {
        if (prev && data.some((s) => s.id === prev)) return prev;
        const stored = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_SHOP_KEY) : null;
        if (stored && data.some((s) => s.id === stored)) return stored;
        return data[0]?.id ?? null;
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  function setActiveShopId(id) {
    setActiveShopIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_SHOP_KEY, id);
  }

  async function addShop(name, type) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    const { data: shop, error } = await supabase
      .from("shops")
      .insert({ owner_id: user.id, name, type })
      .select()
      .single();
    if (error) throw error;

    const seedRows = seedItemsForShop(type).map((it) => ({ ...it, shop_id: shop.id }));
    if (seedRows.length > 0) {
      const { error: seedError } = await supabase.from("items").insert(seedRows);
      if (seedError) throw seedError;
    }

    setShops((prev) => [...prev, shop]);
    setActiveShopId(shop.id);
    showToast(`${name} created`);
    return shop;
  }

  async function updateActiveShop(fields) {
    if (!activeShopId) return;
    const { data, error } = await supabase.from("shops").update(fields).eq("id", activeShopId).select().single();
    if (error) throw error;
    setShops((prev) => prev.map((s) => (s.id === activeShopId ? data : s)));
    return data;
  }

  const activeShop = shops.find((s) => s.id === activeShopId) || null;

  return (
    <ShopContext.Provider
      value={{
        supabase,
        shops,
        activeShop,
        activeShopId,
        setActiveShopId,
        addShop,
        updateActiveShop,
        loading,
        reload: loadShops,
        toast,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within a ShopProvider");
  return ctx;
}
