import { Page, Locator, expect } from "@playwright/test";

export class SuggestionModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly suggestionTextarea: Locator;
  readonly reasonTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly nameError: Locator;
  readonly suggestionError: Locator;
  readonly reasonError: Locator;
  readonly emailError: Locator;
  readonly characterCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"]');
    this.nameInput = page.getByPlaceholder("Enter your name");
    this.emailInput = page.getByPlaceholder("Enter your email for updates");
    this.suggestionTextarea = page.getByPlaceholder("Describe your suggested change...");
    this.reasonTextarea = page.getByPlaceholder("Explain why this change would be beneficial...");
    this.submitButton = page.getByRole("button", { name: /submit suggestion/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.nameError = page.getByText(/name is required/i);
    this.suggestionError = page.getByText(/suggestion is required/i);
    this.reasonError = page.getByText(/reason is required/i);
    this.emailError = page.getByText(/valid email/i);
    this.characterCount = page.locator(".text-base-content\\/50");
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillSuggestion(text: string) {
    await this.suggestionTextarea.fill(text);
  }

  async fillReason(reason: string) {
    await this.reasonTextarea.fill(reason);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async fillAndSubmit(data: {
    name: string;
    email?: string;
    suggestion: string;
    reason: string;
  }) {
    await this.fillName(data.name);
    if (data.email) {
      await this.fillEmail(data.email);
    }
    await this.fillSuggestion(data.suggestion);
    await this.fillReason(data.reason);
    await this.submit();
  }

  async expectOpen() {
    // Wait for modal content (submit button) to be visible - more reliable with Headless UI
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }

  async expectClosed() {
    await expect(this.submitButton).not.toBeVisible();
  }

  async expectNameError() {
    await expect(this.nameError).toBeVisible();
  }

  async expectSuggestionError() {
    await expect(this.suggestionError).toBeVisible();
  }

  async expectReasonError() {
    await expect(this.reasonError).toBeVisible();
  }

  async expectEmailError() {
    await expect(this.emailError).toBeVisible();
  }

  async expectNoErrors() {
    await expect(this.nameError).not.toBeVisible();
    await expect(this.suggestionError).not.toBeVisible();
    await expect(this.reasonError).not.toBeVisible();
    await expect(this.emailError).not.toBeVisible();
  }
}
