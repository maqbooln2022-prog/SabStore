import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabaseAdmin";

// Deletes any shop platform-wide, regardless of who owns it — schema.sql
// cascades everything under it (items, bills, movements, credits,
// day-close history, expenses, supplier links, staff), same as an
// owner deleting their own shop from Store Settings.
export async function POST(request) {
  const { admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const { shopId } = await request.json();
  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  const { error: deleteError } = await admin.from("shops").delete().eq("id", shopId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
