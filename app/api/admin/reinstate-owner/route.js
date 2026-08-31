import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const { ownerId } = await request.json();
  if (!ownerId) return NextResponse.json({ error: "ownerId is required" }, { status: 400 });

  const { error: unbanError } = await admin.auth.admin.updateUserById(ownerId, { ban_duration: "none" });
  if (unbanError) return NextResponse.json({ error: unbanError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
