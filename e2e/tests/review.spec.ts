import { test, expect } from "@playwright/test";
import { ReviewPage } from "../fixtures/pages/review.page";
import { mockProjectData } from "../fixtures/test-data";

test.describe("Review Page", () => {
  test.describe("with mocked API", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the review API
      await page.route("**/api/review/test-link-id", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProjectData),
        });
      });
    });

    test("should display questions from mocked API", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      await reviewPage.expectTrustName("NHS Test Trust");
      expect(await reviewPage.getQuestionCount()).toBe(5);
    });

    test("should display question metadata correctly", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Check first question elements
      await expect(page.getByText("Q001")).toBeVisible();
      // Use first() to avoid matching the category filter dropdown
      await expect(page.locator(".badge-ghost").getByText("Demographics").first()).toBeVisible();
      await expect(page.getByText("What is your age range?")).toBeVisible();
    });

    test("should filter questions by search term", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      await reviewPage.searchQuestions("exercise");

      // Only the exercise question should be visible
      expect(await reviewPage.getQuestionCount()).toBe(1);
      await expect(page.getByText("How often do you exercise?")).toBeVisible();
    });

    test("should filter questions by category", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      await reviewPage.filterByCategory("Health");

      // Only Health questions should be visible
      expect(await reviewPage.getQuestionCount()).toBe(2);
      await expect(page.getByText("Q003")).toBeVisible();
      await expect(page.getByText("Q004")).toBeVisible();
    });

    test("should clear filters and show all questions", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Apply filters
      await reviewPage.searchQuestions("age");
      expect(await reviewPage.getQuestionCount()).toBe(1);

      // Clear filters
      await reviewPage.clearFilters();
      expect(await reviewPage.getQuestionCount()).toBe(5);
    });

    test("should show filter summary when filters applied", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      await reviewPage.filterByCategory("Demographics");

      await expect(reviewPage.filterSummary).toBeVisible();
      await expect(reviewPage.filterSummary).toContainText("2 of 5");
    });

    test("should display suggestion count badge", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // First question has 2 suggestions
      const count = await reviewPage.getSuggestionBadgeCount(0);
      expect(count).toBe(2);
    });

    test("should open suggestion modal when clicking Suggest Change", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      await reviewPage.clickSuggestChange(0);
      await reviewPage.expectSuggestionModalOpen();
    });

    test("should render different answer types correctly", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Radio buttons for radio type
      await expect(page.locator('input[type="radio"]').first()).toBeVisible();

      // Checkboxes for multi_select type
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();

      // Text input for text type
      await expect(
        page.locator('input[placeholder="Enter your answer..."]').first()
      ).toBeVisible();
    });
  });

  test.describe("error handling", () => {
    test("should show error page for invalid link", async ({ page }) => {
      await page.route("**/api/review/invalid-link", async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Project not found" }),
        });
      });

      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("invalid-link");

      await reviewPage.expectErrorPage();
    });

    test("should show error for server error", async ({ page }) => {
      await page.route("**/api/review/error-link", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal server error" }),
        });
      });

      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("error-link");

      await reviewPage.expectErrorPage();
    });
  });
});
