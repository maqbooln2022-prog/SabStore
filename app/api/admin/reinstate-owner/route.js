import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const { ownerId } = await request.json();
  if (!ownerId) return NextResponse.json({ error: "ownerId is required" }, { status: 400 });

  const { data: ownerUser } = await admin.auth.admin.getUserById(ownerId);
  const { error: unbanError } = await admin.auth.admin.updateUserById(ownerId, { ban_duration: "none" });
  if (unbanError) return NextResponse.json({ error: unbanError.message }, { status: 500 });

  await logAdminAction(admin, caller.id, caller.email, "reinstate_owner", "owner", ownerId, { ownerEmail: ownerUser?.user?.email });
  return NextResponse.json({ ok: true });
}
