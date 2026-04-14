import { describe, it, expect } from "vitest";
import { buildTestingUrl, parseTestingConfig } from "@/lib/testingConfig";
import type { TestingConfig } from "@/types/testing";

function roundTrip(config: TestingConfig): TestingConfig {
  const url = buildTestingUrl("link-abc", config);
  const qs = url.split("?")[1] ?? "";
  return parseTestingConfig(new URLSearchParams(qs));
}

describe("testingConfig", () => {
  describe("buildTestingUrl", () => {
    it("returns the bare path when no controls are hidden and no locks are set", () => {
      const url = buildTestingUrl("link-abc", {
        hide: new Set(),
        lockedViewStyle: null,
      });
      expect(url).toBe("/instance/link-abc/testing");
    });

    it("encodes hidden controls as a comma list under ?h=", () => {
      const url = buildTestingUrl("link-abc", {
        hide: new Set(["style", "casod"]),
        lockedViewStyle: null,
      });
      // URLSearchParams escapes commas as %2C, but the parser decodes them.
      expect(decodeURIComponent(url)).toContain("h=style,casod");
    });

    it("encodes locked view style", () => {
      const url = buildTestingUrl("link-abc", {
        hide: new Set(),
        lockedViewStyle: "patient",
      });
      expect(url).toContain("v=patient");
    });

    it("prepends origin when provided", () => {
      const url = buildTestingUrl("link-abc", {
        hide: new Set(),
        lockedViewStyle: null,
      }, "https://example.com");
      expect(url).toBe("https://example.com/instance/link-abc/testing");
    });
  });

  describe("parseTestingConfig", () => {
    it("returns an empty config for empty params", () => {
      const cfg = parseTestingConfig(new URLSearchParams());
      expect(cfg.hide.size).toBe(0);
      expect(cfg.lockedViewStyle).toBeNull();
    });

    it("ignores unknown hide keys but keeps valid ones", () => {
      const cfg = parseTestingConfig(new URLSearchParams("h=style,bogus,casod"));
      expect(cfg.hide.has("style")).toBe(true);
      expect(cfg.hide.has("casod")).toBe(true);
      expect(cfg.hide.size).toBe(2);
    });

    it("ignores invalid view style values", () => {
      const cfg = parseTestingConfig(new URLSearchParams("v=invalid"));
      expect(cfg.lockedViewStyle).toBeNull();
    });

    it("accepts a Next-style searchParams object", () => {
      const cfg = parseTestingConfig({ h: "casod", v: "audit" });
      expect(cfg.hide.has("casod")).toBe(true);
      expect(cfg.lockedViewStyle).toBe("audit");
    });
  });

  describe("round-trip", () => {
    it("preserves a fully-populated config", () => {
      const original: TestingConfig = {
        hide: new Set(["style", "casod", "filters"]),
        lockedViewStyle: "patient",
      };
      const result = roundTrip(original);
      expect([...result.hide].sort()).toEqual([...original.hide].sort());
      expect(result.lockedViewStyle).toBe(original.lockedViewStyle);
    });

    it("preserves an empty config", () => {
      const original: TestingConfig = {
        hide: new Set(),
        lockedViewStyle: null,
      };
      const result = roundTrip(original);
      expect(result.hide.size).toBe(0);
      expect(result.lockedViewStyle).toBeNull();
    });
  });
});
