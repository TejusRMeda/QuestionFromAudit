import { useMemo } from "react";
import { EditableQuestion } from "@/types/editPanel";
import {
  computeClinicallyProtectedIds,
  computeProtectedCharacteristics,
} from "@/lib/clinicalProtection";

/**
 * Memoized hook that computes clinical protection sets from the question list.
 *
 * Returns:
 * - protectedIds: question IDs that are children of clinically required parents (cannot be deleted)
 * - protectedCharacteristics: characteristics on required parents referenced by children (options cannot be removed)
 */
export function useClinicalProtection(questions: EditableQuestion[]) {
  const protectedIds = useMemo(
    () => computeClinicallyProtectedIds(questions),
    [questions]
  );

  const protectedCharacteristics = useMemo(
    () => computeProtectedCharacteristics(questions),
    [questions]
  );

  return { protectedIds, protectedCharacteristics };
}
