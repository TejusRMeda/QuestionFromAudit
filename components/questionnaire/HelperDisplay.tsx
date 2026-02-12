"use client";

import { useState } from "react";

interface HelperDisplayProps {
  helperType: string | null;
  helperName: string | null;
  helperValue: string | null;
}

export default function HelperDisplay({
  helperType,
  helperName,
  helperValue,
}: HelperDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!helperValue) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-focus transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        More information
      </button>

      {expanded && (
        <div className="mt-2 border-l-4 border-info pl-4 py-2">
          {helperName && (
            <p className="text-xs font-medium text-base-content/60 mb-1">
              {helperName}
            </p>
          )}
          {helperType === "webLink" ? (
            <a
              href={helperValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              {helperValue}
              <span className="text-base-content/40 text-xs">(opens in new tab)</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : (
            <div
              className="text-sm text-base-content/80 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: helperValue }}
            />
          )}
        </div>
      )}
    </div>
  );
}
