// Fetches clearance offers whose date range covers today, for pricing
// during Billing. "Active" is computed here, live, from start_date/
// end_date — not a stored flag — so an offer applies and reverts on
// its own with no scheduled job.
export async function fetchActiveOffers(supabase, shopId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("clearance_offers")
    .select("id, name, discount_pct, start_date, end_date, items:clearance_offer_items(shop_product_id)")
    .eq("shop_id", shopId)
    .lte("start_date", today)
    .gte("end_date", today);
  if (error) throw error;
  return data || [];
}

// shop_product_id -> { pct, offerName } — when two active offers cover
// the same item, the better discount for the customer wins.
export function activeDiscountMap(offers) {
  const map = new Map();
  for (const offer of offers) {
    for (const { shop_product_id } of offer.items || []) {
      const existing = map.get(shop_product_id);
      if (!existing || offer.discount_pct > existing.pct) {
        map.set(shop_product_id, { pct: Number(offer.discount_pct), offerName: offer.name });
      }
    }
  }
  return map;
}

export function clearancePrice(price, pct) {
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}
