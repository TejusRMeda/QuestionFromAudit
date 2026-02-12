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
  readonly sectionCards: Locator;
  readonly backButton: Locator;
  readonly reviewTitle: Locator;

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
    this.sectionCards = page.locator('[data-testid="section-card"]');
    this.backButton = page.locator('[data-testid="back-button"]');
    this.reviewTitle = page.locator('[data-testid="review-title"]');
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
    // Legacy: For tests that still expect the old modal-based behavior
    // Now this just selects the question (clicks on the card)
    await this.selectQuestion(index);
  }

  async selectQuestion(index: number = 0) {
    // Click on the question card to select it for editing in the panel
    // Question cards have rounded-box and border classes
    const cards = this.questionCards;
    const card = cards.nth(index);
    // Click on the card's main area (not on interactive elements)
    await card.click({ position: { x: 10, y: 10 } });
  }

  async selectQuestionById(questionId: string) {
    // Select a specific question by its ID using the badge
    const card = this.questionCards.filter({ hasText: questionId });
    await card.click({ position: { x: 10, y: 10 } });
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
    // Trust name is shown in the subtitle when on sections view
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async waitForToast(message: string) {
    // Look for toast specifically (has role="status")
    await expect(this.page.locator('[role="status"]').getByText(message)).toBeVisible({ timeout: 10000 });
  }

  async getSuggestionBadgeCount(index: number = 0): Promise<number> {
    const badge = this.questionCards.nth(index).locator(".badge-info");
    const isVisible = await badge.isVisible();
    if (!isVisible) return 0;
    const text = await badge.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // Characteristic badges use amber styling with monospace font
  getCharacteristicBadges(questionIndex: number = 0): Locator {
    return this.questionCards.nth(questionIndex).locator(".badge.bg-amber-50");
  }

  async getCharacteristicBadgeTexts(questionIndex: number = 0): Promise<string[]> {
    const badges = this.getCharacteristicBadges(questionIndex);
    const count = await badges.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  async expectCharacteristicVisible(text: string) {
    await expect(this.page.locator(".badge.bg-amber-50").getByText(text)).toBeVisible();
  }

  async expectCharacteristicCount(questionIndex: number, expectedCount: number) {
    const badges = this.getCharacteristicBadges(questionIndex);
    await expect(badges).toHaveCount(expectedCount);
  }

  // Section navigation methods
  async clickSection(sectionName: string) {
    await this.sectionCards.filter({ hasText: sectionName }).click();
  }

  async goBackToSections() {
    await this.backButton.click();
  }

  async expectSectionsView() {
    await expect(this.reviewTitle).toContainText("Review Questionnaires");
    await expect(this.sectionCards.first()).toBeVisible();
    await expect(this.backButton).not.toBeVisible();
  }

  async expectSectionQuestionsView(sectionName: string) {
    await expect(this.reviewTitle).toContainText(sectionName);
    await expect(this.backButton).toBeVisible();
    await expect(this.sectionCards).toHaveCount(0);
  }

  async getSectionCount() {
    return await this.sectionCards.count();
  }
}
