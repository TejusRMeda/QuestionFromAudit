"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
}

interface InstanceSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  trustLinkId: string;
  onSuccess?: () => void;
}

export default function InstanceSuggestionModal({
  isOpen,
  onClose,
  question,
  trustLinkId,
  onSuccess,
}: InstanceSuggestionModalProps) {
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
      const response = await fetch(`/api/instance/${trustLinkId}/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceQuestionId: question.id,
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
      <DialogContent className="sm:max-w-lg">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Suggest a Change</DialogTitle>
        </DialogHeader>

        {/* Original Question */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="ghost" className="text-xs">
              {question.category}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            {question.questionText}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label className="font-medium mb-1.5">
              Your Name <span className="text-red-600">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              className={errors.submitterName ? "border-red-300" : ""}
              disabled={isSubmitting}
            />
            {errors.submitterName && (
              <p className="text-xs text-red-600 mt-1">{errors.submitterName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label className="font-medium mb-1.5">
              Email <span className="text-slate-500">(optional)</span>
            </Label>
            <Input
              type="email"
              placeholder="Enter your email for updates"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              className={errors.submitterEmail ? "border-red-300" : ""}
              disabled={isSubmitting}
            />
            {errors.submitterEmail && (
              <p className="text-xs text-red-600 mt-1">{errors.submitterEmail}</p>
            )}
          </div>

          {/* Suggestion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">
                Suggested Change <span className="text-red-600">*</span>
              </Label>
              <span className="text-xs text-slate-500">
                {suggestionText.length}/{MAX_SUGGESTION_LENGTH}
              </span>
            </div>
            <Textarea
              placeholder="Describe your suggested change..."
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              rows={4}
              className={`resize-none ${errors.suggestionText ? "border-red-300" : ""}`}
              disabled={isSubmitting}
            />
            {errors.suggestionText && (
              <p className="text-xs text-red-600 mt-1">{errors.suggestionText}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">
                Reason for Change <span className="text-red-600">*</span>
              </Label>
              <span className="text-xs text-slate-500">
                {reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
            <Textarea
              placeholder="Explain why this change would be beneficial..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={`resize-none ${errors.reason ? "border-red-300" : ""}`}
              disabled={isSubmitting}
            />
            {errors.reason && (
              <p className="text-xs text-red-600 mt-1">{errors.reason}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Suggestion"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
