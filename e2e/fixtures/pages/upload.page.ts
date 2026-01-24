import { Page, Locator, expect } from "@playwright/test";
import path from "path";

export class UploadPage {
  readonly page: Page;
  readonly trustNameInput: Locator;
  readonly fileDropzone: Locator;
  readonly fileInput: Locator;
  readonly createButton: Locator;
  readonly validationError: Locator;
  readonly warningsSection: Locator;
  readonly questionsReadyText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trustNameInput = page.getByPlaceholder(
      "Enter trust name (e.g., NHS Foundation Trust)"
    );
    this.fileDropzone = page.locator(".border-dashed").first();
    this.fileInput = page.locator('input[type="file"]');
    this.createButton = page.getByRole("button", { name: /create project/i });
    this.validationError = page.locator(".text-error");
    this.warningsSection = page.locator(".bg-warning\\/10");
    this.questionsReadyText = page.getByText(/questions ready to upload/);
  }

  async goto() {
    await this.page.goto("/upload");
  }

  async fillTrustName(name: string) {
    await this.trustNameInput.fill(name);
  }

  async uploadCSV(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async uploadCSVFromFixtures(filename: string) {
    const csvPath = path.join(__dirname, "../sample-csvs", filename);
    await this.uploadCSV(csvPath);
  }

  async submit() {
    await this.createButton.click();
  }

  async expectValidationError(message: string) {
    await expect(this.validationError).toContainText(message);
  }

  async expectNoValidationError() {
    await expect(this.validationError).not.toBeVisible();
  }

  async expectQuestionsReady(count: number) {
    await expect(this.questionsReadyText).toContainText(
      `${count} questions ready to upload`
    );
  }

  async expectRedirectToReview() {
    await expect(this.page).toHaveURL(/\/review\/.+/);
  }

  async expectWarnings() {
    await expect(this.warningsSection).toBeVisible();
  }

  async waitForToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
