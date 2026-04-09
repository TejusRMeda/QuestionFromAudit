import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockSupabaseClient,
  createSequentialMockClient,
  createNextRequest,
} from "../helpers/supabase-mock";

// Mock supabase server module
const mockServiceClient = vi.fn();
const mockAuthClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => mockServiceClient(),
  createClient: async () => mockAuthClient(),
}));

// Mock rate limiter to always allow
vi.mock("@/lib/rateLimit", () => ({
  applyRateLimit: () => null,
}));

import { POST } from "@/app/api/instance/[trustLinkId]/suggestions/route";
import { PATCH } from "@/app/api/instance/[trustLinkId]/suggestions/[suggestionId]/route";

const TRUST_LINK = "test-trust-link-id";

function validSuggestionBody() {
  return {
    instanceQuestionId: 42,
    submitterName: "Alice",
    submitterEmail: "alice@example.com",
    suggestionText: "Make this question optional",
    reason: "Not all patients need this",
  };
}

// ── POST /api/instance/[trustLinkId]/suggestions ────────────────────

describe("POST /api/instance/[trustLinkId]/suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing required fields", async () => {
    mockServiceClient.mockReturnValue(
      createMockSupabaseClient({ tables: {} })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      { method: "POST", body: { submitterName: "Alice" } }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty suggestion text", async () => {
    mockServiceClient.mockReturnValue(
      createMockSupabaseClient({ tables: {} })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      {
        method: "POST",
        body: { ...validSuggestionBody(), suggestionText: "" },
      }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for too-long suggestion text (>2000 chars)", async () => {
    mockServiceClient.mockReturnValue(
      createMockSupabaseClient({ tables: {} })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      {
        method: "POST",
        body: {
          ...validSuggestionBody(),
          suggestionText: "x".repeat(2001),
        },
      }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    mockServiceClient.mockReturnValue(
      createMockSupabaseClient({ tables: {} })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      {
        method: "POST",
        body: {
          ...validSuggestionBody(),
          submitterEmail: "not-an-email",
        },
      }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when trust instance not found", async () => {
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: { data: null, error: { message: "Not found" } },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      { method: "POST", body: validSuggestionBody() }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(404);
  });

  it("returns 403 when instance is already submitted", async () => {
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: { id: 1, submission_status: "submitted" },
            },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      { method: "POST", body: validSuggestionBody() }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toContain("already been submitted");
  });

  it("returns 404 when question does not belong to instance", async () => {
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: { id: 1, submission_status: "in_progress" },
            },
          },
          {
            table: "instance_questions",
            response: { data: null, error: { message: "Not found" } },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      { method: "POST", body: validSuggestionBody() }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 with valid input and creates suggestion", async () => {
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: { id: 1, submission_status: "in_progress" },
            },
          },
          {
            table: "instance_questions",
            response: { data: { id: 42 } },
          },
          {
            table: "instance_suggestions",
            response: { data: { id: 99 } },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      { method: "POST", body: validSuggestionBody() }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(99);
    expect(json.message).toContain("successfully");
  });

  it("returns 500 when suggestion insert fails", async () => {
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: { id: 1, submission_status: "in_progress" },
            },
          },
          {
            table: "instance_questions",
            response: { data: { id: 42 } },
          },
          {
            table: "instance_suggestions",
            response: { data: null, error: { message: "DB error" } },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions`,
      { method: "POST", body: validSuggestionBody() }
    );

    const res = await POST(req, { params: Promise.resolve({ trustLinkId: TRUST_LINK }) });
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/instance/[trustLinkId]/suggestions/[suggestionId] ────

describe("PATCH /api/instance/[trustLinkId]/suggestions/[suggestionId]", () => {
  const SUGGESTION_ID = "99";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuthClient.mockReturnValue(
      createMockSupabaseClient({ user: null })
    );
    mockServiceClient.mockReturnValue(
      createMockSupabaseClient({ tables: {} })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions/${SUGGESTION_ID}`,
      { method: "PATCH", body: { status: "approved" } }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        trustLinkId: TRUST_LINK,
        suggestionId: SUGGESTION_ID,
      }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid status value", async () => {
    mockAuthClient.mockReturnValue(
      createMockSupabaseClient({ user: { id: "user-1" } })
    );
    mockServiceClient.mockReturnValue(
      createMockSupabaseClient({ tables: {} })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions/${SUGGESTION_ID}`,
      { method: "PATCH", body: { status: "invalid-status" } }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        trustLinkId: TRUST_LINK,
        suggestionId: SUGGESTION_ID,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 when user does not own the master questionnaire", async () => {
    mockAuthClient.mockReturnValue(
      createMockSupabaseClient({ user: { id: "user-1" } })
    );
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: {
                id: 1,
                submission_status: "in_progress",
                master_questionnaires: { user_id: "other-user" },
              },
            },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions/${SUGGESTION_ID}`,
      { method: "PATCH", body: { status: "approved" } }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        trustLinkId: TRUST_LINK,
        suggestionId: SUGGESTION_ID,
      }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 when instance is already submitted", async () => {
    mockAuthClient.mockReturnValue(
      createMockSupabaseClient({ user: { id: "user-1" } })
    );
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: {
                id: 1,
                submission_status: "submitted",
                master_questionnaires: { user_id: "user-1" },
              },
            },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions/${SUGGESTION_ID}`,
      { method: "PATCH", body: { status: "approved" } }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        trustLinkId: TRUST_LINK,
        suggestionId: SUGGESTION_ID,
      }),
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toContain("already been submitted");
  });

  it("returns 200 on valid status change by owner", async () => {
    mockAuthClient.mockReturnValue(
      createMockSupabaseClient({ user: { id: "user-1" } })
    );
    mockServiceClient.mockReturnValue(
      createSequentialMockClient({
        calls: [
          {
            table: "trust_instances",
            response: {
              data: {
                id: 1,
                submission_status: "in_progress",
                master_questionnaires: { user_id: "user-1" },
              },
            },
          },
          {
            table: "instance_suggestions",
            response: {
              data: {
                id: 99,
                instance_question_id: 42,
                instance_questions: { instance_id: 1 },
              },
            },
          },
          {
            table: "instance_suggestions",
            response: { data: null, error: null },
          },
        ],
      })
    );

    const req = createNextRequest(
      `/api/instance/${TRUST_LINK}/suggestions/${SUGGESTION_ID}`,
      { method: "PATCH", body: { status: "approved" } }
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        trustLinkId: TRUST_LINK,
        suggestionId: SUGGESTION_ID,
      }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("successfully");
  });
});
