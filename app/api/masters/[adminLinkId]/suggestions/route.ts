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

    // Get all instance IDs
    const instanceIds = instances.map((i) => i.id);

    // Fetch all instance questions for these instances
    const { data: questions, error: questionsError } = await supabase
      .from("instance_questions")
      .select("id, instance_id")
      .in("instance_id", instanceIds);

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    // Create a map of question ID to instance ID
    const questionToInstance = new Map<number, number>();
    questions?.forEach((q) => {
      questionToInstance.set(q.id, q.instance_id);
    });

    // Fetch all suggestions for these questions
    const questionIds = questions?.map((q) => q.id) || [];

    let suggestions: { instance_question_id: number; status: string }[] = [];
    if (questionIds.length > 0) {
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from("instance_suggestions")
        .select("instance_question_id, status")
        .in("instance_question_id", questionIds);

      if (suggestionsError) {
        console.error("Error fetching suggestions:", suggestionsError);
        return NextResponse.json(
          { message: "Failed to fetch suggestions" },
          { status: 500 }
        );
      }
      suggestions = suggestionsData || [];
    }

    // Aggregate suggestion counts by instance
    const instanceCounts = new Map<number, SuggestionCount>();

    // Initialize counts for all instances
    instanceIds.forEach((id) => {
      instanceCounts.set(id, { total: 0, pending: 0, approved: 0, rejected: 0 });
    });

    // Count suggestions per instance
    suggestions.forEach((s) => {
      const instanceId = questionToInstance.get(s.instance_question_id);
      if (instanceId) {
        const counts = instanceCounts.get(instanceId)!;
        counts.total++;
        if (s.status === "pending") counts.pending++;
        else if (s.status === "approved") counts.approved++;
        else if (s.status === "rejected") counts.rejected++;
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
