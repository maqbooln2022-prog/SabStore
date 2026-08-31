import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabaseAdmin";

// Platform-wide view across every owner and shop — the whole point of
// this route is to read data that RLS would normally scope down to
// "your own shops", so it goes through the service-role client, gated
// by requireAdmin() rather than by RLS.
export async function GET(request) {
  const { admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const [{ data: shops, error: shopsError }, { data: bills, error: billsError }] = await Promise.all([
    admin.from("shops").select("id, owner_id, name, type, created_at, enabled_modules").order("created_at"),
    admin.from("bills").select("shop_id"),
  ]);
  if (shopsError) return NextResponse.json({ error: shopsError.message }, { status: 500 });
  if (billsError) return NextResponse.json({ error: billsError.message }, { status: 500 });

  const billCountByShop = {};
  for (const b of bills) billCountByShop[b.shop_id] = (billCountByShop[b.shop_id] || 0) + 1;

  // auth.users isn't queryable via PostgREST, so owner email/signup
  // date/ban status comes from the admin auth API instead.
  const { data: userList, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
  const usersById = Object.fromEntries(userList.users.map((u) => [u.id, u]));

  const ownersById = {};
  for (const shop of shops) {
    if (!ownersById[shop.owner_id]) {
      const u = usersById[shop.owner_id];
      ownersById[shop.owner_id] = {
        id: shop.owner_id,
        email: u?.email || "(unknown)",
        created_at: u?.created_at || null,
        banned: !!(u?.banned_until && new Date(u.banned_until) > new Date()),
        shops: [],
      };
    }
    ownersById[shop.owner_id].shops.push({
      id: shop.id,
      name: shop.name,
      type: shop.type,
      created_at: shop.created_at,
      bill_count: billCountByShop[shop.id] || 0,
    });
  }

  const owners = Object.values(ownersById).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({
    owners,
    totals: { ownerCount: owners.length, shopCount: shops.length, billCount: bills.length },
  });
}
