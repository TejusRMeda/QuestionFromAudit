"use client";

import { useState, useMemo } from "react";
import type { Suggestion } from "./SuggestionsListView";
import type { ComponentChanges } from "@/types/editPanel";
import type { TranslatedEnableWhen } from "@/lib/enableWhen";
import { formatDate } from "@/lib/utils";

interface ChangeRequestsTableViewProps {
  suggestions: Suggestion[];
  loading: boolean;
  translatedEnableWhens: Map<number, TranslatedEnableWhen>;
}

/**
 * Derive the "Type of Change" from structured component changes.
 * Returns an array since one suggestion can contain multiple change types.
 */
function deriveChangeTypes(changes: ComponentChanges | null | undefined): string[] {
  if (!changes) return ["General suggestion"];

  const types: string[] = [];

  if (changes.settings?.required) {
    types.push("Change setting");
  }

  if (changes.content?.questionText) {
    types.push("Change question wording");
  }

  if (changes.content?.answerType) {
    types.push("Change answer type");
  }

  if (changes.content?.options) {
    if (changes.content.options.added.length > 0) {
      types.push("Additional option");
    }
    if (changes.content.options.modified.length > 0) {
      types.push("Modify option");
    }
    if (changes.content.options.removed.length > 0) {
      types.push("Remove option");
    }
  }

  if (changes.help) {
    types.push("Change help content");
  }

  if (changes.logic) {
    types.push("Change recommendation");
  }

  return types.length > 0 ? types : ["General suggestion"];
}

/**
 * Extract the suggested change description from component changes.
 */
function extractSuggestedChange(
  changes: ComponentChanges | null | undefined,
  fallbackText: string
): string {
  if (!changes) return fallbackText;

  const parts: string[] = [];

  if (changes.content?.questionText) {
    parts.push(changes.content.questionText.to);
  }

  if (changes.content?.answerType) {
    parts.push(`Change to ${changes.content.answerType.to}`);
  }

  if (changes.content?.options) {
    const { added, modified, removed } = changes.content.options;
    if (added.length > 0) {
      parts.push(`Add: ${added.map((a) => a.text).join(", ")}`);
    }
    if (modified.length > 0) {
      parts.push(
        `Modify: ${modified.map((m) => `"${m.from}" → "${m.to}"`).join(", ")}`
      );
    }
    if (removed.length > 0) {
      parts.push(`Remove ${removed.length} option(s)`);
    }
  }

  if (changes.settings?.required) {
    parts.push(
      changes.settings.required.to ? "Make required" : "Make optional"
    );
  }

  if (changes.help?.helperValue) {
    parts.push(changes.help.helperValue.to);
  }

  if (changes.logic) {
    parts.push(changes.logic.description);
  }

  return parts.length > 0 ? parts.join("; ") : fallbackText;
}

/**
 * Get the branching/positioning info from enableWhen.
 */
function getBranchingInfo(
  questionId: number,
  translatedEnableWhens: Map<number, TranslatedEnableWhen>
): string {
  const translated = translatedEnableWhens.get(questionId);
  if (!translated) return "—";

  // Use the summary which already has the readable format
  return translated.summary;
}

const statusStyles = {
  draft: {
    label: "Draft",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

interface ChangeRequestRow {
  id: number;
  section: string;
  changeTypes: string[];
  question: string;
  questionId: string;
  branching: string;
  suggestedChange: string;
  ultramedResponse: string;
  status: "draft" | "pending" | "approved" | "rejected";
  submitterName: string;
  createdAt: string;
  reason: string;
}

export default function ChangeRequestsTableView({
  suggestions,
  loading,
  translatedEnableWhens,
}: ChangeRequestsTableViewProps) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "pending" | "approved" | "rejected"
  >("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Transform suggestions into table rows
  const rows: ChangeRequestRow[] = useMemo(() => {
    return suggestions.map((s) => ({
      id: s.id,
      section: s.question?.section || "General",
      changeTypes: deriveChangeTypes(s.componentChanges),
      question: s.question?.questionText || "Unknown question",
      questionId: s.question?.questionId || "",
      branching: getBranchingInfo(
        s.question?.id || 0,
        translatedEnableWhens
      ),
      suggestedChange: extractSuggestedChange(
        s.componentChanges,
        s.suggestionText
      ),
      ultramedResponse: s.responseMessage || "",
      status: s.status,
      submitterName: s.submitterName,
      createdAt: s.createdAt,
      reason: s.reason,
    }));
  }, [suggestions, translatedEnableWhens]);

  // Unique sections and change types for filters
  const sections = useMemo(() => {
    return [...new Set(rows.map((r) => r.section))].sort();
  }, [rows]);

  const changeTypes = useMemo(() => {
    const types = new Set<string>();
    rows.forEach((r) => r.changeTypes.forEach((t) => types.add(t)));
    return [...types].sort();
  }, [rows]);

  // Filtered rows
  const filtered = useMemo(() => {
    let result = rows;

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (sectionFilter !== "all") {
      result = result.filter((r) => r.section === sectionFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((r) => r.changeTypes.includes(typeFilter));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.question.toLowerCase().includes(term) ||
          r.suggestedChange.toLowerCase().includes(term) ||
          r.submitterName.toLowerCase().includes(term) ||
          r.questionId.toLowerCase().includes(term)
      );
    }

    return result;
  }, [rows, statusFilter, sectionFilter, typeFilter, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    const c = { all: rows.length, draft: 0, pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
          <div className="h-12 bg-slate-50 border-b border-slate-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 border-b border-slate-100 px-4 flex items-center gap-4"
            >
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1800px] mx-auto">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "draft", "pending", "approved", "rejected"] as const).map(
            (status) => (
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
                <span
                  className={
                    statusFilter === status
                      ? "text-white/80"
                      : "text-slate-400"
                  }
                >
                  {counts[status]}
                </span>
              </button>
            )
          )}

          <span className="text-slate-300 mx-1">|</span>

          {/* Section filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:outline-none focus:border-[#4A90A4] appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center]"
          >
            <option value="all">All Sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:outline-none focus:border-[#4A90A4] appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center]"
          >
            <option value="all">All Types</option>
            {changeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        {rows.length > 0 && (
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search questions, changes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4]"
            />
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Section
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Type of Change
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Question
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Branching off / Positioning
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Suggested Change
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                    Ultramed Response
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const style = statusStyles[row.status];
                  const isExpanded = expandedRow === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : row.id)
                      }
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 align-top">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 rounded px-2 py-0.5 whitespace-nowrap">
                          {row.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {row.changeTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-block text-xs font-medium text-[#4A90A4] bg-[#4A90A4]/10 rounded px-2 py-0.5 whitespace-nowrap w-fit"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {row.questionId}
                          </span>
                          <p
                            className={`text-sm text-slate-700 mt-0.5 ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {row.question}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p
                          className={`text-xs text-slate-500 ${
                            isExpanded ? "" : "line-clamp-2"
                          }`}
                        >
                          {row.branching}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p
                          className={`text-sm text-slate-800 font-medium ${
                            isExpanded ? "" : "line-clamp-3"
                          }`}
                        >
                          {row.suggestedChange}
                        </p>
                        {isExpanded && row.reason && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Reason
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {row.reason}
                            </p>
                          </div>
                        )}
                        {isExpanded && (
                          <div className="mt-2 text-[10px] text-slate-400">
                            by {row.submitterName} on{" "}
                            {formatDate(row.createdAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {row.ultramedResponse ? (
                          <p
                            className={`text-sm text-slate-600 ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {row.ultramedResponse}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300 italic">
                            No response yet
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border ${style.bg} ${style.text} ${style.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                          />
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {filtered.length} of {rows.length} change request
              {rows.length !== 1 ? "s" : ""}
            </span>
            {(statusFilter !== "all" ||
              sectionFilter !== "all" ||
              typeFilter !== "all" ||
              searchTerm) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSectionFilter("all");
                  setTypeFilter("all");
                  setSearchTerm("");
                }}
                className="text-xs font-medium text-[#4A90A4] hover:text-[#3A7A94] transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">
            {rows.length === 0
              ? "No change requests have been submitted yet"
              : "No change requests match your filters"}
          </p>
        </div>
      )}
    </div>
  );
}
