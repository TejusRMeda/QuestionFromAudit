import { describe, it, expect } from "vitest";
import { randomBytes } from "crypto";

// Extracted from upload route for testing
function generateSecureLinkId(): string {
  return randomBytes(16).toString("base64url");
}

describe("Link ID Generation", () => {
  describe("generateSecureLinkId", () => {
    it("should generate a string", () => {
      const id = generateSecureLinkId();
      expect(typeof id).toBe("string");
    });

    it("should generate IDs of consistent length", () => {
      // base64url of 16 bytes = 22 characters
      const id = generateSecureLinkId();
      expect(id.length).toBe(22);
    });

    it("should only contain URL-safe characters", () => {
      const id = generateSecureLinkId();
      // base64url uses A-Z, a-z, 0-9, -, _
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSecureLinkId());
      }
      // All 100 IDs should be unique
      expect(ids.size).toBe(100);
    });

    it("should not contain problematic URL characters", () => {
      for (let i = 0; i < 50; i++) {
        const id = generateSecureLinkId();
        expect(id).not.toContain("+");
        expect(id).not.toContain("/");
        expect(id).not.toContain("=");
        expect(id).not.toContain(" ");
      }
    });
  });
});
