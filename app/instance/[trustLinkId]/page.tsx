"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  buildCharacteristicMap,
  translateEnableWhen,
  TranslatedEnableWhen,
} from "@/lib/enableWhen";
import { EnableWhen } from "@/types/question";
import { EditableQuestion } from "@/types/editPanel";
import { useEditPanelState } from "@/hooks/useEditPanelState";
import SplitScreenLayout from "@/components/questionnaire/panel/SplitScreenLayout";
import QuestionsList from "@/components/questionnaire/panel/QuestionsList";
import EditPanel from "@/components/questionnaire/panel/EditPanel";
import MobileEditModal from "@/components/questionnaire/panel/MobileEditModal";
import UnsavedChangesDialog from "@/components/questionnaire/panel/UnsavedChangesDialog";
import InstanceSuggestionModal from "@/components/questionnaire/InstanceSuggestionModal";

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
}

interface InstanceData {
  trustName: string;
  createdAt: string;
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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingQuestionSelection, setPendingQuestionSelection] = useState<EditableQuestion | null>(null);
  const [demoMode, setDemoMode] = useState<"panel" | "modal">("panel");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuestion, setModalQuestion] = useState<EditableQuestion | null>(null);

  // Convert questions to EditableQuestion format
  const editableQuestions: EditableQuestion[] = useMemo(() => {
    return (instance?.questions || []).map((q) => ({
      ...q,
      required: false, // Default, could be fetched from DB if stored
    }));
  }, [instance?.questions]);

  // Edit panel state
  const editPanelState = useEditPanelState(editableQuestions);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  const fetchInstance = async () => {
    try {
      const response = await fetch(`/api/instance/${trustLinkId}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to load questionnaire");
      }
      const data = await response.json();
      setInstance(data);
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

  // Get unique categories
  const categories = instance
    ? [...new Set(instance.questions.map((q) => q.category))]
    : [];

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle question selection
  const handleSelectQuestion = useCallback(
    (question: EditableQuestion) => {
      const canSelect = editPanelState.selectQuestion(question);
      if (!canSelect) {
        // Show unsaved changes warning
        setPendingQuestionSelection(question);
        setUnsavedDialogOpen(true);
        return;
      }

      // On mobile, open the modal
      if (isMobile) {
        setMobileModalOpen(true);
      }
    },
    [editPanelState, isMobile]
  );

  // Handle discard changes and select pending question
  const handleDiscardAndSelect = useCallback(() => {
    editPanelState.clearChanges();
    if (pendingQuestionSelection) {
      editPanelState.selectQuestion(pendingQuestionSelection);
      if (isMobile) {
        setMobileModalOpen(true);
      }
    }
    setUnsavedDialogOpen(false);
    setPendingQuestionSelection(null);
  }, [editPanelState, pendingQuestionSelection, isMobile]);

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

      toast.success("Suggestion submitted successfully!");
      editPanelState.clearChanges();
      setMobileModalOpen(false);

      // Refresh to get updated suggestion counts
      fetchInstance();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit suggestion"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected question index
  const selectedQuestionIndex = useMemo(() => {
    if (!editPanelState.selectedQuestion) return 0;
    return editableQuestions.findIndex((q) => q.id === editPanelState.selectedQuestion?.id);
  }, [editableQuestions, editPanelState.selectedQuestion]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !instance) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-error"
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
          <p className="text-base-content/60">
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
    <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{instance.trustName}</h1>
              <p className="text-sm text-base-content/60">
                {instance.questions.length} questions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="badge badge-primary badge-outline">
                Review Mode
              </div>
              <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-1.5">
                <span className={`text-xs font-medium ${demoMode === "panel" ? "text-primary" : "text-base-content/50"}`}>
                  Panel
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={demoMode === "modal"}
                  onChange={(e) => setDemoMode(e.target.checked ? "modal" : "panel")}
                />
                <span className={`text-xs font-medium ${demoMode === "modal" ? "text-primary" : "text-base-content/50"}`}>
                  Modal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-100 border-b border-base-300 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40"
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
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10 input-sm"
              />
            </div>
            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select select-bordered w-full select-sm"
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
              <span className="text-sm text-base-content/60">
                Showing filtered results
              </span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {demoMode === "panel" ? (
          <SplitScreenLayout
            leftPanel={
              <QuestionsList
                questions={editableQuestions}
                selectedQuestionId={editPanelState.state.selectedQuestionId}
                onSelectQuestion={handleSelectQuestion}
                searchTerm={searchTerm}
                categoryFilter={categoryFilter}
                translatedEnableWhens={translatedEnableWhens}
                questionAnswers={questionAnswers}
                onAnswerChange={handleAnswerChange}
              />
            }
            rightPanel={
              <EditPanel
                question={editPanelState.selectedQuestion}
                allQuestions={editableQuestions}
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
                validationErrors={editPanelState.validate()}
                translatedEnableWhen={translatedEnableWhen}
                onSelectQuestion={handleSelectQuestion}
                questionIndex={selectedQuestionIndex}
                totalQuestions={editableQuestions.length}
              />
            }
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <QuestionsList
                questions={editableQuestions}
                selectedQuestionId={null}
                onSelectQuestion={() => {}}
                searchTerm={searchTerm}
                categoryFilter={categoryFilter}
                translatedEnableWhens={translatedEnableWhens}
                questionAnswers={questionAnswers}
                onAnswerChange={handleAnswerChange}
                onAddSuggestion={(question) => {
                  setModalQuestion(question);
                  setModalOpen(true);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Edit Modal */}
      <MobileEditModal
        isOpen={mobileModalOpen && isMobile}
        onClose={() => setMobileModalOpen(false)}
        question={editPanelState.selectedQuestion}
        allQuestions={editableQuestions}
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
        validationErrors={editPanelState.validate()}
        translatedEnableWhen={translatedEnableWhen}
        onSelectQuestion={handleSelectQuestion}
        questionIndex={selectedQuestionIndex}
        totalQuestions={editableQuestions.length}
        hasUnsavedChanges={editPanelState.hasChanges()}
        onDiscardChanges={editPanelState.clearChanges}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={unsavedDialogOpen}
        onKeepEditing={() => {
          setUnsavedDialogOpen(false);
          setPendingQuestionSelection(null);
        }}
        onDiscard={handleDiscardAndSelect}
      />

      {/* Legacy Suggestion Modal (modal mode) */}
      <InstanceSuggestionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalQuestion(null);
        }}
        question={modalQuestion}
        trustLinkId={trustLinkId}
        onSuccess={() => fetchInstance()}
      />
    </div>
  );
}
