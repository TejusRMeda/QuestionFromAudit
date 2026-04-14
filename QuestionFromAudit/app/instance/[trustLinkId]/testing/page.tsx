import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import InstancePageClient from "../InstancePageClient";
import { parseTestingConfig } from "@/lib/testingConfig";

interface PageProps {
  params: Promise<{ trustLinkId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Usability-testing view of the trust reviewer screen.
 *
 * Same data as `/instance/[trustLinkId]` but a TestingConfig is parsed from
 * the URL search params and passed to the client. Controls listed in the
 * config are hidden; suggestions/comments submitted through this view are
 * tagged is_test_session=true so they don't pollute the real review queue.
 *
 * The data fetch is identical to the normal route so the testing view shows
 * the same questions/sections/state as production.
 */
export default async function InstanceTestingPage({ params, searchParams }: PageProps) {
  const { trustLinkId } = await params;
  const sp = await searchParams;

  if (!trustLinkId) {
    notFound();
  }

  const testingConfig = parseTestingConfig(sp);

  const supabase = createServiceClient();

  const { data: instance, error: instanceError } = await supabase
    .from("trust_instances")
    .select("id, trust_name, created_at, submission_status, master_questionnaires(name)")
    .eq("trust_link_id", trustLinkId)
    .single();

  if (instanceError || !instance) {
    notFound();
  }

  const [questionsResult, sectionReviewsResult] = await Promise.all([
    supabase
      .from("instance_questions")
      .select(`
        id, question_id, category, question_text, answer_type, answer_options,
        characteristic, section, page, required, enable_when, has_helper, helper_type,
        helper_name, helper_value,
        instance_suggestions (count)
      `)
      .eq("instance_id", instance.id)
      .order("id", { ascending: true }),
    supabase
      .from("instance_section_reviews")
      .select("section_name, reviewer_name, has_suggestions")
      .eq("instance_id", instance.id),
  ]);

  const questions = questionsResult.data || [];
  const sectionReviews = sectionReviewsResult.data || [];

  const questionIds = questions.map((q) => q.id);

  const [quickActionsResult, newQuestionsResult] = await Promise.all([
    supabase
      .from("instance_suggestions")
      .select("instance_question_id, suggestion_text")
      .in("suggestion_text", [
        "Make this question required",
        "Remove this question from the questionnaire",
      ])
      .in("instance_question_id", questionIds),
    questionIds.length > 0
      ? supabase
          .from("instance_suggestions")
          .select("id, instance_question_id, submitter_name, component_changes")
          .not("component_changes->newQuestion", "is", null)
          .in("instance_question_id", questionIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const quickActionSuggestions = quickActionsResult.data || [];
  const newQuestionRows = newQuestionsResult.data || [];

  const quickActionMap: Record<number, "required" | "delete"> = {};
  for (const s of quickActionSuggestions) {
    if (s.suggestion_text === "Make this question required") {
      quickActionMap[s.instance_question_id] = "required";
    } else if (s.suggestion_text === "Remove this question from the questionnaire") {
      quickActionMap[s.instance_question_id] = "delete";
    }
  }

  const formattedQuestions = questions.map((q) => ({
    id: q.id,
    questionId: q.question_id,
    category: q.category,
    questionText: q.question_text,
    answerType: q.answer_type,
    answerOptions: q.answer_options,
    characteristic: q.characteristic,
    section: q.section,
    page: q.page,
    required: q.required,
    enableWhen: q.enable_when,
    hasHelper: q.has_helper,
    helperType: q.helper_type,
    helperName: q.helper_name,
    helperValue: q.helper_value,
    suggestionCount: q.instance_suggestions?.[0]?.count || 0,
    quickAction: quickActionMap[q.id] || null,
  }));

  const newQuestionSuggestions = newQuestionRows.map((s: any) => ({
    id: s.id,
    anchorQuestionId: s.instance_question_id,
    position: s.component_changes?.newQuestion?.position || "after",
    questionText: s.component_changes?.newQuestion?.questionText || "",
    submitterName: s.submitter_name,
  }));

  const initialData = {
    trustName: instance.trust_name,
    questionnaireName: (instance.master_questionnaires as any)?.name || null,
    createdAt: instance.created_at,
    submissionStatus: (instance.submission_status || "in_progress") as "in_progress" | "submitted",
    sectionReviews: sectionReviews.map((r) => r.section_name),
    questions: formattedQuestions,
    newQuestionSuggestions,
  };

  // Testing links exist to usability-test the trust-reviewer experience, so
  // they always render in user mode regardless of who's signed in.
  return (
    <InstancePageClient
      trustLinkId={trustLinkId}
      initialData={initialData}
      testingConfig={testingConfig}
      isAdminMode={false}
    />
  );
}
