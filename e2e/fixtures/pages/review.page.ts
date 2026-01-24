import { Page, Locator, expect } from "@playwright/test";

export class ReviewPage {
  readonly page: Page;
  readonly trustNameHeader: Locator;
  readonly questionCards: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly clearFiltersButton: Locator;
  readonly filterSummary: Locator;
  readonly suggestionModal: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trustNameHeader = page.locator("h1").first();
    this.questionCards = page.locator(".bg-base-100.rounded-box");
    this.searchInput = page.getByPlaceholder("Search questions...");
    this.categorySelect = page.locator("select");
    this.clearFiltersButton = page.getByRole("button", {
      name: /clear filters/i,
    });
    this.filterSummary = page.getByText(/Showing \d+ of \d+ questions/);
    this.suggestionModal = page.locator('[role="dialog"]');
    this.loadingSpinner = page.locator(".loading.loading-spinner");
    this.errorMessage = page.getByText("Unable to Load Project");
  }

  async goto(linkId: string) {
    await this.page.goto(`/review/${linkId}`);
  }

  async waitForLoad() {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 10000 });
  }

  async getQuestionCount() {
    return await this.questionCards.count();
  }

  async searchQuestions(term: string) {
    await this.searchInput.fill(term);
  }

  async filterByCategory(category: string) {
    await this.categorySelect.selectOption(category);
  }

  async clearFilters() {
    await this.clearFiltersButton.click();
  }

  async clickSuggestChange(index: number = 0) {
    await this.questionCards
      .nth(index)
      .getByRole("button", { name: /suggest change/i })
      .click();
  }

  async clickViewSuggestions(index: number = 0) {
    await this.questionCards
      .nth(index)
      .getByRole("button", { name: /view suggestions/i })
      .click();
  }

  async expectQuestionVisible(questionId: string) {
    await expect(this.page.getByText(questionId)).toBeVisible();
  }

  async expectQuestionNotVisible(questionId: string) {
    await expect(this.page.getByText(questionId)).not.toBeVisible();
  }

  async expectSuggestionModalOpen() {
    // Wait for modal content to be visible (more reliable than role="dialog" with Headless UI)
    await expect(
      this.page.getByRole("dialog").getByText(/suggest/i).first()
    ).toBeVisible({ timeout: 10000 });
  }

  async expectSuggestionModalClosed() {
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }

  async expectErrorPage() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectTrustName(name: string) {
    await expect(this.trustNameHeader).toContainText(name);
  }

  async waitForToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async getSuggestionBadgeCount(index: number = 0): Promise<number> {
    const badge = this.questionCards.nth(index).locator(".badge-info");
    const isVisible = await badge.isVisible();
    if (!isVisible) return 0;
    const text = await badge.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
