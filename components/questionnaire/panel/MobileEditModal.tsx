"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useRef, useEffect } from "react";
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
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral/50" />
          </Transition.Child>

          <div className="fixed inset-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full"
            >
              <Dialog.Panel className="w-full h-full flex flex-col bg-base-100">
                {/* Header */}
                <div className="flex-shrink-0 border-b border-base-300 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
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
                    </button>
                    <Dialog.Title className="text-sm font-medium">
                      Edit Question
                    </Dialog.Title>
                    <div className="w-20" /> {/* Spacer for centering */}
                  </div>

                  {/* Question Info */}
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-neutral badge-sm font-mono">
                        {question.questionId}
                      </span>
                      <span className="badge badge-ghost badge-sm">{question.category}</span>
                    </div>
                    <p className="text-sm text-base-content/80 line-clamp-2">
                      {question.questionText}
                    </p>
                  </div>
                </div>

                {/* Horizontal Scrollable Tabs */}
                <div
                  ref={tabsRef}
                  className="flex-shrink-0 border-b border-base-300 overflow-x-auto"
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
                              ? "border-primary text-primary"
                              : "border-transparent text-base-content/60"
                          }`}
                        >
                          {tab.label}
                          {(hasChanges || hasErrors) && (
                            <span
                              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                                hasErrors ? "bg-error" : "bg-success"
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
                  <div className="flex-shrink-0 border-t border-base-300 px-4 py-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="btn btn-ghost"
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
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={goToNextTab}
                    >
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
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Unsaved Changes Warning */}
      <Transition appear show={showUnsavedWarning} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[60]"
          onClose={() => setShowUnsavedWarning(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-box bg-base-100 p-6 shadow-xl transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-warning"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold">
                        Unsaved Changes
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-base-content/70">
                        You have unsaved changes. Do you want to discard them?
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowUnsavedWarning(false)}
                    >
                      Keep Editing
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleDiscard}
                    >
                      Discard Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
