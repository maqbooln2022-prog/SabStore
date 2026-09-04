import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const { admin, error, status } = await requireAdmin(request);
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

  const { data, error: logError } = await admin
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

  return NextResponse.json({ log: data });
}
