"use client";

import { useState, useEffect } from "react";
import { EditableQuestion } from "@/types/editPanel";
import { Badge } from "@/components/ui/badge";
import ComponentChangesDisplay from "@/components/questionnaire/ComponentChangesDisplay";
import SuggestionThreadModal from "@/components/questionnaire/SuggestionThreadModal";
import type { ComponentChanges } from "@/types/editPanel";
import { formatDate } from "@/lib/utils";
import { MessageSquarePlus, Loader2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface Suggestion {
  id: number;
  submitterName: string;
  submitterEmail: string | null;
  suggestionText: string;
  reason: string;
  status: "draft" | "pending" | "approved" | "rejected";
  responseMessage: string | null;
  createdAt: string;
  commentCount: number;
  componentChanges?: ComponentChanges | null;
  question?: {
    id: number;
    questionId: string;
    category: string;
    questionText: string;
    section?: string | null;
  } | null;
}

interface QuestionSuggestionsPanelProps {
  question: EditableQuestion;
  trustLinkId: string;
  onAddSuggestion?: () => void;
  onRefresh: () => void;
  /** Called after a suggestion is deleted so parent can update quickActions state */
  onSuggestionDeleted?: (suggestionId: number, suggestionText: string) => void;
  onClose?: () => void;
}

const statusStyles = {
  draft: {
    label: "Draft",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

export default function QuestionSuggestionsPanel({
  question,
  trustLinkId,
  onAddSuggestion,
  onRefresh,
  onSuggestionDeleted,
  onClose,
}: QuestionSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(new Set());
  const [threadSuggestion, setThreadSuggestion] = useState<Suggestion | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSuggestionsForQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/instance/${trustLinkId}/suggestions`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const questionSuggestions = (data.suggestions || []).filter(
        (s: Suggestion) => s.question?.id === question.id
      );
      setSuggestions(questionSuggestions);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/instance/${trustLinkId}/suggestions`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        const questionSuggestions = (data.suggestions || []).filter(
          (s: Suggestion) => s.question?.id === question.id
        );
        setSuggestions(questionSuggestions);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [question.id, trustLinkId]);

  const handleDelete = async (suggestion: Suggestion) => {
    setDeletingId(suggestion.id);
    try {
      const res = await fetch(
        `/api/instance/${trustLinkId}/suggestions/${suggestion.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete");
      }
      toast.success("Suggestion removed");
      // Remove from local list
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      // Notify parent so it can clear quickActions state if needed
      onSuggestionDeleted?.(suggestion.id, suggestion.suggestionText);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete suggestion");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleReason = (id: number) => {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Question Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className="font-mono text-xs">{question.questionId}</Badge>
            <Badge variant="ghost" className="text-xs">{question.category}</Badge>
            {suggestions.length > 0 && !loading && (
              <Badge variant="info" className="text-xs">
                {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600 line-clamp-2">{question.questionText}</p>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm mb-1">No suggestions yet</p>
            <p className="text-slate-500 text-xs">Be the first to add one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const style = statusStyles[suggestion.status];
              const reasonExpanded = expandedReasons.has(suggestion.id);
              const isDeleting = deletingId === suggestion.id;

              return (
                <div
                  key={suggestion.id}
                  className={`bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow ${
                    isDeleting ? "opacity-50" : ""
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-slate-800">
                        {suggestion.submitterName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(suggestion.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {suggestion.commentCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4A90A4] bg-[#4A90A4]/10 rounded-full px-2 py-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {suggestion.commentCount}
                        </span>
                      )}
                      <span className={`inline-flex text-xs font-medium rounded-full px-2 py-0.5 border ${style.bg} ${style.text} ${style.border}`}>
                        {style.label}
                      </span>
                    </div>
                  </div>

                  {/* Suggestion body */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-slate-500 mb-1">Suggested Changes:</p>
                    {suggestion.componentChanges ? (
                      <ComponentChangesDisplay
                        componentChanges={suggestion.componentChanges}
                        fallbackText={suggestion.suggestionText}
                      />
                    ) : (
                      <p className="text-sm text-slate-700">{suggestion.suggestionText}</p>
                    )}
                  </div>

                  {/* Reason (collapsible) */}
                  {suggestion.reason && (
                    <div className="mb-2">
                      <button
                        onClick={() => toggleReason(suggestion.id)}
                        className="text-xs font-medium text-slate-500 hover:text-[#4A90A4] transition-colors flex items-center gap-1"
                      >
                        <svg
                          className={`w-3 h-3 transition-transform ${reasonExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Reason
                      </button>
                      {reasonExpanded && (
                        <p className="text-sm text-slate-600 mt-1 pl-4">{suggestion.reason}</p>
                      )}
                    </div>
                  )}

                  {/* Response message */}
                  {suggestion.responseMessage && (
                    <div className="bg-[#4A90A4]/5 border border-[#4A90A4]/10 rounded-lg p-3 mb-2">
                      <p className="text-xs font-medium text-[#4A90A4] mb-1">Admin Response:</p>
                      <p className="text-sm text-slate-700">{suggestion.responseMessage}</p>
                    </div>
                  )}

                  {/* Actions: View Thread + Delete */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setThreadSuggestion(suggestion)}
                      className="text-xs font-medium text-[#4A90A4] hover:text-[#3A7A94] transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      View Thread
                      {suggestion.commentCount > 0 && ` (${suggestion.commentCount})`}
                    </button>
                    {onAddSuggestion && (
                      <button
                        onClick={() => handleDelete(suggestion)}
                        disabled={isDeleting}
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Suggestion Button — visible when editing is allowed */}
      {onAddSuggestion && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            onClick={onAddSuggestion}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A90A4] text-white text-sm font-medium hover:bg-[#3A7A94] transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Add Suggestion
          </button>
        </div>
      )}

      {/* Thread Modal */}
      <SuggestionThreadModal
        isOpen={!!threadSuggestion}
        onClose={() => setThreadSuggestion(null)}
        suggestion={threadSuggestion}
        trustLinkId={trustLinkId}
        authorType="trust_user"
        onCommentAdded={onRefresh}
      />
    </div>
  );
}
