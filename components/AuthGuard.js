"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

// Wraps every route under app/(app) — redirects to /login if there's no
// active Supabase session, and keeps listening in case the session ends
// (sign-out, expired token) while the user is on the page.
export default function AuthGuard({ children }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        if (!session) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => {
        if (active) router.replace("/login");
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  return children;
}
