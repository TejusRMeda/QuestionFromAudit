import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSequentialMockClient,
  createNextRequest,
} from "../helpers/supabase-mock";

const mockCreateClient = vi.fn();
vi.mock("@/libs/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("crypto", () => ({
  default: {
    randomBytes: () => ({
      toString: () => "test-trust-link-id",
    }),
  },
}));

import { POST } from "@/app/api/masters/[adminLinkId]/instances/route";

const masterQuestions = [
  {
    question_id: "q1",
    category: "General",
    question_text: "What is your name?",
    answer_type: "text-field",
    answer_options: null,
    characteristic: "name",
    has_helper: false,
    helper_type: null,
    helper_name: null,
    helper_value: null,
  },
];

function callPost(body: any, adminLinkId = "admin-123") {
  const req = createNextRequest(`/api/masters/${adminLinkId}/instances`, {
    method: "POST",
    body,
  });
  return POST(req, { params: Promise.resolve({ adminLinkId }) });
}

describe("POST /api/masters/[adminLinkId]/instances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when trustName is missing", async () => {
    const res = await callPost({ trustName: "" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe("Trust name is required");
  });

  it("returns 404 when master questionnaire not found", async () => {
    const mockClient = createSequentialMockClient({
      calls: [
        {
          table: "master_questionnaires",
          response: { data: null, error: { message: "not found" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callPost({ trustName: "NHS Trust" });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.message).toBe("Master questionnaire not found");
  });

  it("returns success with trustLinkId, trustName, questionCount", async () => {
    const mockClient = createSequentialMockClient({
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1" } },
        },
        {
          table: "master_questions",
          response: { data: masterQuestions },
        },
        {
          table: "trust_instances",
          response: { data: { id: "instance-1" } },
        },
        {
          table: "instance_questions",
          response: { data: null, error: null },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callPost({ trustName: "NHS Trust" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.trustLinkId).toBe("test-trust-link-id");
    expect(json.trustName).toBe("NHS Trust");
    expect(json.questionCount).toBe(1);
  });

  it("returns 500 when instance creation fails", async () => {
    const mockClient = createSequentialMockClient({
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1" } },
        },
        {
          table: "master_questions",
          response: { data: masterQuestions },
        },
        {
          table: "trust_instances",
          response: { data: null, error: { message: "insert failed" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callPost({ trustName: "NHS Trust" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Failed to create trust instance");
  });

  it("rolls back instance if question copy fails", async () => {
    const mockClient = createSequentialMockClient({
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1" } },
        },
        {
          table: "master_questions",
          response: { data: masterQuestions },
        },
        {
          table: "trust_instances",
          response: { data: { id: "instance-1" } },
        },
        {
          table: "instance_questions",
          response: { data: null, error: { message: "insert failed" } },
        },
        {
          // Rollback delete call
          table: "trust_instances",
          response: { data: null, error: null },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callPost({ trustName: "NHS Trust" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Failed to copy questions to instance");
    // Verify rollback was attempted (5th call = delete on trust_instances)
    expect(mockClient.from).toHaveBeenCalledTimes(5);
  });

  it("returns 500 when fetching master questions fails", async () => {
    const mockClient = createSequentialMockClient({
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1" } },
        },
        {
          table: "master_questions",
          response: { data: null, error: { message: "DB error" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callPost({ trustName: "NHS Trust" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Failed to fetch master questions");
  });
});
