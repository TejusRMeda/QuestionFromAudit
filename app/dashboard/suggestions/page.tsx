import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import LatestSuggestionsFeed, { SuggestionItem } from "@/components/dashboard/LatestSuggestionsFeed";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Suggestion = {
  id: number;
  status: string;
  submitter_name: string;
  created_at: string;
  suggestion_text: string;
};

type InstanceQuestion = {
  id: number;
  instance_suggestions: Suggestion[];
};

type TrustInstance = {
  id: number;
  trust_name: string;
  trust_link_id: string;
  instance_questions: InstanceQuestion[];
};

type MasterRaw = {
  id: number;
  name: string;
  admin_link_id: string;
  trust_instances: TrustInstance[];
};

export default async function SuggestionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mastersRaw } = await supabase
    .from("master_questionnaires")
    .select(
      `
      id, name, admin_link_id,
      trust_instances(
        id, trust_name, trust_link_id,
        instance_questions(
          id,
          instance_suggestions(
            id, status, submitter_name, created_at, suggestion_text
          )
        )
      )
    `
    )
    .eq("user_id", user!.id);

  const masters: MasterRaw[] = (mastersRaw as MasterRaw[]) || [];

  const allSuggestions: SuggestionItem[] = masters
    .flatMap((m) =>
      m.trust_instances.flatMap((t) =>
        t.instance_questions.flatMap((q) =>
          q.instance_suggestions.map((s) => ({
            ...s,
            masterName: m.name,
            adminLinkId: m.admin_link_id,
            trustName: t.trust_name,
          }))
        )
      )
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pendingCount = allSuggestions.filter((s) => s.status === "pending").length;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Suggestions</h1>
          <p className="text-sm text-slate-400 mt-0.5">All suggestions across your questionnaires</p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {pendingCount} pending
          </span>
        )}
      </div>

      {allSuggestions.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-200 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h3 className="text-base font-medium text-slate-500 mb-2">No suggestions yet</h3>
            <p className="text-sm text-slate-400">
              Suggestions will appear here once trusts start reviewing your questionnaires.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          {/* Status summary bar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-5 text-sm">
            <span className="font-medium text-slate-700">All ({allSuggestions.length})</span>
            <span className="text-amber-600">
              Pending ({allSuggestions.filter((s) => s.status === "pending").length})
            </span>
            <span className="text-green-600">
              Approved ({allSuggestions.filter((s) => s.status === "approved").length})
            </span>
            <span className="text-red-500">
              Rejected ({allSuggestions.filter((s) => s.status === "rejected").length})
            </span>
          </div>
          <LatestSuggestionsFeed suggestions={allSuggestions} />
        </Card>
      )}

      {allSuggestions.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-4">
          Showing {allSuggestions.length} suggestion{allSuggestions.length !== 1 ? "s" : ""}. Click{" "}
          <Link href="#" className="underline">View</Link> on any suggestion to review it.
        </p>
      )}
    </div>
  );
}
