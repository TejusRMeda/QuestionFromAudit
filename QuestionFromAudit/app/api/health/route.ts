import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("master_questionnaires")
      .select("id")
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
