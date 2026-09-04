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
  Settings,
  LogOut,
  ShieldCheck,
  Tag,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { useShop } from "@/components/ShopContext";
import ShopTypeIcon from "@/components/ShopTypeIcon";
import SyncStatusBadge from "@/components/SyncStatusBadge";
import { shopTypeInfo } from "@/lib/shopTypes";
import { greeting, displayName, initials } from "@/lib/format";

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

// These four stay one tap away; everything else — including the
// owner-only Staff/Clearance offers pages below — folds into "More" so
// the nav doesn't force scrolling on a phone-sized drawer.
const TOP_LEVEL_KEYS = ["dashboard", "billing", "inventory", "history"];

const todayStr = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Sidebar({ onOpenSettings, onNavigate }) {
  const { supabase, activeShop, activeShopId, user, isOwner, hasPermission, pendingCount, isPlatformAdmin } = useShop();
  const pathname = usePathname();
  const router = useRouter();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

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
  const topNav = visibleNav.filter((item) => TOP_LEVEL_KEYS.includes(item.key));
  const moreNav = [
    ...visibleNav.filter((item) => !TOP_LEVEL_KEYS.includes(item.key)),
    ...(isOwner ? [{ href: "/staff", label: "Staff", icon: Users }] : []),
    ...(isOwner ? [{ href: "/clearance", label: "Clearance offers", icon: Tag }] : []),
  ];
  const moreActive = moreNav.some((item) => item.href === pathname);
  const showMore = moreOpen || moreActive;

  function renderNavItem(item) {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onNavigate?.()}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs italic font-semibold transition-colors ${
          active ? "bg-white text-[#4338CA] shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"
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
  }

  return (
    <div
      className="h-full flex flex-col text-white"
      style={{ background: "linear-gradient(190deg, #4F46E5 0%, #4338CA 45%, #2C2478 100%)" }}
    >
      <div className="p-4 space-y-3">
        <div className="rounded-2xl p-3 bg-white/10 border border-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
              <ShopTypeIcon type={activeShop.type} size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs italic font-bold truncate">{activeShop.name}</p>
              <p className="text-[10px] italic text-white/70 font-medium">{shopTypeInfo(activeShop.type).label}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-white/20 border border-white/25"
          >
            {initials(user)}
          </span>
          <p className="text-[11px] italic text-white/60">
            {greeting()}
            {displayName(user) ? `, ${displayName(user)}` : ""} 👋
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto ks-scroll">
        {topNav.map(renderNavItem)}
        {moreNav.length > 0 && (
          <>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs italic font-semibold transition-colors ${
                moreActive && !moreOpen ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <MoreHorizontal size={17} />
              More
              <ChevronRight size={14} className={`ml-auto transition-transform ${showMore ? "rotate-90" : ""}`} />
            </button>
            {showMore && <div className="space-y-1 pl-2">{moreNav.map(renderNavItem)}</div>}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/15">
        {pendingCount > 0 && (
          <div className="px-3.5 pb-2">
            <SyncStatusBadge pendingCount={pendingCount} />
          </div>
        )}
        <div className="ks-mono text-[10px] italic text-white/40 px-3.5 pb-2">{todayStr()}</div>
        {isPlatformAdmin && (
          <Link
            href="/admin"
            onClick={() => onNavigate?.()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs italic font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ShieldCheck size={17} /> Platform admin
          </Link>
        )}
        {isOwner && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs italic font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Settings size={17} /> Store settings
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs italic font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </div>
  );
}
