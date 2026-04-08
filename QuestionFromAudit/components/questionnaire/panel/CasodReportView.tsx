"use client";

import { useState, useMemo } from "react";
import type { Suggestion } from "./SuggestionsListView";
import type { ComponentChanges } from "@/types/editPanel";
import type { EditableQuestion } from "@/types/editPanel";
import type { TranslatedEnableWhen } from "@/lib/enableWhen";
import { formatDate } from "@/lib/utils";

interface CasodReportViewProps {
  suggestions: Suggestion[];
  questions: EditableQuestion[];
  loading: boolean;
  translatedEnableWhens: Map<number, TranslatedEnableWhen>;
  trustLinkId: string;
}

/** One consolidated row per question */
interface CasodRow {
  questionDbId: number;
  typeOfChange: string;
  section: string;
  questionText: string;
  questionId: string;
  required: string;
  answerOption: string;
  includeInSummary: string;
  branching: string;
  suggestedChange: string;
  content: string;
  weblink: string;
  recommendations: string;
  ultramedResponse: string;
  trustResponse: string;
  mainChange: string;
  builtInQuestionnaire: string;
  builtInBottomReport: string;
  builtInTopReport: string;
  status: "draft" | "pending" | "approved" | "rejected" | "mixed";
  suggestionCount: number;
}

function deriveChangeTypes(changes: ComponentChanges | null | undefined): string[] {
  if (!changes) return ["General suggestion"];
  const types: string[] = [];
  if (changes.settings?.required) types.push("Change setting");
  if (changes.content?.questionText) types.push("Change wording");
  if (changes.content?.answerType) types.push("Change answer type");
  if (changes.content?.options) {
    if (changes.content.options.added.length > 0) types.push("Add option");
    if (changes.content.options.modified.length > 0) types.push("Modify option");
    if (changes.content.options.removed.length > 0) types.push("Remove option");
  }
  if (changes.help) types.push("Change help");
  if (changes.logic) types.push("Change logic");
  return types.length > 0 ? types : ["General suggestion"];
}

function extractSuggestedChange(changes: ComponentChanges | null | undefined, fallback: string): string {
  if (!changes) return fallback;
  const parts: string[] = [];
  if (changes.content?.questionText) parts.push(changes.content.questionText.to);
  if (changes.content?.answerType) parts.push(`Change to ${changes.content.answerType.to}`);
  if (changes.content?.options) {
    const { added, modified, removed } = changes.content.options;
    if (added.length > 0) parts.push(`Add: ${added.map((a) => a.text).join(", ")}`);
    if (modified.length > 0) parts.push(`Modify: ${modified.map((m) => `"${m.from}" → "${m.to}"`).join(", ")}`);
    if (removed.length > 0) parts.push(`Remove ${removed.length} option(s)`);
  }
  if (changes.settings?.required) parts.push(changes.settings.required.to ? "Make required" : "Make optional");
  if (changes.help?.helperValue) parts.push(changes.help.helperValue.to);
  if (changes.logic) parts.push(changes.logic.description);
  return parts.length > 0 ? parts.join("; ") : fallback;
}

function buildContentColumn(suggestions: Suggestion[]): string {
  const details: string[] = [];
  for (const s of suggestions) {
    const cc = s.componentChanges;
    if (!cc) continue;
    if (cc.content?.questionText) {
      details.push(`Question text: "${cc.content.questionText.from}" → "${cc.content.questionText.to}"`);
    }
    if (cc.content?.answerType) {
      details.push(`Answer type: ${cc.content.answerType.from} → ${cc.content.answerType.to}`);
    }
    if (cc.content?.options) {
      const parts: string[] = [];
      if (cc.content.options.added.length > 0) parts.push(`+${cc.content.options.added.length} added`);
      if (cc.content.options.modified.length > 0) parts.push(`${cc.content.options.modified.length} modified`);
      if (cc.content.options.removed.length > 0) parts.push(`-${cc.content.options.removed.length} removed`);
      if (parts.length > 0) details.push(`Options: ${parts.join(", ")}`);
    }
    if (cc.help?.helperType?.to === "contentBlock" && cc.help.helperValue) {
      details.push(`Help content: "${cc.help.helperName?.to || "Updated"}"`);
    }
  }
  if (details.length === 0) return "Leave as is";
  return `Edit: ${details.join("; ")}`;
}

function buildWeblinkColumn(suggestions: Suggestion[]): string {
  const details: string[] = [];
  for (const s of suggestions) {
    const help = s.componentChanges?.help;
    if (!help) continue;
    if (help.helperType?.to === "webLink" && help.helperValue) {
      const name = help.helperName?.to || "Link";
      details.push(`${name}: ${help.helperValue.to}`);
    }
  }
  if (details.length === 0) return "Leave as is";
  return `Edit: ${details.join("; ")}`;
}

const statusStyles = {
  draft: { label: "Draft", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  rejected: { label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400" },
  mixed: { label: "Mixed", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
};

export default function CasodReportView({
  suggestions,
  questions,
  loading,
  translatedEnableWhens,
  trustLinkId,
}: CasodReportViewProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // Group suggestions by question ID and consolidate into one row per question
  const rows: CasodRow[] = useMemo(() => {
    // Group suggestions by question DB id
    const grouped = new Map<number, Suggestion[]>();
    for (const s of suggestions) {
      const qId = s.question?.id;
      if (!qId) continue;
      if (!grouped.has(qId)) grouped.set(qId, []);
      grouped.get(qId)!.push(s);
    }

    // Build question lookup
    const questionMap = new Map<number, EditableQuestion>();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    const result: CasodRow[] = [];
    for (const [qId, qSuggestions] of grouped) {
      const q = questionMap.get(qId);
      if (!q) continue;

      // Determine consolidated status
      const statuses = new Set(qSuggestions.map((s) => s.status));
      let status: CasodRow["status"];
      if (statuses.size === 1) {
        status = [...statuses][0];
      } else {
        status = "mixed";
      }

      // Consolidated change types
      const allChangeTypes = new Set<string>();
      for (const s of qSuggestions) {
        deriveChangeTypes(s.componentChanges).forEach((t) => allChangeTypes.add(t));
      }

      // Consolidated suggested change text
      const suggestedChange = qSuggestions.length === 1
        ? extractSuggestedChange(qSuggestions[0].componentChanges, qSuggestions[0].suggestionText)
        : qSuggestions.map((s) => `${s.submitterName}: ${extractSuggestedChange(s.componentChanges, s.suggestionText)}`).join(" | ");

      // Consolidated trust response (reasons)
      const trustResponse = qSuggestions.length === 1
        ? qSuggestions[0].reason
        : qSuggestions.map((s) => `${s.submitterName}: ${s.reason}`).join(" | ");

      // Ultramed response
      const ultramedParts: string[] = [];
      for (const s of qSuggestions) {
        if (s.responseMessage) {
          ultramedParts.push(qSuggestions.length > 1 ? `${s.submitterName}: ${s.responseMessage}` : s.responseMessage);
        }
      }

      const branching = translatedEnableWhens.get(qId)?.summary || "";

      result.push({
        questionDbId: qId,
        typeOfChange: [...allChangeTypes].join(", "),
        section: q.section || q.category || "General",
        questionText: q.questionText,
        questionId: q.questionId,
        required: q.required ? "TRUE" : "FALSE",
        answerOption: q.answerOptions ? q.answerOptions.split("|").map((o) => o.trim()).join(", ") : "",
        includeInSummary: "FALSE",
        branching,
        suggestedChange,
        content: buildContentColumn(qSuggestions),
        weblink: buildWeblinkColumn(qSuggestions),
        recommendations: "",
        ultramedResponse: ultramedParts.join(" | "),
        trustResponse,
        mainChange: "FALSE",
        builtInQuestionnaire: "FALSE",
        builtInBottomReport: "FALSE",
        builtInTopReport: "FALSE",
        status,
        suggestionCount: qSuggestions.length,
      });
    }

    return result;
  }, [suggestions, questions, translatedEnableWhens]);

  // Unique sections for filter
  const sections = useMemo(() => [...new Set(rows.map((r) => r.section))].sort(), [rows]);

  // Filtered rows
  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (sectionFilter !== "all") {
      result = result.filter((r) => r.section === sectionFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.questionText.toLowerCase().includes(term) ||
          r.suggestedChange.toLowerCase().includes(term) ||
          r.questionId.toLowerCase().includes(term) ||
          r.section.toLowerCase().includes(term)
      );
    }
    return result;
  }, [rows, statusFilter, sectionFilter, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    const c = { all: rows.length, draft: 0, pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) {
      if (r.status !== "mixed") c[r.status]++;
    }
    c.all = rows.length;
    return c;
  }, [rows]);

  const handleExport = async () => {
    setExporting(true);
    try {
      window.location.href = `/api/instance/${trustLinkId}/export/casod`;
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
          <div className="h-12 bg-slate-50 border-b border-slate-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-slate-100 px-4 flex items-center gap-4">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Status pills */}
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
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}{" "}
              <span className={statusFilter === status ? "text-white/80" : "text-slate-400"}>
                {counts[status]}
              </span>
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {/* Section filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:outline-none focus:border-[#4A90A4] appearance-none pr-7 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center]"
          >
            <option value="all">All Sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Spacer + Export button */}
          <div className="flex-1" />
          <button
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#4A90A4] text-[#4A90A4] hover:bg-[#4A90A4] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        {/* Search */}
        {rows.length > 0 && (
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4 flex items-start gap-2">
        <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-700">
          CASOD Report — one row per question, consolidating all suggestions. Questions with no suggestions are excluded.
          Internal-use columns default to FALSE and can be edited after export.
        </p>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-slate-50 z-10">
                    Section
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Type of Change
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                    Question / Text
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Required
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                    Answer Option
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                    Branching / Positioning
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Suggested Change
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                    Content
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                    Weblink
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                    Recommendations
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                    Ultramed Response
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                    Trust Response
                  </th>
                  <th className="text-left px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const style = statusStyles[row.status];
                  const isExpanded = expandedRow === row.questionDbId;

                  return (
                    <tr
                      key={row.questionDbId}
                      onClick={() => setExpandedRow(isExpanded ? null : row.questionDbId)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-3 py-3 align-top sticky left-0 bg-white group-hover:bg-slate-50/50 z-10">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 rounded px-2 py-0.5 whitespace-nowrap">
                          {row.section}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs font-medium text-[#4A90A4] bg-[#4A90A4]/10 rounded px-2 py-0.5 whitespace-nowrap">
                          {row.typeOfChange}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">{row.questionId}</span>
                          <p className={`text-sm text-slate-700 mt-0.5 ${isExpanded ? "" : "line-clamp-2"}`}>
                            {row.questionText}
                          </p>
                          {isExpanded && row.suggestionCount > 1 && (
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {row.suggestionCount} suggestions consolidated
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className={`text-xs font-medium ${row.required === "TRUE" ? "text-amber-600" : "text-slate-400"}`}>
                          {row.required}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className={`text-xs text-slate-600 ${isExpanded ? "" : "line-clamp-2"}`}>
                          {row.answerOption || <span className="text-slate-300">—</span>}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className={`text-xs text-slate-500 ${isExpanded ? "" : "line-clamp-2"}`}>
                          {row.branching || <span className="text-slate-300">—</span>}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className={`text-sm text-slate-800 font-medium ${isExpanded ? "" : "line-clamp-3"}`}>
                          {row.suggestedChange}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className={`text-xs ${row.content === "Leave as is" ? "text-slate-300 italic" : "text-slate-600"} ${isExpanded ? "" : "line-clamp-2"}`}>
                          {row.content}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className={`text-xs ${row.weblink === "Leave as is" ? "text-slate-300 italic" : "text-slate-600"} ${isExpanded ? "" : "line-clamp-2"}`}>
                          {row.weblink}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-xs text-slate-300 italic">—</span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {row.ultramedResponse ? (
                          <p className={`text-sm text-slate-600 ${isExpanded ? "" : "line-clamp-2"}`}>
                            {row.ultramedResponse}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No response yet</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className={`text-xs text-slate-600 ${isExpanded ? "" : "line-clamp-2"}`}>
                          {row.trustResponse}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border ${style.bg} ${style.text} ${style.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
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
              Showing {filtered.length} of {rows.length} question{rows.length !== 1 ? "s" : ""} with suggestions
            </span>
            {(statusFilter !== "all" || sectionFilter !== "all" || searchTerm) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSectionFilter("all");
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
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">
            {rows.length === 0
              ? "No suggestions have been submitted yet"
              : "No questions match your filters"}
          </p>
        </div>
      )}
    </div>
  );
}
