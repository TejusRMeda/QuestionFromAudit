import { describe, it, expect } from "vitest";
import config from "../config";

describe("config", () => {
  describe("required fields", () => {
    it("should have a non-empty appName", () => {
      expect(config.appName).toBeDefined();
      expect(typeof config.appName).toBe("string");
      expect(config.appName.trim().length).toBeGreaterThan(0);
    });

    it("should have a non-empty appDescription", () => {
      expect(config.appDescription).toBeDefined();
      expect(typeof config.appDescription).toBe("string");
      expect(config.appDescription.trim().length).toBeGreaterThan(0);
    });

    it("should have a non-empty domainName", () => {
      expect(config.domainName).toBeDefined();
      expect(typeof config.domainName).toBe("string");
      expect(config.domainName.trim().length).toBeGreaterThan(0);
    });
  });

  describe("domain format", () => {
    it("should not start with http:// or https://", () => {
      expect(config.domainName).not.toMatch(/^https?:\/\//);
    });

    it("should not end with a trailing slash", () => {
      expect(config.domainName).not.toMatch(/\/$/);
    });

    it("should be a valid domain format", () => {
      // Basic domain validation: at least one dot, no spaces
      expect(config.domainName).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/);
    });
  });

  describe("colors", () => {
    it("main color should be a valid hex color", () => {
      expect(config.colors.main).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("theme should be a valid DaisyUI theme or empty", () => {
      const validThemes = [
        "",
        "light",
        "dark",
        "cupcake",
        "bumblebee",
        "emerald",
        "corporate",
        "synthwave",
        "retro",
        "cyberpunk",
        "valentine",
        "halloween",
        "garden",
        "forest",
        "aqua",
        "lofi",
        "pastel",
        "fantasy",
        "wireframe",
        "black",
        "luxury",
        "dracula",
      ];
      expect(validThemes).toContain(config.colors.theme);
    });
  });

  describe("auth paths", () => {
    it("loginUrl should start with /", () => {
      expect(config.auth.loginUrl).toMatch(/^\//);
    });

    it("callbackUrl should start with /", () => {
      expect(config.auth.callbackUrl).toMatch(/^\//);
    });
  });

});
