import { createClient, createServiceClient } from "@/lib/supabase/server";
import SuggestionsPageClient, { TrustSuggestionGroup } from "@/components/dashboard/SuggestionsPageClient";

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
  const serviceClient = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mastersRaw } = await serviceClient
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

  // Group suggestions by trust name
  const trustGroupMap = new Map<string, TrustSuggestionGroup>();

  for (const m of masters) {
    for (const t of m.trust_instances) {
      const suggestions = t.instance_questions.flatMap((q) =>
        q.instance_suggestions.map((s) => ({
          ...s,
          masterName: m.name,
          adminLinkId: m.admin_link_id,
          trustName: t.trust_name,
          trustLinkId: t.trust_link_id,
        }))
      );

      if (suggestions.length === 0) continue;

      const existing = trustGroupMap.get(t.trust_name);
      if (existing) {
        existing.suggestions.push(...suggestions);
      } else {
        trustGroupMap.set(t.trust_name, {
          trustName: t.trust_name,
          trustLinkId: t.trust_link_id,
          suggestions,
        });
      }
    }
  }

  const trustGroups = Array.from(trustGroupMap.values());

  // Sort groups alphabetically, sort suggestions within each group by date desc
  trustGroups.sort((a, b) => a.trustName.localeCompare(b.trustName));
  for (const group of trustGroups) {
    group.suggestions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return <SuggestionsPageClient trustGroups={trustGroups} />;
}
