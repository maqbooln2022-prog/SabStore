"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useShop } from "@/components/ShopContext";

// Wraps a route so it's inaccessible — not just hidden from the nav —
// to a shop member without that module's permission, or a shop that has
// disabled the module entirely. Real enforcement (writes are RLS-gated
// at the database) lives in the RLS policies; this closes the "just
// type the URL" gap for reads/UI.
export default function ModuleGuard({ module, children }) {
  const { activeShop, currentMember, hasPermission } = useShop();
  const router = useRouter();

  const enabled = (activeShop?.enabled_modules || []).includes(module);
  const allowed = currentMember && enabled && hasPermission(module);

  useEffect(() => {
    if (currentMember && !allowed) router.replace("/dashboard");
  }, [currentMember, allowed, router]);

  if (!currentMember || !allowed) {
    return (
      <div className="pt-6 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  return children;
}
