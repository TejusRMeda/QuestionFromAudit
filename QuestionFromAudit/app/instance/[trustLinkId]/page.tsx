"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  buildCharacteristicMap,
  translateEnableWhen,
  TranslatedEnableWhen,
} from "@/lib/enableWhen";
import { EnableWhen } from "@/types/question";
import { EditableQuestion, PhantomQuestion, QuestionListItem } from "@/types/editPanel";
import { useEditPanelState } from "@/hooks/useEditPanelState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SplitScreenLayout from "@/components/questionnaire/panel/SplitScreenLayout";
import QuestionsList, { ViewStyle } from "@/components/questionnaire/panel/QuestionsList";
import { QuickActionType } from "@/components/questionnaire/QuickActionsMenu";
import EditPanel from "@/components/questionnaire/panel/EditPanel";
import QuestionSuggestionsPanel from "@/components/questionnaire/panel/QuestionSuggestionsPanel";
import LogicFlowView from "@/components/questionnaire/panel/LogicFlowView";
import SectionCardsView from "@/components/questionnaire/panel/SectionCardsView";
import SuggestionsListView, { Suggestion } from "@/components/questionnaire/panel/SuggestionsListView";
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

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
  characteristic: string | null;
  section: string | null;
  page: string | null;
  enableWhen: EnableWhen | null;
  hasHelper: boolean | null;
  helperType: string | null;
  helperName: string | null;
  helperValue: string | null;
  suggestionCount: number;
  quickAction: "required" | "delete" | null;
}

interface InstanceData {
  trustName: string;
  questionnaireName: string | null;
  createdAt: string;
  submissionStatus: "in_progress" | "submitted";
  sectionReviews: string[];
  questions: Question[];
}

export default function InstanceReviewPage() {
  const params = useParams();
  const trustLinkId = params.trustLinkId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingQuestionSelection, setPendingQuestionSelection] = useState<EditableQuestion | null>(null);
  const [demoMode, setDemoMode] = useState<"panel" | "modal" | "logic">("panel");
  const [viewStyle, setViewStyle] = useState<ViewStyle>("default");

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "suggestions" | "change-requests" | "casod-report">("main");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [quickActions, setQuickActions] = useState<Record<number, QuickActionType>>({});
  const [rightPanelMode, setRightPanelMode] = useState<"suggestions" | "edit">("edit");
  const [newQuestionSuggestions, setNewQuestionSuggestions] = useState<
    Array<{ id: number; anchorQuestionId: number; position: "before" | "after"; questionText: string; submitterName: string }>
  >([]);
  const [addNewQuestionDialog, setAddNewQuestionDialog] = useState<{
    anchor: EditableQuestion;
    position: "before" | "after";
  } | null>(null);

  // Draft workflow state
  const [sectionReviews, setSectionReviews] = useState<Set<string>>(new Set());
  const [submissionStatus, setSubmissionStatus] = useState<"in_progress" | "submitted">("in_progress");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Track question IDs whose quick actions were deleted locally — prevents fetchInstance from restoring stale cached data
  const deletedQuickActionIds = useRef(new Set<number>());

  // Load reviewer name from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("qa-reviewer-name");
    if (stored) setReviewerName(stored);
  }, []);

  // Convert questions to EditableQuestion format
  const editableQuestions: EditableQuestion[] = useMemo(() => {
    return (instance?.questions || []).map((q) => ({
      ...q,
      required: false, // Default, could be fetched from DB if stored
    }));
  }, [instance?.questions]);

  // Edit panel state
  const editPanelState = useEditPanelState(editableQuestions);

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

  const fetchInstance = async () => {
    try {
      const response = await fetch(`/api/instance/${trustLinkId}`, { cache: "no-store" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to load questionnaire");
      }
      const data = await response.json();
      setInstance(data);

      // Sync submission status and section reviews
      if (data.submissionStatus) setSubmissionStatus(data.submissionStatus);
      if (data.sectionReviews) setSectionReviews(new Set(data.sectionReviews));

      // Sync quick actions from DB
      const freshQuickActions: Record<number, QuickActionType> = {};
      for (const q of data.questions || []) {
        if (q.quickAction && !deletedQuickActionIds.current.has(q.id)) {
          freshQuickActions[q.id] = q.quickAction;
        }
        // If the API no longer reports a quick action, clear the local deletion tracking
        if (!q.quickAction && deletedQuickActionIds.current.has(q.id)) {
          deletedQuickActionIds.current.delete(q.id);
        }
      }
      setQuickActions(freshQuickActions);

      // Store new-question suggestions for phantom card rendering
      setNewQuestionSuggestions(data.newQuestionSuggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questionnaire");
      toast.error("Failed to load questionnaire");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trustLinkId) {
      fetchInstance();
    }
  }, [trustLinkId]);

  // Fetch suggestions lazily when suggestions tab is first opened
  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`/api/instance/${trustLinkId}/suggestions`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [trustLinkId]);

  useEffect(() => {
    if ((activeTab === "suggestions" || activeTab === "change-requests" || activeTab === "casod-report") && suggestions === null && !suggestionsLoading) {
      fetchSuggestions();
    }
  }, [activeTab, suggestions, suggestionsLoading, fetchSuggestions]);

  // Filter suggestions by selected section
  const displaySuggestions = useMemo(() => {
    if (!suggestions) return [];
    if (!selectedSection) return suggestions;
    return suggestions.filter(
      (s) => (s.question?.section || "General") === selectedSection
    );
  }, [suggestions, selectedSection]);

  // Build characteristic map for EnableWhen translation
  const characteristicMap = useMemo(() => {
    if (!instance?.questions) return new Map();
    return buildCharacteristicMap(instance.questions);
  }, [instance?.questions]);

  // Build translated EnableWhen conditions for each question
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

  // Merge phantom (new question) suggestions into the question list at correct positions
  const mergedQuestions: QuestionListItem[] = useMemo(() => {
    if (newQuestionSuggestions.length === 0) return sectionQuestions;

    const result: QuestionListItem[] = [];
    for (const q of sectionQuestions) {
      // Insert "before" phantoms
      const beforeItems = newQuestionSuggestions.filter(
        (s) => s.anchorQuestionId === q.id && s.position === "before"
      );
      for (const phantom of beforeItems) {
        result.push({
          id: -phantom.id, // negative to avoid collision with real IDs
          questionId: `NEW-${phantom.id}`,
          category: q.category,
          questionText: phantom.questionText,
          answerType: null,
          answerOptions: null,
          characteristic: null,
          section: q.section,
          page: q.page,
          enableWhen: null,
          hasHelper: null,
          helperType: null,
          helperName: null,
          helperValue: null,
          suggestionCount: 0,
          required: false,
          isPhantom: true,
          phantomSuggestionId: phantom.id,
          anchorQuestionId: q.id,
          phantomPosition: "before",
          submitterName: phantom.submitterName,
        } satisfies PhantomQuestion);
      }

      result.push(q);

      // Insert "after" phantoms
      const afterItems = newQuestionSuggestions.filter(
        (s) => s.anchorQuestionId === q.id && s.position === "after"
      );
      for (const phantom of afterItems) {
        result.push({
          id: -phantom.id,
          questionId: `NEW-${phantom.id}`,
          category: q.category,
          questionText: phantom.questionText,
          answerType: null,
          answerOptions: null,
          characteristic: null,
          section: q.section,
          page: q.page,
          enableWhen: null,
          hasHelper: null,
          helperType: null,
          helperName: null,
          helperValue: null,
          suggestionCount: 0,
          required: false,
          isPhantom: true,
          phantomSuggestionId: phantom.id,
          anchorQuestionId: q.id,
          phantomPosition: "after",
          submitterName: phantom.submitterName,
        } satisfies PhantomQuestion);
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

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle question selection
  const handleSelectQuestion = useCallback(
    (question: EditableQuestion) => {
      // If a phantom card is clicked, select its anchor question instead
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
        // Show unsaved changes warning
        setPendingQuestionSelection(question);
        setUnsavedDialogOpen(true);
        return;
      }

      // Show suggestions panel first if question has suggestions, otherwise go to edit
      setRightPanelMode(question.suggestionCount > 0 ? "suggestions" : "edit");
    },
    [editPanelState, editableQuestions]
  );

  // Handle discard changes and select pending question
  const handleDiscardAndSelect = useCallback(() => {
    editPanelState.clearChanges();
    if (pendingQuestionSelection) {
      editPanelState.selectQuestion(pendingQuestionSelection);
      setRightPanelMode(pendingQuestionSelection.suggestionCount > 0 ? "suggestions" : "edit");
    }
    setUnsavedDialogOpen(false);
    setPendingQuestionSelection(null);
  }, [editPanelState, pendingQuestionSelection]);

  // Handle submission
  const handleSubmit = async () => {
    const data = editPanelState.getSubmissionData();
    if (!data) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/instance/${trustLinkId}/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit suggestion");
      }

      toast.success("Draft saved");
      editPanelState.clearChanges();

      // Switch back to suggestions view and refresh data
      setRightPanelMode("suggestions");
      fetchInstance();
      setSuggestions(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit suggestion"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewerNameSubmit = useCallback((name: string) => {
    setReviewerName(name);
    localStorage.setItem("qa-reviewer-name", name);
    setNameDialogOpen(false);
  }, []);

  // Mark a section as reviewed
  const handleMarkSectionReviewed = useCallback(async (sectionName: string, hasSuggestions: boolean) => {
    if (!reviewerName) {
      setNameDialogOpen(true);
      return;
    }
    try {
      const res = await fetch(`/api/instance/${trustLinkId}/section-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionName, reviewerName, hasSuggestions }),
      });
      if (!res.ok) throw new Error();
      setSectionReviews((prev) => new Set([...prev, sectionName]));
      toast.success(`Section "${sectionName}" marked as reviewed`);
    } catch {
      toast.error("Failed to save section review");
    }
  }, [trustLinkId, reviewerName]);

  // Un-review a section
  const handleUnreviewSection = useCallback(async (sectionName: string) => {
    try {
      const res = await fetch(
        `/api/instance/${trustLinkId}/section-reviews?sectionName=${encodeURIComponent(sectionName)}&reviewerName=${encodeURIComponent(reviewerName)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setSectionReviews((prev) => {
        const next = new Set(prev);
        next.delete(sectionName);
        return next;
      });
      toast.success(`Section "${sectionName}" unmarked`);
    } catch {
      toast.error("Failed to remove section review");
    }
  }, [trustLinkId, reviewerName]);

  // Submit all drafts
  const handleSubmitReview = useCallback(async () => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/instance/${trustLinkId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit review");
      }
      setSubmissionStatus("submitted");
      setShowSubmitDialog(false);
      toast.success("Review submitted successfully!");
      fetchInstance();
      setSuggestions(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [trustLinkId]);

  const handleQuickAction = useCallback((questionId: number, action: QuickActionType) => {
    deletedQuickActionIds.current.delete(questionId);
    setQuickActions((prev) => ({ ...prev, [questionId]: action }));
    fetchInstance();
    setSuggestions(null);
  }, []);

  // When a suggestion is deleted from the right panel, clear its quick action
  const handleSuggestionDeleted = useCallback((suggestionId: number, suggestionText: string) => {
    const quickActionTexts: Record<string, QuickActionType> = {
      "Make this question required": "required",
      "Remove this question from the questionnaire": "delete",
    };
    const actionType = quickActionTexts[suggestionText];
    if (actionType && editPanelState.state.selectedQuestionId) {
      const qId = editPanelState.state.selectedQuestionId;
      // Mark as locally deleted so fetchInstance won't restore it
      deletedQuickActionIds.current.add(qId);
      setQuickActions((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
    fetchInstance();
    setSuggestions(null);
  }, [editPanelState.state.selectedQuestionId]);

  // Get selected question index (relative to section-filtered list)
  const selectedQuestionIndex = useMemo(() => {
    if (!editPanelState.selectedQuestion) return 0;
    return sectionQuestions.findIndex((q) => q.id === editPanelState.selectedQuestion?.id);
  }, [sectionQuestions, editPanelState.selectedQuestion]);

  // Memoize validation errors to avoid calling validate() multiple times per render
  const validationErrors = useMemo(() => editPanelState.validate(), [editPanelState.validate]);

  // Compute progress stats
  const suggestedQuestionIds = useMemo(() => {
    if (!instance?.questions) return new Set<number>();
    return new Set(
      instance.questions
        .filter((q) => q.suggestionCount > 0)
        .map((q) => q.id)
    );
  }, [instance?.questions]);

  const totalQuestionCount = instance?.questions.length ?? 0;
  const suggestedCount = suggestedQuestionIds.size;
  const progressPercent = totalQuestionCount > 0 ? Math.round((suggestedCount / totalQuestionCount) * 100) : 0;

  // Compute all unique section names and whether all are reviewed
  const allSectionNames = useMemo(() => {
    if (!instance?.questions) return new Set<string>();
    return new Set(instance.questions.map((q) => q.section || "General"));
  }, [instance?.questions]);

  const allSectionsReviewed = allSectionNames.size > 0 && [...allSectionNames].every((s) => sectionReviews.has(s));

  // Check if current section has suggestions (for mark-as-reviewed UX)
  const currentSectionHasSuggestions = useMemo(() => {
    if (!selectedSection) return false;
    return editableQuestions
      .filter((q) => (q.section || "General") === selectedSection)
      .some((q) => q.suggestionCount > 0);
  }, [selectedSection, editableQuestions]);

  // Section-specific progress
  const sectionProgress = useMemo(() => {
    if (!selectedSection) return { total: totalQuestionCount, suggested: suggestedCount, percent: progressPercent };
    const sectionQs = editableQuestions.filter((q) => (q.section || "General") === selectedSection);
    const sectionSuggested = sectionQs.filter((q) => suggestedQuestionIds.has(q.id)).length;
    const percent = sectionQs.length > 0 ? Math.round((sectionSuggested / sectionQs.length) * 100) : 0;
    return { total: sectionQs.length, suggested: sectionSuggested, percent };
  }, [selectedSection, editableQuestions, suggestedQuestionIds, totalQuestionCount, suggestedCount, progressPercent]);

  // Loading state — skeleton cards
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Skeleton header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-[1800px] mx-auto">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Skeleton cards */}
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

  // Error state
  if (error || !instance) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h1 className="text-xl font-bold mb-2">Unable to Load Questionnaire</h1>
          <p className="text-slate-500">
            {error ||
              "The link may be invalid or expired. Please contact your account manager."}
          </p>
        </div>
      </div>
    );
  }

  const translatedEnableWhen = editPanelState.selectedQuestion
    ? translatedEnableWhens.get(editPanelState.selectedQuestion.id) || null
    : null;

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden">
      {/* Progress Bar */}
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
              <span className="text-slate-400"> in this section</span>
            )}
          </span>
        </div>
      </div>

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
            {selectedSection && activeTab === "main" && submissionStatus === "in_progress" && (
              <div className="flex items-center gap-3">
                {/* Section review toggle */}
                {sectionReviews.has(selectedSection) ? (
                  <button
                    onClick={() => handleUnreviewSection(selectedSection)}
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
                      onClick={() => handleMarkSectionReviewed(selectedSection, currentSectionHasSuggestions)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#4A90A4] text-white hover:bg-[#3d7a8c] transition-colors"
                    >
                      {currentSectionHasSuggestions ? "Mark as Reviewed" : "No Changes Needed"}
                    </button>
                  </div>
                )}
                <Badge variant="outline" className="border-[#4A90A4] text-[#4A90A4]">
                  Review Mode
                </Badge>
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  {(["panel", "modal", "logic"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDemoMode(mode)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                        demoMode === mode
                          ? "bg-white text-[#4A90A4] shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {mode === "panel" ? "Panel" : mode === "modal" ? "Modal" : "Logic"}
                    </button>
                  ))}
                </div>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("main")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "main"
                  ? "border-[#4A90A4] text-[#4A90A4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {selectedSection ? "Review" : "Sections"}
            </button>
            <button
              onClick={() => setActiveTab("suggestions")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "suggestions"
                  ? "border-[#4A90A4] text-[#4A90A4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Suggestions
              {displaySuggestions.length > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  activeTab === "suggestions"
                    ? "bg-[#4A90A4]/10 text-[#4A90A4]"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {displaySuggestions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("change-requests")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "change-requests"
                  ? "border-[#4A90A4] text-[#4A90A4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Change Requests
              {displaySuggestions.length > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  activeTab === "change-requests"
                    ? "bg-[#4A90A4]/10 text-[#4A90A4]"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {displaySuggestions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("casod-report")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "casod-report"
                  ? "border-[#4A90A4] text-[#4A90A4]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              CASOD Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters — only show when inside a section on review tab */}
      {selectedSection && activeTab === "main" && (
        <div className="bg-white border-b border-slate-200 flex-shrink-0">
          <div className="max-w-[1800px] mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Category Filter */}
              <div className="sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter summary */}
            {(searchTerm || categoryFilter !== "all") && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-slate-500">
                  Showing filtered results
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                  }}
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
          /* CASOD Report Tab */
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
          /* Change Requests Table Tab */
          <div className="h-full overflow-y-auto">
            <ChangeRequestsTableView
              suggestions={displaySuggestions}
              loading={suggestionsLoading}
              translatedEnableWhens={translatedEnableWhens}
            />
          </div>
        ) : activeTab === "suggestions" ? (
          /* Suggestions Tab */
          <div className="h-full overflow-y-auto">
            <SuggestionsListView
              suggestions={displaySuggestions}
              loading={suggestionsLoading}
              trustLinkId={trustLinkId}
              onRefresh={() => setSuggestions(null)}
            />
          </div>
        ) : !selectedSection ? (
          /* Section Cards Overview */
          <div className="h-full overflow-y-auto">
            <SectionCardsView
              questions={editableQuestions}
              onSelectSection={setSelectedSection}
              sectionReviews={sectionReviews}
              submissionStatus={submissionStatus}
            />

            {/* Submit Review Button — shown on section cards view */}
            {submissionStatus === "in_progress" && (
              <div className="max-w-5xl mx-auto px-4 pb-8">
                <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {allSectionsReviewed
                          ? "All sections reviewed! Ready to submit."
                          : `${sectionReviews.size} of ${allSectionNames.size} sections reviewed`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {allSectionsReviewed
                          ? "Your suggestions will be sent to the account manager."
                          : "Complete all sections to submit your review."}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSubmitDialog(true)}
                      disabled={!allSectionsReviewed}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        allSectionsReviewed
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : demoMode === "panel" ? (
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
                quickActions={submissionStatus === "submitted" ? {} : quickActions}
                onQuickAction={submissionStatus === "submitted" ? undefined : handleQuickAction}
                onAddSuggestion={submissionStatus === "submitted" ? undefined : (question) => {
                  editPanelState.selectQuestion(question);
                  setRightPanelMode("edit");
                }}
                onAddNewQuestion={submissionStatus === "submitted" ? undefined : (question, position) => {
                  setAddNewQuestionDialog({ anchor: question, position });
                }}
                onReviewerNameRequired={() => setNameDialogOpen(true)}
              />
            }
            rightPanel={
              (submissionStatus === "submitted" || rightPanelMode === "suggestions") && editPanelState.selectedQuestion ? (
                <QuestionSuggestionsPanel
                  question={editPanelState.selectedQuestion}
                  trustLinkId={trustLinkId}
                  onAddSuggestion={submissionStatus === "submitted" ? undefined : () => setRightPanelMode("edit")}
                  onRefresh={() => { fetchInstance(); setSuggestions(null); }}
                  onSuggestionDeleted={submissionStatus === "submitted" ? undefined : handleSuggestionDeleted}
                />
              ) : (
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
                />
              )
            }
          />
        ) : demoMode === "modal" ? (
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
                quickActions={submissionStatus === "submitted" ? {} : quickActions}
                onQuickAction={submissionStatus === "submitted" ? undefined : handleQuickAction}
                onAddSuggestion={submissionStatus === "submitted" ? undefined : (question) => {
                  editPanelState.selectQuestion(question);
                  setRightPanelMode("edit");
                }}
                onAddNewQuestion={submissionStatus === "submitted" ? undefined : (question, position) => {
                  setAddNewQuestionDialog({ anchor: question, position });
                }}
                onReviewerNameRequired={() => setNameDialogOpen(true)}
              />
            }
            rightPanel={
              (submissionStatus === "submitted" || rightPanelMode === "suggestions") && editPanelState.selectedQuestion ? (
                <QuestionSuggestionsPanel
                  question={editPanelState.selectedQuestion}
                  trustLinkId={trustLinkId}
                  onAddSuggestion={submissionStatus === "submitted" ? undefined : () => setRightPanelMode("edit")}
                  onRefresh={() => { fetchInstance(); setSuggestions(null); }}
                  onSuggestionDeleted={submissionStatus === "submitted" ? undefined : handleSuggestionDeleted}
                />
              ) : (
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
                />
              )
            }
          />
        ) : (
          <SplitScreenLayout
            showRightOnMobile={!!editPanelState.state.selectedQuestionId}
            onMobileBack={() => {
              editPanelState.selectQuestion(null);
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
                quickActions={submissionStatus === "submitted" ? {} : quickActions}
                onQuickAction={submissionStatus === "submitted" ? undefined : handleQuickAction}
                onAddSuggestion={submissionStatus === "submitted" ? undefined : (question) => {
                  editPanelState.selectQuestion(question);
                  setRightPanelMode("edit");
                }}
                onAddNewQuestion={submissionStatus === "submitted" ? undefined : (question, position) => {
                  setAddNewQuestionDialog({ anchor: question, position });
                }}
                onReviewerNameRequired={() => setNameDialogOpen(true)}
              />
            }
            rightPanel={
              <LogicFlowView
                questions={sectionQuestions}
                selectedQuestion={editPanelState.selectedQuestion}
                onSelectQuestion={handleSelectQuestion}
                characteristicMap={characteristicMap}
              />
            }
          />
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={unsavedDialogOpen}
        onKeepEditing={() => {
          setUnsavedDialogOpen(false);
          setPendingQuestionSelection(null);
        }}
        onDiscard={handleDiscardAndSelect}
      />

      {/* Add New Question Dialog */}
      <AddNewQuestionDialog
        open={!!addNewQuestionDialog}
        anchorQuestion={addNewQuestionDialog?.anchor ?? null}
        position={addNewQuestionDialog?.position ?? null}
        trustLinkId={trustLinkId}
        reviewerName={reviewerName}
        onClose={() => setAddNewQuestionDialog(null)}
        onSubmitted={() => {
          setAddNewQuestionDialog(null);
          fetchInstance();
          setSuggestions(null);
        }}
      />

      {/* Reviewer Name Dialog (quick actions) */}
      <ReviewerNameDialog
        open={nameDialogOpen}
        onSubmit={handleReviewerNameSubmit}
        onClose={() => setNameDialogOpen(false)}
      />

      {/* Submit Review Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Submit Review</h2>
            <p className="text-sm text-slate-600 mb-4">
              Once submitted, your suggestions will be visible to the account manager and this review will be locked.
            </p>

            {/* Section summary */}
            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {[...allSectionNames].map((name) => {
                const sectionQs = editableQuestions.filter((q) => (q.section || "General") === name);
                const draftCount = sectionQs.filter((q) => q.suggestionCount > 0).length;
                return (
                  <div key={name} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className={`text-xs ${draftCount > 0 ? "text-[#4A90A4]" : "text-slate-400"}`}>
                      {draftCount > 0 ? `${draftCount} draft${draftCount !== 1 ? "s" : ""}` : "No changes"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
