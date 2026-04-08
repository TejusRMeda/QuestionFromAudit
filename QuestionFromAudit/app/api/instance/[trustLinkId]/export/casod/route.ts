import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import Papa from "papaparse";
import { CASOD_COLUMNS } from "@/types/casodExport";
import {
  consolidateSuggestionsToRows,
  type ExportQuestion,
  type ExportSuggestion,
} from "@/lib/casod-export";
import type { QuestionForMapping } from "@/lib/enableWhen";

interface Params {
  params: Promise<{ trustLinkId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { trustLinkId } = await params;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";

    const supabase = await createClient();

    // Get the instance
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .select("id, trust_name")
      .eq("trust_link_id", trustLinkId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { message: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Fetch all instance questions with full details
    const { data: questions, error: questionsError } = await supabase
      .from("instance_questions")
      .select(
        "id, question_id, category, question_text, answer_type, answer_options, section, page, characteristic, required, enable_when, has_helper, helper_type, helper_name, helper_value"
      )
      .eq("instance_id", instance.id);

    if (questionsError || !questions) {
      return NextResponse.json(
        { message: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Fetch all suggestions joined to these questions (exclude drafts)
    let suggestionsQuery = supabase
      .from("instance_suggestions")
      .select(
        "id, instance_question_id, submitter_name, submitter_email, suggestion_text, reason, status, internal_comment, response_message, component_changes"
      )
      .in(
        "instance_question_id",
        questions.map((q) => q.id)
      )
      .neq("status", "draft");

    if (statusFilter !== "all") {
      suggestionsQuery = suggestionsQuery.eq("status", statusFilter);
    }

    const { data: suggestions, error: suggestionsError } =
      await suggestionsQuery;

    if (suggestionsError) {
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Group suggestions by question ID
    const suggestionsMap = new Map<number, ExportSuggestion[]>();
    for (const s of suggestions || []) {
      const qId = s.instance_question_id;
      if (!suggestionsMap.has(qId)) {
        suggestionsMap.set(qId, []);
      }
      suggestionsMap.get(qId)!.push(s as ExportSuggestion);
    }

    // Build characteristic map for EnableWhen translation
    const allQuestions: QuestionForMapping[] = questions.map((q) => ({
      questionId: q.question_id,
      questionText: q.question_text,
      answerOptions: q.answer_options,
      characteristic: q.characteristic,
    }));

    // Consolidate into CASOD rows
    const rows = consolidateSuggestionsToRows(
      questions as ExportQuestion[],
      suggestionsMap,
      allQuestions
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No suggestions to export" },
        { status: 404 }
      );
    }

    // Generate CSV
    const csv = Papa.unparse(rows, {
      columns: CASOD_COLUMNS as string[],
    });

    // Sanitize trust name for filename
    const safeName = instance.trust_name
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const filename = `${safeName}-casod-export.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CASOD export error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
