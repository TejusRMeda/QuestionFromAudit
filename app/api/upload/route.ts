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

interface UploadRequest {
  trustName: string;
  questions: Question[];
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
      question_id: q.Question_ID.trim(),
      category: q.Category.trim(),
      question_text: q.Question_Text.trim(),
      answer_type: q.Answer_Type.trim().toLowerCase(),
      answer_options: q.Answer_Options?.trim() || null,
    }));

    // Insert questions
    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Questions insertion error:", questionsError);
      // Rollback: delete the project if questions fail
      await supabase.from("projects").delete().eq("id", project.id);
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
