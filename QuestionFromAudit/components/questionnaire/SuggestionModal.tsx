"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import toast from "react-hot-toast";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
}

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSuccess?: () => void;
}

export default function SuggestionModal({
  isOpen,
  onClose,
  question,
  onSuccess,
}: SuggestionModalProps) {
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAX_SUGGESTION_LENGTH = 2000;
  const MAX_REASON_LENGTH = 1000;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!submitterName.trim()) {
      newErrors.submitterName = "Name is required";
    }

    if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
      newErrors.submitterEmail = "Please enter a valid email address";
    }

    if (!suggestionText.trim()) {
      newErrors.suggestionText = "Suggestion is required";
    } else if (suggestionText.length > MAX_SUGGESTION_LENGTH) {
      newErrors.suggestionText = `Maximum ${MAX_SUGGESTION_LENGTH} characters allowed`;
    }

    if (!reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (reason.length > MAX_REASON_LENGTH) {
      newErrors.reason = `Maximum ${MAX_REASON_LENGTH} characters allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !question) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: question.id,
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim() || null,
          suggestionText: suggestionText.trim(),
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit suggestion");
      }

      toast.success("Suggestion submitted successfully!");
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit suggestion"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitterName("");
    setSubmitterEmail("");
    setSuggestionText("");
    setReason("");
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="w-full sm:max-w-lg overflow-hidden rounded-box bg-base-100 p-6 shadow-xl" showCloseButton={false}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <DialogTitle className="text-lg font-semibold">
                    Suggest a Change
                  </DialogTitle>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    aria-label="Close"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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

                {/* Original Question */}
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

                {/* Form */}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="label" htmlFor="suggestion-name">
                      <span className="label-text font-medium">
                        Your Name <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="suggestion-name"
                      type="text"
                      placeholder="Enter your name"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      className={`input input-bordered w-full ${
                        errors.submitterName ? "input-error" : ""
                      }`}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.submitterName}
                      aria-describedby={errors.submitterName ? "suggestion-name-error" : undefined}
                    />
                    {errors.submitterName && (
                      <label className="label">
                        <span id="suggestion-name-error" className="label-text-alt text-error">
                          {errors.submitterName}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label" htmlFor="suggestion-email">
                      <span className="label-text font-medium">
                        Email <span className="text-base-content/50">(optional)</span>
                      </span>
                    </label>
                    <input
                      id="suggestion-email"
                      type="email"
                      placeholder="Enter your email for updates"
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      className={`input input-bordered w-full ${
                        errors.submitterEmail ? "input-error" : ""
                      }`}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.submitterEmail}
                      aria-describedby={errors.submitterEmail ? "suggestion-email-error" : undefined}
                    />
                    {errors.submitterEmail && (
                      <label className="label">
                        <span id="suggestion-email-error" className="label-text-alt text-error">
                          {errors.submitterEmail}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Suggestion */}
                  <div>
                    <label className="label" htmlFor="suggestion-text">
                      <span className="label-text font-medium">
                        Suggested Change <span className="text-error">*</span>
                      </span>
                      <span className="label-text-alt text-base-content/50">
                        {suggestionText.length}/{MAX_SUGGESTION_LENGTH}
                      </span>
                    </label>
                    <textarea
                      id="suggestion-text"
                      placeholder="Describe your suggested change..."
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      rows={4}
                      maxLength={MAX_SUGGESTION_LENGTH}
                      className={`textarea textarea-bordered w-full resize-none ${
                        errors.suggestionText ? "textarea-error" : ""
                      }`}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.suggestionText}
                      aria-describedby={errors.suggestionText ? "suggestion-text-error" : undefined}
                    />
                    {errors.suggestionText && (
                      <label className="label">
                        <span id="suggestion-text-error" className="label-text-alt text-error">
                          {errors.suggestionText}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="label" htmlFor="suggestion-reason">
                      <span className="label-text font-medium">
                        Reason for Change <span className="text-error">*</span>
                      </span>
                      <span className="label-text-alt text-base-content/50">
                        {reason.length}/{MAX_REASON_LENGTH}
                      </span>
                    </label>
                    <textarea
                      id="suggestion-reason"
                      placeholder="Explain why this change would be beneficial..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      maxLength={MAX_REASON_LENGTH}
                      className={`textarea textarea-bordered w-full resize-none ${
                        errors.reason ? "textarea-error" : ""
                      }`}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.reason}
                      aria-describedby={errors.reason ? "suggestion-reason-error" : undefined}
                    />
                    {errors.reason && (
                      <label className="label">
                        <span id="suggestion-reason-error" className="label-text-alt text-error">
                          {errors.reason}
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Suggestion"
                    )}
                  </button>
                </div>
      </DialogContent>
    </Dialog>
  );
}
