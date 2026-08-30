import { redirect } from "next/navigation";

// TODO(claude-code): check the Supabase session here (server component +
// @supabase/ssr's createServerClient) and redirect to /login if signed out,
// or /dashboard if signed in. Hardcoded for now so the scaffold builds.
export default function RootPage() {
  redirect("/login");
}
