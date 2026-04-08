import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface ComponentChanges {
  settings?: {
    required?: { from: boolean; to: boolean };
  };
  content?: {
    questionText?: { from: string; to: string };
    answerType?: { from: string; to: string };
    options?: {
      added: Array<{ text: string; characteristic: string }>;
      modified: Array<{ index: number; from: string; to: string }>;
      removed: number[];
    };
  };
  help?: {
    hasHelper?: { from: boolean; to: boolean };
    helperName?: { from: string | null; to: string };
    helperValue?: { from: string | null; to: string };
    helperType?: { from: string | null; to: string };
  };
  logic?: {
    description: string;
  };
}

interface SuggestionRequest {
  questionId: number;
  submitterName: string;
  submitterEmail?: string | null;
  suggestionText: string;
  reason: string;
  componentChanges?: ComponentChanges;
}

export async function POST(req: NextRequest) {
  try {
    const body: SuggestionRequest = await req.json();
    const { questionId, submitterName, submitterEmail, suggestionText, reason, componentChanges } = body;

    // Validate required fields
    if (!questionId) {
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
        { message: "Suggestion exceeds 2000 character limit" },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        { message: "Reason exceeds 1000 character limit" },
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

    // Verify the question exists
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Create the suggestion with optional component changes
    const insertData: Record<string, unknown> = {
      question_id: questionId,
      submitter_name: submitterName.trim(),
      submitter_email: submitterEmail?.trim() || null,
      suggestion_text: suggestionText.trim(),
      reason: reason.trim(),
      status: "pending",
    };

    // Add component_changes if provided
    if (componentChanges && Object.keys(componentChanges).length > 0) {
      insertData.component_changes = componentChanges;
    }

    const { data: suggestion, error: suggestionError } = await supabase
      .from("suggestions")
      .insert(insertData)
      .select()
      .single();

    if (suggestionError) {
      console.error("Suggestion creation error:", suggestionError);
      return NextResponse.json(
        { message: "Failed to create suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestionId: suggestion.id,
    });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
