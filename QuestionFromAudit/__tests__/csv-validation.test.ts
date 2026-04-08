import { describe, it, expect } from "vitest";
import {
  MyPreOpCsvRow,
  ParsedQuestion,
  MYPREOP_ITEM_TYPES,
  ITEM_TYPES_REQUIRING_OPTIONS,
  ITEM_TYPES_NO_OPTIONS,
  groupRowsByQuestion,
  rowsToQuestion,
  parseEnableWhen,
  MyPreOpItemType,
} from "@/types/question";

// Validation function extracted from upload page for testing
function validateQuestions(rows: MyPreOpCsvRow[]): {
  questions: ParsedQuestion[];
  warnings: string[];
} {
  const groupedRows = groupRowsByQuestion(rows);

  if (groupedRows.size === 0) {
    throw new Error("No valid questions found in CSV");
  }

  if (groupedRows.size > 500) {
    throw new Error("CSV file exceeds maximum of 500 questions");
  }

  const warnings: string[] = [];
  const questions: ParsedQuestion[] = [];
  const sectionCounts: Record<string, number> = {};

  for (const [id, questionRows] of groupedRows) {
    const question = rowsToQuestion(questionRows);

    // Validate Id
    if (!question.id) {
      throw new Error(`Question has empty Id`);
    }

    // Validate Section
    if (!question.section) {
      throw new Error(`Question ${question.id}: Section is empty`);
    }

    sectionCounts[question.section] =
      (sectionCounts[question.section] || 0) + 1;

    // Validate ItemType
    const itemType = question.itemType as MyPreOpItemType;
    if (!itemType) {
      throw new Error(`Question ${question.id}: ItemType is required`);
    }
    if (!MYPREOP_ITEM_TYPES.includes(itemType)) {
      throw new Error(
        `Question ${question.id}: ItemType must be one of: ${MYPREOP_ITEM_TYPES.join(", ")} (got "${question.itemType}")`
      );
    }

    // Validate options based on item type
    if (ITEM_TYPES_REQUIRING_OPTIONS.includes(itemType)) {
      if (question.options.length < 2) {
        throw new Error(
          `Question ${question.id}: ${itemType} type requires at least 2 options (found ${question.options.length})`
        );
      }
    } else if (ITEM_TYPES_NO_OPTIONS.includes(itemType)) {
      if (question.options.length > 0) {
        warnings.push(
          `Question ${question.id}: ${itemType} type typically has no options`
        );
      }
    }

    // Validate helper fields
    if (question.hasHelper) {
      if (!question.helperType) {
        warnings.push(
          `Question ${question.id}: HasHelper is TRUE but HelperType is empty`
        );
      }
      if (!question.helperValue) {
        warnings.push(
          `Question ${question.id}: HasHelper is TRUE but HelperValue is empty`
        );
      }
    }

    // Validate Question text length
    if (question.questionText.length > 1000) {
      throw new Error(
        `Question ${question.id}: Question text exceeds 1000 character limit`
      );
    }

    // Warnings for many options
    if (question.options.length > 20) {
      warnings.push(
        `Question ${question.id}: More than 20 options may affect usability`
      );
    }

    // Warnings for long options
    question.options.forEach((opt, idx) => {
      if (opt.value.length > 100) {
        warnings.push(
          `Question ${question.id}: Option ${idx + 1} exceeds 100 characters`
        );
      }
    });

    questions.push(question);
  }

  // Check for single-question sections
  Object.entries(sectionCounts).forEach(([section, count]) => {
    if (count === 1) {
      warnings.push(`Section "${section}" has only 1 question`);
    }
  });

  return { questions, warnings };
}

// Helper to create a CSV row
function createRow(overrides: Partial<MyPreOpCsvRow> = {}): MyPreOpCsvRow {
  return {
    Id: "Q001",
    Section: "Who I Am",
    Page: "Personal Details",
    ItemType: "radio",
    Question: "Test question?",
    Option: "Yes",
    Characteristic: "test_char",
    Required: "TRUE",
    EnableWhen: "",
    HasHelper: "FALSE",
    HelperType: "",
    HelperName: "",
    HelperValue: "",
    ...overrides,
  };
}

describe("MyPreOp CSV Validation", () => {
  describe("row grouping", () => {
    it("should group rows by Id", () => {
      const rows: MyPreOpCsvRow[] = [
        createRow({ Id: "Q001", Option: "Male", Characteristic: "is_male" }),
        createRow({ Id: "Q001", Option: "Female", Characteristic: "is_female" }),
        createRow({ Id: "Q002", Option: "Yes", Characteristic: "yes" }),
        createRow({ Id: "Q002", Option: "No", Characteristic: "no" }),
      ];

      const groups = groupRowsByQuestion(rows);

      expect(groups.size).toBe(2);
      expect(groups.get("Q001")).toHaveLength(2);
      expect(groups.get("Q002")).toHaveLength(2);
    });

    it("should skip rows with empty Id", () => {
      const rows: MyPreOpCsvRow[] = [
        createRow({ Id: "Q001", Option: "Yes" }),
        createRow({ Id: "", Option: "No" }),
        createRow({ Id: "  ", Option: "Maybe" }),
      ];

      const groups = groupRowsByQuestion(rows);

      expect(groups.size).toBe(1);
      expect(groups.get("Q001")).toHaveLength(1);
    });
  });

  describe("rowsToQuestion conversion", () => {
    it("should aggregate options from multiple rows", () => {
      const rows: MyPreOpCsvRow[] = [
        createRow({ Option: "Male", Characteristic: "is_male" }),
        createRow({ Option: "Female", Characteristic: "is_female" }),
        createRow({ Option: "Other", Characteristic: "is_other" }),
      ];

      const question = rowsToQuestion(rows);

      expect(question.options).toHaveLength(3);
      expect(question.options[0]).toEqual({
        value: "Male",
        characteristic: "is_male",
      });
      expect(question.options[1]).toEqual({
        value: "Female",
        characteristic: "is_female",
      });
    });

    it("should parse boolean fields correctly", () => {
      const rows = [createRow({ Required: "TRUE", HasHelper: "FALSE" })];
      const question = rowsToQuestion(rows);

      expect(question.required).toBe(true);
      expect(question.hasHelper).toBe(false);
    });

    it("should handle case-insensitive boolean parsing", () => {
      const rows = [createRow({ Required: "true", HasHelper: "false" })];
      const question = rowsToQuestion(rows);

      expect(question.required).toBe(true);
      expect(question.hasHelper).toBe(false);
    });

    it("should normalize ItemType to lowercase", () => {
      const rows = [createRow({ ItemType: "RADIO" })];
      const question = rowsToQuestion(rows);

      expect(question.itemType).toBe("radio");
    });

    it("should handle empty options for text types", () => {
      const rows = [createRow({ ItemType: "text-field", Option: "" })];
      const question = rowsToQuestion(rows);

      expect(question.options).toHaveLength(0);
    });
  });

  describe("EnableWhen parsing", () => {
    it("should parse simple condition", () => {
      const result = parseEnableWhen("(patient_has_preferred_name=true)");

      expect(result).not.toBeNull();
      expect(result!.conditions).toHaveLength(1);
      expect(result!.conditions[0]).toEqual({
        characteristic: "patient_has_preferred_name",
        operator: "=",
        value: "true",
      });
    });

    it("should parse AND conditions", () => {
      const result = parseEnableWhen(
        "(patient_age<16) AND(patient_ageexistsnull)"
      );

      expect(result).not.toBeNull();
      expect(result!.logic).toBe("AND");
      expect(result!.conditions.length).toBeGreaterThanOrEqual(1);
    });

    it("should parse OR conditions", () => {
      const result = parseEnableWhen(
        "(patient_has_ethnicity-black_african_caribbean=true) OR(patient_has_ethnicity-prefer_not_to_disclose=true)"
      );

      expect(result).not.toBeNull();
      expect(result!.logic).toBe("OR");
      expect(result!.conditions.length).toBeGreaterThanOrEqual(1);
    });

    it("should return null for empty string", () => {
      expect(parseEnableWhen("")).toBeNull();
      expect(parseEnableWhen("   ")).toBeNull();
    });

    it("should parse less than operator", () => {
      const result = parseEnableWhen("(patient_age<16)");

      expect(result).not.toBeNull();
      expect(result!.conditions[0].operator).toBe("<");
      expect(result!.conditions[0].value).toBe("16");
    });
  });

  describe("question validation", () => {
    it("should reject empty questions array", () => {
      expect(() => validateQuestions([])).toThrow("No valid questions found");
    });

    it("should reject empty Section", () => {
      const rows = [createRow({ Section: "" })];
      expect(() => validateQuestions(rows)).toThrow("Section is empty");
    });

    it("should reject invalid ItemType", () => {
      const rows = [
        createRow({ ItemType: "dropdown", Option: "A" }),
        createRow({ Id: "Q001", ItemType: "dropdown", Option: "B" }),
      ];
      expect(() => validateQuestions(rows)).toThrow("ItemType must be one of");
    });

    it("should accept all valid item types", () => {
      for (const itemType of MYPREOP_ITEM_TYPES) {
        const rows =
          itemType === "radio" || itemType === "checkbox"
            ? [
                createRow({ ItemType: itemType, Option: "A", Characteristic: "a" }),
                createRow({ Id: "Q001", ItemType: itemType, Option: "B", Characteristic: "b" }),
              ]
            : [createRow({ ItemType: itemType, Option: "" })];

        expect(() => validateQuestions(rows)).not.toThrow();
      }
    });

    it("should reject radio type with fewer than 2 options", () => {
      const rows = [createRow({ ItemType: "radio", Option: "Only one" })];
      expect(() => validateQuestions(rows)).toThrow(
        "requires at least 2 options"
      );
    });

    it("should reject checkbox type with fewer than 2 options", () => {
      const rows = [createRow({ ItemType: "checkbox", Option: "Only one" })];
      expect(() => validateQuestions(rows)).toThrow(
        "requires at least 2 options"
      );
    });

    it("should accept text types with no options", () => {
      const textTypes = [
        "text-field",
        "text-area",
        "text-paragraph",
        "phone-number",
        "age",
        "number-input",
        "allergy-list",
      ];

      for (const itemType of textTypes) {
        const rows = [createRow({ ItemType: itemType, Option: "" })];
        expect(() => validateQuestions(rows)).not.toThrow();
      }
    });

    it("should reject question text over 1000 characters", () => {
      const rows = [
        createRow({
          Question: "a".repeat(1001),
          ItemType: "text-field",
          Option: "",
        }),
      ];
      expect(() => validateQuestions(rows)).toThrow(
        "exceeds 1000 character limit"
      );
    });
  });

  describe("warnings (non-blocking)", () => {
    it("should warn about more than 20 options", () => {
      const rows: MyPreOpCsvRow[] = [];
      for (let i = 0; i < 25; i++) {
        rows.push(
          createRow({
            Id: "Q001",
            ItemType: "radio",
            Option: `Option ${i}`,
            Characteristic: `char_${i}`,
          })
        );
      }

      const result = validateQuestions(rows);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("More than 20 options")
      );
    });

    it("should warn about options exceeding 100 characters", () => {
      const rows = [
        createRow({ Option: "a".repeat(101), Characteristic: "long" }),
        createRow({ Id: "Q001", Option: "Short", Characteristic: "short" }),
      ];

      const result = validateQuestions(rows);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("exceeds 100 characters")
      );
    });

    it("should warn about single-question sections", () => {
      const rows = [
        createRow({
          Section: "Lonely Section",
          ItemType: "text-field",
          Option: "",
        }),
      ];

      const result = validateQuestions(rows);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Section "Lonely Section" has only 1 question')
      );
    });

    it("should warn when HasHelper is TRUE but HelperType is empty", () => {
      const rows = [
        createRow({
          HasHelper: "TRUE",
          HelperType: "",
          HelperValue: "some value",
          ItemType: "text-field",
          Option: "",
        }),
      ];

      const result = validateQuestions(rows);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("HasHelper is TRUE but HelperType is empty")
      );
    });

    it("should warn when HasHelper is TRUE but HelperValue is empty", () => {
      const rows = [
        createRow({
          HasHelper: "TRUE",
          HelperType: "contentBlock",
          HelperValue: "",
          ItemType: "text-field",
          Option: "",
        }),
      ];

      const result = validateQuestions(rows);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("HasHelper is TRUE but HelperValue is empty")
      );
    });
  });

  describe("valid MyPreOp CSV data", () => {
    it("should validate a complete valid CSV", () => {
      const rows: MyPreOpCsvRow[] = [
        // Radio question with 2 options
        createRow({
          Id: "Q001",
          Section: "Who I Am",
          Page: "Personal Details",
          ItemType: "radio",
          Question: "Select your gender",
          Option: "Male",
          Characteristic: "patient_is_male",
          Required: "TRUE",
        }),
        createRow({
          Id: "Q001",
          Section: "Who I Am",
          Page: "Personal Details",
          ItemType: "radio",
          Question: "Select your gender",
          Option: "Female",
          Characteristic: "patient_is_female",
          Required: "TRUE",
        }),
        // Checkbox with multiple options
        createRow({
          Id: "Q002",
          Section: "Who I Am",
          Page: "Status",
          ItemType: "checkbox",
          Question: "Select your preferences",
          Option: "Option A",
          Characteristic: "pref_a",
          Required: "FALSE",
        }),
        createRow({
          Id: "Q002",
          Section: "Who I Am",
          Page: "Status",
          ItemType: "checkbox",
          Question: "Select your preferences",
          Option: "Option B",
          Characteristic: "pref_b",
          Required: "FALSE",
        }),
        // Text field
        createRow({
          Id: "Q003",
          Section: "Who I Am",
          Page: "Contact",
          ItemType: "text-field",
          Question: "Enter your name",
          Option: "",
          Characteristic: "patient_name",
          Required: "TRUE",
          EnableWhen: "(patient_is_male=true)",
        }),
        // Text area
        createRow({
          Id: "Q004",
          Section: "Who I Am",
          Page: "Contact",
          ItemType: "text-area",
          Question: "Additional comments",
          Option: "",
          Characteristic: "comments",
          Required: "FALSE",
        }),
      ];

      const result = validateQuestions(rows);

      expect(result.questions).toHaveLength(4);
      expect(result.questions[0].options).toHaveLength(2);
      expect(result.questions[1].options).toHaveLength(2);
      expect(result.questions[2].options).toHaveLength(0);
      expect(result.questions[3].options).toHaveLength(0);
    });

    it("should handle question with helper content", () => {
      const rows = [
        createRow({
          Id: "Q001",
          ItemType: "text-field",
          Option: "",
          HasHelper: "TRUE",
          HelperType: "contentBlock",
          HelperName: "Help Title",
          HelperValue: "<p>Some help content</p>",
        }),
      ];

      const result = validateQuestions(rows);

      expect(result.questions[0].hasHelper).toBe(true);
      expect(result.questions[0].helperType).toBe("contentBlock");
      expect(result.questions[0].helperName).toBe("Help Title");
      expect(result.questions[0].helperValue).toBe("<p>Some help content</p>");
      expect(result.warnings).toHaveLength(1); // Single section warning
    });

    it("should handle conditional EnableWhen", () => {
      const rows = [
        createRow({
          Id: "Q001",
          ItemType: "text-field",
          Option: "",
          EnableWhen: "(patient_has_preferred_name=true)",
        }),
      ];

      const result = validateQuestions(rows);

      expect(result.questions[0].enableWhen).not.toBeNull();
      expect(result.questions[0].enableWhen!.conditions).toHaveLength(1);
    });
  });
});
