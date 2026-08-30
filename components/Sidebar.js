"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Clock,
  Wallet,
  Calculator,
  Wallet2,
  BookOpen,
  Truck,
  Users,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
} from "lucide-react";
import { useShop } from "@/components/ShopContext";
import ShopTypeIcon from "@/components/ShopTypeIcon";
import { shopTypeInfo } from "@/lib/shopTypes";
import { greeting, displayName } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", key: "inventory", label: "Inventory", icon: Package },
  { href: "/billing", key: "billing", label: "New Bill", icon: Receipt },
  { href: "/history", key: "history", label: "History", icon: Clock },
  { href: "/credit", key: "credit", label: "Udhaar", icon: Wallet },
  { href: "/dayclose", key: "dayclose", label: "Day Close", icon: Calculator },
  { href: "/expenses", key: "expenses", label: "Expenses", icon: Wallet2 },
  { href: "/cashbook", key: "cashbook", label: "Cashbook", icon: BookOpen },
  { href: "/suppliers", key: "suppliers", label: "Suppliers", icon: Truck },
];

const todayStr = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Sidebar({ onAddShop, onOpenSettings, onNavigate }) {
  const { supabase, shops, activeShop, activeShopId, setActiveShopId, user, isOwner, hasPermission } = useShop();
  const pathname = usePathname();
  const router = useRouter();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!activeShopId) return;
    let active = true;
    supabase
      .from("shop_products")
      .select("stock, low_at")
      .eq("shop_id", activeShopId)
      .then(({ data }) => {
        if (!active || !data) return;
        setLowStockCount(data.filter((i) => i.stock <= i.low_at).length);
      });
    return () => {
      active = false;
    };
  }, [supabase, activeShopId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!activeShop) return null;

  const enabledModules = activeShop.enabled_modules || NAV_ITEMS.map((i) => i.key);
  const visibleNav = NAV_ITEMS.filter((item) => enabledModules.includes(item.key) && hasPermission(item.key));

  return (
    <div className="h-full flex flex-col bg-[#000000] text-white">
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)" }}
          >
            <ShopTypeIcon type={activeShop.type} size={17} />
          </div>
          <div className="relative flex-1 min-w-0">
            <select
              value={activeShopId}
              onChange={(e) => setActiveShopId(e.target.value)}
              className="w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-sm font-bold bg-white/10 text-white border border-white/15 focus:outline-none focus:border-white/40"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id} style={{ color: "#000" }}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50" />
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-white/50">{shopTypeInfo(activeShop.type).label}</span>
          {isOwner && (
            <button onClick={onAddShop} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#818CF8" }}>
              <Plus size={12} /> Add shop
            </button>
          )}
        </div>
      </div>

      <p className="px-5 pt-3 text-xs text-white/40">
        {greeting()}
        {displayName(user) ? `, ${displayName(user)}` : ""} 👋
      </p>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto ks-scroll">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active ? "bg-[#4F46E5] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {item.label}
              {item.href === "/inventory" && lowStockCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5484D] text-white text-[10px] font-bold">
                  {lowStockCount}
                </span>
              )}
            </Link>
          );
        })}
        {isOwner && (
          <Link
            href="/staff"
            onClick={() => onNavigate?.()}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === "/staff" ? "bg-[#4F46E5] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users size={17} /> Staff
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="ks-mono text-[11px] text-white/40 px-3.5 pb-2">{todayStr()}</div>
        {isOwner && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white"
          >
            <Settings size={17} /> Store settings
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </div>
  );
}
