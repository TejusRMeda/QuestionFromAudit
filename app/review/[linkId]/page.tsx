"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

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

  useEffect(() => {
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
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
            {error || "The link may be invalid or expired. Please contact your account manager."}
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
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full"
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
      </div>

      {/* Questions Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {filteredQuestions && filteredQuestions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-5 hover:shadow-md transition-shadow"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-neutral badge-sm font-mono">
                      {question.questionId}
                    </span>
                    <span className="badge badge-ghost badge-sm">
                      {question.category}
                    </span>
                  </div>
                  {question.suggestionCount > 0 && (
                    <span className="badge badge-info badge-sm">
                      {question.suggestionCount} suggestion
                      {question.suggestionCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-base-content mb-3">{question.questionText}</p>

                {/* Answer Options */}
                {question.answerOptions && (
                  <div className="mb-4 p-3 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-base-content/70 uppercase">
                        {question.answerType === "radio"
                          ? "Single choice"
                          : question.answerType === "multi_select"
                          ? "Multiple choice"
                          : question.answerType === "text"
                          ? "Free text"
                          : question.answerType || "Options"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {question.answerOptions.split("|").map((option, idx) => (
                        <span
                          key={idx}
                          className="badge badge-outline badge-sm"
                        >
                          {option.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button className="btn btn-ghost btn-sm text-base-content/60">
                    View Suggestions
                  </button>
                  <button className="btn btn-primary btn-sm">
                    Suggest Change
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-base-content/60">
              {searchTerm || categoryFilter !== "all"
                ? "No questions match your filters"
                : "No questions found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
