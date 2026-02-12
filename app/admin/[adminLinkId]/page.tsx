"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import SuggestionDetailModal from "@/components/questionnaire/SuggestionDetailModal";
import { ComponentChangesInline } from "@/components/questionnaire/ComponentChangesDisplay";
import type { ComponentChanges } from "@/types/editPanel";

interface Suggestion {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  submitterName: string;
  submitterEmail: string | null;
  suggestionText: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  internalComment: string | null;
  responseMessage: string | null;
  createdAt: string;
  updatedAt: string;
  componentChanges: ComponentChanges | null;
}

interface ProjectData {
  trustName: string;
  createdAt: string;
  suggestions: Suggestion[];
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const statusConfig = {
  pending: {
    label: "Pending",
    className: "badge-warning",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  approved: {
    label: "Approved",
    className: "badge-success",
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  rejected: {
    label: "Rejected",
    className: "badge-error",
    bgColor: "bg-error/10",
    textColor: "text-error",
  },
};

export default function AdminDashboardPage() {
  const params = useParams();
  const adminLinkId = params.adminLinkId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/admin/${adminLinkId}`);
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
    if (adminLinkId) {
      fetchProject();
    }
  }, [adminLinkId]);

  // Filter suggestions
  const filteredSuggestions = project?.suggestions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      s.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.questionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.suggestionText.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Count suggestions by status
  const statusCounts = {
    all: project?.suggestions.length || 0,
    pending: project?.suggestions.filter((s) => s.status === "pending").length || 0,
    approved: project?.suggestions.filter((s) => s.status === "approved").length || 0,
    rejected: project?.suggestions.filter((s) => s.status === "rejected").length || 0,
  };

  const handleViewDetails = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading dashboard...</p>
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
          <h1 className="text-xl font-bold mb-2">Unable to Load Dashboard</h1>
          <p className="text-base-content/60">
            {error ||
              "The admin link may be invalid or expired."}
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
                {statusCounts.all} total suggestions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-secondary badge-outline">
                Admin Dashboard
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-box p-4 border border-base-300">
            <p className="text-sm text-base-content/60">Total</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </div>
          <div className="bg-base-100 rounded-box p-4 border border-base-300">
            <p className="text-sm text-warning">Pending</p>
            <p className="text-2xl font-bold text-warning">{statusCounts.pending}</p>
          </div>
          <div className="bg-base-100 rounded-box p-4 border border-base-300">
            <p className="text-sm text-success">Approved</p>
            <p className="text-2xl font-bold text-success">{statusCounts.approved}</p>
          </div>
          <div className="bg-base-100 rounded-box p-4 border border-base-300">
            <p className="text-sm text-error">Rejected</p>
            <p className="text-2xl font-bold text-error">{statusCounts.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-4">
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
              placeholder="Search suggestions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full pl-10"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${
                statusFilter === status
                  ? status === "all"
                    ? "btn-primary"
                    : status === "pending"
                    ? "btn-warning"
                    : status === "approved"
                    ? "btn-success"
                    : "btn-error"
                  : "btn-ghost"
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="badge badge-sm ml-1">
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {filteredSuggestions && filteredSuggestions.length > 0 ? (
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-base-100 rounded-box border border-base-300 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(suggestion)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Question Info */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge badge-neutral badge-sm font-mono">
                        {suggestion.questionId}
                      </span>
                      <span className="badge badge-ghost badge-sm">
                        {suggestion.category}
                      </span>
                      <span
                        className={`badge badge-sm ${
                          statusConfig[suggestion.status].className
                        }`}
                      >
                        {statusConfig[suggestion.status].label}
                      </span>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm text-base-content/70 mb-2">
                      {truncateText(suggestion.questionText, 100)}
                    </p>

                    {/* Suggestion Preview */}
                    {suggestion.componentChanges &&
                    Object.keys(suggestion.componentChanges).length > 0 ? (
                      <div className="mb-2">
                        <ComponentChangesInline
                          componentChanges={suggestion.componentChanges}
                          fallbackText={suggestion.suggestionText}
                        />
                      </div>
                    ) : (
                      <p className="text-base-content mb-2">
                        {truncateText(suggestion.suggestionText, 150)}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-sm text-base-content/50">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {suggestion.submitterName}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(suggestion.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-base-content/40"
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-base-content/60">
              {searchTerm || statusFilter !== "all"
                ? "No suggestions match your filters"
                : "No suggestions yet"}
            </p>
            {statusFilter !== "all" && (
              <button
                className="btn btn-ghost btn-sm mt-2"
                onClick={() => setStatusFilter("all")}
              >
                View all suggestions
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <SuggestionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        suggestion={selectedSuggestion}
        onUpdate={fetchProject}
      />
    </div>
  );
}
