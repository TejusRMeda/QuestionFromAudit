"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ───────────────────────────── Types ──────────────────────────────

interface MasterQuestion {
  id: number;
  question_id: string;
  category: string;
  question_text: string;
  answer_type: string;
  answer_options: string | null;
  characteristic: string | null;
  section: string | null;
  page: string | null;
  enable_when: string | null;
  required: boolean;
  has_helper: boolean;
  helper_type: string | null;
  helper_name: string | null;
  helper_value: string | null;
  is_hidden: boolean;
  is_locked: boolean;
}

interface EditSlideOverProps {
  question: MasterQuestion;
  onSave: (updated: Partial<MasterQuestion>) => void;
  onClose: () => void;
}

// ───────────────────────────── Component ──────────────────────────

export default function EditSlideOver({
  question,
  onSave,
  onClose,
}: EditSlideOverProps) {
  const [questionText, setQuestionText] = useState(question.question_text);
  const [required, setRequired] = useState(question.required);
  const [hasHelper, setHasHelper] = useState(question.has_helper);
  const [helperType, setHelperType] = useState(question.helper_type || "");
  const [helperName, setHelperName] = useState(question.helper_name || "");
  const [helperValue, setHelperValue] = useState(question.helper_value || "");
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap: close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Focus first interactive element on mount
  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      const firstInput = panel.querySelector<HTMLElement>(
        "textarea, input, button"
      );
      firstInput?.focus();
    }
  }, []);

  const answerOptions = question.answer_options
    ? question.answer_options.split("|").map((o) => o.trim())
    : [];

  const handleApply = useCallback(() => {
    onSave({
      question_text: questionText,
      required,
      has_helper: hasHelper,
      helper_type: helperType || null,
      helper_name: helperName || null,
      helper_value: helperValue || null,
    });
  }, [questionText, required, hasHelper, helperType, helperName, helperValue, onSave]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit question"
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white shadow-xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-slate-800 truncate">
              {question.question_text.length > 40
                ? question.question_text.slice(0, 40) + "..."
                : question.question_text}
            </span>
            <Badge variant="ghost" className="text-[10px] shrink-0">
              {question.answer_type}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="question" className="h-full">
            <div className="px-4 pt-3">
              <TabsList variant="line" className="w-full">
                <TabsTrigger value="question">Question</TabsTrigger>
                <TabsTrigger value="options">Answer Options</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
              </TabsList>
            </div>

            {/* ── Question Tab ── */}
            <TabsContent value="question" className="px-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question-text" className="mb-1.5">
                    Question Text
                  </Label>
                  <Textarea
                    id="question-text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={4}
                    className="resize-y"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="required-toggle">Required</Label>
                  <Switch
                    id="required-toggle"
                    checked={required}
                    onCheckedChange={(val) => setRequired(val as boolean)}
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <Label className="text-slate-500 text-xs uppercase tracking-wider mb-2">
                    Read-only Fields
                  </Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Answer Type</span>
                      <span className="text-slate-800 font-medium">
                        {question.answer_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Category</span>
                      <span className="text-slate-800 font-medium">
                        {question.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Section</span>
                      <span className="text-slate-800 font-medium">
                        {question.section || "None"}
                      </span>
                    </div>
                    {question.characteristic && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Characteristic</span>
                        <span className="text-slate-800 font-medium truncate ml-2 max-w-[180px]">
                          {question.characteristic}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Answer Options Tab ── */}
            <TabsContent value="options" className="px-4 py-4">
              {answerOptions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-3">
                    Answer options are read-only in this version. Editing will be
                    available in a future update.
                  </p>
                  <ul className="space-y-1.5">
                    {answerOptions.map((option, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-sm text-slate-700"
                      >
                        <span className="text-xs font-mono text-slate-400 w-5 shrink-0">
                          {idx + 1}.
                        </span>
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">
                    This question has no answer options.
                  </p>
                  <p className="text-xs mt-1 text-slate-400">
                    Answer options apply to choice-based question types.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── Help Tab ── */}
            <TabsContent value="help" className="px-4 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="has-helper-toggle">Enable Help</Label>
                  <Switch
                    id="has-helper-toggle"
                    checked={hasHelper}
                    onCheckedChange={(val) => setHasHelper(val as boolean)}
                  />
                </div>

                {hasHelper && (
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div>
                      <Label htmlFor="helper-type" className="mb-1.5">
                        Helper Type
                      </Label>
                      <Input
                        id="helper-type"
                        value={helperType}
                        onChange={(e) => setHelperType(e.target.value)}
                        placeholder="e.g., tooltip, info, video"
                      />
                    </div>
                    <div>
                      <Label htmlFor="helper-name" className="mb-1.5">
                        Helper Name
                      </Label>
                      <Input
                        id="helper-name"
                        value={helperName}
                        onChange={(e) => setHelperName(e.target.value)}
                        placeholder="Display name for the helper"
                      />
                    </div>
                    <div>
                      <Label htmlFor="helper-value" className="mb-1.5">
                        Helper Value
                      </Label>
                      <Textarea
                        id="helper-value"
                        value={helperValue}
                        onChange={(e) => setHelperValue(e.target.value)}
                        rows={3}
                        placeholder="Help content or URL"
                        className="resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
            onClick={handleApply}
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </>
  );
}
