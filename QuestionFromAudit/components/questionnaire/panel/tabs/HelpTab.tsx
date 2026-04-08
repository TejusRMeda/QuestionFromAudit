"use client";

import { EditableQuestion, HelpChanges } from "@/types/editPanel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SafeHtml } from "@/components/ui/safe-html";

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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-red-700">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Current Helper
        </h3>

        <div className="bg-slate-50 rounded-lg p-4">
          {currentHasHelper ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs">Enabled</Badge>
                {currentHelperType && (
                  <Badge variant="outline" className="text-xs">{currentHelperType}</Badge>
                )}
              </div>

              {currentHelperName && (
                <div>
                  <p className="text-xs text-slate-500">Name/Title</p>
                  <p className="text-sm">{currentHelperName}</p>
                </div>
              )}

              {currentHelperValue && (
                <div>
                  <p className="text-xs text-slate-500">
                    {currentHelperType === "webLink" ? "URL" : "Content"}
                  </p>
                  {currentHelperType === "webLink" ? (
                    <a
                      href={currentHelperValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4A90A4] hover:underline break-all"
                    >
                      {currentHelperValue}
                    </a>
                  ) : (
                    <SafeHtml
                      content={currentHelperValue}
                      className="text-sm prose prose-sm max-w-none"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
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
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Suggest Changes
        </h3>

        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div
            className={`rounded-lg p-4 border transition-colors ${
              changes?.hasHelper
                ? "border-[#4A90A4] bg-[#4A90A4]/5"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Helper Content</p>
                <p className="text-sm text-slate-500">
                  {suggestedHasHelper
                    ? "Additional information will be shown"
                    : "No additional information"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {suggestedHasHelper ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={suggestedHasHelper}
                  onCheckedChange={handleHelperToggle}
                />
              </div>
            </div>

            {changes?.hasHelper && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-[#4A90A4] flex items-center gap-1">
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
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs">Helper Type</Label>
                  {changes?.helperType && (
                    <span className="text-[#4A90A4] text-xs">Modified</span>
                  )}
                </div>
                <select
                  value={suggestedHelperType || ""}
                  onChange={(e) => handleHelperTypeChange(e.target.value)}
                  className={`flex h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    changes?.helperType ? "border-[#4A90A4] ring-1 ring-[#4A90A4]/20" : "border-input"
                  }`}
                >
                  <option value="">Select type</option>
                  <option value="contentBlock">Content Block</option>
                  <option value="webLink">Web Link</option>
                </select>
              </div>

              {/* Helper Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs">
                    {suggestedHelperType === "webLink" ? "Link Title" : "Section Title"}
                  </Label>
                  {changes?.helperName && (
                    <span className="text-[#4A90A4] text-xs">Modified</span>
                  )}
                </div>
                <Input
                  type="text"
                  value={suggestedHelperName || ""}
                  onChange={(e) => handleHelperNameChange(e.target.value)}
                  placeholder="Enter title..."
                  className={changes?.helperName ? "border-[#4A90A4] ring-1 ring-[#4A90A4]/20" : ""}
                />
              </div>

              {/* Helper Value */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs">
                    {suggestedHelperType === "webLink" ? "URL" : "Content"}
                  </Label>
                  {changes?.helperValue && (
                    <span className="text-[#4A90A4] text-xs">Modified</span>
                  )}
                </div>
                {suggestedHelperType === "webLink" ? (
                  <Input
                    type="url"
                    value={suggestedHelperValue || ""}
                    onChange={(e) => handleHelperValueChange(e.target.value)}
                    placeholder="https://example.com"
                    className={changes?.helperValue ? "border-[#4A90A4] ring-1 ring-[#4A90A4]/20" : ""}
                  />
                ) : (
                  <Textarea
                    value={suggestedHelperValue || ""}
                    onChange={(e) => handleHelperValueChange(e.target.value)}
                    placeholder="Enter helper content..."
                    className={changes?.helperValue ? "border-[#4A90A4] ring-1 ring-[#4A90A4]/20" : ""}
                    rows={4}
                  />
                )}
                {suggestedHelperType === "webLink" && (
                  <p className="text-xs text-slate-500 mt-1">
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
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 flex items-start gap-2 text-sky-700">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
