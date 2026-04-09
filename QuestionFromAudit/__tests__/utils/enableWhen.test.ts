import { describe, it, expect } from "vitest";
import {
  parseCharacteristics,
  buildCharacteristicMap,
  translateEnableWhen,
  type QuestionForMapping,
  type CharacteristicSource,
} from "@/lib/enableWhen";
import type { EnableWhen } from "@/types/question";

// ── parseCharacteristics ────────────────────────────────────────────

describe("parseCharacteristics", () => {
  it("splits pipe-separated values and trims whitespace", () => {
    expect(parseCharacteristics("a | b | c")).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for null/undefined/empty", () => {
    expect(parseCharacteristics(null)).toEqual([]);
    expect(parseCharacteristics(undefined)).toEqual([]);
    expect(parseCharacteristics("")).toEqual([]);
  });

  it("handles single value without pipe", () => {
    expect(parseCharacteristics("patient_age")).toEqual(["patient_age"]);
  });
});

// ── buildCharacteristicMap ──────────────────────────────────────────

describe("buildCharacteristicMap", () => {
  it("maps question-level characteristic (single, no options)", () => {
    const questions: QuestionForMapping[] = [
      {
        questionId: "q1",
        questionText: "What is your age?",
        answerOptions: null,
        characteristic: "patient_age",
      },
    ];
    const map = buildCharacteristicMap(questions);
    expect(map.get("patient_age")).toEqual({
      questionId: "q1",
      questionText: "What is your age?",
    });
  });

  it("maps option-level characteristics to corresponding options", () => {
    const questions: QuestionForMapping[] = [
      {
        questionId: "q2",
        questionText: "Do you have allergies?",
        answerOptions: "Yes | No",
        characteristic: "has_allergies | no_allergies",
      },
    ];
    const map = buildCharacteristicMap(questions);
    expect(map.get("has_allergies")).toEqual({
      questionId: "q2",
      questionText: "Do you have allergies?",
      optionText: "Yes",
    });
    expect(map.get("no_allergies")).toEqual({
      questionId: "q2",
      questionText: "Do you have allergies?",
      optionText: "No",
    });
  });

  it("skips questions with null/empty characteristic", () => {
    const questions: QuestionForMapping[] = [
      {
        questionId: "q3",
        questionText: "Notes",
        answerOptions: null,
        characteristic: null,
      },
      {
        questionId: "q4",
        questionText: "Other",
        answerOptions: null,
        characteristic: "",
      },
    ];
    const map = buildCharacteristicMap(questions);
    expect(map.size).toBe(0);
  });

  it("skips empty characteristic segments", () => {
    const questions: QuestionForMapping[] = [
      {
        questionId: "q5",
        questionText: "Gender",
        answerOptions: "Male | Female | ",
        characteristic: "gender_male | gender_female | ",
      },
    ];
    const map = buildCharacteristicMap(questions);
    expect(map.has("gender_male")).toBe(true);
    expect(map.has("gender_female")).toBe(true);
    // empty segment should be skipped
    expect(map.size).toBe(2);
  });

  it("handles empty questions array", () => {
    const map = buildCharacteristicMap([]);
    expect(map.size).toBe(0);
  });

  it("handles more characteristics than options gracefully", () => {
    const questions: QuestionForMapping[] = [
      {
        questionId: "q6",
        questionText: "Color",
        answerOptions: "Red",
        characteristic: "color_red | color_blue",
      },
    ];
    const map = buildCharacteristicMap(questions);
    expect(map.get("color_red")?.optionText).toBe("Red");
    // color_blue has no matching option
    expect(map.get("color_blue")?.optionText).toBeUndefined();
  });
});

// ── translateEnableWhen ─────────────────────────────────────────────

describe("translateEnableWhen", () => {
  const charMap = new Map<string, CharacteristicSource>([
    [
      "patient_age",
      { questionId: "q1", questionText: "What is your age?" },
    ],
    [
      "has_allergies",
      {
        questionId: "q2",
        questionText: "Do you have allergies?",
        optionText: "Yes",
      },
    ],
    [
      "no_allergies",
      {
        questionId: "q2",
        questionText: "Do you have allergies?",
        optionText: "No",
      },
    ],
  ]);

  it("translates single = true condition on option-level characteristic", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "has_allergies", operator: "=", value: "true" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].readable).toBe(
      '"Do you have allergies?" is answered "Yes"'
    );
    expect(result.conditions[0].raw).toBe(false);
    expect(result.summary).toContain("Shown when:");
  });

  it("translates = false on option-level characteristic", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "has_allergies", operator: "=", value: "false" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"Do you have allergies?" is not "Yes"'
    );
  });

  it("translates question-level = true as 'is answered'", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "=", value: "true" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" is answered'
    );
  });

  it("translates < operator", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "<", value: "16" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" is less than 16'
    );
  });

  it("translates > operator", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: ">", value: "65" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" is greater than 65'
    );
  });

  it("translates != operator", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "!=", value: "0" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" does not equal "0"'
    );
  });

  it("translates exists with null value as 'has no value'", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "exists", value: "null" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" has no value'
    );
  });

  it("translates exists without value as 'has no value'", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "exists" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" has no value'
    );
  });

  it("translates <= and >= operators", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "<=", value: "18" },
        { characteristic: "patient_age", operator: ">=", value: "5" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" is at most 18'
    );
    expect(result.conditions[1].readable).toBe(
      '"What is your age?" is at least 5'
    );
  });

  it("falls back to raw output for unknown characteristics", () => {
    const ew: EnableWhen = {
      conditions: [
        {
          characteristic: "unknown_char",
          operator: "=",
          value: "true",
        },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].raw).toBe(true);
    expect(result.conditions[0].questionText).toBe("unknown_char");
    expect(result.conditions[0].readable).toBe("unknown_char is answered");
  });

  it("joins multiple AND conditions with ' and '", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "has_allergies", operator: "=", value: "true" },
        { characteristic: "patient_age", operator: "<", value: "16" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.logic).toBe("AND");
    expect(result.summary).toContain(" and ");
    expect(result.conditions[0].logicalOp).toBe("AND");
    expect(result.conditions[1].logicalOp).toBeNull(); // last condition
  });

  it("joins multiple OR conditions with ' or '", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "has_allergies", operator: "=", value: "true" },
        { characteristic: "no_allergies", operator: "=", value: "true" },
      ],
      logic: "OR",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.logic).toBe("OR");
    expect(result.summary).toContain(" or ");
  });

  it("handles unknown operator gracefully", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "patient_age", operator: "~=", value: "abc" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"What is your age?" ~= abc'
    );
  });

  it("handles option-level with non-equals operator", () => {
    const ew: EnableWhen = {
      conditions: [
        { characteristic: "has_allergies", operator: ">", value: "5" },
      ],
      logic: "AND",
    };
    const result = translateEnableWhen(ew, charMap);
    expect(result.conditions[0].readable).toBe(
      '"Do you have allergies?" → "Yes" is greater than 5'
    );
  });
});
