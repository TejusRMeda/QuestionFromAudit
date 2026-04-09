import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import ReviewPageClient from "./ReviewPageClient";

interface PageProps {
  params: Promise<{ linkId: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { linkId } = await params;

  if (!linkId) {
    notFound();
  }

  const supabase = createServiceClient();

  // Find project by trust_link_id
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, trust_name, created_at")
    .eq("trust_link_id", linkId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Get all questions with suggestion counts
  const { data: questions } = await supabase
    .from("questions")
    .select(`
      id, question_id, category, question_text, answer_type, answer_options,
      characteristic, section, page, enable_when, has_helper, helper_type,
      helper_name, helper_value,
      suggestions (count)
    `)
    .eq("project_id", project.id)
    .order("id", { ascending: true });

  const formattedQuestions = (questions || []).map((q) => ({
    id: q.id,
    questionId: q.question_id,
    category: q.category,
    questionText: q.question_text,
    answerType: q.answer_type,
    answerOptions: q.answer_options,
    characteristic: q.characteristic,
    section: q.section,
    page: q.page,
    enableWhen: q.enable_when,
    hasHelper: q.has_helper,
    helperType: q.helper_type,
    helperName: q.helper_name,
    helperValue: q.helper_value,
    suggestionCount: q.suggestions?.[0]?.count || 0,
  }));

  const initialData = {
    trustName: project.trust_name,
    createdAt: project.created_at,
    questions: formattedQuestions,
  };

  return <ReviewPageClient linkId={linkId} initialData={initialData} />;
}
