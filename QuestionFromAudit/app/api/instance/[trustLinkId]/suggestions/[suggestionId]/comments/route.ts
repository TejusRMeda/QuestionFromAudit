import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ trustLinkId: string; suggestionId: string }>;
}

interface CreateCommentRequest {
  authorType: "admin" | "trust_user";
  authorName: string;
  authorEmail?: string | null;
  message: string;
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
      .eq("id", suggestionIdNum)
      .single();

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

    // Fetch all comments for this suggestion
    const { data: comments, error: commentsError } = await supabase
      .from("suggestion_comments")
      .select("id, author_type, author_name, author_email, message, created_at")
      .eq("suggestion_id", suggestionIdNum)
      .order("created_at", { ascending: true });

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
    const { trustLinkId, suggestionId } = await params;
    const body: CreateCommentRequest = await req.json();
    const { authorType, authorName, authorEmail, message } = body;

    // Validate required fields
    const suggestionIdNum = parseInt(suggestionId, 10);
    if (!suggestionId || isNaN(suggestionIdNum)) {
      return NextResponse.json(
        { message: "Valid suggestion ID is required" },
        { status: 400 }
      );
    }

    if (!authorType || !["admin", "trust_user"].includes(authorType)) {
      return NextResponse.json(
        { message: "Author type must be 'admin' or 'trust_user'" },
        { status: 400 }
      );
    }

    if (!authorName?.trim()) {
      return NextResponse.json(
        { message: "Author name is required" },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    // Validate lengths
    if (authorName.length > 100) {
      return NextResponse.json(
        { message: "Author name exceeds maximum length of 100 characters" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { message: "Message exceeds maximum length of 2000 characters" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      return NextResponse.json(
        { message: "Invalid email format" },
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
      .eq("id", suggestionIdNum)
      .single();

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
        author_type: authorType,
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
