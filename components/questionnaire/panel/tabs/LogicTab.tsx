"use client";

import { EditableQuestion, LogicChanges } from "@/types/editPanel";
import { TranslatedEnableWhen, parseCharacteristics } from "@/lib/enableWhen";

interface LogicTabProps {
  question: EditableQuestion;
  allQuestions: EditableQuestion[];
  changes: LogicChanges | null;
  onUpdateChanges: (changes: Partial<LogicChanges>) => void;
  translatedEnableWhen: TranslatedEnableWhen | null;
  onSelectQuestion: (question: EditableQuestion) => void;
}

/**
 * Logic tab for viewing and suggesting changes to conditional logic (EnableWhen)
 */
export default function LogicTab({
  question,
  allQuestions,
  changes,
  onUpdateChanges,
  translatedEnableWhen,
  onSelectQuestion,
}: LogicTabProps) {
  // Find parent questions (questions that this question depends on)
  const parentQuestions: EditableQuestion[] = [];
  if (translatedEnableWhen) {
    for (const condition of translatedEnableWhen.conditions) {
      if (!condition.raw) {
        // Find the question that owns this characteristic
        const parent = allQuestions.find((q) => {
          if (!q.characteristic) return false;
          const chars = parseCharacteristics(q.characteristic);
          return chars.includes(condition.characteristic);
        });
        if (parent && !parentQuestions.find((p) => p.id === parent.id)) {
          parentQuestions.push(parent);
        }
      }
    }
  }

  // Find child questions (questions that depend on this question)
  const childQuestions: EditableQuestion[] = [];
  if (question.characteristic) {
    const thisChars = parseCharacteristics(question.characteristic);

    for (const q of allQuestions) {
      if (q.id === question.id || !q.enableWhen) continue;

      const dependsOnThis = q.enableWhen.conditions.some((cond) =>
        thisChars.includes(cond.characteristic)
      );

      if (dependsOnThis) {
        childQuestions.push(q);
      }
    }
  }

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    if (!value.trim()) {
      onUpdateChanges({ description: undefined } as any);
    } else {
      onUpdateChanges({ description: value });
    }
  };

  const hasLogic = translatedEnableWhen !== null;
  const hasChanges = changes?.description && changes.description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Current Logic */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Conditional Display Logic
        </h3>

        {hasLogic ? (
          <div className="bg-base-200/50 rounded-lg p-4 space-y-4">
            {/* Summary */}
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-info flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">This question is conditional</p>
                <p className="text-sm text-base-content/70 mt-1">
                  {translatedEnableWhen.summary}
                </p>
              </div>
            </div>

            {/* Detailed conditions */}
            <div className="border-t border-base-300 pt-3">
              <p className="text-xs text-base-content/60 mb-2">Conditions:</p>
              <div className="space-y-1">
                {translatedEnableWhen.conditions.map((condition, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {idx > 0 && (
                      <span className="badge badge-sm badge-ghost">
                        {translatedEnableWhen.logic}
                      </span>
                    )}
                    <span
                      className={
                        condition.raw
                          ? "font-mono text-xs bg-base-300 px-1 py-0.5 rounded"
                          : ""
                      }
                    >
                      {condition.readable}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-base-200/50 rounded-lg p-4 flex items-center gap-2 text-base-content/60">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">This question is always shown (no conditions)</span>
          </div>
        )}
      </div>

      {/* Relationship Diagram */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Question Relationships
        </h3>

        <div className="flex flex-col items-center gap-2">
          {/* Parent questions */}
          {parentQuestions.length > 0 && (
            <>
              <div className="w-full space-y-2">
                <p className="text-xs text-base-content/60 text-center">Depends on:</p>
                {parentQuestions.map((parent) => (
                  <button
                    key={parent.id}
                    onClick={() => onSelectQuestion(parent)}
                    className="w-full text-left p-2 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="badge badge-ghost badge-sm font-mono">
                        {parent.questionId}
                      </span>
                      <span className="text-sm truncate">{parent.questionText}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Arrow down */}
              <svg
                className="w-6 h-6 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </>
          )}

          {/* Current question */}
          <div className="w-full p-3 rounded-lg border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-mono">
                {question.questionId}
              </span>
              <span className="text-sm font-medium truncate">{question.questionText}</span>
            </div>
          </div>

          {/* Child questions */}
          {childQuestions.length > 0 && (
            <>
              {/* Arrow down */}
              <svg
                className="w-6 h-6 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>

              <div className="w-full space-y-2">
                <p className="text-xs text-base-content/60 text-center">Controls display of:</p>
                {childQuestions.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelectQuestion(child)}
                    className="w-full text-left p-2 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="badge badge-ghost badge-sm font-mono">
                        {child.questionId}
                      </span>
                      <span className="text-sm truncate">{child.questionText}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {parentQuestions.length === 0 && childQuestions.length === 0 && (
            <p className="text-sm text-base-content/60 text-center py-4">
              This question has no direct relationships with other questions.
            </p>
          )}
        </div>
      </div>

      {/* Suggest Logic Change */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Suggest Logic Change
        </h3>

        <div
          className={`rounded-lg border transition-colors ${
            hasChanges ? "border-primary bg-primary/5" : "border-base-300 bg-base-100"
          }`}
        >
          <div className="p-4">
            <label className="label">
              <span className="label-text text-xs">
                Describe your suggested logic change
              </span>
              {hasChanges && (
                <span className="label-text-alt text-primary text-xs">Modified</span>
              )}
            </label>
            <textarea
              value={changes?.description || ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="E.g., 'Only show this question if the patient is over 65 years old' or 'Remove the condition that requires gender to be female'"
              className={`textarea textarea-bordered w-full ${
                hasChanges ? "textarea-primary" : ""
              }`}
              rows={4}
            />
            <p className="text-xs text-base-content/60 mt-2">
              Describe in plain language how you want the conditional logic to work.
              A visual logic builder will be available in a future release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
