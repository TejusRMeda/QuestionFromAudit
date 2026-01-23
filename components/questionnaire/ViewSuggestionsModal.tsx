"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
}

interface Suggestion {
  id: number;
  submitterName: string;
  suggestionText: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  responseMessage: string | null;
  createdAt: string;
}

interface ViewSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSuggestChange?: () => void;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "badge-warning",
  },
  approved: {
    label: "Approved",
    className: "badge-success",
  },
  rejected: {
    label: "Rejected",
    className: "badge-error",
  },
};

export default function ViewSuggestionsModal({
  isOpen,
  onClose,
  question,
  onSuggestChange,
}: ViewSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && question) {
      fetchSuggestions();
    }
  }, [isOpen, question]);

  const fetchSuggestions = async () => {
    if (!question) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/questions/${question.id}/suggestions`);
      if (!response.ok) {
        throw new Error("Failed to load suggestions");
      }
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!question) return null;

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-box bg-base-100 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    Suggestions
                  </Dialog.Title>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={onClose}
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

                {/* Question Info */}
                <div className="bg-base-200 rounded-box p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-neutral badge-sm font-mono">
                      {question.questionId}
                    </span>
                    <span className="badge badge-ghost badge-sm">
                      {question.category}
                    </span>
                  </div>
                  <p className="text-sm text-base-content/80">
                    {question.questionText}
                  </p>
                </div>

                {/* Suggestions List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="loading loading-spinner loading-md"></span>
                      <span className="ml-2 text-base-content/60">
                        Loading suggestions...
                      </span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-error"
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
                      <p className="text-error">{error}</p>
                      <button
                        className="btn btn-ghost btn-sm mt-2"
                        onClick={fetchSuggestions}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-base-content/40"
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
                      <p className="text-base-content/60 mb-1">
                        No suggestions yet
                      </p>
                      <p className="text-sm text-base-content/40">
                        Be the first to suggest a change
                      </p>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="border border-base-300 rounded-box p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {suggestion.submitterName}
                            </span>
                            <span className="text-xs text-base-content/50">
                              {formatDate(suggestion.createdAt)}
                            </span>
                          </div>
                          <span
                            className={`badge badge-sm ${
                              statusConfig[suggestion.status].className
                            }`}
                          >
                            {statusConfig[suggestion.status].label}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-base-content/70 mb-1">
                            Suggested Change:
                          </p>
                          <p className="text-sm text-base-content">
                            {suggestion.suggestionText}
                          </p>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-base-content/70 mb-1">
                            Reason:
                          </p>
                          <p className="text-sm text-base-content/80">
                            {suggestion.reason}
                          </p>
                        </div>

                        {suggestion.responseMessage && (
                          <div className="mt-3 pt-3 border-t border-base-300">
                            <p className="text-sm font-medium text-primary mb-1">
                              Response:
                            </p>
                            <p className="text-sm text-base-content/80">
                              {suggestion.responseMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-base-300">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onClose();
                      onSuggestChange?.();
                    }}
                  >
                    Add Your Suggestion
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
