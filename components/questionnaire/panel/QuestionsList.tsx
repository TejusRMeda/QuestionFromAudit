"use client";

import { useMemo } from "react";
import {
  parseCharacteristics,
  TranslatedEnableWhen,
} from "@/lib/enableWhen";
import ConditionalQuestionWrapper from "../ConditionalQuestionWrapper";
import HelperDisplay from "../HelperDisplay";
import { EditableQuestion } from "@/types/editPanel";

interface QuestionsListProps {
  questions: EditableQuestion[];
  selectedQuestionId: number | null;
  onSelectQuestion: (question: EditableQuestion) => void;
  searchTerm: string;
  categoryFilter: string;
  translatedEnableWhens: Map<number, TranslatedEnableWhen>;
  questionAnswers: Record<number, string | string[]>;
  onAnswerChange: (questionId: number, value: string | string[]) => void;
  onAddSuggestion?: (question: EditableQuestion) => void;
}

/**
 * List of questions in the left panel of the split-screen layout.
 * Questions are clickable to select them for editing.
 */
export default function QuestionsList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  searchTerm,
  categoryFilter,
  translatedEnableWhens,
  questionAnswers,
  onAnswerChange,
  onAddSuggestion,
}: QuestionsListProps) {
  // Filter questions based on search and category
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        searchTerm === "" ||
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.questionId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || q.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [questions, searchTerm, categoryFilter]);

  const renderAnswerInputs = (question: EditableQuestion) => {
    const answerType = question.answerType?.toLowerCase();
    const currentAnswer = questionAnswers[question.id];
    const characteristics = parseCharacteristics(question.characteristic);

    // Text input types
    const textInputTypes = [
      "text", "text-field", "send-button", "forage",
      "phone-number", "number-input", "age",
      "allergy-list", "bmi-calculator", "frailty-score",
      "medication-list", "i-c-u-list", "previous-operation-list"
    ];
    if (textInputTypes.includes(answerType || "")) {
      return (
        <div className="form-control">
          <input
            type="text"
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="input input-bordered input-sm w-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Multiline text
    if (answerType === "text-area" || answerType === "text-paragraph") {
      return (
        <div className="form-control">
          <textarea
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="textarea textarea-bordered textarea-sm w-full"
            rows={3}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Date picker
    if (answerType === "date") {
      return (
        <div className="form-control">
          <input
            type="date"
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="input input-bordered input-sm w-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Display-only types
    if (answerType === "spacer" || answerType === "content-block" || answerType === "alert") {
      return null;
    }

    // Radio buttons
    if (answerType === "radio" && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      return (
        <div className="flex flex-col gap-1">
          {options.map((option, idx) => (
            <label key={idx} className="label cursor-pointer justify-between py-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  className="radio radio-primary radio-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="label-text text-sm">{option}</span>
              </div>
              {characteristics[idx] && (
                <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs">
                  {characteristics[idx]}
                </span>
              )}
            </label>
          ))}
        </div>
      );
    }

    // Checkboxes
    if ((answerType === "multi_select" || answerType === "checkbox") && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      const selectedValues = Array.isArray(currentAnswer) ? currentAnswer : [];

      return (
        <div className="flex flex-col gap-1">
          {options.map((option, idx) => (
            <label key={idx} className="label cursor-pointer justify-between py-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    onAnswerChange(question.id, newValues);
                  }}
                  className="checkbox checkbox-primary checkbox-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="label-text text-sm">{option}</span>
              </div>
              {characteristics[idx] && (
                <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs">
                  {characteristics[idx]}
                </span>
              )}
            </label>
          ))}
        </div>
      );
    }

    // Fallback: show options as badges
    if (question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      return (
        <div className="flex flex-col gap-1.5">
          {options.map((option, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="badge badge-outline badge-sm">{option}</span>
              {characteristics[idx] && (
                <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs">
                  {characteristics[idx]}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const getAnswerTypeLabel = (answerType: string | null): string => {
    const type = answerType?.toLowerCase();
    if (!type) return "Options";

    if (type === "radio") return "Single choice";
    if (type === "multi_select" || type === "checkbox") return "Multiple choice";
    if (type === "text-area" || type === "text-paragraph") return "Multiline text";
    if (type === "date") return "Date";
    if (type === "spacer" || type === "content-block" || type === "alert") return "Display only";

    const textInputTypes = [
      "text", "text-field", "send-button", "forage", "phone-number",
      "number-input", "age", "allergy-list", "bmi-calculator",
      "frailty-score", "medication-list", "i-c-u-list", "previous-operation-list"
    ];
    if (textInputTypes.includes(type)) return "Free text";

    return type;
  };

  if (filteredQuestions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-base-content/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-base-content/60">
          {searchTerm || categoryFilter !== "all"
            ? "No questions match your filters"
            : "No questions found"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {filteredQuestions.map((question) => {
        const translatedEnableWhen = translatedEnableWhens.get(question.id);
        const isConditional = !!translatedEnableWhen;
        const isSelected = selectedQuestionId === question.id;

        const questionContent = (
          <>
            {/* Question Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-ghost badge-sm">{question.category}</span>
                {isConditional && (
                  <span className="badge badge-info badge-outline badge-sm">Conditional</span>
                )}
              </div>
              {question.suggestionCount > 0 && (
                <span className="badge badge-info badge-sm whitespace-nowrap">
                  {question.suggestionCount} suggestion{question.suggestionCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Question Text */}
            <p className="text-sm text-base-content mb-2">{question.questionText}</p>

            {/* Helper Information */}
            {question.hasHelper && (
              <div onClick={(e) => e.stopPropagation()}>
                <HelperDisplay
                  helperType={question.helperType}
                  helperName={question.helperName}
                  helperValue={question.helperValue}
                />
              </div>
            )}

            {/* Answer Inputs */}
            {(question.answerType || question.answerOptions) && (
              <div
                className="mb-2 p-2 bg-base-200/50 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-base-content/70 uppercase">
                    {getAnswerTypeLabel(question.answerType)}
                  </span>
                  {!question.answerOptions && question.characteristic && (
                    <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs">
                      {question.characteristic}
                    </span>
                  )}
                </div>
                {renderAnswerInputs(question)}
              </div>
            )}

            {/* Add Suggestion button (modal mode) */}
            {onAddSuggestion && (
              <div className="flex justify-end mt-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSuggestion(question);
                  }}
                >
                  Add Suggestion
                </button>
              </div>
            )}
          </>
        );

        return (
          <div
            key={question.id}
            data-testid={`question-card-${question.questionId}`}
            className={`bg-base-100 rounded-box border p-4 cursor-pointer transition-all ${
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-base-300 hover:border-base-content/20 hover:shadow-sm"
            }`}
            onClick={() => onSelectQuestion(question)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectQuestion(question);
              }
            }}
            aria-selected={isSelected}
          >
            {isConditional ? (
              <ConditionalQuestionWrapper translatedEnableWhen={translatedEnableWhen}>
                {questionContent}
              </ConditionalQuestionWrapper>
            ) : (
              questionContent
            )}
          </div>
        );
      })}
    </div>
  );
}
