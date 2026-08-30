// TODO(claude-code): Port the Sidebar component from
// reference/kirana-store-app.jsx (search for `function Sidebar`) — shop
// dropdown (now backed by a real `shops` query instead of local state),
// nav links to each route below, and the store-settings modal. Fetch the
// current user's shops from Supabase here (or in a client context) and
// pass the active shop down via React context so every page under this
// layout can read it.
//
// AuthGuard (components/AuthGuard.js) already redirects signed-out users
// to /login, so everything rendered below is guaranteed to have a session.

import AuthGuard from "@/components/AuthGuard";

export default function AppLayout({ children }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        {/* <Sidebar ... /> */}
        <main className="flex-1 min-w-0 ks-page-pad pb-16 max-w-5xl">{children}</main>
      </div>
    </AuthGuard>
  );
}
