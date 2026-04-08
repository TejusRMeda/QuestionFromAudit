import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;

    if (!linkId) {
      return NextResponse.json(
        { message: "Link ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find project by trust_link_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, trust_name, created_at")
      .eq("trust_link_id", linkId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { message: "Project not found. The link may be invalid." },
        { status: 404 }
      );
    }

    // Get all questions for this project with suggestion counts
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select(`
        id,
        question_id,
        category,
        question_text,
        answer_type,
        answer_options,
        characteristic,
        section,
        page,
        enable_when,
        has_helper,
        helper_type,
        helper_name,
        helper_value,
        suggestions (count)
      `)
      .eq("project_id", project.id)
      .order("id", { ascending: true });

    if (questionsError) {
      console.error("Questions fetch error:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Transform the data to include suggestion count and answer info
    const questionsWithCount = questions.map((q) => ({
      id: q.id,
      questionId: q.question_id,
      category: q.category,
      questionText: q.question_text,
      answerType: q.answer_type,
      answerOptions: q.answer_options,
      characteristic: q.characteristic,
      section: q.section,
      page: q.page,
      enableWhen: q.enable_when,
      hasHelper: q.has_helper,
      helperType: q.helper_type,
      helperName: q.helper_name,
      helperValue: q.helper_value,
      suggestionCount: q.suggestions?.[0]?.count || 0,
    }));

    return NextResponse.json({
      trustName: project.trust_name,
      createdAt: project.created_at,
      questions: questionsWithCount,
    });
  } catch (error) {
    console.error("Review API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
