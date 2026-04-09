import { describe, it, expect } from "vitest";
import {
  getCalculatorConfig,
  isCalculatorType,
  parseCalculatorAnswer,
  serializeCalculatorAnswer,
} from "@/lib/calculators";

// ── getCalculatorConfig ─────────────────────────────────────────────

describe("getCalculatorConfig", () => {
  it("returns config for bmi-calculator", () => {
    const config = getCalculatorConfig("bmi-calculator");
    expect(config).not.toBeNull();
    expect(config!.type).toBe("bmi-calculator");
    expect(config!.fields).toHaveLength(3);
  });

  it("returns null for unknown calculator type", () => {
    expect(getCalculatorConfig("unknown-calculator")).toBeNull();
    expect(getCalculatorConfig("")).toBeNull();
  });
});

// ── isCalculatorType ────────────────────────────────────────────────

describe("isCalculatorType", () => {
  it("returns true for registered types", () => {
    expect(isCalculatorType("bmi-calculator")).toBe(true);
  });

  it("returns false for unregistered types", () => {
    expect(isCalculatorType("unknown")).toBe(false);
    expect(isCalculatorType("")).toBe(false);
    expect(isCalculatorType("string")).toBe(false);
  });
});

// ── parseCalculatorAnswer ───────────────────────────────────────────

describe("parseCalculatorAnswer", () => {
  it("parses valid JSON object", () => {
    const result = parseCalculatorAnswer('{"height":"170","weight":"65"}');
    expect(result).toEqual({ height: "170", weight: "65" });
  });

  it("returns empty object for undefined", () => {
    expect(parseCalculatorAnswer(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseCalculatorAnswer("")).toEqual({});
  });

  it("returns empty object for non-string input (array)", () => {
    expect(parseCalculatorAnswer(["a", "b"])).toEqual({});
  });

  it("returns empty object for malformed JSON", () => {
    expect(parseCalculatorAnswer("{invalid json}")).toEqual({});
    expect(parseCalculatorAnswer("not json at all")).toEqual({});
  });

  it("returns empty object for JSON array", () => {
    expect(parseCalculatorAnswer("[1,2,3]")).toEqual({});
  });

  it("returns empty object for JSON primitive", () => {
    expect(parseCalculatorAnswer('"hello"')).toEqual({});
    expect(parseCalculatorAnswer("42")).toEqual({});
  });
});

// ── serializeCalculatorAnswer ───────────────────────────────────────

describe("serializeCalculatorAnswer", () => {
  it("serializes values to JSON", () => {
    const result = serializeCalculatorAnswer({ height: "170", weight: "65" });
    expect(JSON.parse(result)).toEqual({ height: "170", weight: "65" });
  });

  it("serializes empty object", () => {
    expect(serializeCalculatorAnswer({})).toBe("{}");
  });
});

// ── BMI compute function ────────────────────────────────────────────

describe("BMI calculator compute", () => {
  const config = getCalculatorConfig("bmi-calculator")!;

  it("computes BMI correctly for normal inputs", () => {
    // BMI = 70 / (1.75^2) = 70 / 3.0625 = 22.857... ≈ 22.9
    const result = config.compute({ height: 175, weight: 70 });
    expect(result.bmi).toBe(22.9);
  });

  it("computes BMI for short/heavy person", () => {
    // BMI = 100 / (1.50^2) = 100 / 2.25 = 44.4
    const result = config.compute({ height: 150, weight: 100 });
    expect(result.bmi).toBe(44.4);
  });

  it("computes BMI for tall/light person", () => {
    // BMI = 55 / (1.90^2) = 55 / 3.61 = 15.235... ≈ 15.2
    const result = config.compute({ height: 190, weight: 55 });
    expect(result.bmi).toBe(15.2);
  });

  it("returns null for zero height (division by zero)", () => {
    const result = config.compute({ height: 0, weight: 70 });
    expect(result.bmi).toBeNull();
  });

  it("returns null for negative height", () => {
    const result = config.compute({ height: -170, weight: 70 });
    expect(result.bmi).toBeNull();
  });

  it("returns null for null height", () => {
    const result = config.compute({ height: null, weight: 70 });
    expect(result.bmi).toBeNull();
  });

  it("returns null for null weight", () => {
    const result = config.compute({ height: 170, weight: null });
    expect(result.bmi).toBeNull();
  });

  it("returns null when both inputs are null", () => {
    const result = config.compute({ height: null, weight: null });
    expect(result.bmi).toBeNull();
  });

  it("returns null when inputs are missing", () => {
    const result = config.compute({});
    expect(result.bmi).toBeNull();
  });

  it("has correct field validation ranges", () => {
    const heightField = config.fields.find((f) => f.key === "height")!;
    expect(heightField.min).toBe(50);
    expect(heightField.max).toBe(300);
    expect(heightField.role).toBe("input");

    const weightField = config.fields.find((f) => f.key === "weight")!;
    expect(weightField.min).toBe(10);
    expect(weightField.max).toBe(500);
    expect(weightField.role).toBe("input");

    const bmiField = config.fields.find((f) => f.key === "bmi")!;
    expect(bmiField.role).toBe("output");
  });
});
