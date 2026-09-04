import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/supabaseAdmin";

// Bans the owner's own Supabase auth account (blocks login/token
// refresh entirely — this is enforced by Supabase Auth itself, not just
// hidden in the UI). Does not touch their staff accounts, which are
// separate auth users under separate emails.
export async function POST(request) {
  const { caller, admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const { ownerId } = await request.json();
  if (!ownerId) return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
  if (ownerId === caller.id) return NextResponse.json({ error: "You can't suspend your own account" }, { status: 400 });

  const { data: ownerUser } = await admin.auth.admin.getUserById(ownerId);
  const { error: banError } = await admin.auth.admin.updateUserById(ownerId, { ban_duration: "876000h" });
  if (banError) return NextResponse.json({ error: banError.message }, { status: 500 });

  await logAdminAction(admin, caller.id, caller.email, "suspend_owner", "owner", ownerId, { ownerEmail: ownerUser?.user?.email });
  return NextResponse.json({ ok: true });
}
