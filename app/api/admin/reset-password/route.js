import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { caller, admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const { userId, newPassword } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (!newPassword || newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const { data: targetUser } = await admin.auth.admin.getUserById(userId);
  const { error: resetError } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (resetError) return NextResponse.json({ error: resetError.message }, { status: 500 });

  await logAdminAction(admin, caller.id, caller.email, "reset_password", "user", userId, { targetEmail: targetUser?.user?.email });
  return NextResponse.json({ ok: true });
}
