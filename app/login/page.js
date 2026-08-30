"use client";

// TODO(claude-code): build real Supabase auth here (email+password or phone
// OTP — see PROJECT_BRIEF.md "What needs to become real"). This stub exists
// so the route compiles; wire it up before anything else, since every other
// screen assumes an authenticated user with at least one shop.

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="ks-card p-8 max-w-sm w-full text-center">
        <h1 className="ks-display text-xl font-bold mb-2">Sign in</h1>
        <p className="text-sm text-[#6B7280]">
          Supabase auth goes here — see PROJECT_BRIEF.md and
          reference/kirana-store-app.jsx for the shop/owner model this
          should produce a session for.
        </p>
      </div>
    </main>
  );
}
