import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

interface Params {
  params: Promise<{ adminLinkId: string }>;
}

interface SuggestionCount {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface TrustWithSuggestions {
  id: number;
  trustName: string;
  trustLinkId: string;
  createdAt: string;
  suggestionCounts: SuggestionCount;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { adminLinkId } = await params;

    if (!adminLinkId) {
      return NextResponse.json(
        { message: "Admin link ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .select("id, name")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (masterError || !master) {
      return NextResponse.json(
        { message: "Master questionnaire not found" },
        { status: 404 }
      );
    }

    // Fetch all trust instances for this master
    const { data: instances, error: instancesError } = await supabase
      .from("trust_instances")
      .select("id, trust_name, trust_link_id, created_at")
      .eq("master_id", master.id)
      .order("created_at", { ascending: false });

    if (instancesError) {
      console.error("Error fetching instances:", instancesError);
      return NextResponse.json(
        { message: "Failed to fetch instances" },
        { status: 500 }
      );
    }

    if (!instances || instances.length === 0) {
      return NextResponse.json({
        masterName: master.name,
        trusts: [],
      });
    }

    // Single joined query: instances -> questions -> suggestions
    // Replaces 3 separate waterfall queries with 1 query using Supabase joins
    const instanceIds = instances.map((i) => i.id);

    const { data: questionsWithSuggestions, error: joinError } = await supabase
      .from("instance_questions")
      .select(`
        instance_id,
        instance_suggestions (status)
      `)
      .in("instance_id", instanceIds);

    if (joinError) {
      console.error("Error fetching suggestions:", joinError);
      return NextResponse.json(
        { message: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    // Aggregate suggestion counts by instance
    const instanceCounts = new Map<number, SuggestionCount>();

    // Initialize counts for all instances
    instanceIds.forEach((id) => {
      instanceCounts.set(id, { total: 0, pending: 0, approved: 0, rejected: 0 });
    });

    // Count suggestions per instance from joined data (exclude drafts)
    (questionsWithSuggestions || []).forEach((q: any) => {
      const counts = instanceCounts.get(q.instance_id);
      if (counts && q.instance_suggestions) {
        for (const s of q.instance_suggestions) {
          if (s.status === "draft") continue; // Drafts are not visible to admins
          counts.total++;
          if (s.status === "pending") counts.pending++;
          else if (s.status === "approved") counts.approved++;
          else if (s.status === "rejected") counts.rejected++;
        }
      }
    });

    // Build response with trusts and their suggestion counts
    const trustsWithSuggestions: TrustWithSuggestions[] = instances.map((instance) => ({
      id: instance.id,
      trustName: instance.trust_name,
      trustLinkId: instance.trust_link_id,
      createdAt: instance.created_at,
      suggestionCounts: instanceCounts.get(instance.id) || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    }));

    return NextResponse.json({
      masterName: master.name,
      trusts: trustsWithSuggestions,
    });
  } catch (error) {
    console.error("Error fetching master suggestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
