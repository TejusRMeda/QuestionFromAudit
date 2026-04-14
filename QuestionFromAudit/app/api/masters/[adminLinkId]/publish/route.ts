import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/rateLimit";

interface Params {
  params: Promise<{ adminLinkId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = applyRateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, prefix: "masters-publish" });
    if (rateLimited) return rateLimited;

    const { adminLinkId } = await params;

    if (!adminLinkId) {
      return NextResponse.json(
        { message: "Admin link ID is required" },
        { status: 400 }
      );
    }

    const authClient = await createClient();
    const supabase = createServiceClient();

    // Require authentication
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .select("id, user_id, status")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (masterError || !master) {
      return NextResponse.json(
        { message: "Master questionnaire not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (master.user_id !== user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Check current status
    if (master.status !== 'draft') {
      return NextResponse.json(
        { message: "Questionnaire is already published" },
        { status: 400 }
      );
    }

    // Update status to published
    const { data: updated, error: updateError } = await supabase
      .from("master_questionnaires")
      .update({ status: 'published' })
      .eq("id", master.id)
      .select("id, status")
      .single();

    if (updateError) {
      console.error("Error publishing master:", updateError);
      return NextResponse.json(
        { message: "Failed to publish questionnaire" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Questionnaire published successfully",
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error publishing master:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
