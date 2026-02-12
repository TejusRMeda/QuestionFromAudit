"use client";

import { useRef, useEffect } from "react";
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
import EmptyPanelState from "./EmptyPanelState";
import SettingsTab from "./tabs/SettingsTab";
import ContentTab from "./tabs/ContentTab";
import HelpTab from "./tabs/HelpTab";
import LogicTab from "./tabs/LogicTab";
import ReviewTab from "./tabs/ReviewTab";

interface EditPanelProps {
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
}

/**
 * Tab icons as SVG components
 */
function TabIcon({ icon, className }: { icon: string; className?: string }) {
  const baseClass = `w-4 h-4 ${className || ""}`;

  switch (icon) {
    case "Cog6Tooth":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "PencilSquare":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case "QuestionMarkCircle":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "ArrowsRightLeft":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case "CheckCircle":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Edit panel with tabbed interface for making structured suggestions
 */
export default function EditPanel({
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
}: EditPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when a new question is selected
  useEffect(() => {
    if (question && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [question?.id]);

  if (!question) {
    return (
      <div className="h-full bg-base-100 border-l border-base-300">
        <EmptyPanelState />
      </div>
    );
  }

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
            onSelectQuestion={onSelectQuestion}
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
    <div className="h-full flex flex-col bg-base-100 border-l border-base-300">
      {/* Question Header */}
      <div className="p-4 border-b border-base-300 bg-base-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-neutral badge-sm font-mono">{question.questionId}</span>
          <span className="badge badge-ghost badge-sm">{question.category}</span>
          {question.suggestionCount > 0 && (
            <span className="badge badge-info badge-sm">
              {question.suggestionCount} suggestion{question.suggestionCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-base-content/80 line-clamp-2">{question.questionText}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-base-300">
        <div className="flex overflow-x-auto">
          {EDIT_PANEL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasChanges = tabHasChanges(tab.id);
            const hasErrors = tabHasErrors(tab.id);

            return (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                }`}
              >
                <TabIcon icon={tab.icon} />
                <span>{tab.label}</span>
                {/* Indicator dots */}
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
      <div ref={contentRef} className="flex-1 overflow-auto p-4">{renderTabContent()}</div>
    </div>
  );
}
