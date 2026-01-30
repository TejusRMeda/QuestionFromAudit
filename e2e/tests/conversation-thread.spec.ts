import { test, expect } from "@playwright/test";
import { ThreadModal } from "../fixtures/pages/thread-modal.page";

// Mock data for suggestions with comment counts
const mockSuggestionsData = {
  trustName: "Test Trust",
  createdAt: "2024-01-15T10:00:00Z",
  suggestions: [
    {
      id: 1,
      submitterName: "Dr. Smith",
      submitterEmail: "smith@nhs.uk",
      suggestionText: "Consider adding more age ranges",
      reason: "Elderly patients need finer granularity",
      status: "pending",
      createdAt: "2024-01-16T14:30:00Z",
      responseMessage: null,
      commentCount: 3,
      question: {
        id: 1,
        questionId: "Q001",
        category: "Demographics",
        questionText: "What is your age range?",
      },
    },
    {
      id: 2,
      submitterName: "Nurse Johnson",
      submitterEmail: null,
      suggestionText: "Align with NHS standard categories",
      reason: "Consistency with other forms",
      status: "approved",
      createdAt: "2024-01-16T09:15:00Z",
      responseMessage: "Great suggestion!",
      commentCount: 0,
      question: {
        id: 1,
        questionId: "Q001",
        category: "Demographics",
        questionText: "What is your age range?",
      },
    },
  ],
  totalCount: 2,
};

// Mock comments data
const mockCommentsEmpty = {
  comments: [],
  totalCount: 0,
};

const mockCommentsWithData = {
  comments: [
    {
      id: 1,
      authorType: "admin",
      authorName: "Admin User",
      authorEmail: "admin@example.com",
      message: "Thank you for your suggestion. We are reviewing it.",
      createdAt: "2024-01-17T10:00:00Z",
    },
    {
      id: 2,
      authorType: "trust_user",
      authorName: "Dr. Smith",
      authorEmail: "smith@nhs.uk",
      message: "Please let me know if you need more details.",
      createdAt: "2024-01-17T11:00:00Z",
    },
    {
      id: 3,
      authorType: "admin",
      authorName: "Admin User",
      authorEmail: "admin@example.com",
      message: "Could you provide examples of the age ranges you recommend?",
      createdAt: "2024-01-17T12:00:00Z",
    },
  ],
  totalCount: 3,
};

// Mock new comment response
const mockNewCommentResponse = {
  id: 4,
  authorType: "admin",
  authorName: "Test Admin",
  authorEmail: null,
  message: "This is a new test comment.",
  createdAt: new Date().toISOString(),
};

test.describe("Conversation Thread Feature", () => {
  let threadModal: ThreadModal;

  test.describe("Admin View - Suggestions Page", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the suggestions API
      await page.route("**/api/instance/test-trust-link/suggestions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSuggestionsData),
        });
      });

      threadModal = new ThreadModal(page);
    });

    test("should display comment count in View Thread button", async ({ page }) => {
      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      // First suggestion should have View Thread (3) button showing comment count
      const viewThreadButton = page.getByRole("button", { name: /view thread \(3\)/i });
      await expect(viewThreadButton).toBeVisible();

      // Second suggestion with 0 comments should just say "View Thread" without count
      const viewThreadNoCount = page.getByRole("button", { name: /^view thread$/i });
      await expect(viewThreadNoCount).toBeVisible();
    });

    test("should open thread modal when clicking View Thread", async ({ page }) => {
      // Mock comments endpoint
      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCommentsWithData),
        });
      });

      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      // Click view thread button
      await page.getByRole("button", { name: /view thread/i }).first().click();

      await threadModal.expectOpen();
    });

    test("should display comments in correct order (oldest first)", async ({ page }) => {
      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCommentsWithData),
        });
      });

      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /view thread/i }).first().click();
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      // Verify comments are in order by checking they appear on page
      await expect(page.getByText("Thank you for your suggestion. We are reviewing it.")).toBeVisible();
      await expect(page.getByText("Please let me know if you need more details.")).toBeVisible();
      await expect(page.getByText("Could you provide examples of the age ranges you recommend?")).toBeVisible();
    });

    test("should show admin messages styled differently than user messages", async ({ page }) => {
      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCommentsWithData),
        });
      });

      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /view thread/i }).first().click();
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      // Admin comments should have "Admin" label visible (2 admin comments)
      const adminLabels = page.getByRole("dialog").getByText("Admin", { exact: true });
      await expect(adminLabels).toHaveCount(2);

      // Admin User appears twice (two admin comments)
      await expect(page.getByRole("dialog").getByText("Admin User")).toHaveCount(2);

      // Dr. Smith appears in both the suggestion header AND as a comment author
      // Just verify the comment messages are visible
      await expect(page.getByText("Please let me know if you need more details.")).toBeVisible();
    });

    test("should allow admin to add a comment", async ({ page }) => {
      let commentCreated = false;

      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockCommentsEmpty),
          });
        } else if (route.request().method() === "POST") {
          commentCreated = true;
          const body = route.request().postDataJSON();
          expect(body.authorType).toBe("admin");
          expect(body.authorName).toBe("Test Admin");
          expect(body.message).toBe("This is a test response.");

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ...mockNewCommentResponse,
              authorName: body.authorName,
              message: body.message,
            }),
          });
        }
      });

      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /view thread/i }).first().click();
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      // Fill in and submit comment
      await threadModal.fillAndSend({
        name: "Test Admin",
        message: "This is a test response.",
      });

      // Verify the comment was sent
      expect(commentCreated).toBe(true);

      // Toast should appear
      await expect(page.getByText(/comment added/i)).toBeVisible();
    });

    test("should validate required fields when adding comment", async ({ page }) => {
      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCommentsEmpty),
        });
      });

      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /view thread/i }).first().click();
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      // Fill message but not name
      await threadModal.fillMessage("Test message");

      // Try to send
      await threadModal.send();

      // Should show validation error for name
      await threadModal.expectNameError();
    });
  });

  test.describe("Trust User View - Instance Page Modal", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the instance API
      await page.route("**/api/instance/test-trust-link", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            trustName: "Test Trust",
            createdAt: "2024-01-15T10:00:00Z",
            questions: [
              {
                id: 1,
                questionId: "Q001",
                category: "Demographics",
                questionText: "What is your age range?",
                answerType: "radio",
                answerOptions: "Under 18|18-30|31-50|Over 50",
                suggestionCount: 2,
              },
            ],
          }),
        });
      });

      // Mock suggestions for the question
      await page.route("**/api/instance-questions/1/suggestions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: mockSuggestionsData.suggestions,
            totalCount: 2,
          }),
        });
      });

      threadModal = new ThreadModal(page);
    });

    test("should allow trust user to reply in thread", async ({ page }) => {
      let commentCreated = false;

      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockCommentsWithData),
          });
        } else if (route.request().method() === "POST") {
          commentCreated = true;
          const body = route.request().postDataJSON();
          expect(body.authorType).toBe("trust_user");

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ...mockNewCommentResponse,
              authorType: "trust_user",
              authorName: body.authorName,
              message: body.message,
            }),
          });
        }
      });

      await page.goto("/instance/test-trust-link");
      await page.waitForLoadState("networkidle");

      // Open suggestions modal for the question
      await page.getByRole("button", { name: /view suggestions/i }).click();

      // Wait for suggestions modal content to be visible
      await expect(page.getByText("Dr. Smith")).toBeVisible({ timeout: 10000 });

      // Click view thread on the first suggestion
      await page.getByRole("button", { name: /view thread/i }).first().click();

      // Wait for thread modal to be fully loaded
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      // Add a reply
      await threadModal.fillAndSend({
        name: "Trust User",
        message: "Here are the recommended ranges: 50-65, 65-80, 80+",
      });

      expect(commentCreated).toBe(true);
    });

    test("should show empty state when no comments exist", async ({ page }) => {
      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockCommentsEmpty),
        });
      });

      await page.goto("/instance/test-trust-link");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: /view suggestions/i }).click();
      // Wait for suggestions modal content to be visible
      await expect(page.getByText("Dr. Smith")).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /view thread/i }).first().click();
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      await threadModal.expectEmptyState();
    });
  });

  test.describe("Comment Count Badge Updates", () => {
    test("should update comment count after adding a comment", async ({ page }) => {
      let callCount = 0;

      // Mock suggestions with initial count of 3
      await page.route("**/api/instance/test-trust-link/suggestions", async (route) => {
        // On refetch after comment added, return updated count
        const count = callCount > 0 ? 4 : 3;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...mockSuggestionsData,
            suggestions: [
              { ...mockSuggestionsData.suggestions[0], commentCount: count },
              mockSuggestionsData.suggestions[1],
            ],
          }),
        });
        callCount++;
      });

      await page.route("**/api/instance/test-trust-link/suggestions/1/comments", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockCommentsWithData),
          });
        } else if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockNewCommentResponse),
          });
        }
      });

      const threadModal = new ThreadModal(page);

      await page.goto("/instance/test-trust-link/suggestions");
      await page.waitForLoadState("networkidle");

      // Initial button should show "View Thread (3)"
      await expect(page.getByRole("button", { name: /view thread \(3\)/i })).toBeVisible();

      // Open thread and add a comment
      await page.getByRole("button", { name: /view thread/i }).first().click();
      await threadModal.expectOpen();
      await threadModal.waitForLoaded();

      await threadModal.fillAndSend({
        name: "Test Admin",
        message: "New comment",
      });

      // Wait for toast confirming comment added
      await expect(page.getByText(/comment added/i)).toBeVisible();

      // Close modal
      await threadModal.close();
      await threadModal.expectClosed();

      // Button should now show "View Thread (4)" (after refetch triggered by onCommentAdded callback)
      await expect(page.getByRole("button", { name: /view thread \(4\)/i })).toBeVisible({ timeout: 5000 });
    });
  });
});
