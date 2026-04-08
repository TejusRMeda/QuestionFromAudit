"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SuggestionItem } from "./LatestSuggestionsFeed";

export interface TrustSuggestionGroup {
  trustName: string;
  trustLinkId: string;
  suggestions: (SuggestionItem & { trustLinkId: string })[];
}

interface Props {
  trustGroups: TrustSuggestionGroup[];
}

const statusDot: Record<string, string> = {
  pending: "bg-amber-400",
  approved: "bg-green-400",
  rejected: "bg-red-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SuggestionsPageClient({ trustGroups }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const allSuggestions = trustGroups.flatMap((g) => g.suggestions);
  const pendingCount = allSuggestions.filter((s) => s.status === "pending").length;

  function toggleGroup(trustName: string) {
    setCollapsed((prev) => ({ ...prev, [trustName]: !prev[trustName] }));
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Suggestions</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            All suggestions across your questionnaires
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {pendingCount} pending
          </span>
        )}
      </div>

      {trustGroups.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-200 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h3 className="text-base font-medium text-slate-500 mb-2">No suggestions yet</h3>
            <p className="text-sm text-slate-400">
              Suggestions will appear here once trusts start reviewing your questionnaires.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {trustGroups.map((group) => {
            const isCollapsed = collapsed[group.trustName];
            const groupPending = group.suggestions.filter((s) => s.status === "pending").length;
            const groupApproved = group.suggestions.filter((s) => s.status === "approved").length;
            const groupRejected = group.suggestions.filter((s) => s.status === "rejected").length;

            return (
              <Card key={group.trustName}>
                {/* Trust group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.trustName)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">
                      {group.trustName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {group.suggestions.length} suggestion{group.suggestions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {groupPending > 0 && (
                      <span className="text-amber-600">{groupPending} pending</span>
                    )}
                    {groupApproved > 0 && (
                      <span className="text-green-600">{groupApproved} approved</span>
                    )}
                    {groupRejected > 0 && (
                      <span className="text-red-500">{groupRejected} rejected</span>
                    )}
                  </div>
                </button>

                {/* Suggestions list */}
                {!isCollapsed && (
                  <ul className="border-t border-slate-100">
                    {group.suggestions.map((s) => (
                      <li
                        key={s.id}
                        className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${statusDot[s.status] || "bg-slate-300"}`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className="text-xs font-medium text-slate-700">
                                  {s.submitter_name}
                                </span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-400">{s.masterName}</span>
                              </div>
                              <p className="text-sm text-slate-600 truncate">{s.suggestion_text}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {timeAgo(s.created_at)}
                            </span>
                            <Link
                              href={`/masters/${s.adminLinkId}/suggestions`}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
