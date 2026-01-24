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

  describe("stripe plans", () => {
    it("should have at least one plan", () => {
      expect(config.stripe.plans).toBeDefined();
      expect(Array.isArray(config.stripe.plans)).toBe(true);
      expect(config.stripe.plans.length).toBeGreaterThan(0);
    });

    it("each plan should have required fields", () => {
      config.stripe.plans.forEach((plan, index) => {
        expect(plan.priceId, `Plan ${index} missing priceId`).toBeDefined();
        expect(plan.name, `Plan ${index} missing name`).toBeDefined();
        expect(typeof plan.price, `Plan ${index} price not a number`).toBe("number");
      });
    });

    it("each plan should have positive price", () => {
      config.stripe.plans.forEach((plan, index) => {
        expect(plan.price, `Plan ${index} has non-positive price`).toBeGreaterThan(0);
      });
    });

    it("priceAnchor should be greater than price when defined", () => {
      config.stripe.plans.forEach((plan, index) => {
        if (plan.priceAnchor !== undefined) {
          expect(
            plan.priceAnchor,
            `Plan ${index} priceAnchor should be greater than price`
          ).toBeGreaterThan(plan.price);
        }
      });
    });

    it("should have at most one featured plan", () => {
      const featuredPlans = config.stripe.plans.filter((plan) => plan.isFeatured);
      expect(featuredPlans.length).toBeLessThanOrEqual(1);
    });

    it("each plan should have at least one feature", () => {
      config.stripe.plans.forEach((plan, index) => {
        expect(
          plan.features?.length,
          `Plan ${index} should have at least one feature`
        ).toBeGreaterThan(0);
      });
    });
  });

  describe("email format", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("fromNoReply should contain a valid email", () => {
      // Extract email from format like "Name <email@domain.com>"
      const match = config.resend.fromNoReply.match(/<([^>]+)>/) ||
        config.resend.fromNoReply.match(emailRegex);
      const email = match ? match[1] || match[0] : config.resend.fromNoReply;
      expect(email).toMatch(emailRegex);
    });

    it("fromAdmin should contain a valid email", () => {
      const match = config.resend.fromAdmin.match(/<([^>]+)>/) ||
        config.resend.fromAdmin.match(emailRegex);
      const email = match ? match[1] || match[0] : config.resend.fromAdmin;
      expect(email).toMatch(emailRegex);
    });

    it("supportEmail should be valid when defined", () => {
      if (config.resend.supportEmail) {
        expect(config.resend.supportEmail).toMatch(emailRegex);
      }
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

  describe("crisp config", () => {
    it("onlyShowOnRoutes should contain valid paths when defined", () => {
      if (config.crisp.onlyShowOnRoutes) {
        config.crisp.onlyShowOnRoutes.forEach((route) => {
          expect(route).toMatch(/^\//);
        });
      }
    });
  });
});
