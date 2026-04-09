import { useState, useCallback, useRef } from "react";
import type { QuickActionType } from "@/components/questionnaire/QuickActionsMenu";

interface QuestionWithQuickAction {
  id: number;
  quickAction: "required" | "delete" | null;
}

export function useQuickActions(
  initialQuestions: QuestionWithQuickAction[],
  onRefresh: () => void
) {
  const [quickActions, setQuickActions] = useState<Record<number, QuickActionType>>(() => {
    const map: Record<number, QuickActionType> = {};
    for (const q of initialQuestions) {
      if (q.quickAction) map[q.id] = q.quickAction;
    }
    return map;
  });

  // Track question IDs whose quick actions were deleted locally
  const deletedQuickActionIds = useRef(new Set<number>());

  const syncFromFetch = useCallback((questions: QuestionWithQuickAction[]) => {
    const freshQuickActions: Record<number, QuickActionType> = {};
    for (const q of questions) {
      if (q.quickAction && !deletedQuickActionIds.current.has(q.id)) {
        freshQuickActions[q.id] = q.quickAction;
      }
      if (!q.quickAction && deletedQuickActionIds.current.has(q.id)) {
        deletedQuickActionIds.current.delete(q.id);
      }
    }
    setQuickActions(freshQuickActions);
  }, []);

  const handleQuickAction = useCallback(
    (questionId: number, action: QuickActionType) => {
      deletedQuickActionIds.current.delete(questionId);
      setQuickActions((prev) => ({ ...prev, [questionId]: action }));
      onRefresh();
    },
    [onRefresh]
  );

  const handleSuggestionDeleted = useCallback(
    (suggestionText: string, selectedQuestionId: number | null) => {
      const quickActionTexts: Record<string, QuickActionType> = {
        "Make this question required": "required",
        "Remove this question from the questionnaire": "delete",
      };
      const actionType = quickActionTexts[suggestionText];
      if (actionType && selectedQuestionId) {
        deletedQuickActionIds.current.add(selectedQuestionId);
        setQuickActions((prev) => {
          const next = { ...prev };
          delete next[selectedQuestionId];
          return next;
        });
      }
      onRefresh();
    },
    [onRefresh]
  );

  return { quickActions, syncFromFetch, handleQuickAction, handleSuggestionDeleted };
}
