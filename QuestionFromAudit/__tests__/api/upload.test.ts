import { describe, it, expect } from "vitest";

// Types matching the API
interface UploadQuestion {
  Question_ID: string;
  Category: string;
  Question_Text: string;
  Answer_Type: string;
  Answer_Options: string;
}

interface UploadPayload {
  trustName: string;
  questions: UploadQuestion[];
}

const VALID_ANSWER_TYPES = ["text", "radio", "multi_select"];

// Extracted validation logic from upload API route
function validateUploadPayload(payload: UploadPayload): void {
  const { trustName, questions } = payload;

  // Validate trust name
  if (!trustName || typeof trustName !== "string" || !trustName.trim()) {
    throw new Error("Trust name is required");
  }

  // Validate questions array
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new Error("Questions array is required and must not be empty");
  }

  if (questions.length > 500) {
    throw new Error("Maximum 500 questions allowed");
  }

  // Validate each question
  questions.forEach((q, index) => {
    const rowNum = index + 1;

    if (!q.Question_ID?.trim()) {
      throw new Error(`Question ${rowNum}: Question_ID is required`);
    }

    if (!q.Category?.trim()) {
      throw new Error(`Question ${rowNum}: Category is required`);
    }

    if (!q.Question_Text?.trim()) {
      throw new Error(`Question ${rowNum}: Question_Text is required`);
    }

    if (q.Question_Text.length > 1000) {
      throw new Error(`Question ${rowNum}: Question_Text exceeds 1000 characters`);
    }

    const answerType = q.Answer_Type?.trim().toLowerCase();
    if (!answerType || !VALID_ANSWER_TYPES.includes(answerType)) {
      throw new Error(
        `Question ${rowNum}: Answer_Type must be one of: text, radio, multi_select`
      );
    }

    // Validate answer options based on type
    if (answerType === "text") {
      if (q.Answer_Options?.trim()) {
        throw new Error(
          `Question ${rowNum}: Answer_Options must be empty for text type`
        );
      }
    } else {
      if (!q.Answer_Options?.trim()) {
        throw new Error(
          `Question ${rowNum}: Answer_Options is required for ${answerType} type`
        );
      }

      const options = q.Answer_Options.split("|").map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) {
        throw new Error(
          `Question ${rowNum}: At least 2 options required for ${answerType} type`
        );
      }
    }
  });
}

describe("Upload API Validation", () => {
  describe("trust name validation", () => {
    it("should reject missing trust name", () => {
      const payload = {
        trustName: "",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "text",
            Answer_Options: "",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).toThrow("Trust name is required");
    });

    it("should reject whitespace-only trust name", () => {
      const payload = {
        trustName: "   ",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "text",
            Answer_Options: "",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).toThrow("Trust name is required");
    });

    it("should accept valid trust name", () => {
      const payload = {
        trustName: "NHS Foundation Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "text",
            Answer_Options: "",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).not.toThrow();
    });
  });

  describe("questions array validation", () => {
    it("should reject missing questions", () => {
      const payload: UploadPayload = {
        trustName: "Test Trust",
        questions: [],
      };
      expect(() => validateUploadPayload(payload)).toThrow(
        "Questions array is required and must not be empty"
      );
    });

    it("should reject more than 500 questions", () => {
      const questions = Array.from({ length: 501 }, (_, i) => ({
        Question_ID: `Q${i}`,
        Category: "Test",
        Question_Text: "Test question",
        Answer_Type: "text",
        Answer_Options: "",
      }));
      const payload = { trustName: "Test Trust", questions };
      expect(() => validateUploadPayload(payload)).toThrow(
        "Maximum 500 questions allowed"
      );
    });

    it("should accept valid questions array", () => {
      const questions = Array.from({ length: 50 }, (_, i) => ({
        Question_ID: `Q${i}`,
        Category: "Test",
        Question_Text: "Test question",
        Answer_Type: "text",
        Answer_Options: "",
      }));
      const payload = { trustName: "Test Trust", questions };
      expect(() => validateUploadPayload(payload)).not.toThrow();
    });
  });

  describe("question field validation", () => {
    const baseQuestion = {
      Question_ID: "Q001",
      Category: "Test",
      Question_Text: "Test question?",
      Answer_Type: "text",
      Answer_Options: "",
    };

    it("should reject missing Question_ID", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [{ ...baseQuestion, Question_ID: "" }],
      };
      expect(() => validateUploadPayload(payload)).toThrow("Question_ID is required");
    });

    it("should reject missing Category", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [{ ...baseQuestion, Category: "" }],
      };
      expect(() => validateUploadPayload(payload)).toThrow("Category is required");
    });

    it("should reject missing Question_Text", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [{ ...baseQuestion, Question_Text: "" }],
      };
      expect(() => validateUploadPayload(payload)).toThrow("Question_Text is required");
    });

    it("should reject Question_Text over 1000 characters", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [{ ...baseQuestion, Question_Text: "a".repeat(1001) }],
      };
      expect(() => validateUploadPayload(payload)).toThrow(
        "Question_Text exceeds 1000 characters"
      );
    });
  });

  describe("answer type validation", () => {
    it("should reject invalid answer type", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "dropdown",
            Answer_Options: "A|B",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).toThrow(
        "Answer_Type must be one of: text, radio, multi_select"
      );
    });

    it("should accept text type with empty options", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "text",
            Answer_Options: "",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).not.toThrow();
    });

    it("should reject text type with non-empty options", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "text",
            Answer_Options: "Some option",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).toThrow(
        "Answer_Options must be empty for text type"
      );
    });

    it("should reject radio type without options", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "radio",
            Answer_Options: "",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).toThrow(
        "Answer_Options is required for radio type"
      );
    });

    it("should reject radio type with fewer than 2 options", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "radio",
            Answer_Options: "Only one",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).toThrow(
        "At least 2 options required for radio type"
      );
    });

    it("should accept radio type with 2+ options", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "radio",
            Answer_Options: "Yes|No",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).not.toThrow();
    });

    it("should accept multi_select type with options", () => {
      const payload = {
        trustName: "Test Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Test",
            Question_Text: "Test?",
            Answer_Type: "multi_select",
            Answer_Options: "A|B|C",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).not.toThrow();
    });
  });

  describe("complete valid payload", () => {
    it("should validate a complete valid upload payload", () => {
      const payload = {
        trustName: "NHS Foundation Trust",
        questions: [
          {
            Question_ID: "Q001",
            Category: "Demographics",
            Question_Text: "What is your age?",
            Answer_Type: "radio",
            Answer_Options: "Under 18|18-30|31-50|Over 50",
          },
          {
            Question_ID: "Q002",
            Category: "Health",
            Question_Text: "Any allergies?",
            Answer_Type: "multi_select",
            Answer_Options: "Peanuts|Dairy|Gluten|None",
          },
          {
            Question_ID: "Q003",
            Category: "Feedback",
            Question_Text: "Additional comments?",
            Answer_Type: "text",
            Answer_Options: "",
          },
        ],
      };
      expect(() => validateUploadPayload(payload)).not.toThrow();
    });
  });
});
