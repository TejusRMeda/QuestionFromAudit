"use client";

import { useState, useMemo } from "react";
import ComponentChangesDisplay from "@/components/questionnaire/ComponentChangesDisplay";
import SuggestionThreadModal from "@/components/questionnaire/SuggestionThreadModal";
import type { ComponentChanges } from "@/types/editPanel";
import { formatDate } from "@/lib/utils";

interface SuggestionQuestion {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  section?: string | null;
}

export interface Suggestion {
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
  question?: SuggestionQuestion | null;
}

interface SuggestionsListViewProps {
  suggestions: Suggestion[];
  loading: boolean;
  trustLinkId: string;
  onRefresh: () => void;
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

export default function SuggestionsListView({
  suggestions,
  loading,
  trustLinkId,
  onRefresh,
}: SuggestionsListViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(new Set());
  const [threadSuggestion, setThreadSuggestion] = useState<Suggestion | null>(null);

  const filtered = useMemo(() => {
    let result = suggestions;
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.question?.questionText.toLowerCase().includes(term) ||
          s.question?.questionId.toLowerCase().includes(term) ||
          s.suggestionText.toLowerCase().includes(term) ||
          s.submitterName.toLowerCase().includes(term)
      );
    }
    return result;
  }, [suggestions, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const c = { all: suggestions.length, draft: 0, pending: 0, approved: 0, rejected: 0 };
    for (const s of suggestions) {
      c[s.status]++;
    }
    return c;
  }, [suggestions]);

  const toggleReason = (id: number) => {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 w-1/3 bg-slate-200 rounded mb-3" />
              <div className="h-3 w-2/3 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Status counts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "draft", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === status
                ? "bg-[#4A90A4] text-white border-[#4A90A4]"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {status === "all" ? "All" : statusStyles[status].label}{" "}
            <span className={statusFilter === status ? "text-white/80" : "text-slate-500"}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      {suggestions.length > 0 && (
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4]"
          />
        </div>
      )}

      {/* Suggestions list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((suggestion) => {
            const style = statusStyles[suggestion.status];
            const reasonExpanded = expandedReasons.has(suggestion.id);

            return (
              <div
                key={suggestion.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
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

                {/* Question reference */}
                {suggestion.question && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">
                        {suggestion.question.questionId}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                        {suggestion.question.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {suggestion.question.questionText}
                    </p>
                  </div>
                )}

                {/* Suggestion body */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Suggested Changes:</p>
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
                  <div className="mb-3">
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
                      <p className="text-sm text-slate-600 mt-1.5 pl-4">{suggestion.reason}</p>
                    )}
                  </div>
                )}

                {/* Response message */}
                {suggestion.responseMessage && (
                  <div className="bg-[#4A90A4]/5 border border-[#4A90A4]/10 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-[#4A90A4] mb-1">Admin Response:</p>
                    <p className="text-sm text-slate-700">{suggestion.responseMessage}</p>
                  </div>
                )}

                {/* View Thread button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setThreadSuggestion(suggestion)}
                    className="text-sm font-medium text-[#4A90A4] hover:text-[#3A7A94] transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    View Thread
                    {suggestion.commentCount > 0 && ` (${suggestion.commentCount})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">
            {suggestions.length === 0
              ? "No suggestions have been submitted yet"
              : "No suggestions match your filters"}
          </p>
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
