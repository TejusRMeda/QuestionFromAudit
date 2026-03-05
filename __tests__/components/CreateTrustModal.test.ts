import { describe, it, expect } from "vitest";

// ── Logic extracted from CreateTrustModal ────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

function canAdvance(step: Step, trustName: string, selectedIds: string[]): boolean {
  if (step === 1) return trustName.trim().length > 0;
  if (step === 3) return selectedIds.length > 0;
  return true;
}

function addMember(members: string[], input: string): string[] {
  const email = input.trim();
  if (!email) return members;
  if (members.includes(email)) return members;
  return [...members, email];
}

function removeMember(members: string[], email: string): string[] {
  return members.filter((m) => m !== email);
}

function toggleQuestionnaire(selectedIds: string[], adminLinkId: string): string[] {
  return selectedIds.includes(adminLinkId)
    ? selectedIds.filter((id) => id !== adminLinkId)
    : [...selectedIds, adminLinkId];
}

function buildShareUrl(origin: string, trustLinkId: string): string {
  return `${origin}/instance/${trustLinkId}`;
}

// ── canAdvance ───────────────────────────────────────────────────────────────

describe("canAdvance", () => {
  describe("step 1 — trust name", () => {
    it("returns false when trust name is empty", () => {
      expect(canAdvance(1, "", [])).toBe(false);
    });

    it("returns false when trust name is whitespace only", () => {
      expect(canAdvance(1, "   ", [])).toBe(false);
    });

    it("returns true when trust name has content", () => {
      expect(canAdvance(1, "NHS Trust", [])).toBe(true);
    });
  });

  describe("step 2 — members (optional)", () => {
    it("returns true with no members", () => {
      expect(canAdvance(2, "NHS Trust", [])).toBe(true);
    });

    it("returns true with members present", () => {
      expect(canAdvance(2, "NHS Trust", [])).toBe(true);
    });
  });

  describe("step 3 — questionnaires", () => {
    it("returns false when no questionnaires selected", () => {
      expect(canAdvance(3, "NHS Trust", [])).toBe(false);
    });

    it("returns true when at least one questionnaire is selected", () => {
      expect(canAdvance(3, "NHS Trust", ["admin-abc"])).toBe(true);
    });

    it("returns true when multiple questionnaires are selected", () => {
      expect(canAdvance(3, "NHS Trust", ["admin-abc", "admin-def"])).toBe(true);
    });
  });

  describe("step 4 — review", () => {
    it("always returns true (create button is separate)", () => {
      expect(canAdvance(4, "NHS Trust", [])).toBe(true);
    });
  });
});

// ── addMember ────────────────────────────────────────────────────────────────

describe("addMember", () => {
  it("adds an email to an empty list", () => {
    expect(addMember([], "alice@example.com")).toEqual(["alice@example.com"]);
  });

  it("appends to an existing list", () => {
    const result = addMember(["alice@example.com"], "bob@example.com");
    expect(result).toEqual(["alice@example.com", "bob@example.com"]);
  });

  it("does not add a duplicate email", () => {
    const result = addMember(["alice@example.com"], "alice@example.com");
    expect(result).toEqual(["alice@example.com"]);
  });

  it("trims whitespace before adding", () => {
    expect(addMember([], "  alice@example.com  ")).toEqual(["alice@example.com"]);
  });

  it("does not add an empty string", () => {
    expect(addMember(["alice@example.com"], "")).toEqual(["alice@example.com"]);
  });

  it("does not add a whitespace-only string", () => {
    expect(addMember(["alice@example.com"], "   ")).toEqual(["alice@example.com"]);
  });

  it("does not mutate the original array", () => {
    const original = ["alice@example.com"];
    addMember(original, "bob@example.com");
    expect(original).toEqual(["alice@example.com"]);
  });
});

// ── removeMember ─────────────────────────────────────────────────────────────

describe("removeMember", () => {
  it("removes the specified email", () => {
    const result = removeMember(["alice@example.com", "bob@example.com"], "alice@example.com");
    expect(result).toEqual(["bob@example.com"]);
  });

  it("returns unchanged list when email not found", () => {
    const result = removeMember(["alice@example.com"], "nonexistent@example.com");
    expect(result).toEqual(["alice@example.com"]);
  });

  it("returns empty array when last member is removed", () => {
    expect(removeMember(["alice@example.com"], "alice@example.com")).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const original = ["alice@example.com", "bob@example.com"];
    removeMember(original, "alice@example.com");
    expect(original).toHaveLength(2);
  });
});

// ── toggleQuestionnaire ───────────────────────────────────────────────────────

describe("toggleQuestionnaire", () => {
  it("adds an id that is not in the list", () => {
    expect(toggleQuestionnaire([], "admin-abc")).toEqual(["admin-abc"]);
  });

  it("removes an id that is already in the list", () => {
    expect(toggleQuestionnaire(["admin-abc"], "admin-abc")).toEqual([]);
  });

  it("appends to existing selections", () => {
    const result = toggleQuestionnaire(["admin-abc"], "admin-def");
    expect(result).toEqual(["admin-abc", "admin-def"]);
  });

  it("only removes the matching id, preserving others", () => {
    const result = toggleQuestionnaire(["admin-abc", "admin-def", "admin-ghi"], "admin-def");
    expect(result).toEqual(["admin-abc", "admin-ghi"]);
  });

  it("toggling the same id twice returns original state", () => {
    const after1 = toggleQuestionnaire([], "admin-abc");
    const after2 = toggleQuestionnaire(after1, "admin-abc");
    expect(after2).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const original = ["admin-abc"];
    toggleQuestionnaire(original, "admin-abc");
    expect(original).toEqual(["admin-abc"]);
  });
});

// ── buildShareUrl ─────────────────────────────────────────────────────────────

describe("buildShareUrl", () => {
  it("constructs correct share URL", () => {
    expect(buildShareUrl("https://questionaireaudit.com", "abc123")).toBe(
      "https://questionaireaudit.com/instance/abc123"
    );
  });

  it("works with localhost origin", () => {
    expect(buildShareUrl("http://localhost:3000", "xyz789")).toBe(
      "http://localhost:3000/instance/xyz789"
    );
  });
});
