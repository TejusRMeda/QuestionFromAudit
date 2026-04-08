"use client";

import {
  EditableQuestion,
  SettingsChanges,
  ContentChanges,
  HelpChanges,
  LogicChanges,
  ValidationErrors,
  VALIDATION_LIMITS,
} from "@/types/editPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ReviewTabProps {
  question: EditableQuestion;
  changes: {
    settings: SettingsChanges | null;
    content: ContentChanges | null;
    help: HelpChanges | null;
    logic: LogicChanges | null;
  };
  submitterName: string;
  submitterEmail: string;
  notes: string;
  onSubmitterNameChange: (name: string) => void;
  onSubmitterEmailChange: (email: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  validationErrors: ValidationErrors;
}

/**
 * Review tab showing summary of all changes and submission form
 */
export default function ReviewTab({
  question,
  changes,
  submitterName,
  submitterEmail,
  notes,
  onSubmitterNameChange,
  onSubmitterEmailChange,
  onNotesChange,
  onSubmit,
  isSubmitting,
  validationErrors,
}: ReviewTabProps) {
  const hasAnyChanges =
    changes.settings !== null ||
    changes.content !== null ||
    changes.help !== null ||
    changes.logic !== null;

  const notesLength = notes.trim().length;
  const isNotesValid = notesLength >= VALIDATION_LIMITS.MIN_NOTES_LENGTH && notesLength <= VALIDATION_LIMITS.MAX_NOTES_LENGTH;
  const isNameValid = submitterName.trim().length > 0;

  const canSubmit = hasAnyChanges && isNotesValid && isNameValid && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Changes Summary */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Changes Summary
        </h3>

        {hasAnyChanges ? (
          <div className="space-y-3">
            {/* Settings Changes */}
            {changes.settings && (
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#4A90A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">Settings</span>
                </div>
                <div className="pl-6 space-y-1">
                  {changes.settings.required && (
                    <p className="text-sm">
                      <span className="text-slate-500">Required:</span>{" "}
                      <span className="line-through text-red-400">
                        {changes.settings.required.from ? "Required" : "Optional"}
                      </span>
                      {" → "}
                      <span className="text-green-600">
                        {changes.settings.required.to ? "Required" : "Optional"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Content Changes */}
            {changes.content && (
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#4A90A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium">Content</span>
                </div>
                <div className="pl-6 space-y-2">
                  {changes.content.questionText && (
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs mb-1">Question Text:</p>
                      <p className="line-through text-red-400 text-xs mb-1">
                        {changes.content.questionText.from.substring(0, 100)}
                        {changes.content.questionText.from.length > 100 ? "..." : ""}
                      </p>
                      <p className="text-green-600 text-xs">
                        {changes.content.questionText.to.substring(0, 100)}
                        {changes.content.questionText.to.length > 100 ? "..." : ""}
                      </p>
                    </div>
                  )}
                  {changes.content.answerType && (
                    <p className="text-sm">
                      <span className="text-slate-500">Answer Type:</span>{" "}
                      <span className="line-through text-red-400">
                        {changes.content.answerType.from}
                      </span>
                      {" → "}
                      <span className="text-green-600">{changes.content.answerType.to}</span>
                    </p>
                  )}
                  {changes.content.options && (
                    <div className="text-sm">
                      {changes.content.options.added.length > 0 && (
                        <p className="text-green-600">
                          + {changes.content.options.added.length} option(s) added
                        </p>
                      )}
                      {changes.content.options.modified.length > 0 && (
                        <p className="text-[#4A90A4]">
                          ~ {changes.content.options.modified.length} option(s) modified
                        </p>
                      )}
                      {changes.content.options.removed.length > 0 && (
                        <p className="text-red-600">
                          - {changes.content.options.removed.length} option(s) removed
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Changes */}
            {changes.help && (
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#4A90A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Help</span>
                </div>
                <div className="pl-6 space-y-1">
                  {changes.help.hasHelper && (
                    <p className="text-sm">
                      <span className="text-slate-500">Helper:</span>{" "}
                      <span className="line-through text-red-400">
                        {changes.help.hasHelper.from ? "Enabled" : "Disabled"}
                      </span>
                      {" → "}
                      <span className="text-green-600">
                        {changes.help.hasHelper.to ? "Enabled" : "Disabled"}
                      </span>
                    </p>
                  )}
                  {changes.help.helperType && (
                    <p className="text-sm">
                      <span className="text-slate-500">Type:</span>{" "}
                      <span className="line-through text-red-400">
                        {changes.help.helperType.from || "None"}
                      </span>
                      {" → "}
                      <span className="text-green-600">{changes.help.helperType.to}</span>
                    </p>
                  )}
                  {changes.help.helperName && (
                    <p className="text-sm">
                      <span className="text-slate-500">Name:</span> Updated
                    </p>
                  )}
                  {changes.help.helperValue && (
                    <p className="text-sm">
                      <span className="text-slate-500">Content:</span> Updated
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Logic Changes */}
            {changes.logic && changes.logic.description && (
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#4A90A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-sm font-medium">Logic</span>
                </div>
                <div className="pl-6">
                  <p className="text-sm text-slate-600">
                    {changes.logic.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center gap-2 text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No changes have been made yet. Use the tabs above to suggest changes.</span>
          </div>
        )}
      </div>

      {/* Submission Form */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Save Draft
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label className="mb-1.5">
              Your Name <span className="text-red-600">*</span>
            </Label>
            <Input
              type="text"
              value={submitterName}
              onChange={(e) => onSubmitterNameChange(e.target.value)}
              placeholder="Enter your name"
              className={!isNameValid && submitterName.length > 0 ? "border-red-300" : ""}
              disabled={isSubmitting}
            />
          </div>

          {/* Email */}
          <div>
            <Label className="mb-1.5">
              Email <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              type="email"
              value={submitterEmail}
              onChange={(e) => onSubmitterEmailChange(e.target.value)}
              placeholder="Enter your email for updates"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>
                Notes & Comments <span className="text-red-600">*</span>
              </Label>
              <span className="text-xs text-slate-400">
                {notesLength}/{VALIDATION_LIMITS.MAX_NOTES_LENGTH}
              </span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Explain why these changes would improve the questionnaire..."
              className={validationErrors.notes ? "border-red-300" : ""}
              rows={4}
              disabled={isSubmitting}
            />
            {notesLength < VALIDATION_LIMITS.MIN_NOTES_LENGTH && (
              <p className="text-xs text-slate-500 mt-1">
                Minimum {VALIDATION_LIMITS.MIN_NOTES_LENGTH} characters required ({VALIDATION_LIMITS.MIN_NOTES_LENGTH - notesLength} more)
              </p>
            )}
            {validationErrors.notes && notesLength >= VALIDATION_LIMITS.MIN_NOTES_LENGTH && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.notes}</p>
            )}
          </div>

          {/* Save Draft Button */}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>

          {!hasAnyChanges && (
            <p className="text-sm text-center text-slate-500">
              Make at least one change before saving.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
