import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for the split-screen edit panel
 */
export class EditPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly tabs: {
    settings: Locator;
    content: Locator;
    help: Locator;
    logic: Locator;
    review: Locator;
  };
  // Review tab fields
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;
  readonly changesSummary: Locator;
  // Settings tab
  readonly requiredToggle: Locator;
  // Content tab
  readonly questionTextInput: Locator;
  readonly answerTypeSelect: Locator;
  // Empty state
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    // The edit panel is the right side of the split screen
    this.panel = page.locator('[class*="border-l"][class*="border-base-300"]').first();

    // Tab buttons - use data-testid for reliable selection
    this.tabs = {
      settings: page.locator('[data-testid="tab-settings"]'),
      content: page.locator('[data-testid="tab-content"]'),
      help: page.locator('[data-testid="tab-help"]'),
      logic: page.locator('[data-testid="tab-logic"]'),
      review: page.locator('[data-testid="tab-review"]'),
    };

    // Review tab form fields
    this.nameInput = page.getByPlaceholder("Enter your name");
    this.emailInput = page.getByPlaceholder("Enter your email for updates");
    this.notesTextarea = page.getByPlaceholder(/explain why/i);
    this.submitButton = page.getByRole("button", { name: /submit suggestion/i });
    this.changesSummary = page.getByText("Changes Summary").first();

    // Settings tab
    this.requiredToggle = page.locator('input[type="checkbox"].toggle').first();

    // Content tab
    this.questionTextInput = page.locator('textarea').first();
    this.answerTypeSelect = page.locator('select').first();

    // Empty state
    this.emptyState = page.getByText(/select a question/i);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  async expectQuestionSelected(questionId: string) {
    // The question ID should be visible in the panel header (badge)
    await expect(this.page.locator('.badge').getByText(questionId)).toBeVisible({ timeout: 10000 });
  }

  async goToTab(tab: "settings" | "content" | "help" | "logic" | "review") {
    await this.tabs[tab].click();
    // Wait for tab content to load
    await this.page.waitForTimeout(200);
  }

  async toggleRequired() {
    // Find the toggle in the settings tab
    const toggle = this.page.locator('.toggle.toggle-primary').first();
    await toggle.click();
  }

  async fillQuestionText(text: string) {
    await this.goToTab("content");
    // Find the textarea for suggested text (not the readonly current text)
    const textarea = this.page.locator('textarea').first();
    await textarea.fill(text);
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled({ timeout: 5000 });
  }

  async expectHasChanges() {
    // Check for green dot indicator on tabs
    await expect(this.page.locator(".bg-success.rounded-full")).toBeVisible();
  }

  async expectNoChanges() {
    await expect(this.page.getByText(/no changes have been made/i)).toBeVisible({ timeout: 5000 });
  }

  async fillAndSubmit(data: {
    name: string;
    email?: string;
    notes: string;
  }) {
    await this.goToTab("review");
    await this.fillName(data.name);
    if (data.email) {
      await this.fillEmail(data.email);
    }
    await this.fillNotes(data.notes);
    await this.submit();
  }
}
