/**
 * Clinical Protection Logic
 *
 * Computes which questions are clinically protected based on enableWhen
 * dependencies on clinically required parent questions.
 *
 * Protection model:
 * - "Clinically Required": questions with required === true from CSV (immutable)
 * - "Clinically Protected": direct children (via enableWhen) of required questions
 *   — cannot be deleted, but other edits are allowed
 *
 * Cascade depth: 1 level only. Grandchildren are NOT protected unless
 * they are themselves marked required.
 */

import { parseCharacteristics } from "@/lib/enableWhen";
import type { EnableWhen } from "@/types/question";

interface QuestionForProtection {
  id: number;
  required?: boolean;
  characteristic: string | null;
  enableWhen: EnableWhen | null;
}

/**
 * Returns the set of question IDs that are direct children of clinically
 * required questions (via enableWhen characteristic references).
 */
export function computeClinicallyProtectedIds(
  questions: QuestionForProtection[]
): Set<number> {
  // 1. Collect all characteristics from required questions
  const requiredChars = new Set<string>();
  for (const q of questions) {
    if (q.required === true && q.characteristic) {
      for (const c of parseCharacteristics(q.characteristic)) {
        requiredChars.add(c);
      }
    }
  }

  if (requiredChars.size === 0) return new Set();

  // 2. Find questions whose enableWhen references any required characteristic
  const protectedIds = new Set<number>();
  for (const q of questions) {
    if (!q.enableWhen) continue;
    const dependsOnRequired = q.enableWhen.conditions.some((cond) =>
      requiredChars.has(cond.characteristic)
    );
    if (dependsOnRequired) {
      protectedIds.add(q.id);
    }
  }

  return protectedIds;
}

/**
 * Returns the set of characteristics on required parent questions that are
 * actively referenced by at least one child's enableWhen conditions.
 *
 * These characteristics correspond to answer options that cannot be removed
 * from the required parent without breaking child question logic.
 */
export function computeProtectedCharacteristics(
  questions: QuestionForProtection[]
): Set<string> {
  // 1. Collect all characteristics from required questions
  const requiredChars = new Set<string>();
  for (const q of questions) {
    if (q.required === true && q.characteristic) {
      for (const c of parseCharacteristics(q.characteristic)) {
        requiredChars.add(c);
      }
    }
  }

  if (requiredChars.size === 0) return new Set();

  // 2. Find which of those characteristics are actually referenced by children
  const referenced = new Set<string>();
  for (const q of questions) {
    if (!q.enableWhen) continue;
    for (const cond of q.enableWhen.conditions) {
      if (requiredChars.has(cond.characteristic)) {
        referenced.add(cond.characteristic);
      }
    }
  }

  return referenced;
}
