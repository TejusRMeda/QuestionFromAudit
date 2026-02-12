"use client";

import { useState, useCallback, useMemo } from "react";
import {
  EditPanelState,
  EditableQuestion,
  SettingsChanges,
  ContentChanges,
  HelpChanges,
  LogicChanges,
  ValidationErrors,
  TabId,
  INITIAL_EDIT_PANEL_STATE,
  VALIDATION_LIMITS,
} from "@/types/editPanel";

/**
 * Check if an object has any meaningful properties (non-undefined values)
 */
function hasAnyProperties<T extends object>(obj: T | null | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => v !== undefined);
}

interface UseEditPanelStateReturn {
  state: EditPanelState;
  selectedQuestion: EditableQuestion | null;
  selectQuestion: (question: EditableQuestion | null) => boolean;
  setActiveTab: (tab: TabId) => void;
  updateSettings: (changes: Partial<SettingsChanges>) => void;
  updateContent: (changes: Partial<ContentChanges>) => void;
  updateHelp: (changes: Partial<HelpChanges>) => void;
  updateLogic: (changes: Partial<LogicChanges>) => void;
  setSubmitterName: (name: string) => void;
  setSubmitterEmail: (email: string) => void;
  setNotes: (notes: string) => void;
  hasChanges: () => boolean;
  validate: () => ValidationErrors;
  isValid: () => boolean;
  reset: () => void;
  clearChanges: () => void;
  getSubmissionData: () => SubmissionData | null;
  tabHasChanges: (tab: TabId) => boolean;
  tabHasErrors: (tab: TabId) => boolean;
}

interface SubmissionData {
  instanceQuestionId: number;
  submitterName: string;
  submitterEmail: string | null;
  suggestionText: string;
  reason: string;
  componentChanges: {
    settings?: SettingsChanges;
    content?: ContentChanges;
    help?: HelpChanges;
    logic?: LogicChanges;
  };
}

/**
 * State management hook for the edit panel
 */
export function useEditPanelState(
  questions: EditableQuestion[]
): UseEditPanelStateReturn {
  const [state, setState] = useState<EditPanelState>(INITIAL_EDIT_PANEL_STATE);

  // Find the selected question
  const selectedQuestion = useMemo(() => {
    if (!state.selectedQuestionId) return null;
    return questions.find((q) => q.id === state.selectedQuestionId) || null;
  }, [questions, state.selectedQuestionId]);

  // Check if current state has unsaved changes
  const hasChanges = useCallback(() => {
    return (
      state.changes.settings !== null ||
      state.changes.content !== null ||
      state.changes.help !== null ||
      state.changes.logic !== null
    );
  }, [state.changes]);

  // Select a question (returns false if blocked by unsaved changes)
  const selectQuestion = useCallback(
    (question: EditableQuestion | null): boolean => {
      if (question?.id === state.selectedQuestionId) return true;

      // If there are unsaved changes, the caller should show a warning
      // This function returns false to indicate the caller should handle it
      if (hasChanges() && state.isDirty) {
        return false;
      }

      setState((prev) => ({
        ...INITIAL_EDIT_PANEL_STATE,
        selectedQuestionId: question?.id || null,
        submitterName: prev.submitterName,
        submitterEmail: prev.submitterEmail,
      }));
      return true;
    },
    [state.selectedQuestionId, hasChanges, state.isDirty]
  );

  const setActiveTab = useCallback((tab: TabId) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const updateSettings = useCallback((changes: Partial<SettingsChanges>) => {
    setState((prev) => {
      // If empty object passed, this is a clear operation
      const isEmpty = !hasAnyProperties(changes);
      if (isEmpty) {
        return {
          ...prev,
          isDirty: true,
          changes: { ...prev.changes, settings: null },
        };
      }
      // Merge with existing changes
      const merged = prev.changes.settings
        ? { ...prev.changes.settings, ...changes }
        : (changes as SettingsChanges);
      return {
        ...prev,
        isDirty: true,
        changes: { ...prev.changes, settings: hasAnyProperties(merged) ? merged : null },
      };
    });
  }, []);

  const updateContent = useCallback((changes: Partial<ContentChanges>) => {
    setState((prev) => {
      // If empty object passed, this is a clear operation
      const isEmpty = !hasAnyProperties(changes);
      if (isEmpty) {
        return {
          ...prev,
          isDirty: true,
          changes: { ...prev.changes, content: null },
        };
      }
      // Merge with existing changes
      const merged = prev.changes.content
        ? { ...prev.changes.content, ...changes }
        : (changes as ContentChanges);
      return {
        ...prev,
        isDirty: true,
        changes: { ...prev.changes, content: hasAnyProperties(merged) ? merged : null },
      };
    });
  }, []);

  const updateHelp = useCallback((changes: Partial<HelpChanges>) => {
    setState((prev) => {
      // If empty object passed, this is a clear operation
      const isEmpty = !hasAnyProperties(changes);
      if (isEmpty) {
        return {
          ...prev,
          isDirty: true,
          changes: { ...prev.changes, help: null },
        };
      }
      // Merge with existing changes
      const merged = prev.changes.help
        ? { ...prev.changes.help, ...changes }
        : (changes as HelpChanges);
      return {
        ...prev,
        isDirty: true,
        changes: { ...prev.changes, help: hasAnyProperties(merged) ? merged : null },
      };
    });
  }, []);

  const updateLogic = useCallback((changes: Partial<LogicChanges>) => {
    setState((prev) => {
      // If empty object passed or description is empty, clear
      const isEmpty = !hasAnyProperties(changes) || !changes.description?.trim();
      if (isEmpty) {
        return {
          ...prev,
          isDirty: true,
          changes: { ...prev.changes, logic: null },
        };
      }
      // Merge with existing changes
      const merged = prev.changes.logic
        ? { ...prev.changes.logic, ...changes }
        : (changes as LogicChanges);
      // Logic is special - it only has description, so check if it's meaningful
      const hasContent = merged.description && merged.description.trim().length > 0;
      return {
        ...prev,
        isDirty: true,
        changes: { ...prev.changes, logic: hasContent ? merged : null },
      };
    });
  }, []);

  const setSubmitterName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, submitterName: name }));
  }, []);

  const setSubmitterEmail = useCallback((email: string) => {
    setState((prev) => ({ ...prev, submitterEmail: email }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setState((prev) => ({ ...prev, notes, isDirty: true }));
  }, []);

  const validate = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Check if at least one change exists
    if (!hasChanges()) {
      errors.notes = "At least one change is required";
    }

    // Validate submitter name
    if (!state.submitterName.trim()) {
      errors.settings = ["Name is required"];
    }

    // Validate notes
    if (!state.notes.trim()) {
      errors.notes = "Notes are required";
    } else if (state.notes.trim().length < VALIDATION_LIMITS.MIN_NOTES_LENGTH) {
      errors.notes = `Notes must be at least ${VALIDATION_LIMITS.MIN_NOTES_LENGTH} characters`;
    } else if (state.notes.length > VALIDATION_LIMITS.MAX_NOTES_LENGTH) {
      errors.notes = `Notes cannot exceed ${VALIDATION_LIMITS.MAX_NOTES_LENGTH} characters`;
    }

    // Validate content options if present
    if (state.changes.content?.options) {
      const contentErrors: string[] = [];
      const answerType = selectedQuestion?.answerType?.toLowerCase();

      if (answerType === "radio" || answerType === "checkbox" || answerType === "multi_select") {
        // Check if we have enough options after changes
        const currentOptions = selectedQuestion?.answerOptions
          ?.split("|")
          .map((o) => o.trim())
          .filter(Boolean) || [];

        const { added = [], removed = [] } = state.changes.content.options;
        const resultingCount = currentOptions.length + added.length - removed.length;

        if (resultingCount < VALIDATION_LIMITS.MIN_OPTIONS_FOR_CHOICE) {
          contentErrors.push(
            `${answerType === "radio" ? "Radio" : "Checkbox"} questions require at least ${VALIDATION_LIMITS.MIN_OPTIONS_FOR_CHOICE} options`
          );
        }
      }

      if (contentErrors.length > 0) {
        errors.content = contentErrors;
      }
    }

    // Validate help changes if present
    if (state.changes.help) {
      const helpErrors: string[] = [];

      if (state.changes.help.helperType?.to === "webLink" && state.changes.help.helperValue?.to) {
        try {
          new URL(state.changes.help.helperValue.to);
        } catch {
          helpErrors.push("Please enter a valid URL");
        }
      }

      if (helpErrors.length > 0) {
        errors.help = helpErrors;
      }
    }

    return errors;
  }, [state, hasChanges, selectedQuestion]);

  const isValid = useCallback((): boolean => {
    const errors = validate();
    return Object.keys(errors).length === 0;
  }, [validate]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...INITIAL_EDIT_PANEL_STATE,
      submitterName: prev.submitterName,
      submitterEmail: prev.submitterEmail,
    }));
  }, []);

  const clearChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      changes: {
        settings: null,
        content: null,
        help: null,
        logic: null,
      },
      notes: "",
      isDirty: false,
    }));
  }, []);

  const tabHasChanges = useCallback(
    (tab: TabId): boolean => {
      switch (tab) {
        case "settings":
          return state.changes.settings !== null;
        case "content":
          return state.changes.content !== null;
        case "help":
          return state.changes.help !== null;
        case "logic":
          return state.changes.logic !== null;
        case "review":
          return false;
        default:
          return false;
      }
    },
    [state.changes]
  );

  const tabHasErrors = useCallback(
    (tab: TabId): boolean => {
      const errors = validate();
      switch (tab) {
        case "content":
          return !!errors.content && errors.content.length > 0;
        case "help":
          return !!errors.help && errors.help.length > 0;
        case "review":
          return !!errors.notes;
        default:
          return false;
      }
    },
    [validate]
  );

  const getSubmissionData = useCallback((): SubmissionData | null => {
    if (!selectedQuestion || !isValid()) return null;

    // Generate suggestion text summary
    const summaryParts: string[] = [];

    if (state.changes.settings?.required) {
      const { from, to } = state.changes.settings.required;
      summaryParts.push(
        `Change required status from ${from ? "required" : "optional"} to ${to ? "required" : "optional"}`
      );
    }

    if (state.changes.content?.questionText) {
      summaryParts.push(`Update question text`);
    }

    if (state.changes.content?.answerType) {
      summaryParts.push(
        `Change answer type from "${state.changes.content.answerType.from}" to "${state.changes.content.answerType.to}"`
      );
    }

    if (state.changes.content?.options) {
      const { added, modified, removed } = state.changes.content.options;
      if (added?.length) summaryParts.push(`Add ${added.length} option(s)`);
      if (modified?.length) summaryParts.push(`Modify ${modified.length} option(s)`);
      if (removed?.length) summaryParts.push(`Remove ${removed.length} option(s)`);
    }

    if (state.changes.help?.hasHelper) {
      const { from, to } = state.changes.help.hasHelper;
      summaryParts.push(`${to ? "Enable" : "Disable"} helper content`);
    }

    if (state.changes.help?.helperValue) {
      summaryParts.push(`Update helper content`);
    }

    if (state.changes.logic?.description) {
      summaryParts.push(`Logic change: ${state.changes.logic.description.substring(0, 50)}...`);
    }

    const suggestionText =
      summaryParts.length > 0
        ? summaryParts.join("; ")
        : "Component-level changes suggested";

    return {
      instanceQuestionId: selectedQuestion.id,
      submitterName: state.submitterName,
      submitterEmail: state.submitterEmail || null,
      suggestionText,
      reason: state.notes,
      componentChanges: {
        settings: state.changes.settings || undefined,
        content: state.changes.content || undefined,
        help: state.changes.help || undefined,
        logic: state.changes.logic || undefined,
      },
    };
  }, [selectedQuestion, state, isValid]);

  return {
    state,
    selectedQuestion,
    selectQuestion,
    setActiveTab,
    updateSettings,
    updateContent,
    updateHelp,
    updateLogic,
    setSubmitterName,
    setSubmitterEmail,
    setNotes,
    hasChanges,
    validate,
    isValid,
    reset,
    clearChanges,
    getSubmissionData,
    tabHasChanges,
    tabHasErrors,
  };
}
