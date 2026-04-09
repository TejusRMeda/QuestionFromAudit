import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { CreateLegacySuggestionSchema } from "@/lib/validations/suggestion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateLegacySuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { questionId, submitterName, submitterEmail, suggestionText, reason, componentChanges } = parsed.data;

    const supabase = createServiceClient();

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
