import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

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

    const supabase = await createClient();

    // Fetch trust instance
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

    // Fetch instance questions with suggestion counts
    const { data: questions, error: questionsError } = await supabase
      .from("instance_questions")
      .select("id, question_id, category, question_text, answer_type, answer_options")
      .eq("instance_id", instance.id)
      .order("id", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Get suggestion counts for each question
    const questionIds = questions?.map((q) => q.id) || [];
    let suggestionCounts: Record<number, number> = {};

    if (questionIds.length > 0) {
      const { data: counts, error: countsError } = await supabase
        .from("instance_suggestions")
        .select("instance_question_id")
        .in("instance_question_id", questionIds);

      if (!countsError && counts) {
        counts.forEach((c) => {
          suggestionCounts[c.instance_question_id] =
            (suggestionCounts[c.instance_question_id] || 0) + 1;
        });
      }
    }

    // Format response
    const formattedQuestions = questions?.map((q) => ({
      id: q.id,
      questionId: q.question_id,
      category: q.category,
      questionText: q.question_text,
      answerType: q.answer_type,
      answerOptions: q.answer_options,
      suggestionCount: suggestionCounts[q.id] || 0,
    }));

    return NextResponse.json({
      trustName: instance.trust_name,
      createdAt: instance.created_at,
      questions: formattedQuestions || [],
    });
  } catch (error) {
    console.error("Error fetching instance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
