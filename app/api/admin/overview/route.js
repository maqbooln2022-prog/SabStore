import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const { admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const [
    { data: shops, error: shopsError },
    { data: bills, error: billsError },
    { data: members, error: membersError },
    { data: credits, error: creditsError },
  ] = await Promise.all([
    admin.from("shops").select("id, owner_id, name, type, created_at, enabled_modules").order("created_at"),
    admin.from("bills").select("shop_id, total, date"),
    admin.from("shop_members").select("id, shop_id, user_id, role, name, staff_code, permissions").order("role", { ascending: false }),
    admin.from("credits").select("amount, type"),
  ]);

  if (shopsError) return NextResponse.json({ error: shopsError.message }, { status: 500 });
  if (billsError) return NextResponse.json({ error: billsError.message }, { status: 500 });
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });
  if (creditsError) return NextResponse.json({ error: creditsError.message }, { status: 500 });

  // Per-shop bill stats
  const billCountByShop = {};
  const lastBillByShop = {};
  let platformGmv = 0;
  for (const b of bills) {
    billCountByShop[b.shop_id] = (billCountByShop[b.shop_id] || 0) + 1;
    platformGmv += b.total || 0;
    const prev = lastBillByShop[b.shop_id];
    if (!prev || new Date(b.date) > new Date(prev)) lastBillByShop[b.shop_id] = b.date;
  }

  // Net udhaar outstanding across the whole platform
  let udhaaarOutstanding = 0;
  for (const c of credits) {
    udhaaarOutstanding += c.type === "charge" ? (c.amount || 0) : -(c.amount || 0);
  }

  const membersByShop = {};
  for (const m of members) (membersByShop[m.shop_id] ||= []).push(m);

  const { data: userList, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
  const usersById = Object.fromEntries(userList.users.map((u) => [u.id, u]));

  const ownersById = {};
  let staffCount = 0;
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
    const shopMembers = (membersByShop[shop.id] || []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      email: usersById[m.user_id]?.email || "(unknown)",
      role: m.role,
      name: m.name,
      staff_code: m.staff_code,
      permissions: m.permissions,
    }));
    const shopStaffCount = shopMembers.filter((m) => m.role === "staff").length;
    staffCount += shopStaffCount;

    ownersById[shop.owner_id].shops.push({
      id: shop.id,
      name: shop.name,
      type: shop.type,
      created_at: shop.created_at,
      bill_count: billCountByShop[shop.id] || 0,
      last_bill_at: lastBillByShop[shop.id] || null,
      staff_count: shopStaffCount,
      members: shopMembers,
    });
  }

  const owners = Object.values(ownersById).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({
    owners,
    totals: {
      ownerCount: owners.length,
      shopCount: shops.length,
      billCount: bills.length,
      staffCount,
      platformGmv: Math.round(platformGmv * 100) / 100,
      udhaaarOutstanding: Math.round(udhaaarOutstanding * 100) / 100,
    },
  });
}
