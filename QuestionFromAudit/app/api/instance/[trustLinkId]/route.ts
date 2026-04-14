import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ trustLinkId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;

    if (!trustLinkId) {
      return NextResponse.json(
        { message: "Trust link ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch trust instance
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id, trust_name, created_at, submission_status, master_questionnaires(name)")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Fetch questions and section reviews in parallel (both only need instance.id)
    const [questionsResult, sectionReviewsResult] = await Promise.all([
      supabase
        .from("instance_questions")
        .select(`
          id, question_id, category, question_text, answer_type, answer_options,
          characteristic, section, page, enable_when, has_helper, helper_type,
          helper_name, helper_value, required,
          instance_suggestions (count)
        `)
        .eq("instance_id", instance.id)
        .order("id", { ascending: true }),
      supabase
        .from("instance_section_reviews")
        .select("section_name, reviewer_name, has_suggestions")
        .eq("instance_id", instance.id),
    ]);

    const { data: questions, error: questionsError } = questionsResult;
    const { data: sectionReviews } = sectionReviewsResult;

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Fetch quick actions and new-question suggestions in parallel (both need question IDs)
    const questionIds = questions?.map((q) => q.id) || [];

    const [quickActionsResult, newQuestionsResult] = await Promise.all([
      supabase
        .from("instance_suggestions")
        .select("instance_question_id, suggestion_text")
        .in("suggestion_text", [
          "Make this question required",
          "Remove this question from the questionnaire",
        ])
        .in("instance_question_id", questionIds),
      questionIds.length > 0
        ? supabase
            .from("instance_suggestions")
            .select("id, instance_question_id, submitter_name, component_changes")
            .not("component_changes->newQuestion", "is", null)
            .in("instance_question_id", questionIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const { data: quickActionSuggestions } = quickActionsResult;
    const { data: newQuestionRows } = newQuestionsResult;

    // Build a map of question ID → quick action type
    const quickActionMap: Record<number, "required" | "delete"> = {};
    if (quickActionSuggestions) {
      for (const s of quickActionSuggestions) {
        if (s.suggestion_text === "Make this question required") {
          quickActionMap[s.instance_question_id] = "required";
        } else if (s.suggestion_text === "Remove this question from the questionnaire") {
          quickActionMap[s.instance_question_id] = "delete";
        }
      }
    }

    const newQuestionSuggestions = (newQuestionRows || []).map((s: any) => ({
      id: s.id,
      anchorQuestionId: s.instance_question_id,
      position: s.component_changes?.newQuestion?.position || "after",
      questionText: s.component_changes?.newQuestion?.questionText || "",
      submitterName: s.submitter_name,
    }));

    // Format response
    const formattedQuestions = questions?.map((q) => ({
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
      required: q.required ?? false,
      suggestionCount: q.instance_suggestions?.[0]?.count || 0,
      quickAction: quickActionMap[q.id] || null,
    }));

    return NextResponse.json(
      {
        trustName: instance.trust_name,
        questionnaireName: (instance.master_questionnaires as any)?.name || null,
        createdAt: instance.created_at,
        submissionStatus: instance.submission_status || "in_progress",
        sectionReviews: (sectionReviews || []).map((r) => r.section_name),
        questions: formattedQuestions || [],
        newQuestionSuggestions,
      },
      {
        headers: {
          // Allow client caching for 60s, revalidate in background for up to 5min
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching instance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
