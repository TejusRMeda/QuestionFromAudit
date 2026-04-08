"use client";

import { useState, useRef, useEffect } from "react";
import { EditableQuestion } from "@/types/editPanel";
import {
  ShieldCheck,
  Trash2,
  Loader2,
  MessageSquarePlus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export type QuickActionType = "required" | "delete" | "add-before" | "add-after";

interface QuickActionsMenuProps {
  question: EditableQuestion;
  trustLinkId: string;
  reviewerName: string;
  onActionComplete: (questionId: number, action: QuickActionType) => void;
  onNameRequired: () => void;
  onAddSuggestion?: (question: EditableQuestion) => void;
  onAddNewQuestion?: (question: EditableQuestion, position: "before" | "after") => void;
  /** Currently applied quick action on this question (disables conflicting buttons) */
  appliedAction?: QuickActionType | null;
}

export default function QuickActionsMenu({
  question,
  trustLinkId,
  reviewerName,
  onActionComplete,
  onNameRequired,
  onAddSuggestion,
  onAddNewQuestion,
  appliedAction,
}: QuickActionsMenuProps) {
  const [submitting, setSubmitting] = useState<"required" | "delete" | null>(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showAddDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAddDropdown]);

  const submitQuickAction = async (actionType: "required" | "delete") => {
    if (!reviewerName) {
      onNameRequired();
      return;
    }

    setSubmitting(actionType);

    let suggestionText: string;
    let reason: string;
    let componentChanges: Record<string, unknown> | undefined;

    const isCurrentlyRequired = question.required ?? false;

    switch (actionType) {
      case "required":
        suggestionText = "Make this question required";
        reason = "This question should be mandatory for patients";
        componentChanges = {
          settings: {
            required: { from: isCurrentlyRequired, to: true },
          },
        };
        break;
      case "delete":
        suggestionText = "Remove this question from the questionnaire";
        reason = "This question is not relevant or necessary";
        break;
    }

    try {
      const response = await fetch(
        `/api/instance/${trustLinkId}/suggestions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceQuestionId: question.id,
            submitterName: reviewerName,
            suggestionText,
            reason,
            ...(componentChanges ? { componentChanges } : {}),
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to submit");
      }

      const labels: Record<"required" | "delete", string> = {
        required: "Marked as required",
        delete: "Suggested for removal",
      };
      toast.success(labels[actionType]);
      onActionComplete(question.id, actionType);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit quick action"
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleAddNewQuestion = (position: "before" | "after") => {
    setShowAddDropdown(false);
    if (!reviewerName) {
      onNameRequired();
      return;
    }
    onAddNewQuestion?.(question, position);
  };

  // When "delete" is applied, both Mark Required and Delete are inactive
  // When "required" is applied, only Mark Required is inactive
  const isRequiredDisabled = submitting !== null || appliedAction === "required" || appliedAction === "delete";
  const isDeleteDisabled = submitting !== null || appliedAction === "delete";

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        disabled={isRequiredDisabled}
        onClick={() => submitQuickAction("required")}
        className={`gap-1.5 h-7 px-2 text-xs ${
          isRequiredDisabled && !submitting
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-500 hover:text-[#4A90A4] hover:bg-[#4A90A4]/5"
        }`}
      >
        {submitting === "required" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5" />
        )}
        Mark Required
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isDeleteDisabled}
        onClick={() => submitQuickAction("delete")}
        className={`gap-1.5 h-7 px-2 text-xs ${
          isDeleteDisabled && !submitting
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-500 hover:text-red-600 hover:bg-red-50"
        }`}
      >
        {submitting === "delete" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        Delete
      </Button>
      {onAddNewQuestion && (
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            disabled={submitting !== null}
            onClick={() => setShowAddDropdown((prev) => !prev)}
            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 gap-1.5 h-7 px-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </Button>
          {showAddDropdown && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg border border-slate-200 shadow-lg py-1 min-w-[180px]">
              <button
                onClick={() => handleAddNewQuestion("before")}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Before this question
              </button>
              <button
                onClick={() => handleAddNewQuestion("after")}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                After this question
              </button>
            </div>
          )}
        </div>
      )}
      {onAddSuggestion && (
        <Button
          variant="ghost"
          size="sm"
          disabled={submitting !== null}
          onClick={() => onAddSuggestion(question)}
          className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 gap-1.5 h-7 px-2 text-xs"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Add Suggestion
        </Button>
      )}
    </div>
  );
}

/** Permanent banner shown on card after a quick action is taken */
export function QuickActionBanner({
  action,
}: {
  action: QuickActionType;
}) {
  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    delete: {
      label: "Suggested for removal",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    required: {
      label: "Suggested as required",
      bg: "bg-[#4A90A4]/5",
      text: "text-[#4A90A4]",
      border: "border-[#4A90A4]/20",
    },
    "add-before": {
      label: "New question suggested (before)",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    "add-after": {
      label: "New question suggested (after)",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
  };

  const c = config[action];
  if (!c) return null;

  return (
    <div
      className={`rounded-lg border px-3 py-1.5 mb-2 text-xs font-medium ${c.bg} ${c.text} ${c.border}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span>{c.label}</span>
    </div>
  );
}
