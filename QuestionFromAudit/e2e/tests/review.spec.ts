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

    test("should display sections overview with correct counts", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Should show sections overview
      await reviewPage.expectSectionsView();

      // Should display 3 sections
      expect(await reviewPage.getSectionCount()).toBe(3);

      // Section cards should show names and question counts
      await expect(page.getByText("Personal Information")).toBeVisible();
      await expect(page.getByText("Medical History")).toBeVisible();
      await expect(page.getByText("Lifestyle")).toBeVisible();
    });

    test("should display questions from mocked API", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Click on Personal Information section to see questions
      await reviewPage.clickSection("Personal Information");
      await reviewPage.expectSectionQuestionsView("Personal Information");

      // Should show 2 questions in Personal Information section
      expect(await reviewPage.getQuestionCount()).toBe(2);
    });

    test("should display question metadata correctly", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section
      await reviewPage.clickSection("Personal Information");
      await reviewPage.expectSectionQuestionsView("Personal Information");

      // Check first question elements (question text, not questionId which isn't displayed)
      await expect(page.getByText("What is your age range?")).toBeVisible();
      // Use first() to avoid matching the category filter dropdown
      await expect(page.locator(".badge-ghost").getByText("Demographics").first()).toBeVisible();
    });

    test("should filter questions by search term", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Lifestyle section which has the exercise question
      await reviewPage.clickSection("Lifestyle");

      await reviewPage.searchQuestions("exercise");

      // Only the exercise question should be visible (1 in this section)
      expect(await reviewPage.getQuestionCount()).toBe(1);
      await expect(page.getByText("How often do you exercise?")).toBeVisible();
    });

    test("should filter questions by category", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Medical History section which has Health questions
      await reviewPage.clickSection("Medical History");
      await reviewPage.expectSectionQuestionsView("Medical History");

      await reviewPage.filterByCategory("Health");

      // Both questions in Medical History are Health category
      expect(await reviewPage.getQuestionCount()).toBe(2);
      await expect(page.getByText("Do you have any chronic conditions?")).toBeVisible();
      await expect(page.getByText("Please describe any additional health concerns")).toBeVisible();
    });

    test("should clear filters and show all questions", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section
      await reviewPage.clickSection("Personal Information");

      // Apply filters
      await reviewPage.searchQuestions("age");
      expect(await reviewPage.getQuestionCount()).toBe(1);

      // Clear filters
      await reviewPage.clearFilters();
      expect(await reviewPage.getQuestionCount()).toBe(2);
    });

    test("should show filter indication when filters applied", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section
      await reviewPage.clickSection("Personal Information");

      await reviewPage.filterByCategory("Demographics");

      // After filtering, the "Showing filtered results" text and clear button should appear
      await expect(page.getByText(/showing filtered results/i)).toBeVisible();
      await expect(reviewPage.clearFiltersButton).toBeVisible();
    });

    test("should display suggestion count badge", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section where first question has 2 suggestions
      await reviewPage.clickSection("Personal Information");

      // First question has 2 suggestions
      const count = await reviewPage.getSuggestionBadgeCount(0);
      expect(count).toBe(2);
    });

    test("should select question in edit panel when clicking question card", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to a section first
      await reviewPage.clickSection("Personal Information");

      // Click on a question to select it
      await reviewPage.selectQuestion(0);

      // The edit panel tabs should now be visible
      await expect(page.locator('[data-testid="tab-settings"]')).toBeVisible({ timeout: 10000 });
    });

    test("should render different answer types correctly", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section for radio buttons
      await reviewPage.clickSection("Personal Information");
      await expect(page.locator('input[type="radio"]').first()).toBeVisible();

      // Go back and navigate to Medical History for checkbox and text inputs
      await reviewPage.goBackToSections();
      await reviewPage.clickSection("Medical History");

      // Checkboxes for multi_select type
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();

      // Text input for text type
      await expect(
        page.locator('input[placeholder="Enter your answer..."]').first()
      ).toBeVisible();
    });

    test("should navigate back to sections and reset filters", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Navigate to a section
      await reviewPage.clickSection("Personal Information");
      await reviewPage.expectSectionQuestionsView("Personal Information");

      // Apply a search filter
      await reviewPage.searchQuestions("age");
      expect(await reviewPage.getQuestionCount()).toBe(1);

      // Go back to sections
      await reviewPage.goBackToSections();
      await reviewPage.expectSectionsView();

      // Navigate to same section again - filters should be reset
      await reviewPage.clickSection("Personal Information");
      expect(await reviewPage.getQuestionCount()).toBe(2);
    });

    test("should show aggregate suggestion count on section cards", async ({ page }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("test-link-id");
      await reviewPage.waitForLoad();

      // Personal Information section has 2 suggestions total (from Q001)
      const personalInfoCard = reviewPage.sectionCards.filter({ hasText: "Personal Information" });
      await expect(personalInfoCard.getByText("2 suggestions")).toBeVisible();

      // Medical History section has 1 suggestion (from Q003)
      const medicalHistoryCard = reviewPage.sectionCards.filter({ hasText: "Medical History" });
      await expect(medicalHistoryCard.getByText("1 suggestion")).toBeVisible();

      // Lifestyle section has 0 suggestions, so badge should not be shown
      const lifestyleCard = reviewPage.sectionCards.filter({ hasText: "Lifestyle" });
      await expect(lifestyleCard.locator(".badge-info")).not.toBeVisible();
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
