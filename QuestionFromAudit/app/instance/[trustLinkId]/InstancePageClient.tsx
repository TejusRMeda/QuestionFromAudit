"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import {
  buildCharacteristicMap,
  translateEnableWhen,
  TranslatedEnableWhen,
} from "@/lib/enableWhen";
import { TestingSessionProvider } from "@/lib/testingSessionContext";
import { isHidden } from "@/lib/testingConfig";
import type { TestingConfig } from "@/types/testing";
import { EditableQuestion, PhantomQuestion, QuestionListItem } from "@/types/editPanel";
import { useEditPanelState } from "@/hooks/useEditPanelState";
import { useInstanceData, InstanceData } from "@/hooks/useInstanceData";
import { useInstanceSuggestions } from "@/hooks/useInstanceSuggestions";
import { useSectionReviews } from "@/hooks/useSectionReviews";
import { useQuickActions } from "@/hooks/useQuickActions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SplitScreenLayout from "@/components/questionnaire/panel/SplitScreenLayout";
import QuestionsList, { ViewStyle } from "@/components/questionnaire/panel/QuestionsList";
import EditPanel from "@/components/questionnaire/panel/EditPanel";
import UserModePanel from "@/components/questionnaire/panel/UserModePanel";
import QuestionSuggestionsPanel from "@/components/questionnaire/panel/QuestionSuggestionsPanel";
import SectionCardsView from "@/components/questionnaire/panel/SectionCardsView";
import SuggestionsListView from "@/components/questionnaire/panel/SuggestionsListView";
import ChangeRequestsTableView from "@/components/questionnaire/panel/ChangeRequestsTableView";
import CasodReportView from "@/components/questionnaire/panel/CasodReportView";

const ReviewerNameDialog = dynamic(
  () => import("@/components/questionnaire/ReviewerNameDialog"),
  { ssr: false }
);

const AddNewQuestionDialog = dynamic(
  () => import("@/components/questionnaire/AddNewQuestionDialog"),
  { ssr: false }
);
const UnsavedChangesDialog = dynamic(
  () => import("@/components/questionnaire/panel/UnsavedChangesDialog"),
  { ssr: false }
);

interface InstancePageClientProps {
  trustLinkId: string;
  initialData: InstanceData;
  /**
   * True when the viewer is the master owner (account manager). Renders the
   * full structured EditPanel. False renders the slim UserModePanel built for
   * trust reviewers. Server pages decide this from auth; testing links always
   * pass false.
   */
  isAdminMode?: boolean;
  /**
   * When set, the screen renders in usability-testing mode: controls listed
   * in `testingConfig.hide` are removed from the UI, and any suggestion or
   * comment submitted is tagged is_test_session=true via TestingSessionContext.
   */
  testingConfig?: TestingConfig;
}

export default function InstancePageClient({ trustLinkId, initialData, isAdminMode = false, testingConfig }: InstancePageClientProps) {
  const isTestSession = !!testingConfig;

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingQuestionSelection, setPendingQuestionSelection] = useState<EditableQuestion | null>(null);
  const [viewStyle, setViewStyle] = useState<ViewStyle>(
    testingConfig?.lockedViewStyle === "patient" ? "patient" : "default"
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "suggestions" | "change-requests" | "casod-report">("main");
  const [rightPanelMode, setRightPanelMode] = useState<"suggestions" | "edit">("edit");
  const [reviewerName, setReviewerName] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newQuestionSuggestions, setNewQuestionSuggestions] = useState<
    Array<{ id: number; anchorQuestionId: number; position: "before" | "after"; questionText: string; submitterName: string }>
  >(initialData.newQuestionSuggestions || []);
  const [addNewQuestionDialog, setAddNewQuestionDialog] = useState<{
    anchor: EditableQuestion;
    position: "before" | "after";
  } | null>(null);

  // Custom hooks
  const { loading, error, instance, fetchInstance } = useInstanceData(trustLinkId, initialData);
  const { suggestionsLoading, invalidateSuggestions, displaySuggestions } =
    useInstanceSuggestions(trustLinkId, activeTab, selectedSection);

  const refreshAll = useCallback(() => {
    fetchInstance().then((data) => {
      if (data) {
        sectionReviewState.syncFromFetch(data);
        quickActionState.syncFromFetch(data.questions || []);
        setNewQuestionSuggestions(data.newQuestionSuggestions || []);
      }
    });
    invalidateSuggestions();
  }, [fetchInstance, invalidateSuggestions]);

  // Convert questions to EditableQuestion format
  const editableQuestions: EditableQuestion[] = useMemo(() => {
    return (instance?.questions || []).map((q) => ({
      ...q,
      required: q.required ?? false,
    }));
  }, [instance?.questions]);

  const sectionReviewState = useSectionReviews(
    trustLinkId,
    initialData.sectionReviews || [],
    initialData.submissionStatus || "in_progress",
    editableQuestions,
    refreshAll
  );

  const quickActionState = useQuickActions(
    initialData.questions || [],
    refreshAll
  );

  const editPanelState = useEditPanelState(editableQuestions);

  // Load reviewer name from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("qa-reviewer-name");
    if (stored) setReviewerName(stored);
  }, []);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editPanelState.hasChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editPanelState]);

  // Build characteristic map and translated EnableWhen conditions
  const characteristicMap = useMemo(() => {
    if (!instance?.questions) return new Map();
    return buildCharacteristicMap(instance.questions);
  }, [instance?.questions]);

  const translatedEnableWhens = useMemo(() => {
    const map = new Map<number, TranslatedEnableWhen>();
    if (!instance?.questions) return map;
    for (const q of instance.questions) {
      if (q.enableWhen) {
        map.set(q.id, translateEnableWhen(q.enableWhen, characteristicMap));
      }
    }
    return map;
  }, [instance?.questions, characteristicMap]);

  // Filter questions by selected section
  const sectionQuestions: EditableQuestion[] = useMemo(() => {
    if (!selectedSection) return editableQuestions;
    return editableQuestions.filter(
      (q) => (q.section || "General") === selectedSection
    );
  }, [editableQuestions, selectedSection]);

  // Merge phantom (new question) suggestions into the question list
  const mergedQuestions: QuestionListItem[] = useMemo(() => {
    if (newQuestionSuggestions.length === 0) return sectionQuestions;

    const result: QuestionListItem[] = [];
    for (const q of sectionQuestions) {
      const beforeItems = newQuestionSuggestions.filter(
        (s) => s.anchorQuestionId === q.id && s.position === "before"
      );
      for (const phantom of beforeItems) {
        result.push(buildPhantomQuestion(phantom, q, "before"));
      }

      result.push(q);

      const afterItems = newQuestionSuggestions.filter(
        (s) => s.anchorQuestionId === q.id && s.position === "after"
      );
      for (const phantom of afterItems) {
        result.push(buildPhantomQuestion(phantom, q, "after"));
      }
    }
    return result;
  }, [sectionQuestions, newQuestionSuggestions]);

  // Get unique categories for section-filtered questions
  const categories = useMemo(() => {
    if (!instance) return [];
    const source = selectedSection
      ? instance.questions.filter((q) => (q.section || "General") === selectedSection)
      : instance.questions;
    return [...new Set(source.map((q) => q.category))];
  }, [instance, selectedSection]);

  // Compute progress stats
  const suggestedQuestionIds = useMemo(() => {
    if (!instance?.questions) return new Set<number>();
    return new Set(
      instance.questions.filter((q) => q.suggestionCount > 0).map((q) => q.id)
    );
  }, [instance?.questions]);

  const totalQuestionCount = instance?.questions.length ?? 0;
  const suggestedCount = suggestedQuestionIds.size;
  const progressPercent = totalQuestionCount > 0 ? Math.round((suggestedCount / totalQuestionCount) * 100) : 0;

  const sectionProgress = useMemo(() => {
    if (!selectedSection) return { total: totalQuestionCount, suggested: suggestedCount, percent: progressPercent };
    const sectionQs = editableQuestions.filter((q) => (q.section || "General") === selectedSection);
    const sectionSuggested = sectionQs.filter((q) => suggestedQuestionIds.has(q.id)).length;
    const percent = sectionQs.length > 0 ? Math.round((sectionSuggested / sectionQs.length) * 100) : 0;
    return { total: sectionQs.length, suggested: sectionSuggested, percent };
  }, [selectedSection, editableQuestions, suggestedQuestionIds, totalQuestionCount, suggestedCount, progressPercent]);

  const currentSectionHasSuggestions = useMemo(() => {
    if (!selectedSection) return false;
    return editableQuestions
      .filter((q) => (q.section || "General") === selectedSection)
      .some((q) => q.suggestionCount > 0);
  }, [selectedSection, editableQuestions]);

  // Handlers
  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setQuestionAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSelectQuestion = useCallback(
    (question: EditableQuestion) => {
      if ("isPhantom" in question && (question as PhantomQuestion).isPhantom) {
        const phantom = question as PhantomQuestion;
        const anchor = editableQuestions.find((q) => q.id === phantom.anchorQuestionId);
        if (anchor) {
          const canSelect = editPanelState.selectQuestion(anchor);
          if (!canSelect) {
            setPendingQuestionSelection(anchor);
            setUnsavedDialogOpen(true);
            return;
          }
          setRightPanelMode("suggestions");
        }
        return;
      }

      const canSelect = editPanelState.selectQuestion(question);
      if (!canSelect) {
        setPendingQuestionSelection(question);
        setUnsavedDialogOpen(true);
        return;
      }
      setRightPanelMode(question.suggestionCount > 0 ? "suggestions" : "edit");
    },
    [editPanelState, editableQuestions]
  );

  const handleDiscardAndSelect = useCallback(() => {
    editPanelState.clearChanges();
    if (pendingQuestionSelection) {
      editPanelState.selectQuestion(pendingQuestionSelection);
      setRightPanelMode(pendingQuestionSelection.suggestionCount > 0 ? "suggestions" : "edit");
    }
    setUnsavedDialogOpen(false);
    setPendingQuestionSelection(null);
  }, [editPanelState, pendingQuestionSelection]);

  const handleSubmit = async () => {
    const data = editPanelState.getSubmissionData();
    if (!data) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/instance/${trustLinkId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isTestSession }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit suggestion");
      }
      toast.success("Draft saved");
      editPanelState.clearChanges();
      setRightPanelMode("suggestions");
      refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewerNameSubmit = useCallback((name: string) => {
    setReviewerName(name);
    localStorage.setItem("qa-reviewer-name", name);
    setNameDialogOpen(false);
  }, []);

  const handleSuggestionDeleted = useCallback(
    (suggestionId: number, suggestionText: string) => {
      quickActionState.handleSuggestionDeleted(
        suggestionText,
        editPanelState.state.selectedQuestionId
      );
    },
    [quickActionState, editPanelState.state.selectedQuestionId]
  );

  // Memoized values for rendering
  const selectedQuestionIndex = useMemo(() => {
    if (!editPanelState.selectedQuestion) return 0;
    return sectionQuestions.findIndex((q) => q.id === editPanelState.selectedQuestion?.id);
  }, [sectionQuestions, editPanelState.selectedQuestion]);

  const validationErrors = useMemo(() => editPanelState.validate(), [editPanelState.validate]);

  const translatedEnableWhen = editPanelState.selectedQuestion
    ? translatedEnableWhens.get(editPanelState.selectedQuestion.id) || null
    : null;

  const isSubmitted = sectionReviewState.submissionStatus === "submitted";

  // Loading / error states
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-[1800px] mx-auto">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-[1800px] mx-auto p-4 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-slate-200 p-4 animate-pulse">
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-3" />
              <div className="flex gap-2 mb-2">
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Unable to Load Questionnaire</h1>
          <p className="text-slate-500">
            {error || "The link may be invalid or expired. Please contact your account manager."}
          </p>
        </div>
      </div>
    );
  }

  // Build the right panel:
  // - Admin viewers get the full structured EditPanel (Settings/Content/Help/Logic/Flow/Review)
  // - Trust reviewers get the slim UserModePanel (Suggestions + Logic)
  // Logic is now an in-panel tab in both — there is no longer a top-level
  // Panel/Modal/Logic toggle.
  let rightPanel: React.ReactNode;
  if ((isSubmitted || rightPanelMode === "suggestions") && editPanelState.selectedQuestion) {
    rightPanel = (
      <QuestionSuggestionsPanel
        question={editPanelState.selectedQuestion}
        trustLinkId={trustLinkId}
        onAddSuggestion={isSubmitted ? undefined : () => setRightPanelMode("edit")}
        onRefresh={refreshAll}
        onSuggestionDeleted={isSubmitted ? undefined : handleSuggestionDeleted}
      />
    );
  } else if (isAdminMode) {
    rightPanel = (
      <EditPanel
        question={editPanelState.selectedQuestion}
        allQuestions={sectionQuestions}
        activeTab={editPanelState.state.activeTab}
        onTabChange={editPanelState.setActiveTab}
        changes={editPanelState.state.changes}
        onUpdateSettings={editPanelState.updateSettings}
        onUpdateContent={editPanelState.updateContent}
        onUpdateHelp={editPanelState.updateHelp}
        onUpdateLogic={editPanelState.updateLogic}
        submitterName={editPanelState.state.submitterName}
        submitterEmail={editPanelState.state.submitterEmail}
        notes={editPanelState.state.notes}
        onSubmitterNameChange={editPanelState.setSubmitterName}
        onSubmitterEmailChange={editPanelState.setSubmitterEmail}
        onNotesChange={editPanelState.setNotes}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        tabHasChanges={editPanelState.tabHasChanges}
        tabHasErrors={editPanelState.tabHasErrors}
        validationErrors={validationErrors}
        translatedEnableWhen={translatedEnableWhen}
        onSelectQuestion={handleSelectQuestion}
        questionIndex={selectedQuestionIndex}
        totalQuestions={sectionQuestions.length}
        characteristicMap={characteristicMap}
      />
    );
  } else {
    rightPanel = (
      <UserModePanel
        question={editPanelState.selectedQuestion}
        allQuestions={sectionQuestions}
        trustLinkId={trustLinkId}
        reviewerName={reviewerName}
        onRefresh={refreshAll}
        onSuggestionDeleted={isSubmitted ? undefined : handleSuggestionDeleted}
        onClose={() => editPanelState.selectQuestion(null)}
        characteristicMap={characteristicMap}
        onSelectQuestion={handleSelectQuestion}
        onReviewerNameRequired={() => setNameDialogOpen(true)}
      />
    );
  }

  return (
    <TestingSessionProvider isTestSession={isTestSession}>
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden">
      {/* Progress Bar */}
      {!isHidden(testingConfig, "progress") && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex-shrink-0">
          <div className="max-w-[1800px] mx-auto flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Progress</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200">
              <div
                className="h-full bg-[#4A90A4] rounded-full transition-all duration-500"
                style={{ width: `${sectionProgress.percent}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{sectionProgress.suggested}</span> of {sectionProgress.total} reviewed
              {selectedSection && (
                <span className="text-slate-500"> in this section</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {selectedSection ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedSection(null);
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setActiveTab("main");
                      editPanelState.clearChanges();
                    }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#4A90A4] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    All Sections
                  </button>
                  <span className="text-slate-300">|</span>
                  <div>
                    <h1 className="text-xl font-bold">{selectedSection}</h1>
                    <p className="text-sm text-slate-500">
                      {sectionProgress.total} questions in this section
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-xl font-bold">{instance.questionnaireName || "Questionnaire"}</h1>
                  <p className="text-sm text-slate-500">
                    {instance.trustName} &middot; {instance.questions.length} questions across {
                      new Set(instance.questions.map((q) => q.section || "General")).size
                    } sections
                  </p>
                </div>
              )}
            </div>
            {selectedSection && activeTab === "main" && !isSubmitted && (
              <div className="flex items-center gap-3">
                {!isHidden(testingConfig, "mark") && (
                  sectionReviewState.sectionReviews.has(selectedSection) ? (
                    <button
                      onClick={() => sectionReviewState.handleUnreviewSection(selectedSection, reviewerName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Reviewed — Undo
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (!reviewerName) {
                            setNameDialogOpen(true);
                            return;
                          }
                          sectionReviewState.handleMarkSectionReviewed(selectedSection, currentSectionHasSuggestions, reviewerName);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#4A90A4] text-white hover:bg-[#3d7a8c] transition-colors"
                      >
                        {currentSectionHasSuggestions ? "Mark as Reviewed" : "No Changes Needed"}
                      </button>
                    </div>
                  )
                )}
                <Badge variant="outline" className="border-[#4A90A4] text-[#4A90A4]">
                  {isTestSession ? "Testing" : isAdminMode ? "Admin" : "Review Mode"}
                </Badge>
                {!isHidden(testingConfig, "style") && !testingConfig?.lockedViewStyle && (
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
                    <span className={`text-xs font-medium ${viewStyle === "default" ? "text-[#4A90A4]" : "text-slate-500"}`}>
                      Audit
                    </span>
                    <Switch
                      size="sm"
                      checked={viewStyle === "patient"}
                      onCheckedChange={(checked) => setViewStyle(checked ? "patient" : "default")}
                    />
                    <span className={`text-xs font-medium ${viewStyle === "patient" ? "text-[#4A90A4]" : "text-slate-500"}`}>
                      Patient Preview
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex">
            {[
              { key: "main" as const, label: selectedSection ? "Review" : "Sections", hideKey: null },
              { key: "suggestions" as const, label: "Suggestions", count: displaySuggestions.length, hideKey: "suggestions" as const },
              { key: "change-requests" as const, label: "Change Requests", count: displaySuggestions.length, hideKey: "changes" as const },
              { key: "casod-report" as const, label: "CASOD Report", hideKey: "casod" as const },
            ]
              .filter((tab) => !tab.hideKey || !isHidden(testingConfig, tab.hideKey))
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? "border-[#4A90A4] text-[#4A90A4]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                  {tab.count && tab.count > 0 ? (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                      activeTab === tab.key
                        ? "bg-[#4A90A4]/10 text-[#4A90A4]"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Filters — only show when inside a section on review tab */}
      {selectedSection && activeTab === "main" && !isHidden(testingConfig, "filters") && (
        <div className="bg-white border-b border-slate-200 flex-shrink-0">
          <div className="max-w-[1800px] mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            {(searchTerm || categoryFilter !== "all") && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-slate-500">Showing filtered results</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { setSearchTerm(""); setCategoryFilter("all"); }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "casod-report" ? (
          <div className="h-full overflow-y-auto">
            <CasodReportView
              suggestions={displaySuggestions}
              questions={editableQuestions}
              loading={suggestionsLoading}
              translatedEnableWhens={translatedEnableWhens}
              trustLinkId={trustLinkId}
            />
          </div>
        ) : activeTab === "change-requests" ? (
          <div className="h-full overflow-y-auto">
            <ChangeRequestsTableView
              suggestions={displaySuggestions}
              loading={suggestionsLoading}
              translatedEnableWhens={translatedEnableWhens}
            />
          </div>
        ) : activeTab === "suggestions" ? (
          <div className="h-full overflow-y-auto">
            <SuggestionsListView
              suggestions={displaySuggestions}
              loading={suggestionsLoading}
              trustLinkId={trustLinkId}
              onRefresh={() => invalidateSuggestions()}
            />
          </div>
        ) : !selectedSection ? (
          <div className="h-full overflow-y-auto">
            <SectionCardsView
              questions={editableQuestions}
              onSelectSection={setSelectedSection}
              sectionReviews={sectionReviewState.sectionReviews}
              submissionStatus={sectionReviewState.submissionStatus}
            />
            {!isSubmitted && !isHidden(testingConfig, "mark") && (
              <div className="max-w-5xl mx-auto px-4 pb-8">
                <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {sectionReviewState.allSectionsReviewed
                          ? "All sections reviewed! Ready to submit."
                          : `${sectionReviewState.sectionReviews.size} of ${sectionReviewState.allSectionNames.size} sections reviewed`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sectionReviewState.allSectionsReviewed
                          ? "Your suggestions will be sent to the account manager."
                          : "Complete all sections to submit your review."}
                      </p>
                    </div>
                    <button
                      onClick={() => sectionReviewState.setShowSubmitDialog(true)}
                      disabled={!sectionReviewState.allSectionsReviewed}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        sectionReviewState.allSectionsReviewed
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                          : "bg-slate-100 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single SplitScreenLayout for all demoModes */
          <SplitScreenLayout
            showRightOnMobile={!!editPanelState.state.selectedQuestionId}
            onMobileBack={() => {
              if (editPanelState.hasChanges()) {
                setUnsavedDialogOpen(true);
                setPendingQuestionSelection(null);
              } else {
                editPanelState.selectQuestion(null);
              }
            }}
            leftPanel={
              <QuestionsList
                questions={mergedQuestions}
                selectedQuestionId={editPanelState.state.selectedQuestionId}
                onSelectQuestion={handleSelectQuestion}
                searchTerm={searchTerm}
                categoryFilter={categoryFilter}
                translatedEnableWhens={translatedEnableWhens}
                questionAnswers={questionAnswers}
                onAnswerChange={handleAnswerChange}
                viewStyle={viewStyle}
                trustLinkId={trustLinkId}
                reviewerName={reviewerName}
                quickActions={isSubmitted ? {} : quickActionState.quickActions}
                onQuickAction={isSubmitted ? undefined : quickActionState.handleQuickAction}
                onAddSuggestion={isSubmitted ? undefined : (question) => {
                  editPanelState.selectQuestion(question);
                  setRightPanelMode("edit");
                }}
                onAddNewQuestion={isSubmitted ? undefined : (question, position) => {
                  setAddNewQuestionDialog({ anchor: question, position });
                }}
                onReviewerNameRequired={() => setNameDialogOpen(true)}
              />
            }
            rightPanel={rightPanel}
          />
        )}
      </div>

      {/* Dialogs */}
      <UnsavedChangesDialog
        isOpen={unsavedDialogOpen}
        onKeepEditing={() => { setUnsavedDialogOpen(false); setPendingQuestionSelection(null); }}
        onDiscard={handleDiscardAndSelect}
      />

      <AddNewQuestionDialog
        open={!!addNewQuestionDialog}
        anchorQuestion={addNewQuestionDialog?.anchor ?? null}
        position={addNewQuestionDialog?.position ?? null}
        trustLinkId={trustLinkId}
        reviewerName={reviewerName}
        onClose={() => setAddNewQuestionDialog(null)}
        onSubmitted={() => { setAddNewQuestionDialog(null); refreshAll(); }}
      />

      <ReviewerNameDialog
        open={nameDialogOpen}
        onSubmit={handleReviewerNameSubmit}
        onClose={() => setNameDialogOpen(false)}
      />

      {sectionReviewState.showSubmitDialog && !isHidden(testingConfig, "mark") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Submit Review</h2>
            <p className="text-sm text-slate-600 mb-4">
              Once submitted, your suggestions will be visible to the account manager and this review will be locked.
            </p>
            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {[...sectionReviewState.allSectionNames].map((name) => {
                const sectionQs = editableQuestions.filter((q) => (q.section || "General") === name);
                const draftCount = sectionQs.filter((q) => q.suggestionCount > 0).length;
                return (
                  <div key={name} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className={`text-xs ${draftCount > 0 ? "text-[#4A90A4]" : "text-slate-500"}`}>
                      {draftCount > 0 ? `${draftCount} draft${draftCount !== 1 ? "s" : ""}` : "No changes"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => sectionReviewState.setShowSubmitDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sectionReviewState.handleSubmitReview}
                disabled={sectionReviewState.isSubmittingReview}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {sectionReviewState.isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TestingSessionProvider>
  );
}

/** Helper to build a PhantomQuestion from a new-question suggestion */
function buildPhantomQuestion(
  phantom: { id: number; anchorQuestionId: number; questionText: string; submitterName: string },
  anchorQ: EditableQuestion,
  position: "before" | "after"
): PhantomQuestion {
  return {
    id: -phantom.id,
    questionId: `NEW-${phantom.id}`,
    category: anchorQ.category,
    questionText: phantom.questionText,
    answerType: null,
    answerOptions: null,
    characteristic: null,
    section: anchorQ.section,
    page: anchorQ.page,
    enableWhen: null,
    hasHelper: null,
    helperType: null,
    helperName: null,
    helperValue: null,
    suggestionCount: 0,
    required: false,
    isPhantom: true,
    phantomSuggestionId: phantom.id,
    anchorQuestionId: anchorQ.id,
    phantomPosition: position,
    submitterName: phantom.submitterName,
  };
}
