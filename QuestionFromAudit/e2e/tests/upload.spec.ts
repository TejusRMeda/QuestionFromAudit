import { test, expect } from "@playwright/test";
import { UploadPage } from "../fixtures/pages/upload.page";
import path from "path";

test.describe("CSV Upload Flow", () => {
  let uploadPage: UploadPage;

  test.beforeEach(async ({ page }) => {
    uploadPage = new UploadPage(page);
    await uploadPage.goto();
  });

  test("should display upload page correctly", async ({ page }) => {
    await expect(page.getByText("Create New Project")).toBeVisible();
    await expect(uploadPage.trustNameInput).toBeVisible();
    await expect(uploadPage.createButton).toBeVisible();
  });

  test("should upload valid CSV and show questions count", async ({ page }) => {
    const csvPath = path.join(
      __dirname,
      "../fixtures/sample-csvs/valid.csv"
    );

    await uploadPage.fillTrustName("NHS Test Trust");
    await uploadPage.uploadCSV(csvPath);

    // Should show validation success
    await uploadPage.expectNoValidationError();
    await uploadPage.expectQuestionsReady(5);
  });

  test("should reject CSV with missing required columns", async ({ page }) => {
    const csvPath = path.join(
      __dirname,
      "../fixtures/sample-csvs/invalid-missing-columns.csv"
    );

    await uploadPage.fillTrustName("Test Trust");
    await uploadPage.uploadCSV(csvPath);

    await uploadPage.expectValidationError("Missing required columns");
  });

  test("should reject CSV with duplicate question IDs", async ({ page }) => {
    const csvPath = path.join(
      __dirname,
      "../fixtures/sample-csvs/invalid-duplicate-ids.csv"
    );

    await uploadPage.fillTrustName("Test Trust");
    await uploadPage.uploadCSV(csvPath);

    await uploadPage.expectValidationError("Duplicate Question_ID");
  });

  test("should keep button disabled without trust name", async ({ page }) => {
    const csvPath = path.join(
      __dirname,
      "../fixtures/sample-csvs/valid.csv"
    );

    // Upload CSV but don't fill trust name
    await uploadPage.uploadCSV(csvPath);

    // Button should remain disabled
    await expect(uploadPage.createButton).toBeDisabled();
  });

  test("should keep button disabled without CSV file", async ({ page }) => {
    // Fill trust name but don't upload CSV
    await uploadPage.fillTrustName("Test Trust");

    // Button should remain disabled
    await expect(uploadPage.createButton).toBeDisabled();
  });

  test("should show file name after upload", async ({ page }) => {
    const csvPath = path.join(
      __dirname,
      "../fixtures/sample-csvs/valid.csv"
    );

    await uploadPage.uploadCSV(csvPath);

    await expect(page.getByText("valid.csv")).toBeVisible();
  });

  test("should enable create button only when form is valid", async ({
    page,
  }) => {
    const csvPath = path.join(
      __dirname,
      "../fixtures/sample-csvs/valid.csv"
    );

    // Initially disabled
    await expect(uploadPage.createButton).toBeDisabled();

    // Add trust name only - still disabled
    await uploadPage.fillTrustName("Test Trust");
    await expect(uploadPage.createButton).toBeDisabled();

    // Add CSV - now enabled
    await uploadPage.uploadCSV(csvPath);
    await expect(uploadPage.createButton).toBeEnabled();
  });
});
