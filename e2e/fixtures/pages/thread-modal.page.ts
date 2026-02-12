import { Page, Locator, expect } from "@playwright/test";

export class ThreadModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageTextarea: Locator;
  readonly sendButton: Locator;
  readonly closeButton: Locator;
  readonly nameError: Locator;
  readonly messageError: Locator;
  readonly emailError: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly commentBubbles: Locator;
  readonly adminBadges: Locator;
  readonly trustUserBadges: Locator;
  readonly characterCount: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use the modal panel which is actually visible, not the outer dialog wrapper
    this.modal = page.locator('[role="dialog"]');
    this.modalTitle = page.getByText("Suggestion Thread");
    this.nameInput = page.getByPlaceholder("Your name *");
    this.emailInput = page.getByPlaceholder("Email (optional)");
    this.messageTextarea = page.locator('[role="dialog"] textarea');
    // Send button - the button with "Send" text in the comment input area
    this.sendButton = page.getByRole("dialog").getByRole("button", { name: "Send" });
    // Close button is the X button in the header (has the close SVG icon)
    this.closeButton = page.locator('[role="dialog"]').locator('button').filter({ has: page.locator('svg path[d="M6 18L18 6M6 6l12 12"]') });
    this.nameError = page.getByText(/name is required/i);
    this.messageError = page.getByText(/message is required/i);
    this.emailError = page.getByText(/invalid email/i);
    this.loadingSpinner = page.locator('[role="dialog"] .loading.loading-spinner');
    this.emptyState = page.getByText(/no comments yet/i);
    this.commentBubbles = page.locator('[role="dialog"] .space-y-4 > div');
    this.adminBadges = page.locator('[role="dialog"] .badge-primary');
    this.trustUserBadges = page.locator('[role="dialog"] .badge-secondary');
    this.characterCount = page.locator("text=/\\d+\\/2000/");
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillMessage(message: string) {
    await this.messageTextarea.fill(message);
  }

  async send() {
    await this.sendButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async fillAndSend(data: { name: string; email?: string; message: string }) {
    await this.fillName(data.name);
    if (data.email) {
      await this.fillEmail(data.email);
    }
    await this.fillMessage(data.message);
    await this.send();
  }

  async expectOpen() {
    // Wait for the modal title to be visible - more reliable than checking dialog wrapper
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async expectClosed() {
    await expect(this.modalTitle).not.toBeVisible({ timeout: 5000 });
  }

  async expectNameError() {
    await expect(this.nameError).toBeVisible();
  }

  async expectMessageError() {
    await expect(this.messageError).toBeVisible();
  }

  async expectEmailError() {
    await expect(this.emailError).toBeVisible();
  }

  async expectNoErrors() {
    await expect(this.nameError).not.toBeVisible();
    await expect(this.messageError).not.toBeVisible();
    await expect(this.emailError).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async waitForLoaded() {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 10000 });
  }

  async getCommentCount(): Promise<number> {
    return await this.commentBubbles.count();
  }

  async getAdminCommentCount(): Promise<number> {
    return await this.adminBadges.count();
  }

  async getTrustUserCommentCount(): Promise<number> {
    return await this.trustUserBadges.count();
  }

  async expectCommentVisible(message: string) {
    await expect(this.modal.getByText(message)).toBeVisible();
  }

  async expectAuthorVisible(name: string) {
    await expect(this.modal.getByText(name)).toBeVisible();
  }

  async getNthCommentAuthorType(index: number): Promise<"admin" | "trust_user"> {
    const bubble = this.commentBubbles.nth(index);
    const hasAdminBadge = await bubble.locator(".badge-primary").isVisible();
    return hasAdminBadge ? "admin" : "trust_user";
  }

  async expectCommentsInOrder(expectedMessages: string[]) {
    const count = await this.getCommentCount();
    expect(count).toBe(expectedMessages.length);

    for (let i = 0; i < expectedMessages.length; i++) {
      const bubble = this.commentBubbles.nth(i);
      await expect(bubble.getByText(expectedMessages[i])).toBeVisible();
    }
  }
}
