/**
 * Calculator registry for questionnaire calculator types (bmi-calculator, etc.)
 *
 * Each calculator type defines its input/output fields, compute function,
 * and display metadata. Adding a new calculator only requires adding a
 * new config object to CALCULATOR_REGISTRY.
 */

export interface CalculatorFieldConfig {
  /** Field key — matches the option value from CSV (e.g. "height", "weight", "bmi") */
  key: string;
  /** Human-readable label */
  label: string;
  /** Unit displayed alongside the input (e.g. "cm", "kg", "kg/m²") */
  unit: string;
  /** Whether this field is a user input or a computed output */
  role: "input" | "output";
  /** Validation constraints (input fields only) */
  min?: number;
  max?: number;
  step?: number;
  /** Number of decimal places for display */
  decimalPlaces?: number;
}

export interface CalculatorConfig {
  /** The answer_type value (e.g. "bmi-calculator") */
  type: string;
  /** Display title when question_text is empty */
  fallbackTitle: string;
  /** Description of the calculation shown to users */
  formulaDescription: string;
  /** Conversion note for imperial users */
  conversionNote?: string;
  /** Ordered field definitions */
  fields: CalculatorFieldConfig[];
  /**
   * Compute function: given input field values,
   * returns output field values. Returns null for an output if inputs are insufficient.
   */
  compute: (inputs: Record<string, number | null>) => Record<string, number | null>;
}

// ── BMI Calculator ──────────────────────────────────────────────────

const BMI_CALCULATOR_CONFIG: CalculatorConfig = {
  type: "bmi-calculator",
  fallbackTitle: "BMI Calculator",
  formulaDescription: "BMI = weight (kg) \u00F7 height (m)\u00B2",
  conversionNote:
    "Height: 1 foot = 30.48 cm, 1 inch = 2.54 cm. Weight: 1 stone = 6.35 kg, 1 pound = 0.45 kg.",
  fields: [
    {
      key: "height",
      label: "Height",
      unit: "cm",
      role: "input",
      min: 50,
      max: 300,
      step: 0.1,
      decimalPlaces: 1,
    },
    {
      key: "weight",
      label: "Weight",
      unit: "kg",
      role: "input",
      min: 10,
      max: 500,
      step: 0.1,
      decimalPlaces: 1,
    },
    {
      key: "bmi",
      label: "BMI",
      unit: "kg/m\u00B2",
      role: "output",
      decimalPlaces: 1,
    },
  ],
  compute: (inputs) => {
    const height = inputs["height"];
    const weight = inputs["weight"];
    if (height == null || weight == null || height <= 0) return { bmi: null };
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return { bmi: Math.round(bmi * 10) / 10 };
  },
};

// ── Registry ────────────────────────────────────────────────────────

const CALCULATOR_REGISTRY: Record<string, CalculatorConfig> = {
  "bmi-calculator": BMI_CALCULATOR_CONFIG,
};

export function getCalculatorConfig(
  answerType: string
): CalculatorConfig | null {
  return CALCULATOR_REGISTRY[answerType] ?? null;
}

export function isCalculatorType(answerType: string): boolean {
  return answerType in CALCULATOR_REGISTRY;
}

// ── Answer helpers ──────────────────────────────────────────────────

export type CalculatorValues = Record<string, string>;

export function parseCalculatorAnswer(
  answer: string | string[] | undefined
): CalculatorValues {
  if (typeof answer !== "string" || !answer) return {};
  try {
    const parsed = JSON.parse(answer);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeCalculatorAnswer(values: CalculatorValues): string {
  return JSON.stringify(values);
}
