import { test, expect } from "@playwright/test";
import { ReviewPage } from "../fixtures/pages/review.page";
import { SuggestionModal } from "../fixtures/pages/suggestion-modal.page";
import {
  mockProjectData,
  validSuggestion,
  mockSuggestionSubmitResponse,
} from "../fixtures/test-data";

test.describe("Suggestion Submission", () => {
  let reviewPage: ReviewPage;
  let suggestionModal: SuggestionModal;

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
    suggestionModal = new SuggestionModal(page);

    await reviewPage.goto("test-link-id");
    await reviewPage.waitForLoad();
  });

  test("should open suggestion modal with question context", async ({
    page,
  }) => {
    await reviewPage.clickSuggestChange(0);

    await suggestionModal.expectOpen();
    // Modal should show the question being suggested on (check within modal dialog)
    await expect(
      page.getByLabel("Suggest a Change").getByText("Q001")
    ).toBeVisible();
  });

  test("should close modal when clicking cancel", async () => {
    await reviewPage.clickSuggestChange(0);
    await suggestionModal.expectOpen();

    await suggestionModal.cancel();

    await suggestionModal.expectClosed();
  });

  test("should validate required fields on submit", async () => {
    await reviewPage.clickSuggestChange(0);

    // Try to submit empty form
    await suggestionModal.submit();

    // Should show validation errors
    await suggestionModal.expectNameError();
    await suggestionModal.expectSuggestionError();
    await suggestionModal.expectReasonError();
  });

  test("should validate email format", async ({ page }) => {
    await reviewPage.clickSuggestChange(0);

    await suggestionModal.fillName("Test User");
    await suggestionModal.fillEmail("invalid-email");
    await suggestionModal.fillSuggestion("Test suggestion");
    await suggestionModal.fillReason("Test reason");
    await suggestionModal.submit();

    await suggestionModal.expectEmailError();
  });

  test("should allow empty email field", async ({ page }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    await reviewPage.clickSuggestChange(0);

    await suggestionModal.fillName("Test User");
    await suggestionModal.fillSuggestion("Test suggestion");
    await suggestionModal.fillReason("Test reason");
    await suggestionModal.submit();

    // Should not show email error
    await expect(suggestionModal.emailError).not.toBeVisible();
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

    await reviewPage.clickSuggestChange(0);

    await suggestionModal.fillAndSubmit({
      name: validSuggestion.name,
      email: validSuggestion.email,
      suggestion: validSuggestion.suggestion,
      reason: validSuggestion.reason,
    });

    // Modal should close and success toast should appear
    await suggestionModal.expectClosed();
    await reviewPage.waitForToast("Suggestion submitted");
  });

  test("should clear form when modal is reopened", async ({ page }) => {
    await page.route("**/api/suggestions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionSubmitResponse),
        });
      }
    });

    // Submit first suggestion
    await reviewPage.clickSuggestChange(0);
    await suggestionModal.fillAndSubmit({
      name: "Test User",
      suggestion: "Test suggestion",
      reason: "Test reason",
    });

    // Open modal again
    await reviewPage.clickSuggestChange(0);
    await suggestionModal.expectOpen();

    // Form should be cleared
    await expect(suggestionModal.nameInput).toHaveValue("");
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

    await reviewPage.clickSuggestChange(0);
    await suggestionModal.fillAndSubmit({
      name: validSuggestion.name,
      suggestion: validSuggestion.suggestion,
      reason: validSuggestion.reason,
    });

    // Should show error toast (the server returns "Server error" message)
    await reviewPage.waitForToast("Server error");
  });

  test("should send correct data to API", async ({ page }) => {
    let capturedRequest: unknown;

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

    await reviewPage.clickSuggestChange(0);
    await suggestionModal.fillAndSubmit({
      name: "Test User",
      email: "test@example.com",
      suggestion: "My suggestion text",
      reason: "My reason text",
    });

    // Verify the request payload
    expect(capturedRequest).toMatchObject({
      submitterName: "Test User",
      submitterEmail: "test@example.com",
      suggestionText: "My suggestion text",
      reason: "My reason text",
    });
  });
});
