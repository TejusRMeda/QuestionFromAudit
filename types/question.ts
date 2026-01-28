/**
 * MyPreOp CSV format types
 *
 * The MyPreOp format uses 13 columns where each option for a question
 * gets its own row (same Id repeated), not pipe-separated in one row.
 */

/**
 * Raw CSV row as parsed from MyPreOp format
 */
export interface MyPreOpCsvRow {
  Id: string;
  Section: string;
  Page: string;
  ItemType: string;
  Question: string;
  Option: string;
  Characteristic: string;
  Required: string;
  EnableWhen: string;
  HasHelper: string;
  HelperType: string;
  HelperName: string;
  HelperValue: string;
}

/**
 * Conditional display logic parsed from EnableWhen column
 * Examples:
 * - "(patient_has_preferred_name=true)" -> { conditions: [{ characteristic: "patient_has_preferred_name", operator: "=", value: "true" }], logic: "AND" }
 * - "(patient_is_female=true) AND(patient_has_sex-male=true)" -> { conditions: [...], logic: "AND" }
 */
export interface EnableWhenCondition {
  characteristic: string;
  operator: string;
  value?: string;
}

export interface EnableWhen {
  conditions: EnableWhenCondition[];
  logic: "AND" | "OR";
}

/**
 * Option with its characteristic identifier
 */
export interface QuestionOption {
  value: string;
  characteristic?: string;
}

/**
 * Parsed and grouped question from MyPreOp CSV
 * Multiple rows with same Id are grouped into one question with multiple options
 */
export interface ParsedQuestion {
  id: string;
  section: string;
  page: string;
  itemType: string;
  questionText: string;
  options: QuestionOption[];
  required: boolean;
  enableWhen: EnableWhen | null;
  hasHelper: boolean;
  helperType: string | null;
  helperName: string | null;
  helperValue: string | null;
}

/**
 * Valid answer/item types for MyPreOp format
 */
export const MYPREOP_ITEM_TYPES = [
  "radio",
  "checkbox",
  "text-field",
  "text-area",
  "text-paragraph",
  "phone-number",
  "age",
  "number-input",
  "allergy-list",
] as const;

export type MyPreOpItemType = (typeof MYPREOP_ITEM_TYPES)[number];

/**
 * Item types that require options (2+ for radio/checkbox)
 */
export const ITEM_TYPES_REQUIRING_OPTIONS: MyPreOpItemType[] = ["radio", "checkbox"];

/**
 * Item types that should have empty options
 */
export const ITEM_TYPES_NO_OPTIONS: MyPreOpItemType[] = [
  "text-field",
  "text-area",
  "text-paragraph",
  "phone-number",
  "age",
  "number-input",
  "allergy-list",
];

/**
 * Required columns for MyPreOp CSV format
 */
export const MYPREOP_REQUIRED_COLUMNS = [
  "Id",
  "Section",
  "Page",
  "ItemType",
  "Question",
  "Option",
  "Characteristic",
  "Required",
  "EnableWhen",
  "HasHelper",
  "HelperType",
  "HelperName",
  "HelperValue",
] as const;

/**
 * Parse EnableWhen string into structured object
 *
 * Examples:
 * - "(patient_has_preferred_name=true)"
 * - "(patient_is_female=true) AND(patient_has_sex-male=true)"
 * - "(patient_has_ethnicity-black_african_caribbean=true) OR(patient_has_ethnicity-prefer_not_to_disclose=true)"
 * - "(patient_age<16) AND(patient_ageexistsnull)"
 */
export function parseEnableWhen(enableWhenStr: string): EnableWhen | null {
  if (!enableWhenStr || !enableWhenStr.trim()) {
    return null;
  }

  const str = enableWhenStr.trim();

  // Determine logic type (AND or OR)
  const hasAnd = str.includes(" AND") || str.includes(")AND");
  const hasOr = str.includes(" OR") || str.includes(")OR");
  const logic: "AND" | "OR" = hasOr ? "OR" : "AND";

  // Split by AND or OR, handling both space-separated and concatenated forms
  const parts = str.split(/\s*(?:AND|OR)\s*|\)(?:AND|OR)\(/);

  const conditions: EnableWhenCondition[] = [];

  for (const part of parts) {
    // Clean up the part - remove parentheses
    const cleaned = part.replace(/^\(|\)$/g, "").trim();
    if (!cleaned) continue;

    // Parse condition: characteristic operator value
    // Patterns: "characteristic=value", "characteristic<value", "characteristicexistsvalue"
    let match = cleaned.match(/^([^=<>!]+)(=|<|>|<=|>=|!=|exists)(.*)$/);

    if (match) {
      conditions.push({
        characteristic: match[1].trim(),
        operator: match[2],
        value: match[3]?.trim() || undefined,
      });
    } else {
      // If no operator found, treat whole thing as a characteristic check
      conditions.push({
        characteristic: cleaned,
        operator: "exists",
      });
    }
  }

  if (conditions.length === 0) {
    return null;
  }

  return { conditions, logic };
}

/**
 * Group CSV rows by Id to create parsed questions
 * Multiple rows with same Id become one question with multiple options
 */
export function groupRowsByQuestion(rows: MyPreOpCsvRow[]): Map<string, MyPreOpCsvRow[]> {
  const groups = new Map<string, MyPreOpCsvRow[]>();

  for (const row of rows) {
    const id = row.Id?.trim();
    if (!id) continue;

    if (!groups.has(id)) {
      groups.set(id, []);
    }
    groups.get(id)!.push(row);
  }

  return groups;
}

/**
 * Convert grouped rows into a ParsedQuestion
 */
export function rowsToQuestion(rows: MyPreOpCsvRow[]): ParsedQuestion {
  if (rows.length === 0) {
    throw new Error("Cannot create question from empty rows");
  }

  // Take question-level fields from the first row
  const firstRow = rows[0];

  // Aggregate options from all rows
  const options: QuestionOption[] = [];
  for (const row of rows) {
    const optionValue = row.Option?.trim();
    if (optionValue) {
      options.push({
        value: optionValue,
        characteristic: row.Characteristic?.trim() || undefined,
      });
    }
  }

  // Parse boolean fields
  const required = firstRow.Required?.trim().toUpperCase() === "TRUE";
  const hasHelper = firstRow.HasHelper?.trim().toUpperCase() === "TRUE";

  return {
    id: firstRow.Id.trim(),
    section: firstRow.Section?.trim() || "",
    page: firstRow.Page?.trim() || "",
    itemType: firstRow.ItemType?.trim().toLowerCase() || "",
    questionText: firstRow.Question?.trim() || "",
    options,
    required,
    enableWhen: parseEnableWhen(firstRow.EnableWhen),
    hasHelper,
    helperType: hasHelper && firstRow.HelperType?.trim() ? firstRow.HelperType.trim() : null,
    helperName: hasHelper && firstRow.HelperName?.trim() ? firstRow.HelperName.trim() : null,
    helperValue: hasHelper && firstRow.HelperValue?.trim() ? firstRow.HelperValue.trim() : null,
  };
}
