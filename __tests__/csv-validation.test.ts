import { describe, it, expect } from "vitest";

// Types matching the upload page
interface ParsedQuestion {
  Question_ID: string;
  Category: string;
  Question_Text: string;
  Answer_Type: string;
  Answer_Options: string;
}

interface ValidationResult {
  questions: ParsedQuestion[];
  warnings: string[];
}

const VALID_ANSWER_TYPES = ["text", "radio", "multi_select"];

// Extracted validation logic from upload page for testing
function validateQuestions(questions: ParsedQuestion[]): ValidationResult {
  const warnings: string[] = [];
  const questionIds = new Set<string>();
  const categoryCounts: Record<string, number> = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const rowNum = i + 2; // Account for header row

    // Required field validations
    if (!q.Question_ID?.trim()) {
      throw new Error(`Row ${rowNum}: Question_ID is empty`);
    }
    if (!q.Category?.trim()) {
      throw new Error(`Row ${rowNum}: Category is empty`);
    }
    if (!q.Question_Text?.trim()) {
      throw new Error(`Row ${rowNum}: Question_Text is empty`);
    }
    if (q.Question_Text.length > 1000) {
      throw new Error(`Row ${rowNum}: Question_Text exceeds 1000 character limit`);
    }
    if (questionIds.has(q.Question_ID)) {
      throw new Error(`Duplicate Question_ID found: ${q.Question_ID}`);
    }
    questionIds.add(q.Question_ID);

    // Track category counts for warnings
    categoryCounts[q.Category] = (categoryCounts[q.Category] || 0) + 1;

    // Answer_Type validation
    const answerType = q.Answer_Type?.trim().toLowerCase();
    if (!answerType) {
      throw new Error(`Row ${rowNum}: Answer_Type is required`);
    }
    if (!VALID_ANSWER_TYPES.includes(answerType)) {
      throw new Error(
        `Row ${rowNum}: Answer_Type must be one of: text, radio, multi_select (got "${q.Answer_Type}")`
      );
    }

    // Normalize Answer_Type to lowercase
    q.Answer_Type = answerType;

    // Answer_Options validation
    const answerOptions = q.Answer_Options?.trim() || "";

    if (answerType === "text") {
      if (answerOptions) {
        throw new Error(
          `Row ${rowNum}: Answer_Options must be empty for "text" type questions`
        );
      }
    } else {
      if (!answerOptions) {
        throw new Error(
          `Row ${rowNum}: Answer_Options is required for "${answerType}" type questions`
        );
      }

      const options = answerOptions.split("|").map((o) => o.trim()).filter(Boolean);

      if (options.length < 2) {
        throw new Error(
          `Row ${rowNum}: Answer_Options must have at least 2 options for "${answerType}" type (found ${options.length})`
        );
      }

      // Warnings (non-blocking)
      if (options.length > 20) {
        warnings.push(
          `Row ${rowNum} (${q.Question_ID}): More than 20 options may affect usability`
        );
      }

      options.forEach((opt, idx) => {
        if (opt.length > 100) {
          warnings.push(
            `Row ${rowNum} (${q.Question_ID}): Option ${idx + 1} exceeds 100 characters`
          );
        }
      });
    }
  }

  // Check for single-question categories (warning only)
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count === 1) {
      warnings.push(`Category "${cat}" has only 1 question`);
    }
  });

  return { questions, warnings };
}

function validateQuestionCount(questions: ParsedQuestion[]): void {
  if (questions.length === 0) {
    throw new Error("CSV file contains no data rows");
  }
  if (questions.length > 500) {
    throw new Error("CSV file exceeds maximum of 500 questions");
  }
}

describe("CSV Validation", () => {
  describe("question count validation", () => {
    it("should reject empty questions array", () => {
      expect(() => validateQuestionCount([])).toThrow("CSV file contains no data rows");
    });

    it("should reject more than 500 questions", () => {
      const questions = Array.from({ length: 501 }, (_, i) => ({
        Question_ID: `Q${i}`,
        Category: "Test",
        Question_Text: "Test question",
        Answer_Type: "text",
        Answer_Options: "",
      }));
      expect(() => validateQuestionCount(questions)).toThrow(
        "CSV file exceeds maximum of 500 questions"
      );
    });

    it("should accept valid question count", () => {
      const questions = Array.from({ length: 100 }, (_, i) => ({
        Question_ID: `Q${i}`,
        Category: "Test",
        Question_Text: "Test question",
        Answer_Type: "text",
        Answer_Options: "",
      }));
      expect(() => validateQuestionCount(questions)).not.toThrow();
    });
  });

  describe("required fields validation", () => {
    it("should reject empty Question_ID", () => {
      const questions = [
        {
          Question_ID: "",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow("Question_ID is empty");
    });

    it("should reject empty Category", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "",
          Question_Text: "Test question",
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow("Category is empty");
    });

    it("should reject empty Question_Text", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "",
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow("Question_Text is empty");
    });

    it("should reject Question_Text over 1000 characters", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "a".repeat(1001),
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        "Question_Text exceeds 1000 character limit"
      );
    });
  });

  describe("duplicate detection", () => {
    it("should reject duplicate Question_IDs", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "First question",
          Answer_Type: "text",
          Answer_Options: "",
        },
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Second question",
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        "Duplicate Question_ID found: Q001"
      );
    });
  });

  describe("answer type validation", () => {
    it("should reject missing Answer_Type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow("Answer_Type is required");
    });

    it("should reject invalid Answer_Type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "dropdown",
          Answer_Options: "A|B",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        'Answer_Type must be one of: text, radio, multi_select (got "dropdown")'
      );
    });

    it("should accept valid answer types", () => {
      VALID_ANSWER_TYPES.forEach((type) => {
        const questions = [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test question",
            Answer_Type: type,
            Answer_Options: type === "text" ? "" : "Option A|Option B",
          },
        ];
        expect(() => validateQuestions(questions)).not.toThrow();
      });
    });

    it("should normalize Answer_Type to lowercase", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "RADIO",
          Answer_Options: "A|B",
        },
      ];
      const result = validateQuestions(questions);
      expect(result.questions[0].Answer_Type).toBe("radio");
    });
  });

  describe("answer options validation", () => {
    it("should reject non-empty Answer_Options for text type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "text",
          Answer_Options: "Some options",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        'Answer_Options must be empty for "text" type questions'
      );
    });

    it("should reject missing Answer_Options for radio type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "radio",
          Answer_Options: "",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        'Answer_Options is required for "radio" type questions'
      );
    });

    it("should reject fewer than 2 options for radio type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "radio",
          Answer_Options: "Only one option",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        'Answer_Options must have at least 2 options for "radio" type'
      );
    });

    it("should reject fewer than 2 options for multi_select type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "multi_select",
          Answer_Options: "Single",
        },
      ];
      expect(() => validateQuestions(questions)).toThrow(
        'Answer_Options must have at least 2 options for "multi_select" type'
      );
    });

    it("should accept 2+ options for radio type", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "radio",
          Answer_Options: "Yes|No",
        },
      ];
      expect(() => validateQuestions(questions)).not.toThrow();
    });
  });

  describe("warnings (non-blocking)", () => {
    it("should warn about more than 20 options", () => {
      const manyOptions = Array.from({ length: 25 }, (_, i) => `Option ${i}`).join("|");
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "radio",
          Answer_Options: manyOptions,
        },
      ];
      const result = validateQuestions(questions);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("More than 20 options")
      );
    });

    it("should warn about options exceeding 100 characters", () => {
      const longOption = "a".repeat(101);
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Test",
          Question_Text: "Test question",
          Answer_Type: "radio",
          Answer_Options: `${longOption}|Short option`,
        },
      ];
      const result = validateQuestions(questions);
      expect(result.warnings).toContainEqual(
        expect.stringContaining("exceeds 100 characters")
      );
    });

    it("should warn about single-question categories", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Lonely Category",
          Question_Text: "Test question",
          Answer_Type: "text",
          Answer_Options: "",
        },
        {
          Question_ID: "Q002",
          Category: "Full Category",
          Question_Text: "Test question 2",
          Answer_Type: "text",
          Answer_Options: "",
        },
        {
          Question_ID: "Q003",
          Category: "Full Category",
          Question_Text: "Test question 3",
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];
      const result = validateQuestions(questions);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Category "Lonely Category" has only 1 question')
      );
    });
  });

  describe("valid CSV data", () => {
    it("should validate a complete valid CSV", () => {
      const questions = [
        {
          Question_ID: "Q001",
          Category: "Demographics",
          Question_Text: "What is your age?",
          Answer_Type: "radio",
          Answer_Options: "Under 18|18-30|31-50|Over 50",
        },
        {
          Question_ID: "Q002",
          Category: "Demographics",
          Question_Text: "What is your gender?",
          Answer_Type: "radio",
          Answer_Options: "Male|Female|Other|Prefer not to say",
        },
        {
          Question_ID: "Q003",
          Category: "Health",
          Question_Text: "Do you have any allergies?",
          Answer_Type: "multi_select",
          Answer_Options: "Peanuts|Dairy|Gluten|None",
        },
        {
          Question_ID: "Q004",
          Category: "Health",
          Question_Text: "Additional comments?",
          Answer_Type: "text",
          Answer_Options: "",
        },
      ];

      const result = validateQuestions(questions);
      expect(result.questions).toHaveLength(4);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
