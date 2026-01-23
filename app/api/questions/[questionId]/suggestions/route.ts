import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const qId = parseInt(questionId, 10);

    if (isNaN(qId)) {
      return NextResponse.json(
        { message: "Invalid question ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the question exists
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", qId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Get all suggestions for this question (public view - no internal comments)
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("suggestions")
      .select(`
        id,
        submitter_name,
        suggestion_text,
        reason,
        status,
        response_message,
        created_at
      `)
      .eq("question_id", qId)
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      console.error("Suggestions fetch error:", suggestionsError);
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Transform the data (excluding internal comments for public view)
    const publicSuggestions = suggestions.map((s) => ({
      id: s.id,
      submitterName: s.submitter_name,
      suggestionText: s.suggestion_text,
      reason: s.reason,
      status: s.status,
      responseMessage: s.response_message,
      createdAt: s.created_at,
    }));

    return NextResponse.json({
      suggestions: publicSuggestions,
    });
  } catch (error) {
    console.error("Questions suggestions API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
