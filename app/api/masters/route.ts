import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import crypto from "crypto";
import {
  ParsedQuestion,
  MYPREOP_ITEM_TYPES,
  ITEM_TYPES_REQUIRING_OPTIONS,
  MyPreOpItemType,
} from "@/types/question";

interface CreateMasterRequest {
  name: string;
  questions: ParsedQuestion[];
}

// Generate a cryptographically secure URL-safe random ID
function generateSecureLinkId(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateMasterRequest = await req.json();
    const { name, questions } = body;

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Questionnaire name is required" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: "Questions array is required" },
        { status: 400 }
      );
    }

    if (questions.length > 500) {
      return NextResponse.json(
        { message: "Maximum 500 questions allowed" },
        { status: 400 }
      );
    }

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
        if (!q.options || q.options.length < 2) {
          return NextResponse.json(
            {
              message: `Question ${rowNum}: ${itemType} type requires at least 2 options`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate secure admin link ID
    const adminLinkId = generateSecureLinkId();

    const supabase = await createClient();

    // Require authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
