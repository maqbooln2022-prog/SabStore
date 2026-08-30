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
  const [user, setUser] = useState(null);

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
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [loadShops, supabase]);

  async function updateProfile(fields) {
    const { data, error } = await supabase.auth.updateUser({ data: fields });
    if (error) throw error;
    setUser(data.user);
    return data.user;
  }

  function setActiveShopId(id) {
    setActiveShopIdState(id);
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(ACTIVE_SHOP_KEY, id);
    else localStorage.removeItem(ACTIVE_SHOP_KEY);
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

    const seedItems = seedItemsForShop(type);
    if (seedItems.length > 0) {
      // Seed items split across the owner-level `products` catalog and this
      // shop's `shop_products` price/stock instance of each — see
      // PROJECT_BRIEF.md's shared-catalog note.
      const productRows = seedItems.map(({ code, price, cost_price, gst, stock, low_at, quick, ...product }) => ({
        ...product,
        owner_id: user.id,
      }));
      const { data: products, error: productError } = await supabase.from("products").insert(productRows).select();
      if (productError) throw productError;

      const shopProductRows = seedItems.map((it, i) => ({
        shop_id: shop.id,
        product_id: products[i].id,
        code: it.code,
        price: it.price,
        cost_price: it.cost_price,
        gst: it.gst,
        stock: it.stock,
        low_at: it.low_at,
        quick: it.quick,
      }));
      const { error: seedError } = await supabase.from("shop_products").insert(shopProductRows);
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

  // Permanently deletes the active shop and everything under it (items,
  // bills, movements, credits, day-close history, expenses, supplier
  // links) — schema.sql cascades all of that from the shops row.
  // Products/suppliers themselves are owner-level and untouched, since
  // they may still be linked to the owner's other shops.
  async function deleteActiveShop() {
    if (!activeShopId) return;
    const { error } = await supabase.from("shops").delete().eq("id", activeShopId);
    if (error) throw error;
    const remaining = shops.filter((s) => s.id !== activeShopId);
    setShops(remaining);
    setActiveShopId(remaining[0]?.id ?? null);
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
        deleteActiveShop,
        loading,
        reload: loadShops,
        toast,
        showToast,
        user,
        updateProfile,
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
