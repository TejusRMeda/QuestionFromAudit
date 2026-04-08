import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ adminLinkId: string; trustLinkId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { adminLinkId, trustLinkId } = await params;

    if (!adminLinkId || !trustLinkId) {
      return NextResponse.json(
        { message: "Admin link ID and trust link ID are required" },
        { status: 400 }
      );
    }

    const authClient = await createClient();
    const supabase = createServiceClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the user owns the master questionnaire
    const { data: master, error: fetchError } = await supabase
      .from("master_questionnaires")
      .select("id, user_id")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (fetchError || !master) {
      return NextResponse.json(
        { message: "Master questionnaire not found" },
        { status: 404 }
      );
    }

    if (master.user_id !== user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Verify the trust instance belongs to this master
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id")
      .eq("trust_link_id", trustLinkId)
      .eq("master_id", master.id)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Trust instance not found" },
        { status: 404 }
      );
    }

    // Delete the trust instance (cascades handle instance_questions, suggestions, comments)
    const { error: deleteError } = await supabase
      .from("trust_instances")
      .delete()
      .eq("id", instance.id);

    if (deleteError) {
      console.error("Error deleting trust instance:", deleteError);
      return NextResponse.json(
        { message: "Failed to delete trust instance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Trust instance deleted successfully" });
  } catch (error) {
    console.error("Error deleting trust instance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
