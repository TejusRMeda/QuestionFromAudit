import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import DashboardQuestionnaires from "@/components/DashboardQuestionnaires";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface MasterQuestionnaire {
  id: number;
  name: string;
  admin_link_id: string;
  created_at: string;
  question_count: number;
}

export default async function QuestionnairesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: masters } = await supabase
    .from("master_questionnaires")
    .select(
      `
      id,
      name,
      admin_link_id,
      created_at,
      master_questions(count)
    `
    )
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  const questionnaires: MasterQuestionnaire[] = (masters || []).map(
    (m: {
      id: number;
      name: string;
      admin_link_id: string;
      created_at: string;
      master_questions: { count: number }[];
    }) => ({
      id: m.id,
      name: m.name,
      admin_link_id: m.admin_link_id,
      created_at: m.created_at,
      question_count: m.master_questions?.[0]?.count || 0,
    })
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Questionnaires</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your master questionnaire templates</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 bg-[#4A90A4] hover:bg-[#3d7a8c] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload CSV
        </Link>
      </div>

      <Card>
        <DashboardQuestionnaires questionnaires={questionnaires} />
      </Card>
    </div>
  );
}
