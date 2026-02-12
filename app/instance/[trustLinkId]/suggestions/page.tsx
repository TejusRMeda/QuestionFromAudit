"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import SuggestionThreadModal from "@/components/questionnaire/SuggestionThreadModal";
import ComponentChangesDisplay from "@/components/questionnaire/ComponentChangesDisplay";
import { ComponentChanges } from "@/types/editPanel";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
}

interface Suggestion {
  id: number;
  submitterName: string;
  submitterEmail: string | null;
  suggestionText: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  responseMessage: string | null;
  createdAt: string;
  commentCount: number;
  componentChanges: ComponentChanges | null;
  question: Question | null;
}

interface SuggestionsData {
  trustName: string;
  createdAt: string;
  suggestions: Suggestion[];
  totalCount: number;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "badge-warning",
    bgColor: "bg-warning/10",
  },
  approved: {
    label: "Approved",
    className: "badge-success",
    bgColor: "bg-success/10",
  },
  rejected: {
    label: "Rejected",
    className: "badge-error",
    bgColor: "bg-error/10",
  },
};

export default function InstanceSuggestionsPage() {
  const params = useParams();
  const trustLinkId = params.trustLinkId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete" | "change-status" | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread modal state
  const [threadModalOpen, setThreadModalOpen] = useState(false);
  const [threadSuggestion, setThreadSuggestion] = useState<Suggestion | null>(null);

  const openThreadModal = (suggestion: Suggestion) => {
    setThreadSuggestion(suggestion);
    setThreadModalOpen(true);
  };

  const closeThreadModal = () => {
    setThreadModalOpen(false);
    setThreadSuggestion(null);
  };

  useEffect(() => {
    if (trustLinkId) {
      fetchSuggestions();
    }
  }, [trustLinkId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/instance/${trustLinkId}/suggestions`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to load suggestions");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (suggestion: Suggestion, action: "approve" | "reject" | "delete" | "change-status") => {
    setSelectedSuggestion(suggestion);
    setActionType(action);
    setResponseMessage(suggestion.responseMessage || "");
    setSelectedStatus(suggestion.status);
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setSelectedSuggestion(null);
    setActionType(null);
    setResponseMessage("");
    setSelectedStatus("pending");
  };

  const handleAction = async () => {
    if (!selectedSuggestion || !actionType) return;

    setIsSubmitting(true);
    try {
      if (actionType === "delete") {
        const response = await fetch(
          `/api/instance/${trustLinkId}/suggestions/${selectedSuggestion.id}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to delete suggestion");
        }
        toast.success("Suggestion deleted");
      } else if (actionType === "change-status") {
        const response = await fetch(
          `/api/instance/${trustLinkId}/suggestions/${selectedSuggestion.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: selectedStatus,
              responseMessage: responseMessage.trim() || null,
            }),
          }
        );
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to update suggestion");
        }
        toast.success(`Status changed to ${selectedStatus}`);
      } else {
        const newStatus = actionType === "approve" ? "approved" : "rejected";
        const response = await fetch(
          `/api/instance/${trustLinkId}/suggestions/${selectedSuggestion.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: newStatus,
              responseMessage: responseMessage.trim() || null,
            }),
          }
        );
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to update suggestion");
        }
        toast.success(`Suggestion ${newStatus}`);
      }

      closeActionModal();
      fetchSuggestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (suggestion: Suggestion, newStatus: "approved" | "rejected") => {
    try {
      const response = await fetch(
        `/api/instance/${trustLinkId}/suggestions/${suggestion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to update suggestion");
      }
      toast.success(`Suggestion ${newStatus}`);
      fetchSuggestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get unique categories from suggestions
  const categories = data
    ? [
        ...new Set(
          data.suggestions
            .map((s) => s.question?.category)
            .filter(Boolean) as string[]
        ),
      ]
    : [];

  // Filter suggestions
  const filteredSuggestions = data?.suggestions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || s.question?.category === categoryFilter;
    const matchesSearch =
      searchTerm === "" ||
      s.suggestionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.question?.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.submitterName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Group suggestions by status for stats
  const stats = data
    ? {
        total: data.suggestions.length,
        pending: data.suggestions.filter((s) => s.status === "pending").length,
        approved: data.suggestions.filter((s) => s.status === "approved").length,
        rejected: data.suggestions.filter((s) => s.status === "rejected").length,
      }
    : { total: 0, pending: 0, approved: 0, rejected: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
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
          <h1 className="text-xl font-bold mb-2">Unable to Load Suggestions</h1>
          <p className="text-base-content/60">
            {error || "The link may be invalid or expired."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data.trustName}</h1>
              <p className="text-sm text-base-content/60">
                All suggestions from this trust
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-base-200 rounded-box p-3">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-base-content/60">Total</div>
              </div>
              <div className="bg-warning/10 rounded-box p-3">
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <div className="text-xs text-base-content/60">Pending</div>
              </div>
              <div className="bg-success/10 rounded-box p-3">
                <div className="text-2xl font-bold text-success">{stats.approved}</div>
                <div className="text-xs text-base-content/60">Approved</div>
              </div>
              <div className="bg-error/10 rounded-box p-3">
                <div className="text-2xl font-bold text-error">{stats.rejected}</div>
                <div className="text-xs text-base-content/60">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="relative sm:col-span-1">
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

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
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
        {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-base-content/60">
              Showing {filteredSuggestions?.length || 0} of {data.suggestions.length}{" "}
              suggestions
            </span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Suggestions List */}
        {filteredSuggestions && filteredSuggestions.length > 0 ? (
          <div className="grid gap-4">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-base-100 rounded-box border border-base-300 p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{suggestion.submitterName}</span>
                    {suggestion.submitterEmail && (
                      <span className="text-xs text-base-content/50">
                        ({suggestion.submitterEmail})
                      </span>
                    )}
                    <span className="text-xs text-base-content/50">
                      {formatDate(suggestion.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestion.commentCount > 0 && (
                      <span className="badge badge-sm badge-primary gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {suggestion.commentCount}
                      </span>
                    )}
                    <span
                      className={`badge badge-sm ${
                        statusConfig[suggestion.status].className
                      }`}
                    >
                      {statusConfig[suggestion.status].label}
                    </span>
                  </div>
                </div>

                {/* Question Info */}
                {suggestion.question && (
                  <div className="bg-base-200 rounded-box p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-neutral badge-sm font-mono">
                        {suggestion.question.questionId}
                      </span>
                      <span className="badge badge-ghost badge-sm">
                        {suggestion.question.category}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/80">
                      {suggestion.question.questionText}
                    </p>
                  </div>
                )}

                {/* Suggestion Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-base-content/70 mb-2">
                      Suggested Changes:
                    </p>
                    {suggestion.componentChanges ? (
                      <ComponentChangesDisplay
                        componentChanges={suggestion.componentChanges}
                        fallbackText={suggestion.suggestionText}
                      />
                    ) : (
                      <p className="text-base-content">{suggestion.suggestionText}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-base-content/70 mb-1">
                      Reason:
                    </p>
                    <p className="text-sm text-base-content/80">{suggestion.reason}</p>
                  </div>

                  {suggestion.responseMessage && (
                    <div className="pt-3 border-t border-base-300">
                      <p className="text-sm font-medium text-primary mb-1">
                        Response:
                      </p>
                      <p className="text-sm text-base-content/80">
                        {suggestion.responseMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
                  {suggestion.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleQuickStatusChange(suggestion, "approved")}
                        className="btn btn-sm btn-success btn-outline"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(suggestion, "rejected")}
                        className="btn btn-sm btn-error btn-outline"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openActionModal(suggestion, "change-status")}
                      className="btn btn-sm btn-ghost"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Change Status
                    </button>
                  )}
                  <button
                    onClick={() => openThreadModal(suggestion)}
                    className="btn btn-sm btn-primary btn-outline"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    View Thread
                    {suggestion.commentCount > 0 && ` (${suggestion.commentCount})`}
                  </button>
                  <button
                    onClick={() => openActionModal(suggestion, "delete")}
                    className="btn btn-sm btn-ghost text-error"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-base-100 rounded-box">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-base-content/60">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "No suggestions match your filters"
                : "No suggestions yet"}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Transition appear show={actionModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeActionModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-base-100 p-6 shadow-xl transition-all">
                  {actionType === "delete" ? (
                    <>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-error">
                        Delete Suggestion
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-base-content/70">
                        Are you sure you want to delete this suggestion? This action cannot be undone.
                      </p>
                      <div className="mt-6 flex gap-3 justify-end">
                        <button onClick={closeActionModal} className="btn btn-ghost">
                          Cancel
                        </button>
                        <button
                          onClick={handleAction}
                          disabled={isSubmitting}
                          className="btn btn-error"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </div>
                    </>
                  ) : actionType === "change-status" ? (
                    <>
                      <Dialog.Title as="h3" className="text-lg font-semibold">
                        Change Status
                      </Dialog.Title>

                      <div className="mt-4">
                        <label className="label">
                          <span className="label-text">New Status</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedStatus("pending")}
                            className={`btn btn-sm flex-1 ${selectedStatus === "pending" ? "btn-warning" : "btn-outline btn-warning"}`}
                          >
                            Pending
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStatus("approved")}
                            className={`btn btn-sm flex-1 ${selectedStatus === "approved" ? "btn-success" : "btn-outline btn-success"}`}
                          >
                            Approved
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStatus("rejected")}
                            className={`btn btn-sm flex-1 ${selectedStatus === "rejected" ? "btn-error" : "btn-outline btn-error"}`}
                          >
                            Rejected
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="label">
                          <span className="label-text">Response Message (optional)</span>
                        </label>
                        <textarea
                          placeholder="Add a response message to the submitter..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          className="textarea textarea-bordered w-full h-24"
                          maxLength={1000}
                        />
                        <p className="text-xs text-base-content/50 mt-1">
                          {responseMessage.length}/1000 characters
                        </p>
                      </div>

                      <div className="mt-6 flex gap-3 justify-end">
                        <button onClick={closeActionModal} className="btn btn-ghost">
                          Cancel
                        </button>
                        <button
                          onClick={handleAction}
                          disabled={isSubmitting || selectedStatus === selectedSuggestion?.status}
                          className="btn btn-primary"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Saving...
                            </>
                          ) : (
                            "Update Status"
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Dialog.Title as="h3" className="text-lg font-semibold">
                        {actionType === "approve" ? "Approve" : "Reject"} Suggestion
                      </Dialog.Title>

                      <div className="mt-4">
                        <label className="label">
                          <span className="label-text">Response Message (optional)</span>
                        </label>
                        <textarea
                          placeholder="Add a response message to the submitter..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          className="textarea textarea-bordered w-full h-24"
                          maxLength={1000}
                        />
                        <p className="text-xs text-base-content/50 mt-1">
                          {responseMessage.length}/1000 characters
                        </p>
                      </div>

                      <div className="mt-6 flex gap-3 justify-end">
                        <button onClick={closeActionModal} className="btn btn-ghost">
                          Cancel
                        </button>
                        <button
                          onClick={handleAction}
                          disabled={isSubmitting}
                          className={`btn ${actionType === "approve" ? "btn-success" : "btn-error"}`}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Saving...
                            </>
                          ) : actionType === "approve" ? (
                            "Approve"
                          ) : (
                            "Reject"
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Thread Modal */}
      <SuggestionThreadModal
        isOpen={threadModalOpen}
        onClose={closeThreadModal}
        suggestion={threadSuggestion}
        trustLinkId={trustLinkId}
        authorType="admin"
        onCommentAdded={fetchSuggestions}
      />
    </div>
  );
}
