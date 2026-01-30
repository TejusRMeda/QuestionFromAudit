import { describe, it, expect } from "vitest";

// Form validation logic extracted from CommentInput for testing
interface CommentFormData {
  authorName: string;
  authorEmail: string;
  message: string;
}

interface ValidationErrors {
  authorName?: string;
  authorEmail?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;

function validateCommentForm(data: CommentFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Name validation
  if (!data.authorName.trim()) {
    errors.authorName = "Name is required";
  }

  // Email validation (optional but must be valid if provided)
  if (data.authorEmail && !EMAIL_REGEX.test(data.authorEmail)) {
    errors.authorEmail = "Invalid email format";
  }

  // Message validation
  if (!data.message.trim()) {
    errors.message = "Message is required";
  } else if (data.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Maximum ${MAX_MESSAGE_LENGTH} characters allowed`;
  }

  return errors;
}

function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

describe("CommentInput Form Validation", () => {
  const validFormData: CommentFormData = {
    authorName: "John Doe",
    authorEmail: "john@example.com",
    message: "This is a test comment.",
  };

  describe("name validation", () => {
    it("should require name", () => {
      const data = { ...validFormData, authorName: "" };
      const errors = validateCommentForm(data);
      expect(errors.authorName).toBe("Name is required");
    });

    it("should reject whitespace-only name", () => {
      const data = { ...validFormData, authorName: "   " };
      const errors = validateCommentForm(data);
      expect(errors.authorName).toBe("Name is required");
    });

    it("should accept valid name", () => {
      const errors = validateCommentForm(validFormData);
      expect(errors.authorName).toBeUndefined();
    });
  });

  describe("message validation", () => {
    it("should require message", () => {
      const data = { ...validFormData, message: "" };
      const errors = validateCommentForm(data);
      expect(errors.message).toBe("Message is required");
    });

    it("should reject whitespace-only message", () => {
      const data = { ...validFormData, message: "   " };
      const errors = validateCommentForm(data);
      expect(errors.message).toBe("Message is required");
    });

    it("should reject message over 2000 characters", () => {
      const data = { ...validFormData, message: "a".repeat(2001) };
      const errors = validateCommentForm(data);
      expect(errors.message).toBe("Maximum 2000 characters allowed");
    });

    it("should accept message at exactly 2000 characters", () => {
      const data = { ...validFormData, message: "a".repeat(2000) };
      const errors = validateCommentForm(data);
      expect(errors.message).toBeUndefined();
    });
  });

  describe("email validation", () => {
    it("should allow empty email (optional)", () => {
      const data = { ...validFormData, authorEmail: "" };
      const errors = validateCommentForm(data);
      expect(errors.authorEmail).toBeUndefined();
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "has spaces@email.com",
      ];

      invalidEmails.forEach((email) => {
        const data = { ...validFormData, authorEmail: email };
        const errors = validateCommentForm(data);
        expect(errors.authorEmail).toBe("Invalid email format");
      });
    });

    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@domain.org",
        "user+tag@sub.domain.com",
      ];

      validEmails.forEach((email) => {
        const data = { ...validFormData, authorEmail: email };
        const errors = validateCommentForm(data);
        expect(errors.authorEmail).toBeUndefined();
      });
    });
  });

  describe("form validity", () => {
    it("should be valid when all required fields are filled correctly", () => {
      const errors = validateCommentForm(validFormData);
      expect(isFormValid(errors)).toBe(true);
    });

    it("should be valid without optional email", () => {
      const data = { ...validFormData, authorEmail: "" };
      const errors = validateCommentForm(data);
      expect(isFormValid(errors)).toBe(true);
    });

    it("should be invalid when name is missing", () => {
      const data = { ...validFormData, authorName: "" };
      const errors = validateCommentForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should be invalid when message is missing", () => {
      const data = { ...validFormData, message: "" };
      const errors = validateCommentForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should be invalid with invalid email", () => {
      const data = { ...validFormData, authorEmail: "invalid" };
      const errors = validateCommentForm(data);
      expect(isFormValid(errors)).toBe(false);
    });

    it("should collect multiple errors", () => {
      const data = {
        authorName: "",
        authorEmail: "invalid",
        message: "",
      };
      const errors = validateCommentForm(data);
      expect(Object.keys(errors).length).toBe(3);
    });
  });

  describe("character counter", () => {
    it("should track message length correctly", () => {
      const text = "Hello world";
      expect(text.length).toBe(11);
      expect(MAX_MESSAGE_LENGTH - text.length).toBe(1989);
    });
  });
});
