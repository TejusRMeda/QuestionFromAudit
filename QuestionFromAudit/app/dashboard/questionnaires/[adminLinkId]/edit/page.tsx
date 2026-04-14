import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditWorkspaceClient from "./EditWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function EditWorkspacePage({
  params,
}: {
  params: Promise<{ adminLinkId: string }>;
}) {
  const { adminLinkId } = await params;
  const authClient = await createClient();
  const supabase = createServiceClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const { data: master } = await supabase
    .from("master_questionnaires")
    .select("id, name, status, admin_link_id, user_id")
    .eq("admin_link_id", adminLinkId)
    .single();

  if (!master || master.user_id !== user.id)
    redirect("/dashboard/questionnaires");

  const { data: questions } = await supabase
    .from("master_questions")
    .select(
      "id, question_id, category, question_text, answer_type, answer_options, characteristic, section, page, enable_when, required, has_helper, helper_type, helper_name, helper_value, is_hidden, is_locked"
    )
    .eq("master_id", master.id)
    .order("id", { ascending: true });

  return (
    <EditWorkspaceClient
      master={{
        id: master.id,
        name: master.name,
        status: master.status,
        admin_link_id: master.admin_link_id,
      }}
      questions={questions || []}
    />
  );
}
