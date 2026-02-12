import { test, expect } from "@playwright/test";
import { ReviewPage } from "../fixtures/pages/review.page";
import { EditPanel } from "../fixtures/pages/edit-panel.page";
import {
  mockProjectData,
  mockSuggestionSubmitResponse,
} from "../fixtures/test-data";

// Skip these tests on mobile - the split-screen panel is desktop only
// Mobile uses a modal which has different behavior
test.describe("Suggestion Submission", () => {
  test.skip(({ isMobile }) => isMobile, "Split-screen panel is desktop only");

  let reviewPage: ReviewPage;
  let editPanel: EditPanel;

  test.beforeEach(async ({ page }) => {
    // Mock the review API
    await page.route("**/api/review/test-link-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProjectData),
      });
    });

    reviewPage = new ReviewPage(page);
    editPanel = new EditPanel(page);

    await reviewPage.goto("test-link-id");
    await reviewPage.waitForLoad();

    // Navigate to Personal Information section to access questions
    await reviewPage.clickSection("Personal Information");
    // Wait for section questions to load
    await page.waitForTimeout(500);
  });

  test("should show empty panel state when no question selected", async ({
    page,
  }) => {
    // The edit panel should show empty state
    await editPanel.expectEmptyState();
  });

  test("should show question in edit panel when clicked", async ({
    page,
  }) => {
    // Wait for questions to be visible
    await expect(page.locator('[data-testid^="question-card-"]').first()).toBeVisible({ timeout: 10000 });

    // Click on the first question
    await reviewPage.selectQuestion(0);

    // Wait for the tabs to appear (indicates panel is showing the question)
    await expect(page.locator('[data-testid="tab-settings"]')).toBeVisible({ timeout: 10000 });
  });

  test("should switch between tabs", async ({ page }) => {
    await reviewPage.selectQuestion(0);

    // Navigate through tabs
    await editPanel.goToTab("content");
    await expect(page.getByText(/question text/i).first()).toBeVisible();

    await editPanel.goToTab("help");
    await expect(page.getByText(/current helper/i)).toBeVisible();

    await editPanel.goToTab("logic");
    await expect(page.getByText(/conditional display logic/i)).toBeVisible();

    await editPanel.goToTab("review");
    await expect(page.getByText(/changes summary/i)).toBeVisible();
  });

  test("should show no changes message on review tab when no changes made", async ({
    page,
  }) => {
    await reviewPage.selectQuestion(0);
    await editPanel.goToTab("review");

    await editPanel.expectNoChanges();
    await editPanel.expectSubmitDisabled();
  });

  test("should enable submit when changes made and form filled", async ({
    page,
  }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a change - toggle required
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Go to review and fill form
    await editPanel.goToTab("review");
    await editPanel.fillName("Test User");
    // Notes must be at least 50 characters
    await editPanel.fillNotes(
      "This is a test note that is at least 50 characters long for validation."
    );

    await editPanel.expectSubmitEnabled();
  });

  test("should validate minimum notes length", async ({ page }) => {
    await reviewPage.selectQuestion(0);

    // Make a change
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Go to review with short notes
    await editPanel.goToTab("review");
    await editPanel.fillName("Test User");
    await editPanel.fillNotes("Too short"); // Less than 50 chars

    // Submit should be disabled
    await editPanel.expectSubmitDisabled();
  });

  test("should submit valid suggestion successfully", async ({ page }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a change
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Fill and submit
    await editPanel.fillAndSubmit({
      name: "Test User",
      email: "test@example.com",
      notes:
        "This is a test suggestion with enough characters to pass validation requirements.",
    });

    // Should show success toast
    await reviewPage.waitForToast("Suggestion submitted");
  });

  test("should handle API error gracefully", async ({ page }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Server error" }),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a change
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Fill and submit
    await editPanel.fillAndSubmit({
      name: "Test User",
      notes:
        "This is a test suggestion that should fail due to server error during submission.",
    });

    // Should show error toast
    await reviewPage.waitForToast("Server error");
  });

  test("should send correct data to API", async ({ page }) => {
    let capturedRequest: any;

    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        capturedRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a settings change
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Fill and submit
    await editPanel.fillAndSubmit({
      name: "Test User",
      email: "test@example.com",
      notes:
        "This is a detailed explanation of why I am suggesting this change to the question.",
    });

    // Wait for submission
    await reviewPage.waitForToast("Suggestion submitted");

    // Verify the request payload
    expect(capturedRequest).toBeDefined();
    expect(capturedRequest.submitterName).toBe("Test User");
    expect(capturedRequest.submitterEmail).toBe("test@example.com");
    expect(capturedRequest.reason).toContain("detailed explanation");
    expect(capturedRequest.componentChanges).toBeDefined();
    expect(capturedRequest.componentChanges.settings).toBeDefined();
    expect(capturedRequest.componentChanges.settings.required).toBeDefined();
  });

  test("should clear changes after successful submission", async ({ page }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a change
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Submit
    await editPanel.fillAndSubmit({
      name: "Test User",
      notes:
        "This is a test suggestion to verify that the form clears after submission.",
    });

    await reviewPage.waitForToast("Suggestion submitted");

    // Go back to review tab - should show no changes
    await editPanel.goToTab("review");
    await editPanel.expectNoChanges();
  });

  test("should allow email to be empty", async ({ page }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a change
    await editPanel.goToTab("settings");
    await editPanel.toggleRequired();

    // Submit without email
    await editPanel.fillAndSubmit({
      name: "Test User",
      // No email
      notes:
        "This is a test suggestion without an email address to verify optional field.",
    });

    // Should still succeed
    await reviewPage.waitForToast("Suggestion submitted");
  });

  test("should track content changes", async ({ page }) => {
    let capturedRequest: any;

    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        capturedRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.selectQuestion(0);

    // Make a content change - change question text
    await editPanel.goToTab("content");
    const textarea = page.locator("textarea").first();
    await textarea.fill("This is the new suggested question text");

    // Submit
    await editPanel.fillAndSubmit({
      name: "Test User",
      notes:
        "I am suggesting a change to the question text to make it clearer for users.",
    });

    await reviewPage.waitForToast("Suggestion submitted");

    // Verify content changes in payload
    expect(capturedRequest.componentChanges.content).toBeDefined();
    expect(capturedRequest.componentChanges.content.questionText).toBeDefined();
  });
});
