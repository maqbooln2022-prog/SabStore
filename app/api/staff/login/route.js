import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

// Resolves a staff code to the login email for that worker's account —
// called before the browser's own supabase.auth.signInWithPassword, so
// the actual PIN check still goes through Supabase's normal secure
// sign-in (rate-limited, etc.), not this route.
export async function POST(request) {
  const { staffCode } = await request.json();
  if (!staffCode) return NextResponse.json({ error: "Staff code is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: member, error } = await admin
    .from("shop_members")
    .select("user_id")
    .eq("staff_code", String(staffCode).trim().toUpperCase())
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!member) return NextResponse.json({ error: "Staff code not found" }, { status: 404 });

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(member.user_id);
  if (userError || !userData?.user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({ email: userData.user.email });
}
