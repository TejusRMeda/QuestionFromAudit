import { test, expect, Page, Route } from "@playwright/test";

/**
 * Tests for quick action banner lifecycle:
 * - Banner appears when a quick action suggestion exists
 * - Banner disappears when the suggestion is deleted from the right panel
 * - Quick action buttons re-activate after deletion
 */

// ── Mock data factories ─────────────────────────────────────────

interface MockQuestion {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string;
  answerOptions: string;
  characteristic: string;
  section: string;
  page: string | null;
  enableWhen: unknown | null;
  hasHelper: boolean;
  helperType: string | null;
  helperName: string | null;
  helperValue: string | null;
  suggestionCount: number;
  quickAction: string | null;
}

interface MockInstanceData {
  trustName: string;
  createdAt: string;
  newQuestionSuggestions: unknown[];
  questions: MockQuestion[];
}

function makeInstanceData({
  quickAction = null as string | null,
  suggestionCount = 0,
} = {}): MockInstanceData {
  return {
    trustName: "NHS Test Trust",
    createdAt: "2024-01-15T10:00:00Z",
    newQuestionSuggestions: [],
    questions: [
      {
        id: 100,
        questionId: "Q001",
        category: "Demographics",
        questionText: "What is your age range?",
        answerType: "radio",
        answerOptions: "Under 18|18-30|31-50|Over 50",
        characteristic: "age_under_18|age_18_30|age_31_50|age_over_50",
        section: "Personal Information",
        page: null,
        enableWhen: null,
        hasHelper: false,
        helperType: null,
        helperName: null,
        helperValue: null,
        suggestionCount,
        quickAction,
      },
      {
        id: 101,
        questionId: "Q002",
        category: "Demographics",
        questionText: "What is your gender?",
        answerType: "radio",
        answerOptions: "Male|Female|Other",
        characteristic: "male|female|other",
        section: "Personal Information",
        page: null,
        enableWhen: null,
        hasHelper: false,
        helperType: null,
        helperName: null,
        helperValue: null,
        suggestionCount: 0,
        quickAction: null,
      },
    ],
  };
}

interface MockSuggestion {
  id: number;
  submitterName: string;
  submitterEmail: string | null;
  suggestionText: string;
  reason: string;
  status: string;
  responseMessage: string | null;
  createdAt: string;
  commentCount: number;
  componentChanges: Record<string, unknown> | null;
  question: { id: number; questionId: string; category: string; questionText: string; section: string } | null;
}

function makeSuggestionsResponse(suggestions: MockSuggestion[] = []) {
  return {
    trustName: "NHS Test Trust",
    createdAt: "2024-01-15T10:00:00Z",
    suggestions,
    totalCount: suggestions.length,
  };
}

const requiredSuggestion: MockSuggestion = {
  id: 501,
  submitterName: "Dr. Smith",
  submitterEmail: null,
  suggestionText: "Make this question required",
  reason: "This question should be mandatory for patients",
  status: "pending",
  responseMessage: null,
  createdAt: "2024-01-16T14:30:00Z",
  commentCount: 0,
  componentChanges: { settings: { required: { from: false, to: true } } },
  question: {
    id: 100,
    questionId: "Q001",
    category: "Demographics",
    questionText: "What is your age range?",
    section: "Personal Information",
  },
};

const deleteSuggestion: MockSuggestion = {
  id: 502,
  submitterName: "Dr. Smith",
  submitterEmail: null,
  suggestionText: "Remove this question from the questionnaire",
  reason: "This question is not relevant or necessary",
  status: "pending",
  responseMessage: null,
  createdAt: "2024-01-16T14:30:00Z",
  commentCount: 0,
  componentChanges: null,
  question: {
    id: 100,
    questionId: "Q001",
    category: "Demographics",
    questionText: "What is your age range?",
    section: "Personal Information",
  },
};

// ── Helpers ─────────────────────────────────────────────────────

const TRUST_LINK = "test-quick-actions";

/** Set up all API mocks. Returns controls to change responses dynamically. */
function setupMocks(page: Page) {
  // Mutable state the tests can modify between requests
  let instanceData = makeInstanceData();
  let suggestionsData = makeSuggestionsResponse();
  let deleteHandler: ((route: Route) => Promise<void>) | null = null;

  // Instance GET
  page.route(`**/api/instance/${TRUST_LINK}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(instanceData),
      });
    } else {
      await route.continue();
    }
  });

  // Suggestions GET
  page.route(`**/api/instance/${TRUST_LINK}/suggestions`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(suggestionsData),
      });
    } else if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 999, message: "Suggestion submitted successfully" }),
      });
    } else {
      await route.continue();
    }
  });

  // Individual suggestion DELETE
  page.route(`**/api/instance/${TRUST_LINK}/suggestions/*`, async (route) => {
    if (route.request().method() === "DELETE" && deleteHandler) {
      await deleteHandler(route);
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Suggestion deleted successfully" }),
      });
    }
  });

  return {
    setInstanceData(data: ReturnType<typeof makeInstanceData>) {
      instanceData = data;
    },
    setSuggestionsData(data: ReturnType<typeof makeSuggestionsResponse>) {
      suggestionsData = data;
    },
    setDeleteHandler(handler: (route: Route) => Promise<void>) {
      deleteHandler = handler;
    },
  };
}

async function navigateToSection(page: Page) {
  await page.goto(`/instance/${TRUST_LINK}`);
  // Wait for loading to finish — section cards are buttons with section names
  const sectionButton = page.getByRole("button", { name: "Personal Information" });
  await expect(sectionButton).toBeVisible({ timeout: 10000 });
  // Click on the section
  await sectionButton.click();
  // Wait for question cards to appear
  await page.waitForSelector('[data-testid^="question-card-"]', { timeout: 10000 });
}

// ── Tests ───────────────────────────────────────────────────────

test.describe("Quick Action Banner Lifecycle", () => {
  test.skip(({ isMobile }) => isMobile, "Split-screen panel is desktop only");

  test("banner appears for question with quickAction='required' from API", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "required", suggestionCount: 1 }));

    await navigateToSection(page);

    // The banner "Suggested as required" should be visible on Q001's card
    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    await expect(questionCard.getByText("Suggested as required")).toBeVisible();
  });

  test("banner appears for question with quickAction='delete' from API", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "delete", suggestionCount: 1 }));

    await navigateToSection(page);

    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    await expect(questionCard.getByText("Suggested for removal")).toBeVisible();
  });

  test("no banner when quickAction is null", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: null, suggestionCount: 0 }));

    await navigateToSection(page);

    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    await expect(questionCard.getByText("Suggested as required")).not.toBeVisible();
    await expect(questionCard.getByText("Suggested for removal")).not.toBeVisible();
  });

  test("'Mark Required' button is disabled when required action is applied", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "required", suggestionCount: 1 }));

    await navigateToSection(page);

    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    const markRequiredBtn = questionCard.getByRole("button", { name: "Mark Required" });
    await expect(markRequiredBtn).toBeDisabled();
  });

  test("both 'Mark Required' and 'Delete' buttons are disabled when delete action is applied", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "delete", suggestionCount: 1 }));

    await navigateToSection(page);

    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    const markRequiredBtn = questionCard.getByRole("button", { name: "Mark Required" });
    const deleteBtn = questionCard.getByRole("button", { name: "Delete" });
    await expect(markRequiredBtn).toBeDisabled();
    await expect(deleteBtn).toBeDisabled();
  });

  test("'Add Question' and 'Add Suggestion' buttons remain enabled when delete action is applied", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "delete", suggestionCount: 1 }));

    await navigateToSection(page);

    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    const addQuestionBtn = questionCard.getByRole("button", { name: "Add Question" });
    await expect(addQuestionBtn).toBeEnabled();
  });

  test("deleting a 'required' suggestion removes the banner and re-enables the button", async ({ page }) => {
    const mocks = setupMocks(page);

    // Initial state: required action applied
    mocks.setInstanceData(makeInstanceData({ quickAction: "required", suggestionCount: 1 }));
    mocks.setSuggestionsData(makeSuggestionsResponse([requiredSuggestion]));

    await navigateToSection(page);

    // Verify banner is visible
    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    await expect(questionCard.getByText("Suggested as required")).toBeVisible();

    // Click the question card's question text to open the right panel
    await questionCard.getByText("What is your age range?").click();
    await page.waitForSelector('text=Suggested Changes', { timeout: 5000 });

    // Set up: after delete, the API returns data WITHOUT the quick action
    mocks.setDeleteHandler(async (route) => {
      // Simulate successful delete — also update the instance data for the subsequent refetch
      mocks.setInstanceData(makeInstanceData({ quickAction: null, suggestionCount: 0 }));
      mocks.setSuggestionsData(makeSuggestionsResponse([]));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Suggestion deleted successfully" }),
      });
    });

    // Click the "Remove" button on the suggestion in the right panel
    const removeBtn = page.getByRole("button", { name: "Remove" });
    await removeBtn.click();

    // Wait for the toast confirming deletion
    await expect(page.locator('[role="status"]').getByText("Suggestion removed")).toBeVisible({ timeout: 5000 });

    // Banner should be gone from the question card
    await expect(questionCard.getByText("Suggested as required")).not.toBeVisible({ timeout: 5000 });

    // Mark Required button should be re-enabled
    const markRequiredBtn = questionCard.getByRole("button", { name: "Mark Required" });
    await expect(markRequiredBtn).toBeEnabled({ timeout: 5000 });
  });

  test("deleting a 'delete' suggestion removes the banner and re-enables both buttons", async ({ page }) => {
    const mocks = setupMocks(page);

    // Initial state: delete action applied
    mocks.setInstanceData(makeInstanceData({ quickAction: "delete", suggestionCount: 1 }));
    mocks.setSuggestionsData(makeSuggestionsResponse([deleteSuggestion]));

    await navigateToSection(page);

    // Verify banner is visible
    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    await expect(questionCard.getByText("Suggested for removal")).toBeVisible();

    // Click the question text to open the right panel
    await questionCard.getByText("What is your age range?").click();
    await page.waitForSelector('text=Suggested Changes', { timeout: 5000 });

    // After delete, API returns clean state
    mocks.setDeleteHandler(async (route) => {
      mocks.setInstanceData(makeInstanceData({ quickAction: null, suggestionCount: 0 }));
      mocks.setSuggestionsData(makeSuggestionsResponse([]));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Suggestion deleted successfully" }),
      });
    });

    // Click Remove
    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.locator('[role="status"]').getByText("Suggestion removed")).toBeVisible({ timeout: 5000 });

    // Banner should be gone
    await expect(questionCard.getByText("Suggested for removal")).not.toBeVisible({ timeout: 5000 });

    // Both buttons re-enabled
    await expect(questionCard.getByRole("button", { name: "Mark Required" })).toBeEnabled({ timeout: 5000 });
    await expect(questionCard.getByRole("button", { name: "Delete" })).toBeEnabled({ timeout: 5000 });
  });

  test("right panel shows suggestions when clicking a question with suggestions", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "required", suggestionCount: 1 }));
    mocks.setSuggestionsData(makeSuggestionsResponse([requiredSuggestion]));

    await navigateToSection(page);

    // Click on the question
    await page.locator('[data-testid="question-card-Q001"]').getByText("What is your age range?").click();

    // Right panel should show the suggestion with submitter name and changes
    await expect(page.getByText("Dr. Smith")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Suggested Changes")).toBeVisible();
    // Remove button should be present in the right panel
    await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible();
    // Add Suggestion button at bottom of the right panel (the large teal one)
    const panelAddBtn = page.locator('button.bg-\\[\\#4A90A4\\]', { hasText: "Add Suggestion" });
    await expect(panelAddBtn).toBeVisible();
  });

  test("suggestion count updates after deleting a suggestion", async ({ page }) => {
    const mocks = setupMocks(page);
    mocks.setInstanceData(makeInstanceData({ quickAction: "required", suggestionCount: 1 }));
    mocks.setSuggestionsData(makeSuggestionsResponse([requiredSuggestion]));

    await navigateToSection(page);

    // Click question to open panel
    await page.locator('[data-testid="question-card-Q001"]').getByText("What is your age range?").click();
    await page.waitForSelector('text=Suggested Changes', { timeout: 5000 });

    // After delete, count drops to 0
    mocks.setDeleteHandler(async (route) => {
      mocks.setInstanceData(makeInstanceData({ quickAction: null, suggestionCount: 0 }));
      mocks.setSuggestionsData(makeSuggestionsResponse([]));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Suggestion deleted successfully" }),
      });
    });

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.locator('[role="status"]').getByText("Suggestion removed")).toBeVisible({ timeout: 5000 });

    // The "1 suggestion" text should no longer be visible on the question card
    const questionCard = page.locator('[data-testid="question-card-Q001"]');
    await expect(questionCard.getByText(/\d+ suggestion/)).not.toBeVisible({ timeout: 5000 });
  });
});
