"use client";

/**
 * Empty state shown in the edit panel when no question is selected
 */
export default function EmptyPanelState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-base-content/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-base-content/80 mb-2">
        Select a Question
      </h3>
      <p className="text-sm text-base-content/60 max-w-xs">
        Click on any question from the list to view its details and suggest changes.
      </p>
    </div>
  );
}
