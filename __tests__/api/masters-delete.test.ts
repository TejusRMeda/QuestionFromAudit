import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockSupabaseClient,
  createSequentialMockClient,
  createNextRequest,
} from "../helpers/supabase-mock";

const mockCreateClient = vi.fn();
vi.mock("@/libs/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

import { DELETE } from "@/app/api/masters/[adminLinkId]/route";

function callDelete(adminLinkId = "admin-123") {
  const req = createNextRequest(`/api/masters/${adminLinkId}`, {
    method: "DELETE",
  });
  return DELETE(req, { params: Promise.resolve({ adminLinkId }) });
}

describe("DELETE /api/masters/[adminLinkId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabaseClient({ user: null })
    );

    const res = await callDelete();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe("Unauthorized");
  });

  it("returns 404 when master not found", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: null, error: { message: "not found" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callDelete();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.message).toBe("Questionnaire not found");
  });

  it("returns 403 when user doesn't own the questionnaire", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1", user_id: "other-user" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callDelete();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toBe("Forbidden");
  });

  it("returns 200 with deletion confirmation on success", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1", user_id: "user-123" } },
        },
        {
          table: "master_questionnaires",
          response: { data: null, error: null },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callDelete();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Questionnaire deleted successfully");
  });

  it("returns 500 on delete failure", async () => {
    const mockClient = createSequentialMockClient({
      user: { id: "user-123" },
      calls: [
        {
          table: "master_questionnaires",
          response: { data: { id: "master-1", user_id: "user-123" } },
        },
        {
          table: "master_questionnaires",
          response: { data: null, error: { message: "delete failed" } },
        },
      ],
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const res = await callDelete();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe("Failed to delete questionnaire");
  });
});
