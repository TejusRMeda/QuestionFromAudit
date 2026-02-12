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

interface ProjectData {
  trustName: string;
  createdAt: string;
  questions: Question[];
}

interface Section {
  name: string;
  questions: Question[];
}

export default function ReviewPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingQuestionSelection, setPendingQuestionSelection] = useState<EditableQuestion | null>(null);

  // Group questions by section, preserving order of first appearance
  const sections = useMemo<Section[]>(() => {
    if (!project?.questions) return [];
    const sectionMap = new Map<string, Question[]>();
    const sectionOrder: string[] = [];

    for (const question of project.questions) {
      const sectionName = question.section?.trim() || "General";
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
        sectionOrder.push(sectionName);
      }
      sectionMap.get(sectionName)!.push(question);
    }

    return sectionOrder.map((name) => ({
      name,
      questions: sectionMap.get(name)!,
    }));
  }, [project?.questions]);

  // Get the current section's questions (or all if no section selected)
  const currentSectionQuestions = useMemo(() => {
    if (!selectedSection) return project?.questions || [];
    const section = sections.find((s) => s.name === selectedSection);
    return section?.questions || [];
  }, [selectedSection, sections, project?.questions]);

  // Convert questions to EditableQuestion format
  const editableQuestions: EditableQuestion[] = useMemo(() => {
    return currentSectionQuestions.map((q) => ({
      ...q,
      required: false,
    }));
  }, [currentSectionQuestions]);

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

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/review/${linkId}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to load project");
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (linkId) {
      fetchProject();
    }
  }, [linkId]);

  // Build characteristic map for EnableWhen translation
  const characteristicMap = useMemo(() => {
    if (!project?.questions) return new Map();
    return buildCharacteristicMap(project.questions);
  }, [project?.questions]);

  // Build translated EnableWhen conditions for each question
  const translatedEnableWhens = useMemo(() => {
    const map = new Map<number, TranslatedEnableWhen>();
    if (!project?.questions) return map;

    for (const q of project.questions) {
      if (q.enableWhen) {
        map.set(q.id, translateEnableWhen(q.enableWhen, characteristicMap));
      }
    }
    return map;
  }, [project?.questions, characteristicMap]);

  // Get unique categories (scoped to current section when a section is selected)
  const categories = useMemo(() => {
    return [...new Set(currentSectionQuestions.map((q) => q.category))];
  }, [currentSectionQuestions]);

  // Navigation handlers
  const handleSelectSection = (sectionName: string) => {
    // Check for unsaved changes before switching sections
    if (editPanelState.hasChanges()) {
      setUnsavedDialogOpen(true);
      return;
    }
    setSelectedSection(sectionName);
    setSearchTerm("");
    setCategoryFilter("all");
    editPanelState.reset();
  };

  const handleBackToSections = () => {
    // Check for unsaved changes before going back
    if (editPanelState.hasChanges()) {
      setUnsavedDialogOpen(true);
      return;
    }
    setSelectedSection(null);
    setSearchTerm("");
    setCategoryFilter("all");
    editPanelState.reset();
  };

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
        setPendingQuestionSelection(question);
        setUnsavedDialogOpen(true);
        return;
      }

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

  // Handle submission - uses the suggestions API route
  const handleSubmit = async () => {
    const data = editPanelState.getSubmissionData();
    if (!data) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: data.instanceQuestionId,
          submitterName: data.submitterName,
          submitterEmail: data.submitterEmail,
          suggestionText: data.suggestionText,
          reason: data.reason,
          componentChanges: data.componentChanges,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit suggestion");
      }

      toast.success("Suggestion submitted successfully!");
      editPanelState.clearChanges();
      setMobileModalOpen(false);

      // Refresh to get updated suggestion counts
      fetchProject();
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
  if (error || !project) {
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
          <h1 className="text-xl font-bold mb-2">Unable to Load Project</h1>
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

  // Sections Overview (when no section selected)
  if (!selectedSection) {
    return (
      <div className="min-h-screen bg-base-200">
        {/* Header */}
        <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold" data-testid="review-title">
                  Review Questionnaires
                </h1>
                <p className="text-sm text-base-content/60">
                  {project.trustName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-primary badge-outline">
                  Review Mode
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section) => {
              const suggestionCount = section.questions.reduce(
                (sum, q) => sum + q.suggestionCount,
                0
              );
              return (
                <button
                  key={section.name}
                  onClick={() => handleSelectSection(section.name)}
                  className="bg-base-100 rounded-box border border-base-300 p-5 text-left hover:shadow-md hover:border-primary/30 transition-all group"
                  data-testid="section-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base-content truncate">
                        {section.name}
                      </h3>
                      <p className="text-sm text-base-content/60 mt-1">
                        {section.questions.length} question
                        {section.questions.length !== 1 ? "s" : ""}
                      </p>
                      {suggestionCount > 0 && (
                        <span className="badge badge-info badge-sm mt-2">
                          {suggestionCount} suggestion
                          {suggestionCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5"
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
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Section Questions View with Split-Screen Layout
  return (
    <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToSections}
                className="btn btn-ghost btn-sm btn-circle -ml-2"
                data-testid="back-button"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold" data-testid="review-title">
                  {selectedSection}
                </h1>
                <p className="text-sm text-base-content/60">
                  {currentSectionQuestions.length} question
                  {currentSectionQuestions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-primary badge-outline">
                Review Mode
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

      {/* Main Content - Split Screen */}
      <div className="flex-1 overflow-hidden">
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
    </div>
  );
}
