import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase instance. For server components/route handlers,
// add a matching createServerClient helper (see @supabase/ssr docs) once
// auth is wired up — this file covers the browser side used by the
// dashboard, billing, inventory, etc.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
