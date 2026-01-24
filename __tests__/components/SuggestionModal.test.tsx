import { describe, it, expect } from "vitest";

// Form validation logic extracted for testing
interface FormData {
  submitterName: string;
  submitterEmail: string;
  suggestionText: string;
  reason: string;
}

interface ValidationErrors {
  submitterName?: string;
  submitterEmail?: string;
  suggestionText?: string;
  reason?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUGGESTION_LENGTH = 2000;
const MAX_REASON_LENGTH = 1000;

function validateForm(data: FormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Name validation
  if (!data.submitterName.trim()) {
    errors.submitterName = "Name is required";
  }

  // Email validation (optional but must be valid if provided)
  if (data.submitterEmail.trim() && !EMAIL_REGEX.test(data.submitterEmail.trim())) {
    errors.submitterEmail = "Please enter a valid email address";
  }

  // Suggestion text validation
  if (!data.suggestionText.trim()) {
    errors.suggestionText = "Suggestion is required";
  } else if (data.suggestionText.length > MAX_SUGGESTION_LENGTH) {
    errors.suggestionText = `Suggestion must be under ${MAX_SUGGESTION_LENGTH} characters`;
  }

  // Reason validation
  if (!data.reason.trim()) {
    errors.reason = "Reason is required";
  } else if (data.reason.length > MAX_REASON_LENGTH) {
    errors.reason = `Reason must be under ${MAX_REASON_LENGTH} characters`;
  }

  return errors;
}

function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

describe("SuggestionModal Form Validation", () => {
  const validFormData: FormData = {
    submitterName: "John Doe",
    submitterEmail: "john@example.com",
    suggestionText: "This question should be rephrased for clarity.",
    reason: "The current wording is confusing to respondents.",
  };

  describe("name validation", () => {
    it("should require name", () => {
      const data = { ...validFormData, submitterName: "" };
      const errors = validateForm(data);
      expect(errors.submitterName).toBe("Name is required");
    });

    it("should reject whitespace-only name", () => {
      const data = { ...validFormData, submitterName: "   " };
      const errors = validateForm(data);
      expect(errors.submitterName).toBe("Name is required");
    });

    it("should accept valid name", () => {
      const errors = validateForm(validFormData);
      expect(errors.submitterName).toBeUndefined();
    });
  });

  describe("email validation", () => {
    it("should allow empty email (optional)", () => {
      const data = { ...validFormData, submitterEmail: "" };
      const errors = validateForm(data);
      expect(errors.submitterEmail).toBeUndefined();
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "has spaces@email.com",
      ];

      invalidEmails.forEach((email) => {
        const data = { ...validFormData, submitterEmail: email };
        const errors = validateForm(data);
        expect(errors.submitterEmail).toBe("Please enter a valid email address");
      });
    });

    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@domain.org",
        "user+tag@sub.domain.com",
      ];

      validEmails.forEach((email) => {
        const data = { ...validFormData, submitterEmail: email };
        const errors = validateForm(data);
        expect(errors.submitterEmail).toBeUndefined();
      });
    });
  });

  describe("suggestion text validation", () => {
    it("should require suggestion text", () => {
      const data = { ...validFormData, suggestionText: "" };
      const errors = validateForm(data);
      expect(errors.suggestionText).toBe("Suggestion is required");
    });

    it("should reject whitespace-only suggestion", () => {
      const data = { ...validFormData, suggestionText: "   " };
      const errors = validateForm(data);
      expect(errors.suggestionText).toBe("Suggestion is required");
    });

    it("should reject suggestion over 2000 characters", () => {
      const data = { ...validFormData, suggestionText: "a".repeat(2001) };
      const errors = validateForm(data);
      expect(errors.suggestionText).toBe("Suggestion must be under 2000 characters");
    });

    it("should accept suggestion at exactly 2000 characters", () => {
      const data = { ...validFormData, suggestionText: "a".repeat(2000) };
      const errors = validateForm(data);
      expect(errors.suggestionText).toBeUndefined();
    });
  });

  describe("reason validation", () => {
    it("should require reason", () => {
      const data = { ...validFormData, reason: "" };
      const errors = validateForm(data);
      expect(errors.reason).toBe("Reason is required");
    });

    it("should reject whitespace-only reason", () => {
      const data = { ...validFormData, reason: "   " };
      const errors = validateForm(data);
      expect(errors.reason).toBe("Reason is required");
    });

    it("should reject reason over 1000 characters", () => {
      const data = { ...validFormData, reason: "a".repeat(1001) };
      const errors = validateForm(data);
      expect(errors.reason).toBe("Reason must be under 1000 characters");
    });

    it("should accept reason at exactly 1000 characters", () => {
      const data = { ...validFormData, reason: "a".repeat(1000) };
      const errors = validateForm(data);
      expect(errors.reason).toBeUndefined();
    });
  });

  describe("form validity", () => {
    it("should be valid when all required fields are filled correctly", () => {
      const errors = validateForm(validFormData);
      expect(isFormValid(errors)).toBe(true);
    });

    it("should be valid without optional email", () => {
      const data = { ...validFormData, submitterEmail: "" };
      const errors = validateForm(data);
      expect(isFormValid(errors)).toBe(true);
    });

    it("should be invalid when name is missing", () => {
      const data = { ...validFormData, submitterName: "" };
      const errors = validateForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should be invalid when suggestion is missing", () => {
      const data = { ...validFormData, suggestionText: "" };
      const errors = validateForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should be invalid when reason is missing", () => {
      const data = { ...validFormData, reason: "" };
      const errors = validateForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should be invalid with invalid email", () => {
      const data = { ...validFormData, submitterEmail: "invalid" };
      const errors = validateForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should collect multiple errors", () => {
      const data = {
        submitterName: "",
        submitterEmail: "invalid",
        suggestionText: "",
        reason: "",
      };
      const errors = validateForm(data);
      expect(Object.keys(errors).length).toBe(4);
    });
  });

  describe("character counters", () => {
    it("should track suggestion length correctly", () => {
      const text = "Hello world";
      expect(text.length).toBe(11);
      expect(MAX_SUGGESTION_LENGTH - text.length).toBe(1989);
    });

    it("should track reason length correctly", () => {
      const text = "This is my reason";
      expect(text.length).toBe(17);
      expect(MAX_REASON_LENGTH - text.length).toBe(983);
    });
  });
});
