// Every module that can be independently toggled per-shop (Store
// Settings) or per-staff-member (Staff page). `nav` is what the sidebar
// filters against; `permissionKey` is the same string used both in
// shops.enabled_modules and shop_members.permissions.
export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "inventory", label: "Inventory" },
  { key: "billing", label: "New Bill" },
  { key: "history", label: "History" },
  { key: "credit", label: "Udhaar" },
  { key: "dayclose", label: "Day Close" },
  { key: "expenses", label: "Expenses" },
  { key: "cashbook", label: "Cashbook" },
  { key: "suppliers", label: "Suppliers" },
];

export function defaultPermissions(allOn) {
  return Object.fromEntries(MODULES.map((m) => [m.key, allOn]));
}
