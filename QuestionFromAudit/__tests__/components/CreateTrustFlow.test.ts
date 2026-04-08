import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Simulates the createTrust flow from CreateTrustModal Step 4 ──────────────
//
// The modal calls POST /api/masters/{adminLinkId}/instances for each selected
// questionnaire in sequence, collecting { questionnaireName, trustLinkId }.
// These tests verify that logic in isolation.

interface Questionnaire {
  id: number;
  name: string;
  admin_link_id: string;
}

interface CreatedLink {
  questionnaireName: string;
  trustLinkId: string;
}

async function runCreateFlow(
  selectedIds: string[],
  questionnaires: Questionnaire[],
  trustName: string,
  fetchFn: (adminLinkId: string, trustName: string) => Promise<{ trustLinkId: string }>
): Promise<CreatedLink[]> {
  const links: CreatedLink[] = [];
  for (const adminLinkId of selectedIds) {
    const q = questionnaires.find((q) => q.admin_link_id === adminLinkId);
    const data = await fetchFn(adminLinkId, trustName);
    links.push({
      questionnaireName: q?.name ?? adminLinkId,
      trustLinkId: data.trustLinkId,
    });
  }
  return links;
}

const questionnaires: Questionnaire[] = [
  { id: 1, name: "Pre-Op Assessment", admin_link_id: "admin-aaa" },
  { id: 2, name: "Post-Op Review", admin_link_id: "admin-bbb" },
  { id: 3, name: "Annual Health Check", admin_link_id: "admin-ccc" },
];

describe("CreateTrust multi-questionnaire flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a single trust instance and returns one link", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ trustLinkId: "link-001" });

    const links = await runCreateFlow(["admin-aaa"], questionnaires, "NHS Trust", mockFetch);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("admin-aaa", "NHS Trust");
    expect(links).toEqual([
      { questionnaireName: "Pre-Op Assessment", trustLinkId: "link-001" },
    ]);
  });

  it("creates instances for multiple questionnaires in order", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ trustLinkId: "link-001" })
      .mockResolvedValueOnce({ trustLinkId: "link-002" });

    const links = await runCreateFlow(
      ["admin-aaa", "admin-bbb"],
      questionnaires,
      "Barts Health",
      mockFetch
    );

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, "admin-aaa", "Barts Health");
    expect(mockFetch).toHaveBeenNthCalledWith(2, "admin-bbb", "Barts Health");
    expect(links).toEqual([
      { questionnaireName: "Pre-Op Assessment", trustLinkId: "link-001" },
      { questionnaireName: "Post-Op Review", trustLinkId: "link-002" },
    ]);
  });

  it("creates instances for three questionnaires", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ trustLinkId: "link-001" })
      .mockResolvedValueOnce({ trustLinkId: "link-002" })
      .mockResolvedValueOnce({ trustLinkId: "link-003" });

    const links = await runCreateFlow(
      ["admin-aaa", "admin-bbb", "admin-ccc"],
      questionnaires,
      "Foundation Trust",
      mockFetch
    );

    expect(links).toHaveLength(3);
    expect(links[2]).toEqual({ questionnaireName: "Annual Health Check", trustLinkId: "link-003" });
  });

  it("aborts on the first API error and propagates the error", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ trustLinkId: "link-001" })
      .mockRejectedValueOnce(new Error("Failed to create instance for \"Post-Op Review\""));

    await expect(
      runCreateFlow(["admin-aaa", "admin-bbb"], questionnaires, "NHS Trust", mockFetch)
    ).rejects.toThrow("Failed to create instance");

    // Third questionnaire should never be reached
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to adminLinkId as name when questionnaire is not found", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ trustLinkId: "link-999" });

    const links = await runCreateFlow(["admin-unknown"], questionnaires, "NHS Trust", mockFetch);

    expect(links[0].questionnaireName).toBe("admin-unknown");
  });

  it("uses the same trustName for all API calls", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ trustLinkId: "link-001" })
      .mockResolvedValueOnce({ trustLinkId: "link-002" });

    await runCreateFlow(["admin-aaa", "admin-bbb"], questionnaires, "Shared Trust Name", mockFetch);

    const calls = mockFetch.mock.calls;
    expect(calls[0][1]).toBe("Shared Trust Name");
    expect(calls[1][1]).toBe("Shared Trust Name");
  });

  it("returns empty array when no questionnaires are selected", async () => {
    const mockFetch = vi.fn();

    const links = await runCreateFlow([], questionnaires, "NHS Trust", mockFetch);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(links).toEqual([]);
  });

  it("preserves correct questionnaire name per link when order matters", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ trustLinkId: "link-bbb" })
      .mockResolvedValueOnce({ trustLinkId: "link-aaa" });

    // Selected in reverse order
    const links = await runCreateFlow(
      ["admin-bbb", "admin-aaa"],
      questionnaires,
      "NHS Trust",
      mockFetch
    );

    expect(links[0]).toEqual({ questionnaireName: "Post-Op Review", trustLinkId: "link-bbb" });
    expect(links[1]).toEqual({ questionnaireName: "Pre-Op Assessment", trustLinkId: "link-aaa" });
  });
});
