import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key, which bypasses Row Level
// Security entirely. Never import this from a "use client" component —
// it must only ever run inside app/api/**/route.js handlers.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Verifies the bearer token from an incoming request and returns the
// caller's user (or null). Uses the anon key + the caller's own token,
// so this respects RLS — it's just identity verification, not a
// privilege escalation.
export async function getRequestUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}
