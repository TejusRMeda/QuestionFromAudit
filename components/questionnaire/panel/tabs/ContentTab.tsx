"use client";

import { useState } from "react";
import { EditableQuestion, ContentChanges, OptionChange, ModifiedOption } from "@/types/editPanel";
import { MYPREOP_ITEM_TYPES } from "@/types/question";
import { parseCharacteristics } from "@/lib/enableWhen";

interface ContentTabProps {
  question: EditableQuestion;
  changes: ContentChanges | null;
  onUpdateChanges: (changes: Partial<ContentChanges>) => void;
  errors?: string[];
}

/**
 * Content tab for suggesting changes to question text, answer type, and options
 */
export default function ContentTab({
  question,
  changes,
  onUpdateChanges,
  errors,
}: ContentTabProps) {
  const [newOptionText, setNewOptionText] = useState("");
  const [newOptionCharacteristic, setNewOptionCharacteristic] = useState("");
  const [newOptionComment, setNewOptionComment] = useState("");

  // Expand state: only one option expanded at a time (existing OR added)
  const [expandedOptionIndex, setExpandedOptionIndex] = useState(-1);
  const [expandedAddedIndex, setExpandedAddedIndex] = useState(-1);

  // Draft state for editing existing options
  const [editDraft, setEditDraft] = useState({ text: "", characteristic: "", comment: "" });
  // Draft state for editing added options
  const [editAddedDraft, setEditAddedDraft] = useState({ text: "", characteristic: "", comment: "" });

  // Parse current options
  const currentOptions = question.answerOptions
    ?.split("|")
    .map((o) => o.trim())
    .filter(Boolean) || [];
  const currentCharacteristics = parseCharacteristics(question.characteristic);

  // Get suggested values
  const suggestedQuestionText = changes?.questionText?.to ?? question.questionText;
  const suggestedAnswerType = changes?.answerType?.to ?? question.answerType;

  // Handle question text change
  const handleQuestionTextChange = (value: string) => {
    if (value === question.questionText) {
      onUpdateChanges({ questionText: undefined });
    } else {
      onUpdateChanges({
        questionText: {
          from: question.questionText,
          to: value,
        },
      });
    }
  };

  // Handle answer type change
  const handleAnswerTypeChange = (value: string) => {
    if (value === question.answerType) {
      onUpdateChanges({ answerType: undefined });
    } else {
      onUpdateChanges({
        answerType: {
          from: question.answerType || "",
          to: value,
        },
      });
    }
  };

  // Generate a characteristic from option text
  const generateCharacteristic = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 30);
  };

  // Handle adding a new option
  const handleAddOption = () => {
    if (!newOptionText.trim()) return;

    const characteristic = newOptionCharacteristic.trim() || generateCharacteristic(newOptionText);
    const newOption: OptionChange = {
      text: newOptionText.trim(),
      characteristic,
      ...(newOptionComment.trim() ? { comment: newOptionComment.trim() } : {}),
    };

    const currentAdded = changes?.options?.added || [];
    onUpdateChanges({
      options: {
        ...changes?.options,
        added: [...currentAdded, newOption],
        modified: changes?.options?.modified || [],
        removed: changes?.options?.removed || [],
      },
    });

    setNewOptionText("");
    setNewOptionCharacteristic("");
    setNewOptionComment("");
  };

  // Handle removing an existing option
  const handleRemoveOption = (index: number) => {
    setExpandedOptionIndex(-1);
    const currentRemoved = changes?.options?.removed || [];
    if (currentRemoved.includes(index)) {
      onUpdateChanges({
        options: {
          ...changes?.options,
          added: changes?.options?.added || [],
          modified: changes?.options?.modified || [],
          removed: currentRemoved.filter((i) => i !== index),
        },
      });
    } else {
      onUpdateChanges({
        options: {
          ...changes?.options,
          added: changes?.options?.added || [],
          modified: changes?.options?.modified || [],
          removed: [...currentRemoved, index],
        },
      });
    }
  };

  // Handle removing a newly added option
  const handleRemoveAddedOption = (index: number) => {
    setExpandedAddedIndex(-1);
    const currentAdded = changes?.options?.added || [];
    onUpdateChanges({
      options: {
        ...changes?.options,
        added: currentAdded.filter((_, i) => i !== index),
        modified: changes?.options?.modified || [],
        removed: changes?.options?.removed || [],
      },
    });
  };

  // --- Expand/collapse handlers for existing options ---
  const handleExpandOption = (idx: number) => {
    setExpandedAddedIndex(-1);
    const modification = changes?.options?.modified?.find((m) => m.index === idx);
    setEditDraft({
      text: modification?.to ?? currentOptions[idx],
      characteristic: modification?.toCharacteristic ?? currentCharacteristics[idx] ?? "",
      comment: modification?.comment ?? "",
    });
    setExpandedOptionIndex(idx);
  };

  const handleSaveOptionEdit = (idx: number) => {
    const originalText = currentOptions[idx];
    const originalChar = currentCharacteristics[idx] ?? "";
    const textChanged = editDraft.text.trim() !== originalText;
    const charChanged = editDraft.characteristic.trim() !== originalChar;
    const hasComment = editDraft.comment.trim() !== "";

    const currentModified = changes?.options?.modified || [];
    const withoutCurrent = currentModified.filter((m) => m.index !== idx);

    if (textChanged || charChanged || hasComment) {
      const mod: ModifiedOption = {
        index: idx,
        from: originalText,
        to: editDraft.text.trim() || originalText,
        ...(charChanged || editDraft.characteristic.trim()
          ? { fromCharacteristic: originalChar, toCharacteristic: editDraft.characteristic.trim() }
          : {}),
        ...(hasComment ? { comment: editDraft.comment.trim() } : {}),
      };
      onUpdateChanges({
        options: {
          ...changes?.options,
          added: changes?.options?.added || [],
          modified: [...withoutCurrent, mod],
          removed: changes?.options?.removed || [],
        },
      });
    } else if (withoutCurrent.length !== currentModified.length) {
      // Remove stale modification entry
      onUpdateChanges({
        options: {
          ...changes?.options,
          added: changes?.options?.added || [],
          modified: withoutCurrent,
          removed: changes?.options?.removed || [],
        },
      });
    }
    setExpandedOptionIndex(-1);
  };

  const handleCancelOptionEdit = () => {
    setExpandedOptionIndex(-1);
  };

  // --- Expand/collapse handlers for added options ---
  const handleExpandAddedOption = (idx: number) => {
    setExpandedOptionIndex(-1);
    const option = changes?.options?.added?.[idx];
    if (!option) return;
    setEditAddedDraft({
      text: option.text,
      characteristic: option.characteristic,
      comment: option.comment ?? "",
    });
    setExpandedAddedIndex(idx);
  };

  const handleSaveAddedOptionEdit = (idx: number) => {
    const currentAdded = [...(changes?.options?.added || [])];
    currentAdded[idx] = {
      text: editAddedDraft.text.trim() || currentAdded[idx].text,
      characteristic: editAddedDraft.characteristic.trim() || currentAdded[idx].characteristic,
      ...(editAddedDraft.comment.trim() ? { comment: editAddedDraft.comment.trim() } : {}),
    };
    onUpdateChanges({
      options: {
        ...changes?.options,
        added: currentAdded,
        modified: changes?.options?.modified || [],
        removed: changes?.options?.removed || [],
      },
    });
    setExpandedAddedIndex(-1);
  };

  const handleCancelAddedOptionEdit = () => {
    setExpandedAddedIndex(-1);
  };

  // Check if answer type supports options
  const typeSupportsOptions = ["radio", "checkbox", "multi_select"].includes(
    suggestedAnswerType?.toLowerCase() || ""
  );

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

      {/* Current Question Text */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Question Text
        </h3>

        <div className="space-y-3">
          {/* Current value */}
          <div className="bg-base-200/50 rounded-lg p-3">
            <p className="text-xs text-base-content/60 mb-1">Current Text</p>
            <p className="text-sm">{question.questionText}</p>
          </div>

          {/* Suggested value */}
          <div>
            <label className="label">
              <span className="label-text text-xs">Suggested Text</span>
              {changes?.questionText && (
                <span className="label-text-alt text-primary text-xs">Modified</span>
              )}
            </label>
            <textarea
              value={suggestedQuestionText}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              className={`textarea textarea-bordered w-full ${
                changes?.questionText ? "textarea-primary" : ""
              }`}
              rows={3}
              placeholder="Enter suggested question text..."
            />
          </div>
        </div>
      </div>

      {/* Answer Type */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
          Answer Type
        </h3>

        <div className="space-y-3">
          {/* Current value */}
          <div className="bg-base-200/50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/60 mb-1">Current Type</p>
              <span className="badge badge-outline">{question.answerType || "—"}</span>
            </div>
          </div>

          {/* Suggested value */}
          <div>
            <label className="label">
              <span className="label-text text-xs">Suggested Type</span>
              {changes?.answerType && (
                <span className="label-text-alt text-primary text-xs">Modified</span>
              )}
            </label>
            <select
              value={suggestedAnswerType || ""}
              onChange={(e) => handleAnswerTypeChange(e.target.value)}
              className={`select select-bordered w-full ${
                changes?.answerType ? "select-primary" : ""
              }`}
            >
              <option value="">Select answer type</option>
              {MYPREOP_ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Options (for radio/checkbox types) */}
      {(currentOptions.length > 0 || typeSupportsOptions) && (
        <div>
          <h3 className="text-sm font-semibold text-base-content/80 uppercase tracking-wide mb-3">
            Answer Options
          </h3>

          <div className="space-y-3">
            {/* Existing options */}
            {currentOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-base-content/60">Current Options</p>
                {currentOptions.map((option, idx) => {
                  const isRemoved = changes?.options?.removed?.includes(idx);
                  const modification = changes?.options?.modified?.find((m) => m.index === idx);
                  const isExpanded = expandedOptionIndex === idx;
                  const displayText = modification ? modification.to : option;
                  const displayChar = modification?.toCharacteristic ?? currentCharacteristics[idx];

                  return (
                    <div key={idx}>
                      {/* Collapsed row */}
                      <div
                        onClick={() => {
                          if (!isRemoved && !isExpanded) handleExpandOption(idx);
                        }}
                        className={`flex items-center justify-between p-2 border ${
                          isExpanded
                            ? "rounded-t-lg border-b-0"
                            : "rounded-lg"
                        } ${
                          isRemoved
                            ? "border-error/30 bg-error/5 line-through opacity-50"
                            : modification
                            ? "border-primary bg-primary/5"
                            : "border-base-300 bg-base-100"
                        } ${!isRemoved && !isExpanded ? "cursor-pointer hover:bg-base-200/50" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm truncate">{displayText}</span>
                          {displayChar && (
                            <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs flex-shrink-0">
                              {displayChar}
                            </span>
                          )}
                          {modification?.comment && (
                            <span className="flex-shrink-0" title={modification.comment}>
                              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOption(idx);
                          }}
                          className={`btn btn-xs flex-shrink-0 ${isRemoved ? "btn-ghost" : "btn-error btn-outline"}`}
                        >
                          {isRemoved ? "Undo" : "Remove"}
                        </button>
                      </div>

                      {/* Expanded edit form */}
                      {isExpanded && (
                        <div className={`p-3 border border-t-0 rounded-b-lg space-y-2 ${
                          modification ? "border-primary bg-primary/5" : "border-base-300 bg-base-100"
                        }`}>
                          <div>
                            <label className="label py-0">
                              <span className="label-text text-xs">Option Text</span>
                            </label>
                            <input
                              type="text"
                              value={editDraft.text}
                              onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                              className="input input-bordered input-sm w-full"
                            />
                          </div>
                          <div>
                            <label className="label py-0">
                              <span className="label-text text-xs">Characteristic</span>
                            </label>
                            <input
                              type="text"
                              value={editDraft.characteristic}
                              onChange={(e) => setEditDraft({ ...editDraft, characteristic: e.target.value })}
                              className="input input-bordered input-sm w-full font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="label py-0">
                              <span className="label-text text-xs">Comment</span>
                            </label>
                            <textarea
                              value={editDraft.comment}
                              onChange={(e) => setEditDraft({ ...editDraft, comment: e.target.value })}
                              className="textarea textarea-bordered textarea-sm w-full"
                              rows={2}
                              placeholder="Add a note about this change..."
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelOptionEdit}
                              className="btn btn-xs btn-ghost"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveOptionEdit(idx)}
                              className="btn btn-xs btn-primary"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Newly added options */}
            {changes?.options?.added && changes.options.added.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-success">New Options</p>
                {changes.options.added.map((option, idx) => {
                  const isExpanded = expandedAddedIndex === idx;

                  return (
                    <div key={`new-${idx}`}>
                      {/* Collapsed row */}
                      <div
                        onClick={() => {
                          if (!isExpanded) handleExpandAddedOption(idx);
                        }}
                        className={`flex items-center justify-between p-2 border border-success/30 bg-success/5 ${
                          isExpanded ? "rounded-t-lg border-b-0" : "rounded-lg"
                        } ${!isExpanded ? "cursor-pointer hover:bg-success/10" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm truncate">{option.text}</span>
                          <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-mono text-xs flex-shrink-0">
                            {option.characteristic}
                          </span>
                          {option.comment && (
                            <span className="flex-shrink-0" title={option.comment}>
                              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAddedOption(idx);
                          }}
                          className="btn btn-xs btn-ghost flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Expanded edit form */}
                      {isExpanded && (
                        <div className="p-3 border border-t-0 border-success/30 bg-success/5 rounded-b-lg space-y-2">
                          <div>
                            <label className="label py-0">
                              <span className="label-text text-xs">Option Text</span>
                            </label>
                            <input
                              type="text"
                              value={editAddedDraft.text}
                              onChange={(e) => setEditAddedDraft({ ...editAddedDraft, text: e.target.value })}
                              className="input input-bordered input-sm w-full"
                            />
                          </div>
                          <div>
                            <label className="label py-0">
                              <span className="label-text text-xs">Characteristic</span>
                            </label>
                            <input
                              type="text"
                              value={editAddedDraft.characteristic}
                              onChange={(e) => setEditAddedDraft({ ...editAddedDraft, characteristic: e.target.value })}
                              className="input input-bordered input-sm w-full font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="label py-0">
                              <span className="label-text text-xs">Comment</span>
                            </label>
                            <textarea
                              value={editAddedDraft.comment}
                              onChange={(e) => setEditAddedDraft({ ...editAddedDraft, comment: e.target.value })}
                              className="textarea textarea-bordered textarea-sm w-full"
                              rows={2}
                              placeholder="Add a note about this change..."
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelAddedOptionEdit}
                              className="btn btn-xs btn-ghost"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAddedOptionEdit(idx)}
                              className="btn btn-xs btn-primary"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new option form */}
            {typeSupportsOptions && (
              <div className="p-3 border border-dashed border-base-300 rounded-lg">
                <p className="text-xs text-base-content/60 mb-2">Add New Option</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Option text"
                    className="input input-bordered input-sm w-full"
                  />
                  <input
                    type="text"
                    value={newOptionCharacteristic}
                    onChange={(e) => setNewOptionCharacteristic(e.target.value)}
                    placeholder="Characteristic (auto-generated if empty)"
                    className="input input-bordered input-sm w-full font-mono text-xs"
                  />
                  <textarea
                    value={newOptionComment}
                    onChange={(e) => setNewOptionComment(e.target.value)}
                    placeholder="Comment (optional)"
                    className="textarea textarea-bordered textarea-sm w-full"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={!newOptionText.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    Add Option
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
