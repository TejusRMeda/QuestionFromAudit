import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { CreateSuggestionSchema } from "@/lib/validations/suggestion";
import { applyRateLimit } from "@/lib/rateLimit";

interface Params {
  params: Promise<{ trustLinkId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const supabase = createServiceClient();

    // Get the instance
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

    // Get all suggestions for this instance's questions using a single join query
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("instance_suggestions")
      .select(`
        id,
        submitter_name,
        submitter_email,
        suggestion_text,
        reason,
        status,
        response_message,
        created_at,
        instance_question_id,
        component_changes,
        is_test_session,
        instance_questions!inner (
          id,
          question_id,
          category,
          question_text,
          section,
          instance_id
        )
      `)
      .eq("instance_questions.instance_id", instance.id)
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError);
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Get comment counts for all suggestions using aggregate count
    // instead of fetching every comment row and counting client-side
    const suggestionIds = suggestions?.map((s) => s.id) || [];
    let commentCounts: Record<number, number> = {};

    if (suggestionIds.length > 0) {
      const { data: commentData, error: commentError } = await supabase
        .from("suggestion_comments")
        .select("suggestion_id, suggestion_id.count()", { count: "exact" })
        .in("suggestion_id", suggestionIds);

      if (!commentError && commentData) {
        commentCounts = commentData.reduce((acc, row: any) => {
          acc[row.suggestion_id] = (acc[row.suggestion_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
      }
    }

    // Format response
    const formattedSuggestions = suggestions?.map((s: any) => ({
      id: s.id,
      submitterName: s.submitter_name,
      submitterEmail: s.submitter_email,
      suggestionText: s.suggestion_text,
      reason: s.reason,
      status: s.status,
      responseMessage: s.response_message,
      createdAt: s.created_at,
      commentCount: commentCounts[s.id] || 0,
      componentChanges: s.component_changes || null,
      isTestSession: !!s.is_test_session,
      question: s.instance_questions ? {
        id: s.instance_questions.id,
        questionId: s.instance_questions.question_id,
        category: s.instance_questions.category,
        questionText: s.instance_questions.question_text,
        section: s.instance_questions.section || null,
      } : null,
    })) || [];

    return NextResponse.json(
      {
        trustName: instance.trust_name,
        createdAt: instance.created_at,
        suggestions: formattedSuggestions,
        totalCount: formattedSuggestions.length,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = applyRateLimit(req, { limit: 30, windowMs: 60 * 60 * 1000, prefix: "suggestions-create" });
    if (rateLimited) return rateLimited;

    const { trustLinkId } = await params;
    const body = await req.json();

    const parsed = CreateSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { instanceQuestionId, submitterName, submitterEmail, suggestionText, reason, componentChanges, isTestSession } = parsed.data;

    const supabase = createServiceClient();

    // Verify the trust link and question belong together
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id, submission_status")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Block mutations on submitted instances
    if (instance.submission_status === "submitted") {
      return NextResponse.json(
        { message: "This review has already been submitted." },
        { status: 403 }
      );
    }

    // Verify the question belongs to this instance
    const { data: question, error: questionError } = await supabase
      .from("instance_questions")
      .select("id, is_locked")
      .eq("id", instanceQuestionId)
      .eq("instance_id", instance.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Block deletion suggestions on locked questions
    if (question.is_locked) {
      const changes = parsed.data.componentChanges;
      if (changes?.settings?.deleteQuestion?.to === true ||
          changes?.settings?.deleteQuestion?.to === "true") {
        return NextResponse.json(
          { message: "This question is locked and cannot be suggested for deletion." },
          { status: 403 }
        );
      }
    }

    // Create the suggestion with optional component changes
    const insertData: Record<string, unknown> = {
      instance_question_id: instanceQuestionId,
      submitter_name: submitterName.trim(),
      submitter_email: submitterEmail?.trim() || null,
      suggestion_text: suggestionText.trim(),
      reason: reason.trim(),
      status: "draft",
      is_test_session: isTestSession,
    };

    // Add component_changes if provided
    if (componentChanges && Object.keys(componentChanges).length > 0) {
      insertData.component_changes = componentChanges;
    }

    const { data: suggestion, error: suggestionError } = await supabase
      .from("instance_suggestions")
      .insert(insertData)
      .select()
      .single();

    if (suggestionError) {
      console.error("Error creating suggestion:", suggestionError);
      return NextResponse.json(
        { message: "Failed to submit suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: suggestion.id,
      message: "Suggestion submitted successfully",
    });
  } catch (error) {
    console.error("Error creating suggestion:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
