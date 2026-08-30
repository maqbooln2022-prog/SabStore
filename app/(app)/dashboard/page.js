// TODO(claude-code): port `function Dashboard` from
// reference/kirana-store-app.jsx. Replace the prototype's in-memory
// `bills`/`items`/etc. arrays with Supabase queries scoped to the active
// shop (see supabase/schema.sql). Keep the same UI/logic:
//   - Hero card: today's sales + profit, "New Bill" and "Send weekly
//     digest" buttons
//   - Clickable stat cards (items in stock, stock value, low stock,
//     today's profit, outstanding udhaar) opening StatDetailModal
//   - "Running low" and "Recent stock movement" cards
//   - "Top customers" card (topCustomers() helper) opening
//     CustomerDetailModal
// The weekly digest currently opens a wa.me link (manual send) — phase 2
// is wiring this to the WhatsApp Cloud API for a real scheduled send.

export default function DashboardPage() {
  return <div>Dashboard — port from reference/kirana-store-app.jsx</div>;
}
