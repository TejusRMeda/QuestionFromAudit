import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import TrustOverviewTable, { TrustRow } from "@/components/dashboard/TrustOverviewTable";
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
  created_at: string;
  instance_questions: InstanceQuestion[];
};

type MasterRaw = {
  id: number;
  name: string;
  admin_link_id: string;
  created_at: string;
  master_questions: { count: number }[];
  trust_instances: TrustInstance[];
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mastersRaw } = await supabase
    .from("master_questionnaires")
    .select(
      `
      id, name, admin_link_id, created_at,
      master_questions(count),
      trust_instances(
        id, trust_name, trust_link_id, created_at,
        instance_questions(
          id,
          instance_suggestions(
            id, status, submitter_name, created_at, suggestion_text
          )
        )
      )
    `
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const masters: MasterRaw[] = (mastersRaw as MasterRaw[]) || [];

  const allSuggestions: SuggestionItem[] = masters.flatMap((m) =>
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
  );

  const mastersCount = masters.length;
  const trustsCount = masters.reduce((sum, m) => sum + m.trust_instances.length, 0);
  const pendingCount = allSuggestions.filter((s) => s.status === "pending").length;
  const approvedCount = allSuggestions.filter((s) => s.status === "approved").length;

  const trustRows: TrustRow[] = masters
    .flatMap((m) =>
      m.trust_instances.map((t) => {
        const suggestions = t.instance_questions.flatMap((q) => q.instance_suggestions);
        return {
          trustId: t.id,
          trustName: t.trust_name,
          trustLinkId: t.trust_link_id,
          masterName: m.name,
          adminLinkId: m.admin_link_id,
          pendingCount: suggestions.filter((s) => s.status === "pending").length,
          totalSuggestions: suggestions.length,
          createdAt: t.created_at,
        };
      })
    )
    .sort((a, b) => b.pendingCount - a.pendingCount);

  const latestSuggestions: SuggestionItem[] = allSuggestions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  // Empty state
  if (mastersCount === 0) {
    return (
      <div className="p-8 bg-[#F8FAFC] min-h-full">
        <div className="max-w-xl mx-auto mt-16">
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-sm text-slate-400 mb-10">{getFormattedDate()}</p>
          <Link
            href="/dashboard/upload"
            className="block bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-[#4A90A4] p-6 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#4A90A4]/10 rounded-lg p-3 group-hover:bg-[#4A90A4]/15 transition-colors">
                <svg className="w-7 h-7 text-[#4A90A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Upload your first CSV</h2>
                <p className="text-sm text-slate-400 mt-0.5">Create a new questionnaire template</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{getFormattedDate()}</p>
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

      {/* Metric chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Questionnaires"
          value={mastersCount}
          href="/dashboard/questionnaires"
          dotColor="bg-[#4A90A4]"
        />
        <StatCard
          label="Trusts"
          value={trustsCount}
          href="/dashboard/trusts"
          dotColor="bg-slate-400"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          href="/dashboard/suggestions"
          dotColor="bg-amber-400"
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          dotColor="bg-green-400"
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trust Overview */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Trust Overview
            </h2>
            <Link href="/dashboard/trusts" className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
              View all
            </Link>
          </div>
          <TrustOverviewTable rows={trustRows.slice(0, 5)} />
        </Card>

        {/* Latest Suggestions */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Latest Suggestions
            </h2>
            <Link href="/dashboard/suggestions" className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
              View all
            </Link>
          </div>
          <LatestSuggestionsFeed suggestions={latestSuggestions} />
        </Card>
      </div>
    </div>
  );
}
