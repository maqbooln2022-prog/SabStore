// shop_products is the per-shop price/stock instance of an owner-level
// product (see PROJECT_BRIEF.md's shared-catalog note). Every page that
// used to read from `items` now reads shop_products joined to products
// and flattens it back into the same shape (code/name/price/stock/...),
// so `id` is the shop_products id (what movements/bills should reference
// — it's shop-specific) and `product_id` is the shared catalog entry.
export function flattenShopProduct(row) {
  const { product, ...shopProductFields } = row;
  return {
    ...shopProductFields,
    product_id: product.id,
    name: product.name,
    hindi_name: product.hindi_name,
    barcode: product.barcode,
    image_url: product.image_url,
    category: product.category,
    unit: product.unit,
  };
}

const SHOP_PRODUCT_SELECT = "*, product:products(*)";

export async function fetchShopItems(supabase, shopId, { orderByCode = true } = {}) {
  let query = supabase.from("shop_products").select(SHOP_PRODUCT_SELECT).eq("shop_id", shopId);
  if (orderByCode) query = query.order("code");
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(flattenShopProduct);
}
