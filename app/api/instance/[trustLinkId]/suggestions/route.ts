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

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const supabase = await createClient();

    // Get the instance
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id, trust_name, created_at")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Get all suggestions for this instance with question details
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("instance_suggestions")
      .select(`
        id,
        submitter_name,
        submitter_email,
        suggestion_text,
        reason,
        status,
        response_message,
        created_at,
        instance_question_id,
        instance_questions (
          id,
          question_id,
          category,
          question_text
        )
      `)
      .eq("instance_questions.instance_id", instance.id)
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError);
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Format response
    const formattedSuggestions = suggestions?.map((s: any) => ({
      id: s.id,
      submitterName: s.submitter_name,
      submitterEmail: s.submitter_email,
      suggestionText: s.suggestion_text,
      reason: s.reason,
      status: s.status,
      responseMessage: s.response_message,
      createdAt: s.created_at,
      question: s.instance_questions ? {
        id: s.instance_questions.id,
        questionId: s.instance_questions.question_id,
        category: s.instance_questions.category,
        questionText: s.instance_questions.question_text,
      } : null,
    })) || [];

    return NextResponse.json({
      trustName: instance.trust_name,
      createdAt: instance.created_at,
      suggestions: formattedSuggestions,
      totalCount: formattedSuggestions.length,
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
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
