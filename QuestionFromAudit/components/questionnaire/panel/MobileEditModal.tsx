"use client";

import { useState, useRef, useEffect } from "react";
import { TranslatedEnableWhen } from "@/lib/enableWhen";
import {
  EditableQuestion,
  TabId,
  EDIT_PANEL_TABS,
  SettingsChanges,
  ContentChanges,
  HelpChanges,
  LogicChanges,
  ValidationErrors,
} from "@/types/editPanel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import SettingsTab from "./tabs/SettingsTab";
import ContentTab from "./tabs/ContentTab";
import HelpTab from "./tabs/HelpTab";
import LogicTab from "./tabs/LogicTab";
import ReviewTab from "./tabs/ReviewTab";

interface MobileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: EditableQuestion | null;
  allQuestions: EditableQuestion[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  changes: {
    settings: SettingsChanges | null;
    content: ContentChanges | null;
    help: HelpChanges | null;
    logic: LogicChanges | null;
  };
  onUpdateSettings: (changes: Partial<SettingsChanges>) => void;
  onUpdateContent: (changes: Partial<ContentChanges>) => void;
  onUpdateHelp: (changes: Partial<HelpChanges>) => void;
  onUpdateLogic: (changes: Partial<LogicChanges>) => void;
  submitterName: string;
  submitterEmail: string;
  notes: string;
  onSubmitterNameChange: (name: string) => void;
  onSubmitterEmailChange: (email: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  tabHasChanges: (tab: TabId) => boolean;
  tabHasErrors: (tab: TabId) => boolean;
  validationErrors: ValidationErrors;
  translatedEnableWhen: TranslatedEnableWhen | null;
  onSelectQuestion: (question: EditableQuestion) => void;
  questionIndex: number;
  totalQuestions: number;
  hasUnsavedChanges: boolean;
  onDiscardChanges: () => void;
}

/**
 * Full-screen modal for editing questions on mobile devices
 */
export default function MobileEditModal({
  isOpen,
  onClose,
  question,
  allQuestions,
  activeTab,
  onTabChange,
  changes,
  onUpdateSettings,
  onUpdateContent,
  onUpdateHelp,
  onUpdateLogic,
  submitterName,
  submitterEmail,
  notes,
  onSubmitterNameChange,
  onSubmitterEmailChange,
  onNotesChange,
  onSubmit,
  isSubmitting,
  tabHasChanges,
  tabHasErrors,
  validationErrors,
  translatedEnableWhen,
  onSelectQuestion,
  questionIndex,
  totalQuestions,
  hasUnsavedChanges,
  onDiscardChanges,
}: MobileEditModalProps) {
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-active="true"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowUnsavedWarning(false);
    onDiscardChanges();
    onClose();
  };

  const handleSelectQuestionFromLogic = (q: EditableQuestion) => {
    // Close modal and select the new question
    onClose();
    onSelectQuestion(q);
  };

  if (!question) return null;

  const tabs = EDIT_PANEL_TABS;
  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  const goToNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      onTabChange(tabs[currentTabIndex + 1].id);
    }
  };

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      onTabChange(tabs[currentTabIndex - 1].id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "settings":
        return (
          <SettingsTab
            question={question}
            changes={changes.settings}
            onUpdateChanges={onUpdateSettings}
            questionIndex={questionIndex}
            totalQuestions={totalQuestions}
          />
        );
      case "content":
        return (
          <ContentTab
            question={question}
            changes={changes.content}
            onUpdateChanges={onUpdateContent}
            errors={validationErrors.content}
          />
        );
      case "help":
        return (
          <HelpTab
            question={question}
            changes={changes.help}
            onUpdateChanges={onUpdateHelp}
            errors={validationErrors.help}
          />
        );
      case "logic":
        return (
          <LogicTab
            question={question}
            allQuestions={allQuestions}
            changes={changes.logic}
            onUpdateChanges={onUpdateLogic}
            translatedEnableWhen={translatedEnableWhen}
            onSelectQuestion={handleSelectQuestionFromLogic}
          />
        );
      case "review":
        return (
          <ReviewTab
            question={question}
            changes={changes}
            submitterName={submitterName}
            submitterEmail={submitterEmail}
            notes={notes}
            onSubmitterNameChange={onSubmitterNameChange}
            onSubmitterEmailChange={onSubmitterEmailChange}
            onNotesChange={onNotesChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            validationErrors={validationErrors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-none w-full h-full m-0 p-0 rounded-none flex flex-col inset-0 translate-x-0 translate-y-0 top-0 left-0"
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close
              </Button>
              <DialogTitle className="text-sm font-medium">
                Edit Question
              </DialogTitle>
              <div className="w-20" /> {/* Spacer for centering */}
            </div>

            {/* Question Info */}
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="font-mono text-xs">
                  {question.questionId}
                </Badge>
                <Badge variant="ghost" className="text-xs">{question.category}</Badge>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {question.questionText}
              </p>
            </div>
          </div>

          {/* Horizontal Scrollable Tabs */}
          <div
            ref={tabsRef}
            className="flex-shrink-0 border-b border-slate-200 overflow-x-auto"
          >
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const hasChanges = tabHasChanges(tab.id);
                const hasErrors = tabHasErrors(tab.id);

                return (
                  <button
                    key={tab.id}
                    data-active={isActive}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                      isActive
                        ? "border-[#4A90A4] text-[#4A90A4]"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    {tab.label}
                    {(hasChanges || hasErrors) && (
                      <span
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                          hasErrors ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4">{renderTabContent()}</div>

          {/* Footer Navigation (except on Review tab) */}
          {activeTab !== "review" && (
            <div className="flex-shrink-0 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={goToPrevTab}
                disabled={currentTabIndex === 0}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </Button>
              <Button onClick={goToNextTab}>
                Next
                <svg
                  className="w-4 h-4 ml-1"
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
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <UnsavedChangesDialog
        isOpen={showUnsavedWarning}
        onKeepEditing={() => setShowUnsavedWarning(false)}
        onDiscard={handleDiscard}
      />
    </>
  );
}
