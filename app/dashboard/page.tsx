import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

interface MasterQuestionnaire {
  id: number;
  name: string;
  admin_link_id: string;
  created_at: string;
  question_count: number;
}

// This is a private page: It's protected by the layout.tsx component which ensures the user is authenticated.
export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's master questionnaires with question counts
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

  // Transform the data to include question_count
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
    <main className="min-h-screen bg-base-200 p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-base-content/60 mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
          <ButtonAccount />
        </div>

        {/* Upload CTA Card */}
        <Link
          href="/dashboard/upload"
          className="block bg-base-100 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-dashed border-base-300 hover:border-primary"
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Upload new master CSV</h2>
              <p className="text-base-content/60 text-sm">
                Create a new questionnaire template from a CSV file
              </p>
            </div>
          </div>
        </Link>

        {/* Masters List */}
        <div className="bg-base-100 rounded-xl shadow-lg">
          <div className="p-6 border-b border-base-200">
            <h2 className="text-xl font-semibold">Your Questionnaires</h2>
          </div>

          {questionnaires.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-base-content/20 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-base-content/60 mb-2">
                No questionnaires yet
              </h3>
              <p className="text-base-content/40 mb-4">
                Upload your first master CSV to get started
              </p>
              <Link href="/dashboard/upload" className="btn btn-primary">
                Upload CSV
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Questions</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {questionnaires.map((q) => (
                    <tr key={q.id} className="hover">
                      <td className="font-medium">{q.name}</td>
                      <td>{q.question_count}</td>
                      <td className="text-base-content/60">
                        {new Date(q.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          href={`/masters/${q.admin_link_id}`}
                          className="btn btn-sm btn-ghost"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
