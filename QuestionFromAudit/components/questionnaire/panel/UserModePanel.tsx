"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { EditableQuestion } from "@/types/editPanel";
import { CharacteristicSource } from "@/lib/enableWhen";
import QuestionSuggestionsPanel from "./QuestionSuggestionsPanel";
import EmptyPanelState from "./EmptyPanelState";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquarePlus, X, GitBranch } from "lucide-react";
import toast from "react-hot-toast";
import { useIsTestSession } from "@/lib/testingSessionContext";

const LogicFlowView = dynamic(() => import("./LogicFlowView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
      <span className="loading loading-spinner" />
    </div>
  ),
});

const CHANGE_TYPES = [
  { value: "Remove", label: "Remove Question" },
  { value: "Reword", label: "Reword" },
  { value: "Additional Question", label: "Additional Question" },
  { value: "Move", label: "Move to Another Section" },
  { value: "Other", label: "Other" },
] as const;

type ChangeType = (typeof CHANGE_TYPES)[number]["value"];

interface UserModePanelProps {
  question: EditableQuestion | null;
  allQuestions: EditableQuestion[];
  trustLinkId: string;
  reviewerName: string;
  onRefresh: () => void;
  onSuggestionDeleted?: (suggestionId: number, suggestionText: string) => void;
  onClose?: () => void;
  characteristicMap: Map<string, CharacteristicSource>;
  onSelectQuestion: (question: EditableQuestion) => void;
  onReviewerNameRequired: () => void;
}

type TabId = "suggestions" | "logic";

const MAX_DESCRIPTION_LENGTH = 2000;

export default function UserModePanel({
  question,
  allQuestions,
  trustLinkId,
  reviewerName,
  onRefresh,
  onSuggestionDeleted,
  onClose,
  characteristicMap,
  onSelectQuestion,
  onReviewerNameRequired,
}: UserModePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("suggestions");
  const [showForm, setShowForm] = useState(false);
  const [changeType, setChangeType] = useState<ChangeType>("Remove");
  const [description, setDescription] = useState("");
  const [inlineName, setInlineName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isTestSession = useIsTestSession();

  const resetForm = useCallback(() => {
    setShowForm(false);
    setChangeType("Remove");
    setDescription("");
    setInlineName("");
    setErrors({});
  }, []);

  const handleAddSuggestion = useCallback(() => {
    if (!reviewerName) {
      onReviewerNameRequired();
      return;
    }
    setShowForm(true);
  }, [reviewerName, onReviewerNameRequired]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Maximum ${MAX_DESCRIPTION_LENGTH} characters allowed`;
    }
    if (!reviewerName && !inlineName.trim()) {
      newErrors.inlineName = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [description, reviewerName, inlineName]);

  const handleSubmit = useCallback(async () => {
    if (!validate() || !question) return;

    const name = reviewerName || inlineName.trim();
    const suggestionText = `[${changeType}] ${description.trim()}`;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/instance/${trustLinkId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceQuestionId: question.id,
          submitterName: name,
          suggestionText,
          reason: description.trim(),
          isTestSession,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit suggestion");
      }

      toast.success("Suggestion submitted!");
      resetForm();
      setRefreshKey((k) => k + 1);
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit suggestion"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, question, reviewerName, inlineName, changeType, description, trustLinkId, resetForm, onRefresh, isTestSession]);

  if (!question) {
    return (
      <div className="h-full bg-white border-l border-slate-200">
        <EmptyPanelState />
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "suggestions",
      label: "Suggestions",
      icon: <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />,
    },
    {
      id: "logic",
      label: "Logic",
      icon: <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-slate-200 bg-white flex-shrink-0">
        <div
          className="flex flex-1"
          role="tablist"
          aria-label="Panel tabs"
        >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => {
              if (showForm && tab.id !== "suggestions") {
                resetForm();
              }
              setActiveTab(tab.id);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-[#4A90A4] text-[#4A90A4]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 mr-2 rounded-md hover:bg-slate-200 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "suggestions" ? (
        <div
          id="tabpanel-suggestions"
          role="tabpanel"
          aria-labelledby="tab-suggestions"
          className="flex-1 flex flex-col min-h-0"
        >
          {showForm ? (
            /* Inline Suggestion Form */
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Add Suggestion</h3>
                  <button
                    onClick={resetForm}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Type of Change */}
                <div>
                  <Label htmlFor="change-type" className="text-xs font-medium text-slate-700 mb-1.5">
                    Type of Change
                  </Label>
                  <select
                    id="change-type"
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as ChangeType)}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4]"
                  >
                    {CHANGE_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>
                        {ct.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="suggestion-description" className="text-xs font-medium text-slate-700">
                      Description <span className="text-red-600">*</span>
                    </Label>
                    <span className="text-xs text-slate-500">
                      {description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="suggestion-description"
                    placeholder="Describe the change you'd like to suggest..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`resize-none ${errors.description ? "border-red-300" : ""}`}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? "description-error" : undefined}
                  />
                  {errors.description && (
                    <p id="description-error" className="text-xs text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Inline name (only if reviewerName not set) */}
                {!reviewerName && (
                  <div>
                    <Label htmlFor="inline-name" className="text-xs font-medium text-slate-700 mb-1.5">
                      Your Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="inline-name"
                      type="text"
                      placeholder="Enter your name"
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      className={errors.inlineName ? "border-red-300" : ""}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.inlineName}
                      aria-describedby={errors.inlineName ? "name-error" : undefined}
                    />
                    {errors.inlineName && (
                      <p id="name-error" className="text-xs text-red-600 mt-1">{errors.inlineName}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#4A90A4] hover:bg-[#3A7A94]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Suggestions List — compose QuestionSuggestionsPanel */
            <QuestionSuggestionsPanel
              key={`${question.id}-${refreshKey}`}
              question={question}
              trustLinkId={trustLinkId}
              onAddSuggestion={handleAddSuggestion}
              onRefresh={onRefresh}
              onSuggestionDeleted={onSuggestionDeleted}
            />
          )}
        </div>
      ) : (
        <div
          id="tabpanel-logic"
          role="tabpanel"
          aria-labelledby="tab-logic"
          className="flex-1 min-h-0"
        >
          <LogicFlowView
            questions={allQuestions}
            selectedQuestion={question}
            onSelectQuestion={onSelectQuestion}
            characteristicMap={characteristicMap}
          />
        </div>
      )}
    </div>
  );
}
