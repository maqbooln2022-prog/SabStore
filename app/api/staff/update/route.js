import { NextResponse } from "next/server";
import { createAdminClient, getRequestUser } from "@/lib/supabaseAdmin";
import { MODULES } from "@/lib/modules";

// Updates a staff member's name/permissions, and optionally resets their
// PIN. Only the shop's owner can call this.
export async function POST(request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { memberId, name, permissions, newPin } = await request.json();
  if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  if (newPin && String(newPin).length < 6) {
    return NextResponse.json({ error: "PIN must be at least 6 digits" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: target, error: targetError } = await admin
    .from("shop_members")
    .select("id, shop_id, user_id, role")
    .eq("id", memberId)
    .maybeSingle();
  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "Can't edit the shop owner here" }, { status: 400 });

  const { data: callerMembership } = await admin
    .from("shop_members")
    .select("role")
    .eq("shop_id", target.shop_id)
    .eq("user_id", caller.id)
    .maybeSingle();
  if (!callerMembership || callerMembership.role !== "owner") {
    return NextResponse.json({ error: "Only the shop owner can edit staff" }, { status: 403 });
  }

  const updates = {};
  if (name?.trim()) updates.name = name.trim();
  if (permissions) updates.permissions = Object.fromEntries(MODULES.map((m) => [m.key, !!permissions[m.key]]));

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await admin.from("shop_members").update(updates).eq("id", memberId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (newPin) {
    const { error: pinError } = await admin.auth.admin.updateUserById(target.user_id, { password: String(newPin) });
    if (pinError) return NextResponse.json({ error: pinError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
