"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import SuggestionModal from "@/components/questionnaire/SuggestionModal";
import ViewSuggestionsModal from "@/components/questionnaire/ViewSuggestionsModal";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
  suggestionCount: number;
}

interface ProjectData {
  trustName: string;
  createdAt: string;
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

  // Modal states
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [viewSuggestionsModalOpen, setViewSuggestionsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string | string[]>>({});

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

  // Get unique categories
  const categories = project
    ? [...new Set(project.questions.map((q) => q.category))]
    : [];

  // Filter questions
  const filteredQuestions = project?.questions.filter((q) => {
    const matchesSearch =
      searchTerm === "" ||
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.questionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSuggestChange = (question: Question) => {
    setSelectedQuestion(question);
    setSuggestionModalOpen(true);
  };

  const handleViewSuggestions = (question: Question) => {
    setSelectedQuestion(question);
    setViewSuggestionsModalOpen(true);
  };

  const handleSuggestionSuccess = () => {
    // Refresh the project to update suggestion counts
    fetchProject();
  };

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const renderAnswerInputs = (question: Question) => {
    const answerType = question.answerType?.toLowerCase();
    const currentAnswer = questionAnswers[question.id];

    if (answerType === "text") {
      return (
        <div className="form-control">
          <input
            type="text"
            placeholder="Enter your answer..."
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
      );
    }

    if (answerType === "radio" && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      return (
        <div className="flex flex-col gap-1">
          {options.map((option, idx) => (
            <label key={idx} className="label cursor-pointer justify-start gap-3 py-2">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={currentAnswer === option}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="radio radio-primary"
              />
              <span className="label-text">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (answerType === "multi_select" && question.answerOptions) {
      const options = question.answerOptions.split("|").map((o) => o.trim()).filter(Boolean);
      const selectedValues = Array.isArray(currentAnswer) ? currentAnswer : [];

      return (
        <div className="flex flex-col gap-1">
          {options.map((option, idx) => (
            <label key={idx} className="label cursor-pointer justify-start gap-3 py-2">
              <input
                type="checkbox"
                value={option}
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  const newValues = e.target.checked
                    ? [...selectedValues, option]
                    : selectedValues.filter((v) => v !== option);
                  handleAnswerChange(question.id, newValues);
                }}
                className="checkbox checkbox-primary"
              />
              <span className="label-text">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    // Fallback: show options as badges if type is not recognized
    if (question.answerOptions) {
      return (
        <div className="flex flex-col gap-2">
          {question.answerOptions.split("|").map((option, idx) => (
            <span key={idx} className="badge badge-outline badge-sm">
              {option.trim()}
            </span>
          ))}
        </div>
      );
    }

    return null;
  };

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

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{project.trustName}</h1>
              <p className="text-sm text-base-content/60">
                {project.questions.length} questions
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

      {/* Filters */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
              className="input input-bordered w-full pl-10"
            />
          </div>
          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select select-bordered w-full"
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
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-base-content/60">
              Showing {filteredQuestions?.length || 0} of {project.questions.length} questions
            </span>
            {(searchTerm || categoryFilter !== "all") && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        {filteredQuestions && filteredQuestions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-base-100 rounded-box border border-base-300 p-5 hover:shadow-md transition-shadow"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-neutral badge-sm font-mono">
                      {question.questionId}
                    </span>
                    <span className="badge badge-ghost badge-sm">
                      {question.category}
                    </span>
                  </div>
                  {question.suggestionCount > 0 && (
                    <span className="badge badge-info badge-sm whitespace-nowrap">
                      {question.suggestionCount} suggestion
                      {question.suggestionCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-base-content mb-3">{question.questionText}</p>

                {/* Answer Inputs */}
                {(question.answerType || question.answerOptions) && (
                  <div className="mb-4 p-3 bg-base-200 rounded-box">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-base-content/70 uppercase">
                        {question.answerType?.toLowerCase() === "radio"
                          ? "Single choice"
                          : question.answerType?.toLowerCase() === "multi_select"
                          ? "Multiple choice"
                          : question.answerType?.toLowerCase() === "text"
                          ? "Free text"
                          : question.answerType || "Options"}
                      </span>
                    </div>
                    {renderAnswerInputs(question)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-base-200">
                  <button
                    className="btn btn-ghost btn-sm text-base-content/60"
                    onClick={() => handleViewSuggestions(question)}
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    View Suggestions
                  </button>
                  <button
                    className="btn btn-outline btn-primary btn-sm"
                    onClick={() => handleSuggestChange(question)}
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Suggest Change
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-base-content/60">
              {searchTerm || categoryFilter !== "all"
                ? "No questions match your filters"
                : "No questions found"}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <SuggestionModal
        isOpen={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
        question={selectedQuestion}
        onSuccess={handleSuggestionSuccess}
      />

      <ViewSuggestionsModal
        isOpen={viewSuggestionsModalOpen}
        onClose={() => setViewSuggestionsModalOpen(false)}
        question={selectedQuestion}
        onSuggestChange={() => {
          setViewSuggestionsModalOpen(false);
          setSuggestionModalOpen(true);
        }}
      />
    </div>
  );
}
