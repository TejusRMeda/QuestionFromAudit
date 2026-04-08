import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ trustLinkId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const supabase = await createClient();

    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from("instance_section_reviews")
      .select("section_name, reviewer_name, has_suggestions, reviewed_at")
      .eq("instance_id", instance.id);

    if (reviewsError) {
      return NextResponse.json(
        { message: "Failed to fetch section reviews" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (error) {
    console.error("Error fetching section reviews:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const body = await req.json();
    const { sectionName, reviewerName, hasSuggestions } = body;

    if (!sectionName?.trim() || !reviewerName?.trim()) {
      return NextResponse.json(
        { message: "Section name and reviewer name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Upsert the section review
    const { error: upsertError } = await supabase
      .from("instance_section_reviews")
      .upsert(
        {
          instance_id: instance.id,
          section_name: sectionName.trim(),
          reviewer_name: reviewerName.trim(),
          has_suggestions: hasSuggestions ?? false,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "instance_id,section_name,reviewer_name" }
      );

    if (upsertError) {
      console.error("Error saving section review:", upsertError);
      return NextResponse.json(
        { message: "Failed to save section review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Section review saved" });
  } catch (error) {
    console.error("Error saving section review:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const { searchParams } = new URL(req.url);
    const sectionName = searchParams.get("sectionName");
    const reviewerName = searchParams.get("reviewerName");

    if (!sectionName || !reviewerName) {
      return NextResponse.json(
        { message: "Section name and reviewer name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("instance_section_reviews")
      .delete()
      .eq("instance_id", instance.id)
      .eq("section_name", sectionName)
      .eq("reviewer_name", reviewerName);

    if (deleteError) {
      console.error("Error deleting section review:", deleteError);
      return NextResponse.json(
        { message: "Failed to remove section review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Section review removed" });
  } catch (error) {
    console.error("Error deleting section review:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
