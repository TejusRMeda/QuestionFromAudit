"use client";

/**
 * Empty state shown in the edit panel when no question is selected.
 * Provides contextual guidance for first-time trust users.
 */
export default function EmptyPanelState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      {/* Clipboard + checkmark illustration */}
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Ready to Review
      </h3>
      <p className="text-sm text-slate-800/70 max-w-xs mb-6">
        Select a question from the list to start suggesting improvements.
      </p>

      {/* 3-step guide */}
      <div className="flex flex-col gap-3 text-left max-w-xs w-full">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            1
          </span>
          <p className="text-xs text-slate-800/70">
            <span className="font-medium text-slate-800">Browse questions</span> in the list and select one to review
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            2
          </span>
          <p className="text-xs text-slate-800/70">
            <span className="font-medium text-slate-800">Suggest changes</span> to settings, content, help text, or logic
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            3
          </span>
          <p className="text-xs text-slate-800/70">
            <span className="font-medium text-slate-800">Submit your suggestion</span> with a note explaining the change
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-800/50 mt-6 max-w-xs">
        Your feedback helps improve patient questionnaires across the trust.
      </p>
    </div>
  );
}
