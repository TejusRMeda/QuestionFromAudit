import { EnableWhen, EnableWhenCondition } from "@/types/question";

/**
 * Parse a pipe-separated characteristic string into a trimmed array.
 * Returns an empty array if the input is null/undefined/empty.
 */
export function parseCharacteristics(characteristic: string | null | undefined): string[] {
  return characteristic ? characteristic.split("|").map((c) => c.trim()) : [];
}

/**
 * Source information for a characteristic
 */
export interface CharacteristicSource {
  questionId: string;
  questionText: string;
  optionText?: string;
}

/**
 * A translated condition with human-readable text
 */
export interface TranslatedCondition {
  characteristic: string;
  questionText: string;
  optionText?: string;
  operator: string;
  value?: string;
  readable: string;
  raw: boolean; // true if characteristic was not found in the map
  logicalOp: "AND" | "OR" | null;
}

/**
 * Fully translated EnableWhen with all conditions
 */
export interface TranslatedEnableWhen {
  conditions: TranslatedCondition[];
  logic: "AND" | "OR";
  summary: string;
}

/**
 * Question data needed for building the characteristic map
 */
export interface QuestionForMapping {
  questionId: string;
  questionText: string;
  answerOptions: string | null;
  characteristic: string | null;
}

/**
 * Build a map from characteristic names to their source question/option
 *
 * Characteristics can come from:
 * 1. Question-level (for text inputs): characteristic field without pipe separators
 * 2. Option-level (for radio/checkbox): characteristic field with pipe-separated values
 *    that correspond to answerOptions
 */
export function buildCharacteristicMap(
  questions: QuestionForMapping[]
): Map<string, CharacteristicSource> {
  const map = new Map<string, CharacteristicSource>();

  for (const q of questions) {
    if (!q.characteristic) continue;

    const characteristics = parseCharacteristics(q.characteristic);
    const options = q.answerOptions
      ? q.answerOptions.split("|").map((o) => o.trim())
      : [];

    // If there's only one characteristic and no options (or mismatched count),
    // it's a question-level characteristic
    if (characteristics.length === 1 && options.length === 0) {
      map.set(characteristics[0], {
        questionId: q.questionId,
        questionText: q.questionText,
      });
    } else {
      // Map each characteristic to its corresponding option
      for (let i = 0; i < characteristics.length; i++) {
        const char = characteristics[i];
        if (!char) continue;

        map.set(char, {
          questionId: q.questionId,
          questionText: q.questionText,
          optionText: options[i] || undefined,
        });
      }
    }
  }

  return map;
}

/**
 * Get human-readable operator text
 */
function getOperatorText(operator: string, value?: string): string {
  switch (operator) {
    case "=":
      if (value === "true") return "is answered";
      if (value === "false") return "is not answered";
      return `equals "${value}"`;
    case "!=":
      return `does not equal "${value}"`;
    case "<":
      return `is less than ${value}`;
    case ">":
      return `is greater than ${value}`;
    case "<=":
      return `is at most ${value}`;
    case ">=":
      return `is at least ${value}`;
    case "exists":
      if (value === "null" || !value) return "has no value";
      return "has a value";
    default:
      return `${operator} ${value || ""}`;
  }
}

/**
 * Translate a single condition to human-readable text
 */
function translateCondition(
  condition: EnableWhenCondition,
  characteristicMap: Map<string, CharacteristicSource>,
  logicalOp: "AND" | "OR" | null
): TranslatedCondition {
  const source = characteristicMap.get(condition.characteristic);

  if (source) {
    // We found the source question/option
    let readable: string;

    if (source.optionText) {
      // Option-level characteristic - the characteristic represents selecting this option
      if (condition.operator === "=" && condition.value === "true") {
        readable = `"${source.questionText}" is answered "${source.optionText}"`;
      } else if (condition.operator === "=" && condition.value === "false") {
        readable = `"${source.questionText}" is not "${source.optionText}"`;
      } else {
        readable = `"${source.questionText}" → "${source.optionText}" ${getOperatorText(condition.operator, condition.value)}`;
      }
    } else {
      // Question-level characteristic
      readable = `"${source.questionText}" ${getOperatorText(condition.operator, condition.value)}`;
    }

    return {
      characteristic: condition.characteristic,
      questionText: source.questionText,
      optionText: source.optionText,
      operator: condition.operator,
      value: condition.value,
      readable,
      raw: false,
      logicalOp,
    };
  }

  // Characteristic not found - show raw condition
  const operatorText = getOperatorText(condition.operator, condition.value);
  return {
    characteristic: condition.characteristic,
    questionText: condition.characteristic,
    operator: condition.operator,
    value: condition.value,
    readable: `${condition.characteristic} ${operatorText}`,
    raw: true,
    logicalOp,
  };
}

/**
 * Translate EnableWhen conditions to human-readable text
 */
export function translateEnableWhen(
  enableWhen: EnableWhen,
  characteristicMap: Map<string, CharacteristicSource>
): TranslatedEnableWhen {
  const conditions: TranslatedCondition[] = enableWhen.conditions.map(
    (cond, index) => {
      const logicalOp =
        index < enableWhen.conditions.length - 1 ? enableWhen.logic : null;
      return translateCondition(cond, characteristicMap, logicalOp);
    }
  );

  // Build summary
  let summary: string;
  if (conditions.length === 1) {
    summary = `Shown when: ${conditions[0].readable}`;
  } else {
    const connector = enableWhen.logic === "OR" ? " or " : " and ";
    const parts = conditions.map((c) => c.readable);
    summary = `Shown when: ${parts.join(connector)}`;
  }

  return {
    conditions,
    logic: enableWhen.logic,
    summary,
  };
}
