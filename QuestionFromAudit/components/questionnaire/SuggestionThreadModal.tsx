"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import ConversationThread from "./ConversationThread";
import CommentInput from "./CommentInput";
import { parseCharacteristics } from "@/lib/enableWhen";
import HelperDisplay from "@/components/questionnaire/HelperDisplay";
import ComponentChangesDisplay from "./ComponentChangesDisplay";
import type { ComponentChanges } from "@/types/editPanel";
import { formatDate } from "@/lib/utils";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType?: string | null;
  answerOptions?: string | null;
  characteristic?: string | null;
  hasHelper?: boolean | null;
  helperType?: string | null;
  helperName?: string | null;
  helperValue?: string | null;
}

interface Suggestion {
  id: number;
  submitterName: string;
  submitterEmail?: string | null;
  suggestionText: string;
  reason: string;
  status: "draft" | "pending" | "approved" | "rejected";
  responseMessage: string | null;
  createdAt: string;
  commentCount?: number;
  question?: Question | null;
  componentChanges?: ComponentChanges | null;
}

interface Comment {
  id: number;
  authorType: "admin" | "trust_user";
  authorName: string;
  authorEmail: string | null;
  message: string;
  createdAt: string;
}

interface SuggestionThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  trustLinkId: string;
  authorType: "admin" | "trust_user";
  onCommentAdded?: () => void;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "badge-ghost",
  },
  pending: {
    label: "Pending",
    className: "badge-warning",
  },
  approved: {
    label: "Approved",
    className: "badge-success",
  },
  rejected: {
    label: "Rejected",
    className: "badge-error",
  },
};

export default function SuggestionThreadModal({
  isOpen,
  onClose,
  suggestion,
  trustLinkId,
  authorType,
  onCommentAdded,
}: SuggestionThreadModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const threadContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !suggestion) return;

    const controller = new AbortController();

    async function fetchComments() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/instance/${trustLinkId}/suggestions/${suggestion!.id}/comments`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Failed to load comments");
        }
        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error fetching comments:", err);
        toast.error("Failed to load comments");
      } finally {
        setLoading(false);
      }
    }

    fetchComments();

    return () => controller.abort();
  }, [isOpen, suggestion, trustLinkId]);

  useEffect(() => {
    // Scroll to bottom when comments change
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTop = threadContainerRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmitComment = async (data: {
    authorName: string;
    authorEmail?: string;
    message: string;
  }) => {
    if (!suggestion) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/instance/${trustLinkId}/suggestions/${suggestion.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorType,
            authorName: data.authorName,
            authorEmail: data.authorEmail || null,
            message: data.message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add comment");
      }

      const newComment = await response.json();
      setComments((prev) => [...prev, newComment]);
      toast.success("Comment added");
      // Defer callback to next microtask so React state update propagates first
      queueMicrotask(() => onCommentAdded?.());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAnswerOptions = (question: Question) => {
    const answerType = question.answerType?.toLowerCase();
    const characteristics = parseCharacteristics(question.characteristic);

    if (!question.answerOptions) {
      // Text-type question with only a characteristic
      if (question.characteristic) {
        return (
          <div className="p-3 bg-base-200 rounded-box">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-base-content/70 uppercase">
                Free text
              </span>
              <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs">
                {question.characteristic}
              </span>
            </div>
          </div>
        );
      }
      return null;
    }

    const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);

    return (
      <div className="p-3 bg-base-200 rounded-box">
        <span className="text-xs font-medium text-base-content/70 uppercase mb-2 block">
          {answerType === "radio"
            ? "Single choice"
            : answerType === "multi_select"
            ? "Multiple choice"
            : answerType || "Options"}
        </span>
        <div className="flex flex-col gap-1">
          {options.map((option, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                {answerType === "radio" ? (
                  <div className="w-4 h-4 rounded-full border-2 border-base-300" />
                ) : answerType === "multi_select" ? (
                  <div className="w-4 h-4 rounded border-2 border-base-300" />
                ) : null}
                <span className="text-sm">{option}</span>
              </div>
              {characteristics[idx] && (
                <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs">
                  {characteristics[idx]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-full sm:max-w-2xl overflow-hidden rounded-xl bg-base-100 shadow-2xl flex flex-col max-h-[85vh] p-0" showCloseButton={false}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
                  <DialogTitle className="text-base font-semibold text-base-content">
                    Suggestion Thread
                  </DialogTitle>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Question Card - Same style as review screen */}
                {suggestion.question && (
                  <div className="px-6 py-4 border-b border-base-200">
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-neutral badge-sm font-mono">
                          {suggestion.question.questionId}
                        </span>
                        <span className="badge badge-ghost badge-sm">
                          {suggestion.question.category}
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-base-content mb-3">{suggestion.question.questionText}</p>

                    {/* Helper Information */}
                    {suggestion.question.hasHelper && (
                      <HelperDisplay
                        helperType={suggestion.question.helperType ?? null}
                        helperName={suggestion.question.helperName ?? null}
                        helperValue={suggestion.question.helperValue ?? null}
                      />
                    )}

                    {/* Answer Options */}
                    {(suggestion.question.answerType || suggestion.question.answerOptions || suggestion.question.characteristic) &&
                      renderAnswerOptions(suggestion.question)
                    }
                  </div>
                )}

                {/* Suggestion Details */}
                <div className="px-6 py-4 bg-base-50 border-b border-base-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-base-content">
                        {suggestion.submitterName}
                      </span>
                      <span className="text-xs text-base-content/40">
                        {formatDate(suggestion.createdAt)}
                      </span>
                    </div>
                    <span className={`badge badge-sm ${statusConfig[suggestion.status].className}`}>
                      {statusConfig[suggestion.status].label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-base-content/60 mb-1">
                        Suggested Change
                      </p>
                      {suggestion.componentChanges &&
                      Object.keys(suggestion.componentChanges).length > 0 ? (
                        <div className="text-sm">
                          <ComponentChangesDisplay
                            componentChanges={suggestion.componentChanges}
                            fallbackText={suggestion.suggestionText}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-base-content">
                          {suggestion.suggestionText}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-base-content/60 mb-1">
                        Reason
                      </p>
                      <p className="text-sm text-base-content/80">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thread */}
                <div
                  ref={threadContainerRef}
                  className="flex-1 overflow-y-auto px-6 py-4 min-h-[180px]"
                >
                  <ConversationThread comments={comments} loading={loading} />
                </div>

                {/* Comment Input */}
                <div className="px-6 py-4 border-t border-base-200 bg-base-50">
                  <CommentInput
                    authorType={authorType}
                    onSubmit={handleSubmitComment}
                    isSubmitting={isSubmitting}
                    placeholder="Add a comment..."
                  />
                </div>
      </DialogContent>
    </Dialog>
  );
}
