import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adminLinkId: string }> }
) {
  try {
    const { adminLinkId } = await params;

    if (!adminLinkId) {
      return NextResponse.json(
        { message: "Admin link ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find project by admin_link_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, trust_name, created_at")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { message: "Project not found. The admin link may be invalid." },
        { status: 404 }
      );
    }

    // Get all questions for this project
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, question_id, category, question_text")
      .eq("project_id", project.id);

    if (questionsError) {
      console.error("Questions fetch error:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Get all suggestions for questions in this project
    const questionIds = questions.map((q) => q.id);

    const { data: suggestions, error: suggestionsError } = await supabase
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
      .in("question_id", questionIds)
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      console.error("Suggestions fetch error:", suggestionsError);
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Create a map of question details
    const questionMap = new Map(
      questions.map((q) => [
        q.id,
        {
          questionId: q.question_id,
          category: q.category,
          questionText: q.question_text,
        },
      ])
    );

    // Transform suggestions with question details
    const suggestionsWithDetails = suggestions.map((s) => {
      const questionDetails = questionMap.get(s.question_id);
      return {
        id: s.id,
        questionId: questionDetails?.questionId,
        category: questionDetails?.category,
        questionText: questionDetails?.questionText,
        submitterName: s.submitter_name,
        submitterEmail: s.submitter_email,
        suggestionText: s.suggestion_text,
        reason: s.reason,
        status: s.status,
        internalComment: s.internal_comment,
        responseMessage: s.response_message,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });

    return NextResponse.json({
      trustName: project.trust_name,
      createdAt: project.created_at,
      suggestions: suggestionsWithDetails,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
