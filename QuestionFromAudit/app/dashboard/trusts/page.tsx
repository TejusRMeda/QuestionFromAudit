import { createClient } from "@/libs/supabase/server";
import TrustsPageClient from "@/components/dashboard/TrustsPageClient";

export const dynamic = "force-dynamic";

type TrustInstance = {
  id: number;
  trust_name: string;
  trust_link_id: string;
  created_at: string;
};

type MasterWithTrusts = {
  id: number;
  name: string;
  admin_link_id: string;
  trust_instances: TrustInstance[];
};

export default async function TrustsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mastersRaw }, { data: mastersForModal }] = await Promise.all([
    supabase
      .from("master_questionnaires")
      .select(
        `
        id, name, admin_link_id,
        trust_instances(
          id, trust_name, trust_link_id, created_at
        )
      `
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("master_questionnaires")
      .select("id, name, admin_link_id")
      .eq("user_id", user!.id)
      .order("name"),
  ]);

  const masters: MasterWithTrusts[] = (mastersRaw as MasterWithTrusts[]) || [];

  return (
    <TrustsPageClient
      masters={masters}
      questionnaires={mastersForModal || []}
    />
  );
}
