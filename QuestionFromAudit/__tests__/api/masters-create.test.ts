import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockSupabaseClient,
  createSequentialMockClient,
  createNextRequest,
} from "../helpers/supabase-mock";

// Mock the supabase server module
const mockCreateClient = vi.fn();
vi.mock("@/libs/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

// Mock crypto.randomBytes for deterministic link IDs
vi.mock("crypto", () => ({
  default: {
    randomBytes: () => ({
      toString: () => "test-admin-link-id",
    }),
  },
}));

import { POST } from "@/app/api/masters/route";

function validQuestion(overrides: any = {}) {
  return {
    id: "q1",
    section: "General",
    page: "Page 1",
    itemType: "text-field",
    questionText: "What is your name?",
    options: [],
    characteristic: "name",
    required: false,
    enableWhen: null,
    hasHelper: false,
    helperType: null,
    helperName: null,
    helperValue: null,
    ...overrides,
  };
}

describe("POST /api/masters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabaseClient({ user: null })
    );

    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test", questions: [validQuestion()] },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Authentication required");
  });

  it("returns 400 when name is missing", async () => {
    // Validation happens before auth check in this route
    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "", questions: [validQuestion()] },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe("Questionnaire name is required");
  });

  it("returns 400 when questions is null or undefined", async () => {
    const req1 = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test", questions: null },
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);
    expect((await res1.json()).message).toBe("Questions array is required");

    const req2 = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test" },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
    expect((await res2.json()).message).toBe("Questions array is required");
  });

  it("returns 400 when questions array is empty", async () => {
    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test", questions: [] },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe("Questions array is required");
  });

  it("returns 400 when questions exceed 500", async () => {
    const questions = Array.from({ length: 501 }, (_, i) =>
      validQuestion({ id: `q${i}` })
    );
    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test", questions },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe("Maximum 500 questions allowed");
  });

  it("returns 400 for invalid itemType", async () => {
    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: {
        name: "Test",
        questions: [validQuestion({ itemType: "invalid-type" })],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("Question 1: ItemType must be one of");
  });

  it("returns 400 when radio type has fewer than 2 options", async () => {
    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: {
        name: "Test",
        questions: [
          validQuestion({
            itemType: "radio",
            options: [{ value: "Yes" }],
          }),
        ],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("radio type requires at least 2 options");
  });

  it("returns 400 when checkbox type has fewer than 2 options", async () => {
    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: {
        name: "Test",
        questions: [
          validQuestion({
            itemType: "checkbox",
            options: [{ value: "A" }],
          }),
        ],
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain(
      "checkbox type requires at least 2 options"
    );
  });

  it("returns success with adminLinkId and questionCount", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1" } },
        },
        {
          table: "master_questions",
          response: { data: null, error: null },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "My Questionnaire", questions: [validQuestion()] },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.adminLinkId).toBe("test-admin-link-id");
    expect(json.questionCount).toBe(1);
  });

  it("rolls back master if question insertion fails", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1" } },
        },
        {
          table: "master_questions",
          response: { data: null, error: { message: "insert failed" } },
        },
        {
          // Rollback: delete the master
          table: "master_questionnaires",
          response: { data: null, error: null },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test", questions: [validQuestion()] },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Failed to save questions");
    // Verify rollback was attempted (3rd from() call = delete on master_questionnaires)
    expect(mockClient.from).toHaveBeenCalledTimes(3);
  });

  it("returns 500 on master creation DB failure", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: null, error: { message: "DB error" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const req = createNextRequest("/api/masters", {
      method: "POST",
      body: { name: "Test", questions: [validQuestion()] },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Failed to create master questionnaire");
  });
});
