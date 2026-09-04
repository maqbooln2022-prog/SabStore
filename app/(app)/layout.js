"use client";

import { useEffect, useState } from "react";
import { Menu, Loader2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { ShopProvider, useShop } from "@/components/ShopContext";
import Sidebar from "@/components/Sidebar";
import { AddShopOnboarding } from "@/components/ShopOnboarding";
import StoreSettingsModal from "@/components/StoreSettingsModal";
import Toast from "@/components/ui/Toast";
import { initials } from "@/lib/format";

function AppShell({ children }) {
  const { shops, activeShop, addShop, loading, toast, user } = useShop();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStoreSettings, setShowStoreSettings] = useState(false);

  // The shop's chosen theme drives every color token in globals.css via
  // [data-theme] on <html> — see StoreSettingsModal for the picker. Reset
  // to the default (no attribute = "light") once signed out.
  useEffect(() => {
    document.documentElement.dataset.theme = activeShop?.theme || "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [activeShop?.theme]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  if (shops.length === 0) {
    return <AddShopOnboarding onAdd={addShop} />;
  }

  return (
    <div className="min-h-screen flex">
      <div className="ks-no-print ks-mobile-bar ks-topbar fixed top-0 left-0 right-0 z-30 items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            {initials(user)}
          </span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}
          >
            <Menu size={20} />
          </button>
        </div>
        <span className="text-sm font-bold truncate px-2">{activeShop?.name}</span>
        <div style={{ width: 32 }} />
      </div>

      {sidebarOpen && (
        <div
          className="ks-no-print ks-mobile-overlay fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`ks-no-print ks-sidebar-wrap${sidebarOpen ? " open" : ""}`}>
        <Sidebar onOpenSettings={() => setShowStoreSettings(true)} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {showStoreSettings && <StoreSettingsModal onClose={() => setShowStoreSettings(false)} />}

      <div className="ks-main flex-1 min-w-0">
        <main className="flex-1 min-w-0 ks-page-pad pb-16 max-w-5xl">{children}</main>
      </div>

      {toast && <Toast msg={toast.msg} tone={toast.tone} />}
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthGuard>
      <ShopProvider>
        <AppShell>{children}</AppShell>
      </ShopProvider>
    </AuthGuard>
  );
}
