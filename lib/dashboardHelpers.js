export function customerBalance(credits, phone) {
  return credits.filter((c) => c.phone === phone).reduce((s, c) => s + (c.type === "charge" ? c.amount : -c.amount), 0);
}

export function topCustomers(bills, limit = 5) {
  const map = new Map();
  bills.forEach((b) => {
    const phone = (b.customer_phone || "").replace(/\D/g, "");
    if (!phone) return;
    const cur = map.get(phone) || { phone, name: b.customer_name || "Customer", total: 0, visits: 0 };
    cur.total += b.total;
    cur.visits += 1;
    cur.name = b.customer_name || cur.name;
    map.set(phone, cur);
  });
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}
