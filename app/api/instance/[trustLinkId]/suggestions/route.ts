import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ trustLinkId: string }>;
}

interface CreateSuggestionRequest {
  instanceQuestionId: number;
  submitterName: string;
  submitterEmail?: string | null;
  suggestionText: string;
  reason: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const body: CreateSuggestionRequest = await req.json();
    const { instanceQuestionId, submitterName, submitterEmail, suggestionText, reason } = body;

    // Validate required fields
    if (!instanceQuestionId) {
      return NextResponse.json(
        { message: "Question ID is required" },
        { status: 400 }
      );
    }

    if (!submitterName?.trim()) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    if (!suggestionText?.trim()) {
      return NextResponse.json(
        { message: "Suggestion is required" },
        { status: 400 }
      );
    }

    if (!reason?.trim()) {
      return NextResponse.json(
        { message: "Reason is required" },
        { status: 400 }
      );
    }

    // Validate lengths
    if (suggestionText.length > 2000) {
      return NextResponse.json(
        { message: "Suggestion exceeds maximum length of 2000 characters" },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        { message: "Reason exceeds maximum length of 1000 characters" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the trust link and question belong together
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

    // Verify the question belongs to this instance
    const { data: question, error: questionError } = await supabase
      .from("instance_questions")
      .select("id")
      .eq("id", instanceQuestionId)
      .eq("instance_id", instance.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Create the suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from("instance_suggestions")
      .insert({
        instance_question_id: instanceQuestionId,
        submitter_name: submitterName.trim(),
        submitter_email: submitterEmail?.trim() || null,
        suggestion_text: suggestionText.trim(),
        reason: reason.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (suggestionError) {
      console.error("Error creating suggestion:", suggestionError);
      return NextResponse.json(
        { message: "Failed to submit suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: suggestion.id,
      message: "Suggestion submitted successfully",
    });
  } catch (error) {
    console.error("Error creating suggestion:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
