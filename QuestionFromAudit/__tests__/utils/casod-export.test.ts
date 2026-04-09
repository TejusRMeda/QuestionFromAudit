import { describe, it, expect } from "vitest";
import {
  consolidateSuggestionsToRows,
  type ExportQuestion,
  type ExportSuggestion,
} from "@/lib/casod-export";
import type { QuestionForMapping } from "@/lib/enableWhen";

// ── Helpers ─────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<ExportQuestion> = {}): ExportQuestion {
  return {
    id: 1,
    question_id: "q1",
    category: "General",
    question_text: "Do you have allergies?",
    answer_type: "choice",
    answer_options: "Yes | No",
    section: "Medical History",
    page: "1",
    characteristic: null,
    required: true,
    enable_when: null,
    has_helper: false,
    helper_type: null,
    helper_name: null,
    helper_value: null,
    ...overrides,
  };
}

function makeSuggestion(
  overrides: Partial<ExportSuggestion> = {}
): ExportSuggestion {
  return {
    id: 100,
    submitter_name: "Alice",
    submitter_email: "alice@example.com",
    suggestion_text: "Make this optional",
    reason: "Not all patients need this",
    status: "pending",
    internal_comment: null,
    response_message: null,
    component_changes: null,
    ...overrides,
  };
}

const emptyMapping: QuestionForMapping[] = [];

// ── consolidateSuggestionsToRows ────────────────────────────────────

describe("consolidateSuggestionsToRows", () => {
  it("returns empty array when suggestionsMap is empty", () => {
    const questions = [makeQuestion()];
    const rows = consolidateSuggestionsToRows(
      questions,
      new Map(),
      emptyMapping
    );
    expect(rows).toEqual([]);
  });

  it("skips questions not in suggestionsMap", () => {
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const suggestionsMap = new Map([
      [2, [makeSuggestion()]],
    ]);
    const rows = consolidateSuggestionsToRows(
      questions,
      suggestionsMap,
      emptyMapping
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]["Question/ text"]).toBe("Do you have allergies?");
  });

  it("populates basic fields correctly", () => {
    const q = makeQuestion({
      section: "Vitals",
      required: false,
      answer_options: "Red | Blue | Green",
    });
    const s = makeSuggestion({
      suggestion_text: "Add more options",
      reason: "More choices needed",
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row["Type of change"]).toBe("Edit");
    expect(row.Section).toBe("Vitals");
    expect(row.Required).toBe("FALSE");
    expect(row["Answer option"]).toBe("Red, Blue, Green");
    expect(row["Suggested Change"]).toBe("Add more options");
    expect(row["Trust Response"]).toBe("More choices needed");
  });

  it("uses category as fallback when section is null", () => {
    const q = makeQuestion({ section: null, category: "Demographics" });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      emptyMapping
    );
    expect(rows[0].Section).toBe("Demographics");
  });

  it("shows 'TRUE' for required questions", () => {
    const q = makeQuestion({ required: true });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      emptyMapping
    );
    expect(rows[0].Required).toBe("TRUE");
  });
});

// ── formatOptions (tested indirectly) ───────────────────────────────

describe("formatOptions (via consolidation)", () => {
  it("formats pipe-separated options as comma-separated", () => {
    const q = makeQuestion({ answer_options: "A | B | C" });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      emptyMapping
    );
    expect(rows[0]["Answer option"]).toBe("A, B, C");
  });

  it("returns empty string for null options", () => {
    const q = makeQuestion({ answer_options: null });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      emptyMapping
    );
    expect(rows[0]["Answer option"]).toBe("");
  });
});

// ── buildSuggestedChangeText (tested indirectly) ────────────────────

describe("buildSuggestedChangeText (via consolidation)", () => {
  it("returns single suggestion text as-is", () => {
    const q = makeQuestion();
    const s = makeSuggestion({ suggestion_text: "Change wording" });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Suggested Change"]).toBe("Change wording");
  });

  it("concatenates multiple suggestions with submitter names", () => {
    const q = makeQuestion();
    const s1 = makeSuggestion({
      submitter_name: "Alice",
      suggestion_text: "Change A",
    });
    const s2 = makeSuggestion({
      id: 101,
      submitter_name: "Bob",
      suggestion_text: "Change B",
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s1, s2]]]),
      emptyMapping
    );
    expect(rows[0]["Suggested Change"]).toBe("Alice: Change A | Bob: Change B");
  });
});

// ── buildContentColumn (tested indirectly) ──────────────────────────

describe("buildContentColumn (via consolidation)", () => {
  it("returns 'Leave as is' when no component_changes", () => {
    const q = makeQuestion();
    const s = makeSuggestion({ component_changes: null });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0].Content).toBe("Leave as is");
  });

  it("shows question text change", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      component_changes: {
        content: {
          questionText: { from: "Old text", to: "New text" },
        },
      },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0].Content).toContain('Question text: "Old text" → "New text"');
  });

  it("shows answer type change", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      component_changes: {
        content: {
          answerType: { from: "choice", to: "open-choice" },
        },
      },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0].Content).toContain("Answer type: choice → open-choice");
  });

  it("shows option changes (added, modified, removed)", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      component_changes: {
        content: {
          options: {
            added: [{ text: "New Option", characteristic: "" }],
            modified: [{ index: 0, from: "Old", to: "Updated" }],
            removed: [0],
          },
        },
      },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0].Content).toContain("+1 added");
    expect(rows[0].Content).toContain("1 modified");
    expect(rows[0].Content).toContain("-1 removed");
  });

  it("shows help content changes for contentBlock type", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      component_changes: {
        help: {
          helperType: { from: null, to: "contentBlock" },
          helperName: { from: null, to: "My Guide" },
          helperValue: { from: null, to: "<p>content</p>" },
        },
      },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0].Content).toContain('Help content: "My Guide"');
  });
});

// ── buildWeblinkColumn (tested indirectly) ──────────────────────────

describe("buildWeblinkColumn (via consolidation)", () => {
  it("returns 'Leave as is' when no webLink changes", () => {
    const q = makeQuestion();
    const s = makeSuggestion({ component_changes: null });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Weblink and link text"]).toBe("Leave as is");
  });

  it("shows webLink change with name and URL", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      component_changes: {
        help: {
          helperType: { from: null, to: "webLink" },
          helperName: { from: null, to: "More Info" },
          helperValue: { from: null, to: "https://example.com" },
        },
      },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Weblink and link text"]).toContain(
      "More Info: https://example.com"
    );
  });
});

// ── buildTrustResponseText (tested indirectly) ──────────────────────

describe("buildTrustResponseText (via consolidation)", () => {
  it("returns single reason as-is", () => {
    const q = makeQuestion();
    const s = makeSuggestion({ reason: "Better UX" });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Trust Response"]).toBe("Better UX");
  });

  it("concatenates multiple reasons with submitter names", () => {
    const q = makeQuestion();
    const s1 = makeSuggestion({
      submitter_name: "Alice",
      reason: "Reason A",
    });
    const s2 = makeSuggestion({
      id: 101,
      submitter_name: "Bob",
      reason: "Reason B",
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s1, s2]]]),
      emptyMapping
    );
    expect(rows[0]["Trust Response"]).toBe(
      "Alice: Reason A | Bob: Reason B"
    );
  });
});

// ── buildUltramedResponseText (tested indirectly) ───────────────────

describe("buildUltramedResponseText (via consolidation)", () => {
  it("returns empty string when no response or internal comment", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      response_message: null,
      internal_comment: null,
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Ultramed Response"]).toBe("");
  });

  it("shows response message only", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      response_message: "We will consider this",
      internal_comment: null,
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Ultramed Response"]).toBe("We will consider this");
  });

  it("shows internal comment with prefix", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      response_message: null,
      internal_comment: "Needs discussion",
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Ultramed Response"]).toBe("[Internal] Needs discussion");
  });

  it("combines response and internal comment with /", () => {
    const q = makeQuestion();
    const s = makeSuggestion({
      response_message: "Approved",
      internal_comment: "Check with team",
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s]]]),
      emptyMapping
    );
    expect(rows[0]["Ultramed Response"]).toBe(
      "Approved / [Internal] Check with team"
    );
  });

  it("includes submitter names when multiple suggestions", () => {
    const q = makeQuestion();
    const s1 = makeSuggestion({
      submitter_name: "Alice",
      response_message: "OK",
      internal_comment: null,
    });
    const s2 = makeSuggestion({
      id: 101,
      submitter_name: "Bob",
      response_message: "Needs work",
      internal_comment: "Flag this",
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [s1, s2]]]),
      emptyMapping
    );
    expect(rows[0]["Ultramed Response"]).toBe(
      "Alice: OK | Bob: Needs work / [Internal] Flag this"
    );
  });
});

// ── buildBranchingText (tested indirectly) ──────────────────────────

describe("buildBranchingText (via consolidation)", () => {
  it("returns empty string when enable_when is null", () => {
    const q = makeQuestion({ enable_when: null });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      emptyMapping
    );
    expect(rows[0]["Branching off/ Positioning"]).toBe("");
  });

  it("returns empty string when enable_when has no conditions", () => {
    const q = makeQuestion({
      enable_when: { conditions: [], logic: "AND" },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      emptyMapping
    );
    expect(rows[0]["Branching off/ Positioning"]).toBe("");
  });

  it("translates enable_when to readable branching text", () => {
    const allQuestions: QuestionForMapping[] = [
      {
        questionId: "q1",
        questionText: "Has allergies?",
        answerOptions: "Yes | No",
        characteristic: "has_allergies | no_allergies",
      },
    ];
    const q = makeQuestion({
      enable_when: {
        conditions: [
          {
            characteristic: "has_allergies",
            operator: "=",
            value: "true",
          },
        ],
        logic: "AND",
      },
    });
    const rows = consolidateSuggestionsToRows(
      [q],
      new Map([[q.id, [makeSuggestion()]]]),
      allQuestions
    );
    expect(rows[0]["Branching off/ Positioning"]).toContain("Shown when:");
    expect(rows[0]["Branching off/ Positioning"]).toContain("Has allergies?");
  });
});
