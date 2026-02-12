import { describe, it, expect } from "vitest";

// Types matching the review page
interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
}

// Logic for determining input type
function getInputType(question: Question): "text" | "radio" | "multi_select" | "unknown" {
  const answerType = question.answerType?.toLowerCase();

  if (answerType === "text") return "text";
  if (answerType === "radio") return "radio";
  if (answerType === "multi_select") return "multi_select";

  return "unknown";
}

// Logic for parsing options
function parseOptions(answerOptions: string | null): string[] {
  if (!answerOptions) return [];
  return answerOptions
    .split("|")
    .map((o) => o.trim())
    .filter(Boolean);
}

// Logic for rendering label
function getInputLabel(answerType: string | null): string {
  const type = answerType?.toLowerCase();

  if (type === "radio") return "Single choice";
  if (type === "multi_select") return "Multiple choice";
  if (type === "text") return "Free text";

  return answerType || "Options";
}

describe("Answer Input Rendering Logic", () => {
  describe("getInputType", () => {
    it("should return 'text' for text type questions", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: "text",
        answerOptions: null,
      };
      expect(getInputType(question)).toBe("text");
    });

    it("should return 'radio' for radio type questions", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: "radio",
        answerOptions: "Yes|No",
      };
      expect(getInputType(question)).toBe("radio");
    });

    it("should return 'multi_select' for multi_select type questions", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: "multi_select",
        answerOptions: "A|B|C",
      };
      expect(getInputType(question)).toBe("multi_select");
    });

    it("should handle uppercase answer types", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: "RADIO",
        answerOptions: "Yes|No",
      };
      expect(getInputType(question)).toBe("radio");
    });

    it("should handle mixed case answer types", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: "Multi_Select",
        answerOptions: "A|B|C",
      };
      expect(getInputType(question)).toBe("multi_select");
    });

    it("should return 'unknown' for null answer type", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: null,
        answerOptions: null,
      };
      expect(getInputType(question)).toBe("unknown");
    });

    it("should return 'unknown' for invalid answer type", () => {
      const question: Question = {
        id: 1,
        questionId: "Q001",
        category: "Test",
        questionText: "Test question",
        answerType: "dropdown",
        answerOptions: "A|B",
      };
      expect(getInputType(question)).toBe("unknown");
    });
  });

  describe("parseOptions", () => {
    it("should parse pipe-separated options", () => {
      const options = parseOptions("Yes|No|Maybe");
      expect(options).toEqual(["Yes", "No", "Maybe"]);
    });

    it("should trim whitespace from options", () => {
      const options = parseOptions("  Yes  |  No  |  Maybe  ");
      expect(options).toEqual(["Yes", "No", "Maybe"]);
    });

    it("should filter empty options", () => {
      const options = parseOptions("Yes||No|||Maybe");
      expect(options).toEqual(["Yes", "No", "Maybe"]);
    });

    it("should return empty array for null", () => {
      const options = parseOptions(null);
      expect(options).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      const options = parseOptions("");
      expect(options).toEqual([]);
    });

    it("should handle single option", () => {
      const options = parseOptions("Only option");
      expect(options).toEqual(["Only option"]);
    });

    it("should handle many options", () => {
      const optionsString = "A|B|C|D|E|F|G|H|I|J";
      const options = parseOptions(optionsString);
      expect(options).toHaveLength(10);
      expect(options[0]).toBe("A");
      expect(options[9]).toBe("J");
    });
  });

  describe("getInputLabel", () => {
    it("should return 'Single choice' for radio", () => {
      expect(getInputLabel("radio")).toBe("Single choice");
    });

    it("should return 'Multiple choice' for multi_select", () => {
      expect(getInputLabel("multi_select")).toBe("Multiple choice");
    });

    it("should return 'Free text' for text", () => {
      expect(getInputLabel("text")).toBe("Free text");
    });

    it("should handle uppercase types", () => {
      expect(getInputLabel("RADIO")).toBe("Single choice");
      expect(getInputLabel("MULTI_SELECT")).toBe("Multiple choice");
      expect(getInputLabel("TEXT")).toBe("Free text");
    });

    it("should return the type itself for unknown types", () => {
      expect(getInputLabel("dropdown")).toBe("dropdown");
    });

    it("should return 'Options' for null", () => {
      expect(getInputLabel(null)).toBe("Options");
    });
  });

  describe("answer state management", () => {
    it("should handle text answer as string", () => {
      const answers: Record<number, string | string[]> = {};
      const questionId = 1;
      const value = "My answer";

      answers[questionId] = value;

      expect(typeof answers[questionId]).toBe("string");
      expect(answers[questionId]).toBe("My answer");
    });

    it("should handle radio answer as string", () => {
      const answers: Record<number, string | string[]> = {};
      const questionId = 1;
      const value = "Option A";

      answers[questionId] = value;

      expect(typeof answers[questionId]).toBe("string");
      expect(answers[questionId]).toBe("Option A");
    });

    it("should handle multi_select answer as array", () => {
      const answers: Record<number, string | string[]> = {};
      const questionId = 1;
      const values = ["Option A", "Option C"];

      answers[questionId] = values;

      expect(Array.isArray(answers[questionId])).toBe(true);
      expect(answers[questionId]).toEqual(["Option A", "Option C"]);
    });

    it("should add to multi_select array", () => {
      let selectedValues: string[] = ["Option A"];
      const newOption = "Option B";

      selectedValues = [...selectedValues, newOption];

      expect(selectedValues).toEqual(["Option A", "Option B"]);
    });

    it("should remove from multi_select array", () => {
      let selectedValues = ["Option A", "Option B", "Option C"];
      const optionToRemove = "Option B";

      selectedValues = selectedValues.filter((v) => v !== optionToRemove);

      expect(selectedValues).toEqual(["Option A", "Option C"]);
    });
  });

  describe("question filtering", () => {
    const questions: Question[] = [
      {
        id: 1,
        questionId: "Q001",
        category: "Demographics",
        questionText: "What is your age?",
        answerType: "radio",
        answerOptions: "Under 18|18-30|31-50|Over 50",
      },
      {
        id: 2,
        questionId: "Q002",
        category: "Health",
        questionText: "Any allergies?",
        answerType: "multi_select",
        answerOptions: "Peanuts|Dairy|Gluten|None",
      },
      {
        id: 3,
        questionId: "Q003",
        category: "Demographics",
        questionText: "What is your gender?",
        answerType: "radio",
        answerOptions: "Male|Female|Other",
      },
    ];

    it("should filter by search term in question text", () => {
      const searchTerm = "age";
      const filtered = questions.filter((q) =>
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].questionId).toBe("Q001");
    });

    it("should filter by search term in question ID", () => {
      const searchTerm = "Q002";
      const filtered = questions.filter((q) =>
        q.questionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].questionText).toBe("Any allergies?");
    });

    it("should filter by category", () => {
      const categoryFilter = "Demographics";
      const filtered = questions.filter((q) => q.category === categoryFilter);
      expect(filtered).toHaveLength(2);
    });

    it("should combine search and category filters", () => {
      const searchTerm = "age";
      const categoryFilter = "Demographics";
      const filtered = questions.filter(
        (q) =>
          q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) &&
          q.category === categoryFilter
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].questionId).toBe("Q001");
    });

    it("should return all when no filters applied", () => {
      const searchTerm: string = "";
      const categoryFilter: string = "all";
      const filtered = questions.filter((q) => {
        const matchesSearch =
          searchTerm === "" ||
          q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" || q.category === categoryFilter;
        return matchesSearch && matchesCategory;
      });
      expect(filtered).toHaveLength(3);
    });
  });
});
