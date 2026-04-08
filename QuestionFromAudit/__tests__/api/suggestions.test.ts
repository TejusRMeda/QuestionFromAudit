import { describe, it, expect } from "vitest";

// Types matching the API
interface SuggestionPayload {
  questionId: number;
  submitterName: string;
  submitterEmail?: string;
  suggestionText: string;
  reason: string;
}

interface UpdateSuggestionPayload {
  status?: string;
  internalComment?: string;
  responseMessage?: string;
}

const VALID_STATUSES = ["pending", "approved", "rejected"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extracted validation logic from suggestions API route
function validateSuggestionPayload(payload: SuggestionPayload): void {
  const { questionId, submitterName, submitterEmail, suggestionText, reason } = payload;

  // Validate questionId
  if (!questionId || typeof questionId !== "number") {
    throw new Error("Question ID is required and must be a number");
  }

  // Validate submitterName
  if (!submitterName || typeof submitterName !== "string" || !submitterName.trim()) {
    throw new Error("Submitter name is required");
  }

  // Validate submitterEmail (optional but must be valid if provided)
  if (submitterEmail && submitterEmail.trim()) {
    if (!EMAIL_REGEX.test(submitterEmail.trim())) {
      throw new Error("Invalid email format");
    }
  }

  // Validate suggestionText
  if (!suggestionText || typeof suggestionText !== "string" || !suggestionText.trim()) {
    throw new Error("Suggestion text is required");
  }

  if (suggestionText.length > 2000) {
    throw new Error("Suggestion text exceeds 2000 character limit");
  }

  // Validate reason
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    throw new Error("Reason is required");
  }

  if (reason.length > 1000) {
    throw new Error("Reason exceeds 1000 character limit");
  }
}

function validateUpdatePayload(payload: UpdateSuggestionPayload): void {
  const { status } = payload;

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
  }
}

describe("Suggestions API Validation", () => {
  describe("create suggestion validation", () => {
    const validPayload: SuggestionPayload = {
      questionId: 1,
      submitterName: "John Doe",
      submitterEmail: "john@example.com",
      suggestionText: "This question could be clearer.",
      reason: "The wording is confusing for non-native speakers.",
    };

    describe("questionId validation", () => {
      it("should reject missing questionId", () => {
        const payload = { ...validPayload, questionId: undefined as unknown as number };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Question ID is required"
        );
      });

      it("should reject non-number questionId", () => {
        const payload = { ...validPayload, questionId: "abc" as unknown as number };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Question ID is required and must be a number"
        );
      });

      it("should accept valid questionId", () => {
        expect(() => validateSuggestionPayload(validPayload)).not.toThrow();
      });
    });

    describe("submitterName validation", () => {
      it("should reject missing submitterName", () => {
        const payload = { ...validPayload, submitterName: "" };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Submitter name is required"
        );
      });

      it("should reject whitespace-only submitterName", () => {
        const payload = { ...validPayload, submitterName: "   " };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Submitter name is required"
        );
      });

      it("should accept valid submitterName", () => {
        const payload = { ...validPayload, submitterName: "Jane Smith" };
        expect(() => validateSuggestionPayload(payload)).not.toThrow();
      });
    });

    describe("submitterEmail validation", () => {
      it("should accept missing email (optional)", () => {
        const payload: SuggestionPayload = { ...validPayload, submitterEmail: undefined };
        expect(() => validateSuggestionPayload(payload)).not.toThrow();
      });

      it("should accept empty email", () => {
        const payload = { ...validPayload, submitterEmail: "" };
        expect(() => validateSuggestionPayload(payload)).not.toThrow();
      });

      it("should reject invalid email format", () => {
        const invalidEmails = [
          "notanemail",
          "missing@domain",
          "@nodomain.com",
          "spaces in@email.com",
          "no@dots",
        ];

        invalidEmails.forEach((email) => {
          const payload = { ...validPayload, submitterEmail: email };
          expect(() => validateSuggestionPayload(payload)).toThrow(
            "Invalid email format"
          );
        });
      });

      it("should accept valid email formats", () => {
        const validEmails = [
          "simple@example.com",
          "user.name@domain.org",
          "user+tag@example.co.uk",
          "123@numbers.com",
        ];

        validEmails.forEach((email) => {
          const payload = { ...validPayload, submitterEmail: email };
          expect(() => validateSuggestionPayload(payload)).not.toThrow();
        });
      });
    });

    describe("suggestionText validation", () => {
      it("should reject missing suggestionText", () => {
        const payload = { ...validPayload, suggestionText: "" };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Suggestion text is required"
        );
      });

      it("should reject suggestionText over 2000 characters", () => {
        const payload = { ...validPayload, suggestionText: "a".repeat(2001) };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Suggestion text exceeds 2000 character limit"
        );
      });

      it("should accept suggestionText at exactly 2000 characters", () => {
        const payload = { ...validPayload, suggestionText: "a".repeat(2000) };
        expect(() => validateSuggestionPayload(payload)).not.toThrow();
      });
    });

    describe("reason validation", () => {
      it("should reject missing reason", () => {
        const payload = { ...validPayload, reason: "" };
        expect(() => validateSuggestionPayload(payload)).toThrow("Reason is required");
      });

      it("should reject reason over 1000 characters", () => {
        const payload = { ...validPayload, reason: "a".repeat(1001) };
        expect(() => validateSuggestionPayload(payload)).toThrow(
          "Reason exceeds 1000 character limit"
        );
      });

      it("should accept reason at exactly 1000 characters", () => {
        const payload = { ...validPayload, reason: "a".repeat(1000) };
        expect(() => validateSuggestionPayload(payload)).not.toThrow();
      });
    });

    describe("complete valid payload", () => {
      it("should validate a complete valid suggestion", () => {
        expect(() => validateSuggestionPayload(validPayload)).not.toThrow();
      });

      it("should validate suggestion without optional email", () => {
        const payload: SuggestionPayload = { ...validPayload, submitterEmail: undefined };
        expect(() => validateSuggestionPayload(payload)).not.toThrow();
      });
    });
  });

  describe("update suggestion validation", () => {
    describe("status validation", () => {
      it("should accept valid status values", () => {
        VALID_STATUSES.forEach((status) => {
          expect(() => validateUpdatePayload({ status })).not.toThrow();
        });
      });

      it("should reject invalid status values", () => {
        const invalidStatuses = ["accepted", "denied", "completed", "open", ""];

        invalidStatuses.forEach((status) => {
          if (status !== "") {
            expect(() => validateUpdatePayload({ status })).toThrow(
              "Status must be one of"
            );
          }
        });
      });

      it("should accept update without status", () => {
        const payload = {
          internalComment: "Internal note",
          responseMessage: "Thank you for your suggestion",
        };
        expect(() => validateUpdatePayload(payload)).not.toThrow();
      });
    });

    describe("optional fields", () => {
      it("should accept internalComment", () => {
        const payload = {
          status: "approved",
          internalComment: "This is an internal note",
        };
        expect(() => validateUpdatePayload(payload)).not.toThrow();
      });

      it("should accept responseMessage", () => {
        const payload = {
          status: "approved",
          responseMessage: "We will implement this change",
        };
        expect(() => validateUpdatePayload(payload)).not.toThrow();
      });

      it("should accept all fields together", () => {
        const payload = {
          status: "approved",
          internalComment: "Good suggestion",
          responseMessage: "Thank you, we will implement this",
        };
        expect(() => validateUpdatePayload(payload)).not.toThrow();
      });
    });
  });
});
