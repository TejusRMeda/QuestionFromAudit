import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import crypto from "crypto";

interface Question {
  Question_ID: string;
  Category: string;
  Question_Text: string;
  Answer_Type: string;
  Answer_Options: string;
}

const VALID_ANSWER_TYPES = ["text", "radio", "multi_select"];

interface CreateMasterRequest {
  name: string;
  questions: Question[];
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

      // Validate Answer_Type
      const answerType = q.Answer_Type?.trim().toLowerCase();
      if (!answerType || !VALID_ANSWER_TYPES.includes(answerType)) {
        return NextResponse.json(
          { message: `Question ${rowNum}: Answer_Type must be text, radio, or multi_select` },
          { status: 400 }
        );
      }

      // Validate Answer_Options based on type
      const answerOptions = q.Answer_Options?.trim() || "";
      if (answerType === "text") {
        if (answerOptions) {
          return NextResponse.json(
            { message: `Question ${rowNum}: Answer_Options must be empty for text type` },
            { status: 400 }
          );
        }
      } else {
        const options = answerOptions.split("|").filter(Boolean);
        if (options.length < 2) {
          return NextResponse.json(
            { message: `Question ${rowNum}: ${answerType} type requires at least 2 options` },
            { status: 400 }
          );
        }
      }
    }

    // Generate secure admin link ID
    const adminLinkId = generateSecureLinkId();

    const supabase = await createClient();

    // Create master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .insert({
        name: name.trim(),
        admin_link_id: adminLinkId,
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
      question_id: q.Question_ID.trim(),
      category: q.Category.trim(),
      question_text: q.Question_Text.trim(),
      answer_type: q.Answer_Type.trim().toLowerCase(),
      answer_options: q.Answer_Options?.trim() || null,
    }));

    // Insert master questions
    const { error: questionsError } = await supabase
      .from("master_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Questions insertion error:", questionsError);
      // Rollback: delete the master if questions fail
      await supabase.from("master_questionnaires").delete().eq("id", master.id);
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
