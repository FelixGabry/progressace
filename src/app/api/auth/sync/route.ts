import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserToDatabase } from "@/lib/user";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUserToDatabase(user);
  return NextResponse.json({ success: true });
}
