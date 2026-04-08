import { describe, it, expect } from "vitest";

// Types matching the API
interface CreateCommentPayload {
  authorType: string;
  authorName: string;
  authorEmail?: string | null;
  message: string;
}

const VALID_AUTHOR_TYPES = ["admin", "trust_user"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_AUTHOR_NAME_LENGTH = 100;

// Extracted validation logic from comments API route
function validateCreateCommentPayload(payload: CreateCommentPayload): void {
  const { authorType, authorName, authorEmail, message } = payload;

  // Validate authorType
  if (!authorType || !VALID_AUTHOR_TYPES.includes(authorType)) {
    throw new Error("Author type must be 'admin' or 'trust_user'");
  }

  // Validate authorName
  if (!authorName || typeof authorName !== "string" || !authorName.trim()) {
    throw new Error("Author name is required");
  }

  if (authorName.length > MAX_AUTHOR_NAME_LENGTH) {
    throw new Error(`Author name exceeds maximum length of ${MAX_AUTHOR_NAME_LENGTH} characters`);
  }

  // Validate message
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
  }

  // Validate authorEmail (optional but must be valid if provided)
  if (authorEmail && !EMAIL_REGEX.test(authorEmail)) {
    throw new Error("Invalid email format");
  }
}

// Mock API responses for GET endpoint
interface Comment {
  id: number;
  authorType: "admin" | "trust_user";
  authorName: string;
  authorEmail: string | null;
  message: string;
  createdAt: string;
}

interface GetCommentsResponse {
  comments: Comment[];
  totalCount: number;
}

function formatCommentsResponse(rawComments: Comment[]): GetCommentsResponse {
  return {
    comments: rawComments,
    totalCount: rawComments.length,
  };
}

describe("Comments API Validation", () => {
  describe("GET comments response formatting", () => {
    it("should return empty list when no comments exist", () => {
      const result = formatCommentsResponse([]);
      expect(result.comments).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it("should return all comments in order when comments exist", () => {
      const mockComments: Comment[] = [
        {
          id: 1,
          authorType: "admin",
          authorName: "Admin User",
          authorEmail: "admin@example.com",
          message: "First comment",
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          authorType: "trust_user",
          authorName: "Trust User",
          authorEmail: null,
          message: "Second comment",
          createdAt: "2024-01-15T11:00:00Z",
        },
      ];

      const result = formatCommentsResponse(mockComments);

      expect(result.comments).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.comments[0].id).toBe(1);
      expect(result.comments[1].id).toBe(2);
    });
  });

  describe("POST comment validation", () => {
    const validPayload: CreateCommentPayload = {
      authorType: "admin",
      authorName: "John Doe",
      authorEmail: "john@example.com",
      message: "This is a test comment.",
    };

    describe("authorName validation", () => {
      it("should reject missing authorName", () => {
        const payload = { ...validPayload, authorName: "" };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Author name is required"
        );
      });

      it("should reject whitespace-only authorName", () => {
        const payload = { ...validPayload, authorName: "   " };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Author name is required"
        );
      });

      it("should reject authorName over 100 characters", () => {
        const payload = { ...validPayload, authorName: "a".repeat(101) };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Author name exceeds maximum length of 100 characters"
        );
      });

      it("should accept valid authorName", () => {
        const payload = { ...validPayload, authorName: "Jane Smith" };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
      });
    });

    describe("message validation", () => {
      it("should reject missing message", () => {
        const payload = { ...validPayload, message: "" };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Message is required"
        );
      });

      it("should reject whitespace-only message", () => {
        const payload = { ...validPayload, message: "   " };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Message is required"
        );
      });

      it("should reject message over 2000 characters", () => {
        const payload = { ...validPayload, message: "a".repeat(2001) };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Message exceeds maximum length of 2000 characters"
        );
      });

      it("should accept message at exactly 2000 characters", () => {
        const payload = { ...validPayload, message: "a".repeat(2000) };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
      });
    });

    describe("authorType validation", () => {
      it("should reject missing authorType", () => {
        const payload = { ...validPayload, authorType: "" };
        expect(() => validateCreateCommentPayload(payload)).toThrow(
          "Author type must be 'admin' or 'trust_user'"
        );
      });

      it("should reject invalid authorType", () => {
        const invalidTypes = ["Admin", "user", "moderator", "ADMIN", "trust"];

        invalidTypes.forEach((authorType) => {
          const payload = { ...validPayload, authorType };
          expect(() => validateCreateCommentPayload(payload)).toThrow(
            "Author type must be 'admin' or 'trust_user'"
          );
        });
      });

      it("should accept valid authorType values", () => {
        VALID_AUTHOR_TYPES.forEach((authorType) => {
          const payload = { ...validPayload, authorType };
          expect(() => validateCreateCommentPayload(payload)).not.toThrow();
        });
      });
    });

    describe("authorEmail validation", () => {
      it("should accept missing email (optional)", () => {
        const payload: CreateCommentPayload = { ...validPayload, authorEmail: undefined };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
      });

      it("should accept null email", () => {
        const payload: CreateCommentPayload = { ...validPayload, authorEmail: null };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
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
          const payload = { ...validPayload, authorEmail: email };
          expect(() => validateCreateCommentPayload(payload)).toThrow(
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
          const payload = { ...validPayload, authorEmail: email };
          expect(() => validateCreateCommentPayload(payload)).not.toThrow();
        });
      });
    });

    describe("complete valid payload", () => {
      it("should validate a complete valid comment", () => {
        expect(() => validateCreateCommentPayload(validPayload)).not.toThrow();
      });

      it("should validate comment without optional email", () => {
        const payload: CreateCommentPayload = { ...validPayload, authorEmail: undefined };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
      });

      it("should validate admin comment", () => {
        const payload = { ...validPayload, authorType: "admin" };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
      });

      it("should validate trust_user comment", () => {
        const payload = { ...validPayload, authorType: "trust_user" };
        expect(() => validateCreateCommentPayload(payload)).not.toThrow();
      });
    });
  });
});
