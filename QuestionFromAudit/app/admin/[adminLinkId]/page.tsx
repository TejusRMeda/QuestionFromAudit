import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import AdminPageClient from "./AdminPageClient";

interface PageProps {
  params: Promise<{ adminLinkId: string }>;
}

export default async function AdminPage({ params }: PageProps) {
  const { adminLinkId } = await params;

  if (!adminLinkId) {
    notFound();
  }

  const authClient = await createClient();
  const supabase = createServiceClient();

  // Require authentication
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    notFound();
  }

  // Find project by admin_link_id
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, trust_name, created_at")
    .eq("admin_link_id", adminLinkId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Get questions and suggestions in parallel
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_id, category, question_text")
    .eq("project_id", project.id);

  const questionIds = (questions || []).map((q) => q.id);

  const { data: suggestions } = await supabase
    .from("suggestions")
    .select(`
      id, question_id, submitter_name, submitter_email, suggestion_text,
      reason, status, internal_comment, response_message, created_at,
      updated_at, component_changes
    `)
    .in("question_id", questionIds)
    .order("created_at", { ascending: false });

  // Create a map of question details
  const questionMap = new Map(
    (questions || []).map((q) => [
      q.id,
      { questionId: q.question_id, category: q.category, questionText: q.question_text },
    ])
  );

  // Transform suggestions with question details
  const suggestionsWithDetails = (suggestions || []).map((s: any) => {
    const questionDetails = questionMap.get(s.question_id);
    return {
      id: s.id,
      questionId: questionDetails?.questionId || "",
      category: questionDetails?.category || "",
      questionText: questionDetails?.questionText || "",
      submitterName: s.submitter_name,
      submitterEmail: s.submitter_email,
      suggestionText: s.suggestion_text,
      reason: s.reason,
      status: s.status,
      internalComment: s.internal_comment,
      responseMessage: s.response_message,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      componentChanges: s.component_changes || null,
    };
  });

  const initialData = {
    trustName: project.trust_name,
    createdAt: project.created_at,
    suggestions: suggestionsWithDetails,
  };

  return <AdminPageClient adminLinkId={adminLinkId} initialData={initialData} />;
}
