"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EditableQuestion } from "@/types/editPanel";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddNewQuestionDialogProps {
  open: boolean;
  anchorQuestion: EditableQuestion | null;
  position: "before" | "after" | null;
  trustLinkId: string;
  reviewerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function AddNewQuestionDialog({
  open,
  anchorQuestion,
  position,
  trustLinkId,
  reviewerName,
  onClose,
  onSubmitted,
}: AddNewQuestionDialogProps) {
  const [questionText, setQuestionText] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setQuestionText("");
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!questionText.trim() || !reason.trim() || !anchorQuestion || !position) return;

    setSubmitting(true);
    try {
      const truncated = questionText.trim().substring(0, 80);
      const response = await fetch(
        `/api/instance/${trustLinkId}/suggestions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceQuestionId: anchorQuestion.id,
            submitterName: reviewerName,
            suggestionText: `Add new question ${position} ${anchorQuestion.questionId}: ${truncated}`,
            reason: reason.trim(),
            componentChanges: {
              newQuestion: {
                position,
                questionText: questionText.trim(),
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to submit");
      }

      toast.success("New question suggested");
      setQuestionText("");
      setReason("");
      onSubmitted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit suggestion"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const positionLabel = position === "before" ? "before" : "after";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a New Question</DialogTitle>
          <DialogDescription>
            This question will be suggested {positionLabel}{" "}
            <span className="font-medium text-slate-700">
              {anchorQuestion?.questionId}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div>
            <Label htmlFor="new-question-text">Question text</Label>
            <textarea
              id="new-question-text"
              placeholder="e.g. Do you have any allergies to medication?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4] resize-none"
              rows={3}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="new-question-reason">Reason</Label>
            <textarea
              id="new-question-reason"
              placeholder="Why should this question be added?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/30 focus:border-[#4A90A4] resize-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!questionText.trim() || !reason.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
