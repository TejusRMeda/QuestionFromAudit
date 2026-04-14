import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { UpdateMasterQuestionSchema } from "@/lib/validations/master";
import { applyRateLimit } from "@/lib/rateLimit";

interface Params {
  params: Promise<{ adminLinkId: string; questionId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = applyRateLimit(req, { limit: 60, windowMs: 60 * 60 * 1000, prefix: "master-questions-update" });
    if (rateLimited) return rateLimited;

    const { adminLinkId, questionId } = await params;

    if (!adminLinkId || !questionId) {
      return NextResponse.json(
        { message: "Admin link ID and question ID are required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = UpdateMasterQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const authClient = await createClient();
    const supabase = createServiceClient();

    // Require authentication
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .select("id, user_id")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (masterError || !master) {
      return NextResponse.json(
        { message: "Master questionnaire not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (master.user_id !== user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Verify question belongs to this master
    const { data: question, error: questionError } = await supabase
      .from("master_questions")
      .select("id")
      .eq("id", questionId)
      .eq("master_id", master.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Build update object, mapping camelCase to snake_case
    const updateData: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.questionText !== undefined) updateData.question_text = data.questionText;
    if (data.answerType !== undefined) updateData.answer_type = data.answerType;
    if (data.answerOptions !== undefined) updateData.answer_options = data.answerOptions;
    if (data.isHidden !== undefined) updateData.is_hidden = data.isHidden;
    if (data.isLocked !== undefined) updateData.is_locked = data.isLocked;
    if (data.required !== undefined) updateData.required = data.required;
    if (data.hasHelper !== undefined) updateData.has_helper = data.hasHelper;
    if (data.helperType !== undefined) updateData.helper_type = data.helperType;
    if (data.helperName !== undefined) updateData.helper_name = data.helperName;
    if (data.helperValue !== undefined) updateData.helper_value = data.helperValue;

    // Update the question
    const { data: updated, error: updateError } = await supabase
      .from("master_questions")
      .update(updateData)
      .eq("id", question.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating question:", updateError);
      return NextResponse.json(
        { message: "Failed to update question" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Question updated successfully",
      question: {
        id: updated.id,
        questionId: updated.question_id,
        questionText: updated.question_text,
        answerType: updated.answer_type,
        answerOptions: updated.answer_options,
        isHidden: updated.is_hidden,
        isLocked: updated.is_locked,
        required: updated.required,
        hasHelper: updated.has_helper,
        helperType: updated.helper_type,
        helperName: updated.helper_name,
        helperValue: updated.helper_value,
      },
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
