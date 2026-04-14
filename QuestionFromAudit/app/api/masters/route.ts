import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  ParsedQuestion,
  MYPREOP_ITEM_TYPES,
  ITEM_TYPES_REQUIRING_OPTIONS,
  MyPreOpItemType,
} from "@/types/question";
import { CreateMasterSchema } from "@/lib/validations/master";
import { applyRateLimit } from "@/lib/rateLimit";
import { generateSecureLinkId } from "@/lib/linkId";

interface CreateMasterRequest {
  name: string;
  questions: ParsedQuestion[];
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = applyRateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, prefix: "masters-create" });
    if (rateLimited) return rateLimited;

    const body: CreateMasterRequest = await req.json();

    const parsed = CreateMasterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name } = parsed.data;
    const questions = parsed.data.questions as unknown as ParsedQuestion[];

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowNum = i + 1;

      // Validate ItemType
      const itemType = q.itemType?.toLowerCase() as MyPreOpItemType;
      if (!itemType || !MYPREOP_ITEM_TYPES.includes(itemType)) {
        return NextResponse.json(
          {
            message: `Question ${rowNum}: ItemType must be one of: ${MYPREOP_ITEM_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Validate options based on type
      if (ITEM_TYPES_REQUIRING_OPTIONS.includes(itemType)) {
        const minOptions = itemType === "radio" ? 1 : 2;
        if (!q.options || q.options.length < minOptions) {
          return NextResponse.json(
            {
              message: `Question ${rowNum}: ${itemType} type requires at least ${minOptions} option${minOptions > 1 ? "s" : ""}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate secure admin link ID
    const adminLinkId = generateSecureLinkId();

    const authClient = await createClient();
    const supabase = createServiceClient();

    // Require authenticated user
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Create master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .insert({
        name: name.trim(),
        admin_link_id: adminLinkId,
        user_id: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (masterError) {
      console.error("Master creation error:", masterError);
      return NextResponse.json(
        { message: "Failed to create master questionnaire" },
        { status: 500 }
      );
    }

    // Prepare questions for insertion
    const questionsToInsert = questions.map((q) => ({
      master_id: master.id,
      question_id: q.id.trim(),
      category: q.section.trim(), // Use section as primary category
      question_text: q.questionText.trim(),
      answer_type: q.itemType.toLowerCase(),
      // Convert options array to pipe-separated string for backward compatibility
      answer_options:
        q.options.length > 0
          ? q.options.map((opt) => opt.value).join("|")
          : null,
      // New MyPreOp fields
      section: q.section?.trim() || null,
      page: q.page?.trim() || null,
      // Store characteristics as pipe-separated string (preserve alignment with options)
      // For questions without options, use the question-level characteristic
      characteristic:
        q.options.length > 0
          ? q.options.map((opt) => opt.characteristic || "").join("|")
          : q.characteristic,
      required: q.required || false,
      enable_when: q.enableWhen || null,
      has_helper: q.hasHelper || false,
      helper_type: q.helperType || null,
      helper_name: q.helperName || null,
      helper_value: q.helperValue || null,
    }));

    // Insert master questions
    const { error: questionsError } = await supabase
      .from("master_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Questions insertion error:", questionsError);
      // Rollback: delete the master if questions fail
      const { error: deleteError } = await supabase
        .from("master_questionnaires")
        .delete()
        .eq("id", master.id);
      if (deleteError) {
        console.error("Rollback failed:", deleteError);
      }
      return NextResponse.json(
        { message: "Failed to save questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      adminLinkId,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error("Master upload error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
