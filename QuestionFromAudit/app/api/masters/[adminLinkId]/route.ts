import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ adminLinkId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { adminLinkId } = await params;

    if (!adminLinkId) {
      return NextResponse.json(
        { message: "Admin link ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .select("id, name, admin_link_id, created_at")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (masterError || !master) {
      return NextResponse.json(
        { message: "Master questionnaire not found" },
        { status: 404 }
      );
    }

    // Fetch question count
    const { count: questionCount } = await supabase
      .from("master_questions")
      .select("id", { count: "exact", head: true })
      .eq("master_id", master.id);

    // Fetch all trust instances for this master
    const { data: instances, error: instancesError } = await supabase
      .from("trust_instances")
      .select("id, trust_name, trust_link_id, created_at")
      .eq("master_id", master.id)
      .order("created_at", { ascending: false });

    if (instancesError) {
      console.error("Error fetching instances:", instancesError);
      return NextResponse.json(
        { message: "Failed to fetch instances" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      master: {
        id: master.id,
        name: master.name,
        adminLinkId: master.admin_link_id,
        createdAt: master.created_at,
        questionCount: questionCount || 0,
      },
      instances: instances || [],
    });
  } catch (error) {
    console.error("Error fetching master:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { adminLinkId } = await params;

    if (!adminLinkId) {
      return NextResponse.json(
        { message: "Admin link ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the user owns this questionnaire
    const { data: master, error: fetchError } = await supabase
      .from("master_questionnaires")
      .select("id, user_id")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (fetchError || !master) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    if (master.user_id !== user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete the master questionnaire (cascades handle related data)
    const { error: deleteError } = await supabase
      .from("master_questionnaires")
      .delete()
      .eq("id", master.id);

    if (deleteError) {
      console.error("Error deleting questionnaire:", deleteError);
      return NextResponse.json(
        { message: "Failed to delete questionnaire" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Questionnaire deleted successfully" });
  } catch (error) {
    console.error("Error deleting questionnaire:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
