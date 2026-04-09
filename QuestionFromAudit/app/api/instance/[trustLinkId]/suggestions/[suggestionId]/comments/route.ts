import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CreateCommentSchema } from "@/lib/validations/comment";
import { applyRateLimit } from "@/lib/rateLimit";

interface Params {
  params: Promise<{ trustLinkId: string; suggestionId: string }>;
}

// Get all comments for a suggestion
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId, suggestionId } = await params;

    const suggestionIdNum = parseInt(suggestionId, 10);
    if (!suggestionId || isNaN(suggestionIdNum)) {
      return NextResponse.json(
        { message: "Valid suggestion ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch instance, suggestion, and comments in parallel
    const [instanceResult, suggestionResult, commentsResult] = await Promise.all([
      supabase
        .from("trust_instances")
        .select("id")
        .eq("trust_link_id", trustLinkId)
        .single(),
      supabase
        .from("instance_suggestions")
        .select(`
          id,
          instance_question_id,
          instance_questions!inner (
            instance_id
          )
        `)
        .eq("id", suggestionIdNum)
        .single(),
      supabase
        .from("suggestion_comments")
        .select("id, author_type, author_name, author_email, message, created_at")
        .eq("suggestion_id", suggestionIdNum)
        .order("created_at", { ascending: true }),
    ]);

    const { data: instance, error: instanceError } = instanceResult;
    const { data: suggestion, error: suggestionError } = suggestionResult;
    const { data: comments, error: commentsError } = commentsResult;

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { message: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify the suggestion belongs to this instance
    const questionData = suggestion.instance_questions as { instance_id?: number } | null;
    if (!questionData || questionData.instance_id !== instance.id) {
      return NextResponse.json(
        { message: "Suggestion does not belong to this questionnaire" },
        { status: 403 }
      );
    }

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json(
        { message: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Format response
    const formattedComments = comments?.map((c) => ({
      id: c.id,
      authorType: c.author_type,
      authorName: c.author_name,
      authorEmail: c.author_email,
      message: c.message,
      createdAt: c.created_at,
    })) || [];

    return NextResponse.json({
      comments: formattedComments,
      totalCount: formattedComments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a new comment to a suggestion
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = applyRateLimit(req, { limit: 60, windowMs: 60 * 60 * 1000, prefix: "comments-create" });
    if (rateLimited) return rateLimited;

    const { trustLinkId, suggestionId } = await params;
    const body = await req.json();

    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { authorName, authorEmail, message } = parsed.data;

    // Validate suggestion ID
    const suggestionIdNum = parseInt(suggestionId, 10);
    if (!suggestionId || isNaN(suggestionIdNum)) {
      return NextResponse.json(
        { message: "Valid suggestion ID is required" },
        { status: 400 }
      );
    }

    const authClient = await createClient();
    const supabase = createServiceClient();

    // Run all validation queries in parallel (they're independent)
    const [instanceResult, authResult, suggestionResult] = await Promise.all([
      supabase
        .from("trust_instances")
        .select("id, master_id, master_questionnaires!inner(user_id)")
        .eq("trust_link_id", trustLinkId)
        .single(),
      authClient.auth.getUser(),
      supabase
        .from("instance_suggestions")
        .select(`
          id,
          instance_question_id,
          instance_questions!inner (
            instance_id
          )
        `)
        .eq("id", suggestionIdNum)
        .single(),
    ]);

    const { data: instance, error: instanceError } = instanceResult;
    const { data: { user } } = authResult;
    const { data: suggestion, error: suggestionError } = suggestionResult;

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Derive authorType server-side: authenticated owner = admin, otherwise trust_user
    const masterData = instance.master_questionnaires as { user_id?: string } | null;
    const resolvedAuthorType = (user && masterData?.user_id === user.id)
      ? "admin"
      : "trust_user";

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { message: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify the suggestion belongs to this instance
    const questionData = suggestion.instance_questions as { instance_id?: number } | null;
    if (!questionData || questionData.instance_id !== instance.id) {
      return NextResponse.json(
        { message: "Suggestion does not belong to this questionnaire" },
        { status: 403 }
      );
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from("suggestion_comments")
      .insert({
        suggestion_id: suggestionIdNum,
        author_type: resolvedAuthorType,
        author_name: authorName.trim(),
        author_email: authorEmail?.trim() || null,
        message: message.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return NextResponse.json(
        { message: "Failed to add comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: comment.id,
      authorType: comment.author_type,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      message: comment.message,
      createdAt: comment.created_at,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
