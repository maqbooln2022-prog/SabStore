"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

// Deliberately separate from /login — platform admin isn't reachable from
// the regular owner/staff sign-in flow or from the app's own sidebar
// (see components/Sidebar.js), only by knowing this URL directly.
export default function AdminLoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) router.replace("/admin");
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [supabase, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace("/admin");
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0B0D12" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "#5B7CFA" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0D12" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(91,124,250,0.16)" }}
          >
            <ShieldCheck size={26} style={{ color: "#5B7CFA" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#EDEFF3" }}>
            Platform admin
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9198A8" }}>
            Restricted access — sign in with your admin account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl p-6"
          style={{ background: "#14161C", border: "1px solid #21242D" }}
        >
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#9198A8" }}>
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: "#191C25", border: "1px solid #21242D", color: "#EDEFF3" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#9198A8" }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: "#191C25", border: "1px solid #21242D", color: "#EDEFF3" }}
            />
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(226,75,74,0.12)", color: "#F29C9C" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold mt-2"
            style={{ background: "#5B7CFA", color: "#fff" }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
