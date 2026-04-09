"use client";

import { useMemo } from "react";
import { EditableQuestion } from "@/types/editPanel";

interface SectionInfo {
  name: string;
  pages: string[];
  questionCount: number;
  suggestedCount: number;
  conditionalCount: number;
}

interface SectionCardsViewProps {
  questions: EditableQuestion[];
  onSelectSection: (sectionName: string) => void;
  sectionReviews?: Set<string>;
  submissionStatus?: "in_progress" | "submitted";
}

export default function SectionCardsView({
  questions,
  onSelectSection,
  sectionReviews = new Set(),
  submissionStatus = "in_progress",
}: SectionCardsViewProps) {
  const sections = useMemo(() => {
    const map = new Map<string, SectionInfo>();

    for (const q of questions) {
      const sectionName = q.section || "General";
      let section = map.get(sectionName);
      if (!section) {
        section = {
          name: sectionName,
          pages: [],
          questionCount: 0,
          suggestedCount: 0,
          conditionalCount: 0,
        };
        map.set(sectionName, section);
      }
      section.questionCount++;
      if (q.suggestionCount > 0) section.suggestedCount++;
      if (q.enableWhen) section.conditionalCount++;
      if (q.page && !section.pages.includes(q.page)) {
        section.pages.push(q.page);
      }
    }

    return Array.from(map.values());
  }, [questions]);

  const totalQuestions = questions.length;
  const totalSuggested = questions.filter((q) => q.suggestionCount > 0).length;
  const totalSections = sections.length;
  const reviewedCount = sections.filter((s) => sectionReviews.has(s.name)).length;
  const allReviewed = reviewedCount === totalSections && totalSections > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Submitted banner */}
      {submissionStatus === "submitted" && (
        <div className="mb-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-emerald-800">Review Submitted</span>
          </div>
          <p className="text-sm text-emerald-700">
            Your review has been submitted. Thank you for your feedback!
          </p>
        </div>
      )}

      {/* Overview stats */}
      <div className="mb-8 text-center">
        <p className="text-sm text-slate-500 mb-2">
          This questionnaire has{" "}
          <span className="font-semibold text-slate-700">{totalSections} sections</span>{" "}
          containing{" "}
          <span className="font-semibold text-slate-700">{totalQuestions} questions</span>
        </p>
        {submissionStatus !== "submitted" && (
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-[#4A90A4]">{reviewedCount}</span> of{" "}
            {totalSections} sections reviewed
            {totalSuggested > 0 && (
              <span className="text-slate-500"> · {totalSuggested} questions with drafts</span>
            )}
          </p>
        )}
      </div>

      {/* Section cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const progress =
            section.questionCount > 0
              ? Math.round((section.suggestedCount / section.questionCount) * 100)
              : 0;
          const isReviewed = sectionReviews.has(section.name);

          return (
            <button
              key={section.name}
              onClick={() => onSelectSection(section.name)}
              className={`group text-left bg-white rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg hover:border-[#4A90A4]/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 ${
                isReviewed
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#4A90A4] transition-colors leading-tight">
                  {section.name}
                </h3>
                {isReviewed ? (
                  <span className="flex-shrink-0 ml-2 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex-shrink-0 ml-2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-[#4A90A4]/10 transition-colors">
                    <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#4A90A4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Question count */}
              <p className="text-sm text-slate-500 mb-3">
                {section.questionCount} question{section.questionCount !== 1 ? "s" : ""}
                {section.conditionalCount > 0 && (
                  <span className="text-sky-600">
                    {" "}· {section.conditionalCount} conditional
                  </span>
                )}
              </p>

              {/* Pages preview */}
              {section.pages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {section.pages.slice(0, 3).map((page) => (
                    <span
                      key={page}
                      className="inline-block text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5"
                    >
                      {page}
                    </span>
                  ))}
                  {section.pages.length > 3 && (
                    <span className="inline-block text-xs text-slate-500 px-1 py-0.5">
                      +{section.pages.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="mt-auto">
                {isReviewed ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-emerald-600">Reviewed</span>
                    {section.suggestedCount > 0 && (
                      <span className="text-xs text-slate-500">
                        · {section.suggestedCount} draft{section.suggestedCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {section.suggestedCount === 0 && (
                      <span className="text-xs text-slate-500">· No changes needed</span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500">
                        {section.suggestedCount > 0
                          ? `${section.suggestedCount} draft${section.suggestedCount !== 1 ? "s" : ""} saved`
                          : "Not yet reviewed"}
                      </span>
                      {section.suggestedCount > 0 && (
                        <span className="text-xs font-medium text-slate-500">
                          {progress}%
                        </span>
                      )}
                    </div>
                    {section.suggestedCount > 0 && (
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-[#4A90A4]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
