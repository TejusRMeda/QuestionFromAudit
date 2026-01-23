"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import toast from "react-hot-toast";

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
}

interface SuggestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  onUpdate?: () => void;
}

const statusOptions = [
  { value: "pending", label: "Pending", className: "badge-warning" },
  { value: "approved", label: "Approved", className: "badge-success" },
  { value: "rejected", label: "Rejected", className: "badge-error" },
];

export default function SuggestionDetailModal({
  isOpen,
  onClose,
  suggestion,
  onUpdate,
}: SuggestionDetailModalProps) {
  const [status, setStatus] = useState<string>("pending");
  const [internalComment, setInternalComment] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showInternalComments, setShowInternalComments] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setStatus(suggestion.status);
      setInternalComment(suggestion.internalComment || "");
      setResponseMessage(suggestion.responseMessage || "");
    }
  }, [suggestion]);

  const handleSave = async () => {
    if (!suggestion) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          internalComment: internalComment.trim() || null,
          responseMessage: responseMessage.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update suggestion");
      }

      toast.success("Suggestion updated successfully!");
      onUpdate?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update suggestion"
      );
    } finally {
      setIsSaving(false);
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

  if (!suggestion) return null;

  const statusConfig = statusOptions.find((s) => s.value === suggestion.status);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-box bg-base-100 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-base-300">
                  <div>
                    <Dialog.Title className="text-lg font-semibold">
                      Suggestion Details
                    </Dialog.Title>
                    <p className="text-sm text-base-content/60 mt-1">
                      Submitted {formatDate(suggestion.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={onClose}
                    disabled={isSaving}
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
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Question Info */}
                  <div className="bg-base-200 rounded-box p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-neutral badge-sm font-mono">
                        {suggestion.questionId}
                      </span>
                      <span className="badge badge-ghost badge-sm">
                        {suggestion.category}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/80">
                      {suggestion.questionText}
                    </p>
                  </div>

                  {/* Submitter Info */}
                  <div>
                    <h3 className="text-sm font-medium text-base-content/70 mb-2">
                      Submitted by
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {suggestion.submitterName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{suggestion.submitterName}</p>
                        {suggestion.submitterEmail && (
                          <p className="text-sm text-base-content/60">
                            {suggestion.submitterEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion */}
                  <div>
                    <h3 className="text-sm font-medium text-base-content/70 mb-2">
                      Suggested Change
                    </h3>
                    <p className="text-base-content bg-base-200 rounded-box p-3">
                      {suggestion.suggestionText}
                    </p>
                  </div>

                  {/* Reason */}
                  <div>
                    <h3 className="text-sm font-medium text-base-content/70 mb-2">
                      Reason for Change
                    </h3>
                    <p className="text-base-content/80 bg-base-200 rounded-box p-3">
                      {suggestion.reason}
                    </p>
                  </div>

                  <div className="divider"></div>

                  {/* Status Update */}
                  <div>
                    <h3 className="text-sm font-medium text-base-content/70 mb-2">
                      Status
                    </h3>
                    <div className="flex gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`btn btn-sm ${
                            status === option.value
                              ? option.value === "pending"
                                ? "btn-warning"
                                : option.value === "approved"
                                ? "btn-success"
                                : "btn-error"
                              : "btn-ghost"
                          }`}
                          onClick={() => setStatus(option.value)}
                          disabled={isSaving}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Response Message */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        Response Message
                        <span className="text-base-content/50 ml-1">
                          (visible to trust user)
                        </span>
                      </span>
                    </label>
                    <textarea
                      placeholder="Add a response that will be visible to the trust user..."
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      rows={3}
                      className="textarea textarea-bordered w-full resize-none"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Internal Comments */}
                  <div>
                    <button
                      className="flex items-center gap-2 text-sm font-medium text-base-content/70 mb-2"
                      onClick={() => setShowInternalComments(!showInternalComments)}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          showInternalComments ? "rotate-90" : ""
                        }`}
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
                      Internal Comments
                      <span className="badge badge-ghost badge-xs">Private</span>
                    </button>
                    {showInternalComments && (
                      <textarea
                        placeholder="Add internal notes (not visible to trust users)..."
                        value={internalComment}
                        onChange={(e) => setInternalComment(e.target.value)}
                        rows={3}
                        className="textarea textarea-bordered w-full resize-none"
                        disabled={isSaving}
                      />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between p-6 border-t border-base-300 bg-base-200/50">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
