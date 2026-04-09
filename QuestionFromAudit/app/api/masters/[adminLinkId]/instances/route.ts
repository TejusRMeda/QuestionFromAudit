import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CreateInstanceSchema } from "@/lib/validations/instance";
import { generateSecureLinkId } from "@/lib/linkId";

interface Params {
  params: Promise<{ adminLinkId: string }>;
}

interface CreateInstanceRequest {
  trustName: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminLinkId } = await params;
    const body: CreateInstanceRequest = await req.json();

    if (!adminLinkId) {
      return NextResponse.json(
        { message: "Admin link ID is required" },
        { status: 400 }
      );
    }

    const parsed = CreateInstanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { trustName } = parsed.data;

    const authClient = await createClient();
    const supabase = createServiceClient();

    // Require authentication
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch master questionnaire
    const { data: master, error: masterError } = await supabase
      .from("master_questionnaires")
      .select("id, user_id")
      .eq("admin_link_id", adminLinkId)
      .single();

    if (masterError || !master) {
      return NextResponse.json(
        { message: "Master questionnaire not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (master.user_id !== user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch master questions
    const { data: masterQuestions, error: questionsError } = await supabase
      .from("master_questions")
      .select("question_id, category, question_text, answer_type, answer_options, characteristic, section, page, enable_when, has_helper, helper_type, helper_name, helper_value")
      .eq("master_id", master.id)
      .order("id", { ascending: true });

    if (questionsError) {
      console.error("Error fetching master questions:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch master questions" },
        { status: 500 }
      );
    }

    // Generate trust link ID
    const trustLinkId = generateSecureLinkId();

    // Create trust instance
    const { data: instance, error: instanceError } = await supabase
      .from("trust_instances")
      .insert({
        master_id: master.id,
        trust_name: trustName.trim(),
        trust_link_id: trustLinkId,
      })
      .select()
      .single();

    if (instanceError) {
      console.error("Error creating instance:", instanceError);
      return NextResponse.json(
        { message: "Failed to create trust instance" },
        { status: 500 }
      );
    }

    // Copy master questions to instance questions
    if (masterQuestions && masterQuestions.length > 0) {
      const instanceQuestions = masterQuestions.map((q) => ({
        instance_id: instance.id,
        question_id: q.question_id,
        category: q.category,
        question_text: q.question_text,
        answer_type: q.answer_type,
        answer_options: q.answer_options,
        characteristic: q.characteristic,
        section: q.section,
        page: q.page,
        enable_when: q.enable_when,
        has_helper: q.has_helper,
        helper_type: q.helper_type,
        helper_name: q.helper_name,
        helper_value: q.helper_value,
      }));

      const { error: insertError } = await supabase
        .from("instance_questions")
        .insert(instanceQuestions);

      if (insertError) {
        console.error("Error copying questions:", insertError);
        // Rollback: delete the instance
        await supabase.from("trust_instances").delete().eq("id", instance.id);
        return NextResponse.json(
          { message: "Failed to copy questions to instance" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      trustLinkId,
      trustName: trustName.trim(),
      questionCount: masterQuestions?.length || 0,
    });
  } catch (error) {
    console.error("Error creating instance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
