"use client";

import { useMemo, memo } from "react";
import {
  TranslatedEnableWhen,
} from "@/lib/enableWhen";
import ConditionalQuestionWrapper from "../ConditionalQuestionWrapper";
import HelperDisplay from "../HelperDisplay";
import QuickActionsMenu, { QuickActionType, QuickActionBanner } from "../QuickActionsMenu";
import { EditableQuestion, QuestionListItem } from "@/types/editPanel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCalculatorConfig } from "@/lib/calculators";
import CalculatorRenderer from "../CalculatorRenderer";


export type ViewStyle = "default" | "patient";

interface QuestionsListProps {
  questions: QuestionListItem[];
  selectedQuestionId: number | null;
  onSelectQuestion: (question: EditableQuestion) => void;
  searchTerm: string;
  categoryFilter: string;
  translatedEnableWhens: Map<number, TranslatedEnableWhen>;
  questionAnswers: Record<number, string | string[]>;
  onAnswerChange: (questionId: number, value: string | string[]) => void;
  onAddSuggestion?: (question: EditableQuestion) => void;
  onAddNewQuestion?: (question: EditableQuestion, position: "before" | "after") => void;
  viewStyle?: ViewStyle;
  trustLinkId?: string;
  reviewerName?: string;
  quickActions?: Record<number, QuickActionType>;
  onQuickAction?: (questionId: number, action: QuickActionType) => void;
  onReviewerNameRequired?: () => void;
}

/**
 * List of questions in the left panel of the split-screen layout.
 * Questions are clickable to select them for editing.
 * Wrapped in React.memo to prevent re-renders when parent state changes
 * (e.g., edit panel tab changes) that don't affect the questions list.
 */
function QuestionsListInner({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  searchTerm,
  categoryFilter,
  translatedEnableWhens,
  questionAnswers,
  onAnswerChange,
  onAddSuggestion,
  onAddNewQuestion,
  viewStyle = "default",
  trustLinkId,
  reviewerName,
  quickActions,
  onQuickAction,
  onReviewerNameRequired,
}: QuestionsListProps) {
  const isPatientView = viewStyle === "patient";

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

    // Calculator types (bmi-calculator, etc.)
    const calcConfig = getCalculatorConfig(answerType || "");
    if (calcConfig) {
      return (
        <CalculatorRenderer
          config={calcConfig}
          questionId={question.id}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          variant="default"
        />
      );
    }

    // Text input types
    const textInputTypes = [
      "text", "text-field", "forage",
      "phone-number", "number-input", "age",
      "allergy-list", "frailty-score",
      "medication-list", "i-c-u-list", "previous-operation-list"
    ];
    if (textInputTypes.includes(answerType || "")) {
      return (
        <div>
          <Input
            type="text"
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Multiline text
    if (answerType === "text-area" || answerType === "text-paragraph") {
      return (
        <div>
          <Textarea
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            rows={3}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Date picker
    if (answerType === "date") {
      return (
        <div>
          <Input
            type="date"
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Display-only types (not shown in questionnaire)
    if (answerType === "spacer" || answerType === "content-block" || answerType === "alert" || answerType === "send-button") {
      return null;
    }

    // Radio buttons
    if (answerType === "radio" && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      return (
        <div className="flex flex-col gap-1">
          {options.map((option, idx) => (
            <label key={idx} className="flex items-center gap-2 py-1.5 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={currentAnswer === option}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="h-4 w-4 accent-[#4A90A4]"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm">{option}</span>
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
            <label key={idx} className="flex items-center gap-2 py-1.5 cursor-pointer">
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
                className="h-4 w-4 accent-[#4A90A4]"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm">{option}</span>
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
            <div key={idx}>
              <Badge variant="outline" className="text-xs">{option}</Badge>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  /** UltraMed patient-facing style answer inputs */
  const renderPatientAnswerInputs = (question: EditableQuestion) => {
    const answerType = question.answerType?.toLowerCase();
    const currentAnswer = questionAnswers[question.id];

    // Calculator types (bmi-calculator, etc.)
    const calcConfig = getCalculatorConfig(answerType || "");
    if (calcConfig) {
      return (
        <CalculatorRenderer
          config={calcConfig}
          questionId={question.id}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          variant="patient"
        />
      );
    }

    // Text input types
    const textInputTypes = [
      "text", "text-field", "forage",
      "phone-number", "number-input", "age",
      "allergy-list", "frailty-score",
      "medication-list", "i-c-u-list", "previous-operation-list"
    ];
    if (textInputTypes.includes(answerType || "")) {
      return (
        <div className="pt-2">
          <input
            type="text"
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full border border-gray-500 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#4A90A4] focus:border-[#4A90A4]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Multiline text
    if (answerType === "text-area" || answerType === "text-paragraph") {
      return (
        <div className="pt-2">
          <textarea
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full border border-gray-500 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#4A90A4] focus:border-[#4A90A4]"
            rows={3}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Date picker
    if (answerType === "date") {
      return (
        <div className="pt-2">
          <input
            type="date"
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full border border-gray-500 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#4A90A4] focus:border-[#4A90A4]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // Display-only types (not shown in questionnaire)
    if (answerType === "spacer" || answerType === "content-block" || answerType === "alert" || answerType === "send-button") {
      return null;
    }

    // Radio buttons — UltraMed custom circular style
    if (answerType === "radio" && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      return (
        <div className="flex flex-col pt-2 space-y-4">
          {options.map((option, idx) => (
            <div key={idx} className="flex mt-2 relative">
              <input
                id={`patient-${question.id}-${option}`}
                type="radio"
                name={`patient-question-${question.id}`}
                value={option}
                checked={currentAnswer === option}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="appearance-none h-11 w-11 opacity-0 peer z-[1] cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Inner fill dot */}
              <span className="rounded-full w-5 h-5 absolute left-1.5 top-1.5 bg-black hidden peer-checked:block peer-checked:bg-[#4A90A4]" />
              {/* Outer ring */}
              <span className="rounded-full w-8 h-8 absolute left-0 border-2 border-black peer-focus:ring-[#4A90A4] peer-focus:ring-2 peer-focus:ring-offset-2" />
              <label
                className="text-lg cursor-pointer w-11 flex mt-[3px] flex-grow"
                htmlFor={`patient-${question.id}-${option}`}
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      );
    }

    // Checkboxes — UltraMed style (square version of the radio pattern)
    if ((answerType === "multi_select" || answerType === "checkbox") && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      const selectedValues = Array.isArray(currentAnswer) ? currentAnswer : [];

      return (
        <div className="flex flex-col pt-2 space-y-4">
          {options.map((option, idx) => (
            <div key={idx} className="flex mt-2 relative">
              <input
                id={`patient-${question.id}-${option}`}
                type="checkbox"
                value={option}
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  const newValues = e.target.checked
                    ? [...selectedValues, option]
                    : selectedValues.filter((v) => v !== option);
                  onAnswerChange(question.id, newValues);
                }}
                className="appearance-none h-11 w-11 opacity-0 peer z-[1] cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Checkmark indicator */}
              <span className="rounded w-5 h-5 absolute left-1.5 top-1.5 bg-black hidden peer-checked:block peer-checked:bg-[#4A90A4]" />
              {/* Outer box */}
              <span className="rounded w-8 h-8 absolute left-0 border-2 border-black peer-focus:ring-[#4A90A4] peer-focus:ring-2 peer-focus:ring-offset-2" />
              <label
                className="text-lg cursor-pointer w-11 flex mt-[3px] flex-grow"
                htmlFor={`patient-${question.id}-${option}`}
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: show options as text
    if (question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      return (
        <div className="flex flex-col pt-2 space-y-3">
          {options.map((option, idx) => (
            <span key={idx} className="text-lg text-slate-800">{option}</span>
          ))}
        </div>
      );
    }

    return null;
  };

  if (filteredQuestions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-500"
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
        <p className="text-slate-500 font-medium mb-1">
          {searchTerm || categoryFilter !== "all"
            ? "No questions match your filters"
            : "No questions found"}
        </p>
        {(searchTerm || categoryFilter !== "all") && (
          <p className="text-sm text-slate-500">
            Try adjusting your search or clearing filters
          </p>
        )}
      </div>
    );
  }

  // ── Patient (UltraMed) view ──────────────────────────────────────
  if (isPatientView) {
    return (
      <div className="flex flex-col max-w-md mx-auto px-2 sm:px-4 pt-0 pb-8">
        <div className="flex flex-col space-y-8">
          {filteredQuestions.map((question) => {
            const answerType = question.answerType?.toLowerCase();
            const isDisplayOnly = answerType === "spacer" || answerType === "content-block" || answerType === "alert" || answerType === "send-button";
            const isSelected = selectedQuestionId === question.id;

            // Display/intro items render as plain text blocks
            if (isDisplayOnly) {
              return (
                <div
                  key={question.id}
                  data-testid={`question-card-${question.questionId}`}
                  className={`flex flex-col grow space-y-4 cursor-pointer rounded-lg px-1 py-2 transition-all ${
                    isSelected ? "ring-2 ring-[#4A90A4]/30 bg-[#4A90A4]/5" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectQuestion(question)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectQuestion(question); } }}
                >
                  <span className="text-slate-800 text-2xl font-semibold leading-tight">
                    {question.questionText || getCalculatorConfig(question.answerType?.toLowerCase() || "")?.fallbackTitle || ""}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={question.id}
                data-testid={`question-card-${question.questionId}`}
                className={`cursor-pointer rounded-lg px-1 py-2 transition-all ${
                  isSelected ? "ring-2 ring-[#4A90A4]/30 bg-[#4A90A4]/5" : ""
                }`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectQuestion(question)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectQuestion(question); } }}
              >
                <fieldset>
                  <legend>
                    <span className="text-slate-800 text-3xl font-semibold leading-tight">
                      {question.questionText || getCalculatorConfig(question.answerType?.toLowerCase() || "")?.fallbackTitle || ""}
                      {question.required !== false && (
                        <span className="text-xl"> (required)</span>
                      )}
                    </span>
                  </legend>
                  {renderPatientAnswerInputs(question)}
                </fieldset>

                {/* Add Suggestion button — subtle for patient view */}
                {onAddSuggestion && (
                  <div className="flex justify-end mt-3">
                    <button
                      className="text-sm font-medium text-[#4A90A4] hover:text-[#3d7a8c] underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSuggestion(question);
                      }}
                    >
                      Add Suggestion
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Default (audit) view ───────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 p-4">
      {filteredQuestions.map((question) => {
        const isPhantom = "isPhantom" in question && question.isPhantom;

        // ── Phantom (suggested new question) card ──
        if (isPhantom) {
          return (
            <div
              key={question.id}
              className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 p-4 transition-all duration-150 cursor-pointer hover:border-emerald-400 hover:shadow-sm"
              onClick={() => onSelectQuestion(question)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectQuestion(question);
                }
              }}
            >
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-2">
                NEW
              </div>
              <p className="text-lg text-slate-700 font-medium font-roboto-slab mb-1">
                {question.questionText}
              </p>
              <p className="text-xs text-slate-500">
                Suggested by {question.submitterName}
              </p>
            </div>
          );
        }

        // ── Regular question card ──
        const translatedEnableWhen = translatedEnableWhens.get(question.id);
        const isConditional = !!translatedEnableWhen;
        const isSelected = selectedQuestionId === question.id;

        const appliedAction = quickActions?.[question.id];
        // When a quick action banner is shown, subtract 1 from displayed suggestion count
        // so the banner itself serves as the indicator for that action
        const displaySuggestionCount = appliedAction
          ? question.suggestionCount - 1
          : question.suggestionCount;

        const metadataLine = (
          <div className="flex items-center gap-1.5 mb-2 text-slate-500" style={{ fontSize: "0.7rem" }}>
            <span className="text-slate-500">
              {question.section || "General"}{question.page ? ` / ${question.page}` : ""}
            </span>
            {isConditional && (
              <>
                <span>&middot;</span>
                <span className="text-sky-600 font-medium">Conditional</span>
              </>
            )}
            {displaySuggestionCount > 0 && (
              <>
                <span>&middot;</span>
                <span className="text-sky-600 font-medium">
                  {displaySuggestionCount} suggestion{displaySuggestionCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        );

        const questionContent = (
          <>
            {/* Quick Action Banner */}
            {appliedAction && (
              <QuickActionBanner action={appliedAction} />
            )}

            {/* Question Text */}
            <p className="text-xl text-slate-700 font-medium font-roboto-slab mb-2">
              {question.questionText || getCalculatorConfig(question.answerType?.toLowerCase() || "")?.fallbackTitle || ""}
            </p>

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
                className="mb-2 p-2 bg-slate-50 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {renderAnswerInputs(question)}
              </div>
            )}

            {/* Quick Actions + Add Suggestion row */}
            <div className="flex items-center justify-between mt-2">
              {trustLinkId && onReviewerNameRequired && onQuickAction ? (
                <QuickActionsMenu
                  question={question}
                  trustLinkId={trustLinkId}
                  reviewerName={reviewerName || ""}
                  onActionComplete={onQuickAction}
                  onNameRequired={onReviewerNameRequired}
                  onAddSuggestion={onAddSuggestion}
                  onAddNewQuestion={onAddNewQuestion}
                  appliedAction={appliedAction || null}
                />
              ) : (
                <div />
              )}
            </div>
          </>
        );

        return (
          <div
            key={question.id}
            data-testid={`question-card-${question.questionId}`}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-150 ${
              isSelected
                ? "border-[#4A90A4] bg-[#4A90A4]/5 ring-2 ring-[#4A90A4]/20"
                : "border-slate-100 hover:border-slate-300 hover:shadow-sm"
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
            {metadataLine}
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

const QuestionsList = memo(QuestionsListInner);
export default QuestionsList;
