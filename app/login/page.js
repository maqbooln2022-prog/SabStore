"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) router.replace("/dashboard");
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [supabase, router]);

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.replace("/dashboard");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) setError(error.message);
      else if (data.session) router.replace("/dashboard");
      else setNotice("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo-mark.svg" alt="SabStore" width={56} height={56} className="rounded-2xl mb-3" priority />
          <h1 className="ks-display text-2xl font-bold">SabStore</h1>
          <p className="text-sm text-muted mt-1 text-center">
            Billing, inventory &amp; udhaar for your shop
          </p>
        </div>

        <div className="ks-card p-6">
          <div className="flex rounded-full bg-[#F1F2F8] p-1 mb-5">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === "signin" ? "bg-white shadow text-ink" : "text-muted"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-white shadow text-ink" : "text-muted"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Your name</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="ks-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Suresh Sharma"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="ks-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@shop.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Password</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="ks-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ks-btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-4">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-brand"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
