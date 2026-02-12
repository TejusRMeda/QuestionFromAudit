"use client";

import { EditableQuestion, HelpChanges } from "@/types/editPanel";

interface HelpTabProps {
  question: EditableQuestion;
  changes: HelpChanges | null;
  onUpdateChanges: (changes: Partial<HelpChanges>) => void;
  errors?: string[];
}

/**
 * Help tab for suggesting changes to helper content (tooltips, web links, content blocks)
 */
export default function HelpTab({
  question,
  changes,
  onUpdateChanges,
  errors,
}: HelpTabProps) {
  // Get current and suggested values
  const currentHasHelper = question.hasHelper ?? false;
  const suggestedHasHelper = changes?.hasHelper?.to ?? currentHasHelper;

  const currentHelperType = question.helperType;
  const suggestedHelperType = changes?.helperType?.to ?? currentHelperType;

  const currentHelperName = question.helperName;
  const suggestedHelperName = changes?.helperName?.to ?? currentHelperName;

  const currentHelperValue = question.helperValue;
  const suggestedHelperValue = changes?.helperValue?.to ?? currentHelperValue;

  // Handle helper toggle
  const handleHelperToggle = () => {
    const newValue = !suggestedHasHelper;
    if (newValue === currentHasHelper) {
      onUpdateChanges({ hasHelper: undefined });
    } else {
      onUpdateChanges({
        hasHelper: {
          from: currentHasHelper,
          to: newValue,
        },
      });
    }
  };

  // Handle helper type change
  const handleHelperTypeChange = (value: string) => {
    if (value === currentHelperType) {
      onUpdateChanges({ helperType: undefined });
    } else {
      onUpdateChanges({
        helperType: {
          from: currentHelperType,
          to: value,
        },
      });
    }
  };

  // Handle helper name change
  const handleHelperNameChange = (value: string) => {
    if (value === currentHelperName) {
      onUpdateChanges({ helperName: undefined });
    } else {
      onUpdateChanges({
        helperName: {
          from: currentHelperName,
          to: value,
        },
      });
    }
  };

  // Handle helper value change
  const handleHelperValueChange = (value: string) => {
    if (value === currentHelperValue) {
      onUpdateChanges({ helperValue: undefined });
    } else {
      onUpdateChanges({
        helperValue: {
          from: currentHelperValue,
          to: value,
        },
      });
    }
  };

  const hasAnyChanges = changes !== null;

  return (
    <div className="space-y-6">
      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="alert alert-error">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <ul className="list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Helper Status */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Current Helper
        </h3>

        <div className="bg-base-200/50 rounded-lg p-4">
          {currentHasHelper ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-success badge-sm">Enabled</span>
                {currentHelperType && (
                  <span className="badge badge-outline badge-sm">{currentHelperType}</span>
                )}
              </div>

              {currentHelperName && (
                <div>
                  <p className="text-xs text-base-content/60">Name/Title</p>
                  <p className="text-sm">{currentHelperName}</p>
                </div>
              )}

              {currentHelperValue && (
                <div>
                  <p className="text-xs text-base-content/60">
                    {currentHelperType === "webLink" ? "URL" : "Content"}
                  </p>
                  {currentHelperType === "webLink" ? (
                    <a
                      href={currentHelperValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {currentHelperValue}
                    </a>
                  ) : (
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentHelperValue }}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-base-content/60">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">No helper content configured</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggest Changes */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Suggest Changes
        </h3>

        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div
            className={`rounded-lg p-4 border transition-colors ${
              changes?.hasHelper
                ? "border-primary bg-primary/5"
                : "border-base-300 bg-base-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Helper Content</p>
                <p className="text-sm text-base-content/60">
                  {suggestedHasHelper
                    ? "Additional information will be shown"
                    : "No additional information"}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-base-content/60">
                  {suggestedHasHelper ? "Enabled" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={suggestedHasHelper}
                  onChange={handleHelperToggle}
                />
              </label>
            </div>

            {changes?.hasHelper && (
              <div className="mt-3 pt-3 border-t border-base-300">
                <p className="text-xs text-primary flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Suggesting to {suggestedHasHelper ? "enable" : "disable"} helper content
                </p>
              </div>
            )}
          </div>

          {/* Helper Details (only show if helper is/will be enabled) */}
          {suggestedHasHelper && (
            <>
              {/* Helper Type */}
              <div>
                <label className="label">
                  <span className="label-text text-xs">Helper Type</span>
                  {changes?.helperType && (
                    <span className="label-text-alt text-primary text-xs">Modified</span>
                  )}
                </label>
                <select
                  value={suggestedHelperType || ""}
                  onChange={(e) => handleHelperTypeChange(e.target.value)}
                  className={`select select-bordered w-full ${
                    changes?.helperType ? "select-primary" : ""
                  }`}
                >
                  <option value="">Select type</option>
                  <option value="contentBlock">Content Block</option>
                  <option value="webLink">Web Link</option>
                </select>
              </div>

              {/* Helper Name */}
              <div>
                <label className="label">
                  <span className="label-text text-xs">
                    {suggestedHelperType === "webLink" ? "Link Title" : "Section Title"}
                  </span>
                  {changes?.helperName && (
                    <span className="label-text-alt text-primary text-xs">Modified</span>
                  )}
                </label>
                <input
                  type="text"
                  value={suggestedHelperName || ""}
                  onChange={(e) => handleHelperNameChange(e.target.value)}
                  placeholder="Enter title..."
                  className={`input input-bordered w-full ${
                    changes?.helperName ? "input-primary" : ""
                  }`}
                />
              </div>

              {/* Helper Value */}
              <div>
                <label className="label">
                  <span className="label-text text-xs">
                    {suggestedHelperType === "webLink" ? "URL" : "Content"}
                  </span>
                  {changes?.helperValue && (
                    <span className="label-text-alt text-primary text-xs">Modified</span>
                  )}
                </label>
                {suggestedHelperType === "webLink" ? (
                  <input
                    type="url"
                    value={suggestedHelperValue || ""}
                    onChange={(e) => handleHelperValueChange(e.target.value)}
                    placeholder="https://example.com"
                    className={`input input-bordered w-full ${
                      changes?.helperValue ? "input-primary" : ""
                    }`}
                  />
                ) : (
                  <textarea
                    value={suggestedHelperValue || ""}
                    onChange={(e) => handleHelperValueChange(e.target.value)}
                    placeholder="Enter helper content..."
                    className={`textarea textarea-bordered w-full ${
                      changes?.helperValue ? "textarea-primary" : ""
                    }`}
                    rows={4}
                  />
                )}
                {suggestedHelperType === "webLink" && (
                  <p className="text-xs text-base-content/60 mt-1">
                    Enter a complete URL starting with http:// or https://
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change summary */}
      {hasAnyChanges && (
        <div className="alert alert-info">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">
            You have pending changes to the helper content. Review and submit on the Review tab.
          </span>
        </div>
      )}
    </div>
  );
}
