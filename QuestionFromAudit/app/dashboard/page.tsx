import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import TrustOverviewTable, { TrustRow } from "@/components/dashboard/TrustOverviewTable";
import LatestSuggestionsFeed, { SuggestionItem } from "@/components/dashboard/LatestSuggestionsFeed";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const MASTERS_PER_PAGE = 10;

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

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Dashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (currentPage - 1) * MASTERS_PER_PAGE;

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Run lighter queries in parallel instead of one deeply nested join
  const [mastersResult, trustsWithCountsResult, latestSuggestionsResult, totalMastersResult] =
    await Promise.all([
      // 1. Masters with question counts and trust instances (no deep suggestion nesting)
      serviceClient
        .from("master_questionnaires")
        .select(
          `
          id, name, admin_link_id, created_at,
          master_questions(count),
          trust_instances(id, trust_name, trust_link_id, created_at)
        `
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + MASTERS_PER_PAGE - 1),

      // 2. Suggestion counts per trust instance (lightweight aggregate)
      serviceClient
        .from("trust_instances")
        .select(
          `
          id,
          instance_suggestions:instance_questions(
            instance_suggestions(count)
          )
        `
        )
        .in(
          "master_questionnaire_id",
          // Sub-select: all master IDs for this user
          (
            await serviceClient
              .from("master_questionnaires")
              .select("id")
              .eq("user_id", user!.id)
          ).data?.map((m) => m.id) || []
        ),

      // 3. Latest 10 suggestions directly (no deep nesting needed)
      serviceClient
        .from("instance_suggestions")
        .select(
          `
          id, status, submitter_name, created_at, suggestion_text,
          instance_questions!inner(
            instance_id,
            trust_instances!inner(
              trust_name,
              master_questionnaires!inner(name, admin_link_id, user_id)
            )
          )
        `
        )
        .eq("instance_questions.trust_instances.master_questionnaires.user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10),

      // 4. Total masters count for pagination
      serviceClient
        .from("master_questionnaires")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id),
    ]);

  type MasterRow = {
    id: number;
    name: string;
    admin_link_id: string;
    created_at: string;
    master_questions: { count: number }[];
    trust_instances: { id: number; trust_name: string; trust_link_id: string; created_at: string }[];
  };

  const masters: MasterRow[] = (mastersResult.data as MasterRow[]) || [];
  const totalMasters = totalMastersResult.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalMasters / MASTERS_PER_PAGE));

  // Build suggestion count map per trust instance
  type TrustCountRow = {
    id: number;
    instance_suggestions: { instance_suggestions: { count: number }[] }[];
  };
  const trustCounts = new Map<number, { total: number; pending: number }>();
  for (const t of (trustsWithCountsResult.data as TrustCountRow[]) || []) {
    const total = t.instance_suggestions?.reduce(
      (sum, iq) => sum + (iq.instance_suggestions?.[0]?.count || 0),
      0
    ) || 0;
    trustCounts.set(t.id, { total, pending: 0 }); // pending requires status filter, handled below
  }

  // For stat counts, derive from trust-level data
  const mastersCount = totalMasters;
  const trustsCount = masters.reduce((sum, m) => sum + m.trust_instances.length, 0);

  // Build trust rows
  const trustRows: TrustRow[] = masters
    .flatMap((m) =>
      m.trust_instances.map((t) => {
        const counts = trustCounts.get(t.id) || { total: 0, pending: 0 };
        return {
          trustId: t.id,
          trustName: t.trust_name,
          trustLinkId: t.trust_link_id,
          masterName: m.name,
          adminLinkId: m.admin_link_id,
          pendingCount: counts.pending,
          totalSuggestions: counts.total,
          createdAt: t.created_at,
        };
      })
    )
    .sort((a, b) => b.totalSuggestions - a.totalSuggestions);

  // Format latest suggestions
  const latestSuggestions: SuggestionItem[] = (
    (latestSuggestionsResult.data as any[]) || []
  ).map((s) => {
    // Supabase returns joined relations — singular FK comes as object, plural as array
    const iq = Array.isArray(s.instance_questions) ? s.instance_questions[0] : s.instance_questions;
    const ti = iq ? (Array.isArray(iq.trust_instances) ? iq.trust_instances[0] : iq.trust_instances) : null;
    const mq = ti ? (Array.isArray(ti.master_questionnaires) ? ti.master_questionnaires[0] : ti.master_questionnaires) : null;
    return {
      id: s.id,
      status: s.status,
      submitter_name: s.submitter_name,
      created_at: s.created_at,
      suggestion_text: s.suggestion_text,
      masterName: mq?.name || "",
      adminLinkId: mq?.admin_link_id || "",
      trustName: ti?.trust_name || "",
    };
  });

  // Pending/approved counts from the latest suggestions feed
  const pendingCount = latestSuggestions.filter((s) => s.status === "pending").length;
  const approvedCount = latestSuggestions.filter((s) => s.status === "approved").length;

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  // Empty state
  if (mastersCount === 0) {
    return (
      <div className="p-8 bg-[#F8FAFC] min-h-full">
        <div className="max-w-xl mx-auto mt-16">
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-sm text-slate-500 mb-10">{getFormattedDate()}</p>
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
                <p className="text-sm text-slate-500 mt-0.5">Create a new questionnaire template</p>
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
          <p className="text-sm text-slate-500 mt-0.5">{getFormattedDate()}</p>
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
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
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
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Latest Suggestions
            </h2>
            <Link href="/dashboard/suggestions" className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
              View all
            </Link>
          </div>
          <LatestSuggestionsFeed suggestions={latestSuggestions} />
        </Card>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/dashboard?page=${currentPage - 1}`}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/dashboard?page=${currentPage + 1}`}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
