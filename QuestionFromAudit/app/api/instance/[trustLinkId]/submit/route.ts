import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ trustLinkId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const supabase = await createClient();

    // Get the instance
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id, submission_status")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    if (instance.submission_status === "submitted") {
      return NextResponse.json(
        { message: "This review has already been submitted" },
        { status: 400 }
      );
    }

    // Get all unique sections for this instance
    const { data: questions, error: questionsError } = await supabase
      .from("instance_questions")
      .select("section")
      .eq("instance_id", instance.id);

    if (questionsError) {
      return NextResponse.json(
        { message: "Failed to verify sections" },
        { status: 500 }
      );
    }

    const allSections = new Set(
      (questions || []).map((q) => q.section || "General")
    );

    // Get reviewed sections
    const { data: reviews, error: reviewsError } = await supabase
      .from("instance_section_reviews")
      .select("section_name")
      .eq("instance_id", instance.id);

    if (reviewsError) {
      return NextResponse.json(
        { message: "Failed to verify section reviews" },
        { status: 500 }
      );
    }

    const reviewedSections = new Set(
      (reviews || []).map((r) => r.section_name)
    );

    // Validate all sections are reviewed
    const unreviewedSections = [...allSections].filter(
      (s) => !reviewedSections.has(s)
    );

    if (unreviewedSections.length > 0) {
      return NextResponse.json(
        {
          message: `Not all sections have been reviewed. Missing: ${unreviewedSections.join(", ")}`,
          unreviewedSections,
        },
        { status: 400 }
      );
    }

    // Get all question IDs for this instance
    const questionIds = (questions || []).map((q: any) => q.id).filter(Boolean);

    // If we need question IDs, re-fetch with id
    const { data: questionRows } = await supabase
      .from("instance_questions")
      .select("id")
      .eq("instance_id", instance.id);

    const qIds = (questionRows || []).map((q) => q.id);

    // Flip all draft suggestions to pending
    if (qIds.length > 0) {
      const { error: updateError } = await supabase
        .from("instance_suggestions")
        .update({ status: "pending" })
        .in("instance_question_id", qIds)
        .eq("status", "draft");

      if (updateError) {
        console.error("Error updating suggestions:", updateError);
        return NextResponse.json(
          { message: "Failed to submit suggestions" },
          { status: 500 }
        );
      }
    }

    // Set submission status
    const { error: statusError } = await supabase
      .from("trust_instances")
      .update({ submission_status: "submitted" })
      .eq("id", instance.id);

    if (statusError) {
      console.error("Error updating submission status:", statusError);
      return NextResponse.json(
        { message: "Failed to update submission status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
