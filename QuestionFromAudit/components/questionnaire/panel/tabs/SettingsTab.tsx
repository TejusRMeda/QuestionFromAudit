"use client";

import { useState } from "react";
import { EditableQuestion, SettingsChanges } from "@/types/editPanel";
import { parseCharacteristics } from "@/lib/enableWhen";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface SettingsTabProps {
  question: EditableQuestion;
  changes: SettingsChanges | null;
  onUpdateChanges: (changes: Partial<SettingsChanges>) => void;
  questionIndex: number;
  totalQuestions: number;
}

/**
 * Settings tab for viewing and suggesting changes to question settings
 */
export default function SettingsTab({
  question,
  changes,
  onUpdateChanges,
  questionIndex,
  totalQuestions,
}: SettingsTabProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Determine the current required status (considering any pending changes)
  const currentRequired = question.required ?? false;
  const suggestedRequired = changes?.required?.to ?? currentRequired;
  const hasRequiredChange = changes?.required !== undefined;

  const handleRequiredToggle = () => {
    const newValue = !suggestedRequired;
    if (newValue === currentRequired) {
      // If reverting to original, clear the change
      onUpdateChanges({ required: undefined });
    } else {
      onUpdateChanges({
        required: {
          from: currentRequired,
          to: newValue,
        },
      });
    }
  };

  // Parse options for the advanced details section
  const options = question.answerOptions
    ?.split("|")
    .map((o) => o.trim())
    .filter(Boolean) || [];
  const characteristics = parseCharacteristics(question.characteristic);

  return (
    <div className="space-y-6">
      {/* Read-only Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Question Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Section */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Section</p>
            <p className="text-sm font-medium">{question.section || "—"}</p>
          </div>

          {/* Page */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Page</p>
            <p className="text-sm font-medium">{question.page || "—"}</p>
          </div>

          {/* Position */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Position</p>
            <p className="text-sm font-medium">
              Question {questionIndex + 1} of {totalQuestions}
            </p>
          </div>

          {/* Question ID */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Question ID</p>
            <p className="text-sm font-medium font-mono">{question.questionId}</p>
          </div>
        </div>
      </div>

      {/* Editable Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Suggest Changes
        </h3>

        {/* Required Toggle */}
        <div
          className={`rounded-lg p-4 border transition-colors ${
            hasRequiredChange
              ? "border-[#4A90A4] bg-[#4A90A4]/5"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Required Field</p>
              <p className="text-sm text-slate-500">
                {currentRequired
                  ? "This question must be answered"
                  : "This question is optional"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {suggestedRequired ? "Required" : "Optional"}
              </span>
              <Switch
                checked={suggestedRequired}
                onCheckedChange={handleRequiredToggle}
                aria-label="Toggle required"
              />
            </div>
          </div>

          {hasRequiredChange && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-[#4A90A4] flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suggesting change from &ldquo;{currentRequired ? "Required" : "Optional"}&rdquo; to &ldquo;
                {suggestedRequired ? "Required" : "Optional"}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Details (Collapsible) */}
      <div className="border border-slate-200 rounded-lg">
        <button
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Advanced Details
          </span>
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform ${
              showAdvanced ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="p-4 pt-0 space-y-4">
            {/* Answer Type */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Answer Type</p>
              <Badge variant="outline">{question.answerType || "—"}</Badge>
            </div>

            {/* Characteristics */}
            {options.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Options & Characteristics
                </p>
                <div className="space-y-1.5">
                  {options.map((option, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-slate-50 rounded px-2 py-1.5"
                    >
                      <span>{option}</span>
                      {characteristics[idx] && (
                        <Badge variant="warning" className="font-mono text-xs">
                          {characteristics[idx]}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single characteristic (for non-option questions) */}
            {options.length === 0 && question.characteristic && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Characteristic</p>
                <Badge variant="warning" className="font-mono">
                  {question.characteristic}
                </Badge>
              </div>
            )}

            {/* Category */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Category</p>
              <Badge variant="ghost">{question.category}</Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
