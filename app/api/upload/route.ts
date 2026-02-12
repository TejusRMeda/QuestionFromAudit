import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import crypto from "crypto";
import {
  ParsedQuestion,
  MYPREOP_ITEM_TYPES,
  ITEM_TYPES_REQUIRING_OPTIONS,
  MyPreOpItemType,
} from "@/types/question";

interface UploadRequest {
  trustName: string;
  questions: ParsedQuestion[];
}

// Generate a cryptographically secure URL-safe random ID
function generateSecureLinkId(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const body: UploadRequest = await req.json();
    const { trustName, questions } = body;

    // Validate input
    if (!trustName?.trim()) {
      return NextResponse.json(
        { message: "Trust name is required" },
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

    // Generate secure link IDs
    const trustLinkId = generateSecureLinkId();
    const adminLinkId = generateSecureLinkId();

    const supabase = await createClient();

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        trust_name: trustName.trim(),
        trust_link_id: trustLinkId,
        admin_link_id: adminLinkId,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project creation error:", projectError);
      return NextResponse.json(
        { message: "Failed to create project" },
        { status: 500 }
      );
    }

    // Prepare questions for insertion
    const questionsToInsert = questions.map((q) => ({
      project_id: project.id,
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

    // Insert questions
    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Questions insertion error:", questionsError);
      // Rollback: delete the project if questions fail
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);
      if (deleteError) {
        console.error("Rollback failed:", deleteError);
      }
      return NextResponse.json(
        { message: "Failed to save questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      trustLinkId,
      adminLinkId,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
