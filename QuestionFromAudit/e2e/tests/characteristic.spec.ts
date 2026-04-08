import { test, expect } from "@playwright/test";
import { UploadPage } from "../fixtures/pages/upload.page";
import { ReviewPage } from "../fixtures/pages/review.page";
import { mockProjectData } from "../fixtures/test-data";
import path from "path";

const MYPREOP_CSV_PATH = path.join(
  __dirname,
  "../fixtures/sample-csvs/valid-mypreop.csv"
);

test.describe("Characteristic Upload and Display", () => {
  test.describe("CSV Parsing with MyPreOp Format", () => {
    test("should parse MyPreOp format CSV with characteristics", async ({
      page,
    }) => {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();

      await uploadPage.fillTrustName("Test Trust with Characteristics");
      await uploadPage.uploadCSV(MYPREOP_CSV_PATH);

      // Should show validation success - 3 unique questions
      await uploadPage.expectNoValidationError();
      await uploadPage.expectQuestionsReady(3);
    });

    test("should show file name after MyPreOp CSV upload", async ({ page }) => {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();

      const csvPath = MYPREOP_CSV_PATH;

      await uploadPage.uploadCSV(csvPath);

      await expect(page.getByText("valid-mypreop.csv")).toBeVisible();
    });
  });

  test.describe("API Request Contains Characteristics", () => {
    test("should include characteristics in upload API request payload", async ({
      page,
    }) => {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();

      const csvPath = MYPREOP_CSV_PATH;

      // Track the API request
      let uploadPayload: unknown = null;
      await page.route("**/api/upload", async (route, request) => {
        uploadPayload = JSON.parse(request.postData() || "{}");
        // Continue with the actual request
        await route.continue();
      });

      await uploadPage.fillTrustName("Test Trust");
      await uploadPage.uploadCSV(csvPath);
      await uploadPage.submit();

      // Wait for request to be captured
      await page.waitForResponse("**/api/upload");

      // Verify characteristics are in the payload
      expect(uploadPayload).toBeDefined();
      const payload = uploadPayload as {
        questions: Array<{
          id?: string;
          characteristic?: string | null;
          options?: Array<{ value: string; characteristic?: string }>;
        }>;
      };
      expect(payload.questions).toBeDefined();

      // Find the gender question (Q001) - uses `id` not `questionId`
      const genderQuestion = payload.questions.find(
        (q) => q.id === "Q001"
      );
      expect(genderQuestion).toBeDefined();
      // Characteristics are in options array for radio questions
      expect(genderQuestion?.options).toBeDefined();
      const genderChars = genderQuestion?.options?.map((o) => o.characteristic);
      expect(genderChars).toContain("patient_is_male");
      expect(genderChars).toContain("patient_is_female");

      // Verify the checkbox question has all characteristics in options
      const conditionsQuestion = payload.questions.find(
        (q) => q.id === "Q003"
      );
      expect(conditionsQuestion).toBeDefined();
      const conditionChars = conditionsQuestion?.options?.map((o) => o.characteristic);
      expect(conditionChars).toContain("patient_has_diabetes");
      expect(conditionChars).toContain("patient_has_asthma");

      // Verify text-field question has characteristic (in question-level field)
      const nameQuestion = payload.questions.find(
        (q) => q.id === "Q002"
      );
      expect(nameQuestion).toBeDefined();
      expect(nameQuestion?.characteristic).toBe("patients_preferred_name");
    });
  });

  test.describe("API Response Contains Characteristics", () => {
    test("should receive characteristics in review API response", async ({
      page,
    }) => {
      // Use waitForResponse to capture the review API response after upload
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();

      await uploadPage.fillTrustName("Test Trust");
      await uploadPage.uploadCSV(MYPREOP_CSV_PATH);

      // Start waiting for the review API response before clicking submit
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes("/api/review/") && response.status() === 200
      );

      await uploadPage.submit();

      // Wait for redirect and capture response
      await uploadPage.expectRedirectToReview();
      const response = await responsePromise;
      const data = await response.json();

      // Verify response contains questions with characteristics
      expect(data.questions).toBeDefined();
      expect(data.questions.length).toBe(3);

      // Check that at least one question has a characteristic
      const questionsWithCharacteristic = data.questions.filter(
        (q: { characteristic?: string | null }) =>
          q.characteristic !== null && q.characteristic !== undefined
      );
      expect(questionsWithCharacteristic.length).toBeGreaterThan(0);
    });
  });

  test.describe("Characteristic Display with Mocked API", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the review API with characteristic data
      await page.route("**/api/review/char-test-link", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProjectData),
        });
      });
    });

    test("should display characteristic badges for questions with characteristics", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("char-test-link");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section
      await reviewPage.clickSection("Personal Information");

      // First question should have characteristics (age ranges)
      await reviewPage.expectCharacteristicVisible("age_under_18");
    });

    test("should display multiple characteristics for radio questions", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("char-test-link");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section
      await reviewPage.clickSection("Personal Information");

      // Gender question (Q002, index 1 in this section) should show all 4 characteristics
      const characteristics = await reviewPage.getCharacteristicBadgeTexts(1);
      expect(characteristics).toContain("patient_is_male");
      expect(characteristics).toContain("patient_is_female");
    });

    test("should display characteristics for multi_select questions", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("char-test-link");
      await reviewPage.waitForLoad();

      // Navigate to Medical History section
      await reviewPage.clickSection("Medical History");

      // Chronic conditions question should have characteristics
      await reviewPage.expectCharacteristicVisible("patient_has_diabetes");
    });

    test("should display characteristic for text questions in header", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("char-test-link");
      await reviewPage.waitForLoad();

      // Navigate to Medical History section
      await reviewPage.clickSection("Medical History");

      // Text questions (Q004, index 1 in Medical History section) display characteristic in the header area
      // not alongside options (since there are none)
      await reviewPage.expectCharacteristicVisible("additional_health_concerns");
    });

    test("should not display characteristic badges when characteristic is null", async ({
      page,
    }) => {
      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("char-test-link");
      await reviewPage.waitForLoad();

      // Navigate to Lifestyle section
      await reviewPage.clickSection("Lifestyle");

      // Exercise question (index 0 in Lifestyle section) has null characteristic
      await reviewPage.expectCharacteristicCount(0, 0);
    });
  });

  test.describe("Full Flow Integration", () => {
    test("should upload MyPreOp CSV and display characteristics on review page", async ({
      page,
    }) => {
      const uploadPage = new UploadPage(page);
      await uploadPage.goto();

      const csvPath = MYPREOP_CSV_PATH;

      await uploadPage.fillTrustName("E2E Characteristic Test Trust");
      await uploadPage.uploadCSV(csvPath);

      // Verify questions parsed correctly
      await uploadPage.expectQuestionsReady(3);

      // Submit and navigate to review
      await uploadPage.submit();
      await uploadPage.expectRedirectToReview();

      // Now on review page - verify characteristics are displayed
      const reviewPage = new ReviewPage(page);
      await reviewPage.waitForLoad();

      // Verify the trust name is displayed in sections view
      await reviewPage.expectTrustName("E2E Characteristic Test Trust");

      // Navigate to "Who I Am" section (first section in the MyPreOp CSV)
      await reviewPage.clickSection("Who I Am");

      // Verify questions are displayed (2 questions in Who I Am section)
      expect(await reviewPage.getQuestionCount()).toBe(2);

      // Verify characteristics are visible
      // Gender question (radio) should have patient_is_male and patient_is_female
      await reviewPage.expectCharacteristicVisible("patient_is_male");
      await reviewPage.expectCharacteristicVisible("patient_is_female");

      // Text-field question (Q002) displays characteristic in header
      await reviewPage.expectCharacteristicVisible("patients_preferred_name");

      // Navigate to Health section to check checkbox characteristics
      await reviewPage.goBackToSections();
      await reviewPage.clickSection("Health");

      // Conditions question (checkbox) should have characteristics
      await reviewPage.expectCharacteristicVisible("patient_has_diabetes");
      await reviewPage.expectCharacteristicVisible("patient_has_asthma");
    });

    test("should preserve characteristics through search filter", async ({
      page,
    }) => {
      // Use mocked API for consistent data
      await page.route("**/api/review/filter-test-link", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProjectData),
        });
      });

      const reviewPage = new ReviewPage(page);
      await reviewPage.goto("filter-test-link");
      await reviewPage.waitForLoad();

      // Navigate to Personal Information section first
      await reviewPage.clickSection("Personal Information");

      // Search for "gender"
      await reviewPage.searchQuestions("gender");

      // Should only show the gender question
      expect(await reviewPage.getQuestionCount()).toBe(1);

      // Characteristics should still be visible
      await reviewPage.expectCharacteristicVisible("patient_is_male");
    });
  });

  test.describe("Debug: Characteristic Data Flow", () => {
    test("should log parsed question data with characteristics", async ({
      page,
    }) => {
      const consoleLogs: string[] = [];
      page.on("console", (msg) => {
        consoleLogs.push(msg.text());
      });

      const uploadPage = new UploadPage(page);
      await uploadPage.goto();

      const csvPath = MYPREOP_CSV_PATH;

      await uploadPage.fillTrustName("Debug Test Trust");
      await uploadPage.uploadCSV(csvPath);

      // Wait for parsing to complete
      await uploadPage.expectQuestionsReady(3);

      // Log captured console messages for debugging
      console.log("Console logs captured:", consoleLogs);

      // Verify no parsing errors
      const errorLogs = consoleLogs.filter(
        (log) =>
          log.toLowerCase().includes("error") &&
          !log.includes("favicon") &&
          !log.includes("404")
      );
      expect(errorLogs).toHaveLength(0);
    });
  });
});
