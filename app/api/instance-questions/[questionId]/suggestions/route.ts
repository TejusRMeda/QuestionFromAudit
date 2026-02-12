import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ questionId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { questionId } = await params;
    const questionIdNum = parseInt(questionId, 10);

    if (isNaN(questionIdNum)) {
      return NextResponse.json(
        { message: "Invalid question ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch suggestions for this instance question
    const { data: suggestions, error } = await supabase
      .from("instance_suggestions")
      .select("id, submitter_name, suggestion_text, reason, status, response_message, created_at, component_changes")
      .eq("instance_question_id", questionIdNum)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suggestions:", error);
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Get comment counts for all suggestions
    const suggestionIds = suggestions?.map((s) => s.id) || [];
    let commentCounts: Record<number, number> = {};

    if (suggestionIds.length > 0) {
      const { data: commentData, error: commentError } = await supabase
        .from("suggestion_comments")
        .select("suggestion_id")
        .in("suggestion_id", suggestionIds);

      if (!commentError && commentData) {
        commentCounts = commentData.reduce((acc, row) => {
          acc[row.suggestion_id] = (acc[row.suggestion_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
      }
    }

    // Format response
    const formattedSuggestions = suggestions?.map((s: any) => ({
      id: s.id,
      submitterName: s.submitter_name,
      suggestionText: s.suggestion_text,
      reason: s.reason,
      status: s.status,
      responseMessage: s.response_message,
      createdAt: s.created_at,
      commentCount: commentCounts[s.id] || 0,
      componentChanges: s.component_changes || null,
    }));

    return NextResponse.json({
      suggestions: formattedSuggestions || [],
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
