export function nextCode(items) {
  const used = new Set(items.map((i) => i.code));
  for (let n = 1; n <= 99; n++) {
    const c = String(n).padStart(2, "0");
    if (!used.has(c)) return c;
  }
  return String(items.length + 1).padStart(2, "0");
}

// bills.items is jsonb: [{ shop_product_id, code, name, price, unit, gst, qty }, ...]
export function reorderSuggestion(item, bills) {
  const days = new Set();
  let totalSold = 0;
  (bills || []).forEach((b) => {
    const line = (b.items || []).find((l) => l.shop_product_id === item.id);
    if (line) {
      totalSold += line.qty;
      days.add(new Date(b.date).toDateString());
    }
  });
  if (totalSold === 0 || days.size === 0) return null;
  const avgPerDay = totalSold / days.size;
  if (avgPerDay <= 0) return null;
  return { avgPerDay, daysLeft: item.stock / avgPerDay, suggestedQty: Math.max(1, Math.ceil(avgPerDay * 7)) };
}
