import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { UpdateSuggestionSchema } from "@/lib/validations/suggestion";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseInt(id, 10);

    if (isNaN(suggestionId)) {
      return NextResponse.json(
        { message: "Invalid suggestion ID" },
        { status: 400 }
      );
    }

    const authClient = await createClient();
    const supabase = createServiceClient();

    // Require authentication for status/comment updates
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = UpdateSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { status, internalComment, responseMessage } = parsed.data;

    // Verify the suggestion exists
    const { data: existingSuggestion, error: fetchError } = await supabase
      .from("suggestions")
      .select("id")
      .eq("id", suggestionId)
      .single();

    if (fetchError || !existingSuggestion) {
      return NextResponse.json(
        { message: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (internalComment !== undefined) {
      updateData.internal_comment = internalComment?.trim() || null;
    }

    if (responseMessage !== undefined) {
      updateData.response_message = responseMessage?.trim() || null;
    }

    // Update the suggestion
    const { error: updateError } = await supabase
      .from("suggestions")
      .update(updateData)
      .eq("id", suggestionId);

    if (updateError) {
      console.error("Suggestion update error:", updateError);
      return NextResponse.json(
        { message: "Failed to update suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Suggestion update API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseInt(id, 10);

    if (isNaN(suggestionId)) {
      return NextResponse.json(
        { message: "Invalid suggestion ID" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get suggestion
    const { data: suggestion, error } = await supabase
      .from("suggestions")
      .select(`
        id,
        question_id,
        submitter_name,
        submitter_email,
        suggestion_text,
        reason,
        status,
        internal_comment,
        response_message,
        created_at,
        updated_at
      `)
      .eq("id", suggestionId)
      .single();

    if (error || !suggestion) {
      return NextResponse.json(
        { message: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Get related question
    const { data: question } = await supabase
      .from("questions")
      .select("question_id, category, question_text")
      .eq("id", suggestion.question_id)
      .single();

    return NextResponse.json({
      id: suggestion.id,
      questionId: question?.question_id,
      category: question?.category,
      questionText: question?.question_text,
      submitterName: suggestion.submitter_name,
      submitterEmail: suggestion.submitter_email,
      suggestionText: suggestion.suggestion_text,
      reason: suggestion.reason,
      status: suggestion.status,
      internalComment: suggestion.internal_comment,
      responseMessage: suggestion.response_message,
      createdAt: suggestion.created_at,
      updatedAt: suggestion.updated_at,
    });
  } catch (error) {
    console.error("Suggestion fetch API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
