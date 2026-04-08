import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ trustLinkId: string; suggestionId: string }>;
}

interface UpdateSuggestionRequest {
  status?: "pending" | "approved" | "rejected";
  responseMessage?: string | null;
}

// Update a suggestion (status, response message)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId, suggestionId } = await params;
    const body: UpdateSuggestionRequest = await req.json();
    const { status, responseMessage } = body;

    if (!suggestionId) {
      return NextResponse.json(
        { message: "Suggestion ID is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be pending, approved, or rejected" },
        { status: 400 }
      );
    }

    // Validate response message length
    if (responseMessage && responseMessage.length > 1000) {
      return NextResponse.json(
        { message: "Response message exceeds maximum length of 1000 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the trust instance exists
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

    // Verify the suggestion exists and belongs to this instance
    const { data: suggestion, error: suggestionError } = await supabase
      .from("instance_suggestions")
      .select(`
        id,
        instance_question_id,
        instance_questions!inner (
          instance_id
        )
      `)
      .eq("id", suggestionId)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { message: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify the suggestion belongs to this instance
    const questionData = suggestion.instance_questions as unknown as { instance_id: number };
    if (questionData.instance_id !== instance.id) {
      return NextResponse.json(
        { message: "Suggestion does not belong to this questionnaire" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (responseMessage !== undefined) {
      updateData.response_message = responseMessage?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the suggestion
    const { error: updateError } = await supabase
      .from("instance_suggestions")
      .update(updateData)
      .eq("id", suggestionId);

    if (updateError) {
      console.error("Error updating suggestion:", updateError);
      return NextResponse.json(
        { message: "Failed to update suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Suggestion updated successfully",
    });
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a suggestion
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId, suggestionId } = await params;

    if (!suggestionId) {
      return NextResponse.json(
        { message: "Suggestion ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the trust instance exists
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

    // Verify the suggestion exists and belongs to this instance
    const { data: suggestion, error: suggestionError } = await supabase
      .from("instance_suggestions")
      .select(`
        id,
        instance_question_id,
        instance_questions!inner (
          instance_id
        )
      `)
      .eq("id", suggestionId)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { message: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify the suggestion belongs to this instance
    const questionData = suggestion.instance_questions as unknown as { instance_id: number };
    if (questionData.instance_id !== instance.id) {
      return NextResponse.json(
        { message: "Suggestion does not belong to this questionnaire" },
        { status: 403 }
      );
    }

    // Delete the suggestion
    const { error: deleteError } = await supabase
      .from("instance_suggestions")
      .delete()
      .eq("id", suggestionId);

    if (deleteError) {
      console.error("Error deleting suggestion:", deleteError);
      return NextResponse.json(
        { message: "Failed to delete suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Suggestion deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
