"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ───────────────────────────── Types ──────────────────────────────

interface ChangeEntry {
  questionId: string;
  changes: string[];
}

interface ChangesSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockedCount: number;
  hiddenCount: number;
  editedCount: number;
  changes: ChangeEntry[];
  onConfirm: () => void;
  isPublishing: boolean;
}

// ───────────────────────────── Component ──────────────────────────

export default function ChangesSummaryDialog({
  open,
  onOpenChange,
  lockedCount,
  hiddenCount,
  editedCount,
  changes,
  onConfirm,
  isPublishing,
}: ChangesSummaryDialogProps) {
  const hasChanges = lockedCount > 0 || hiddenCount > 0 || editedCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>Publish Questionnaire</DialogTitle>
          <DialogDescription>
            {hasChanges
              ? "Review the changes before publishing."
              : "No changes have been made. Publish as-is?"}
          </DialogDescription>
        </DialogHeader>

        {hasChanges && (
          <div className="space-y-3">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {lockedCount > 0 && (
                <Badge variant="primary">
                  {lockedCount} locked
                </Badge>
              )}
              {hiddenCount > 0 && (
                <Badge variant="ghost">
                  {hiddenCount} hidden
                </Badge>
              )}
              {editedCount > 0 && (
                <Badge variant="warning">
                  {editedCount} edited
                </Badge>
              )}
            </div>

            {/* Changes list */}
            {changes.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
                {changes.map((entry, idx) => (
                  <div key={idx} className="px-3 py-2">
                    <span className="text-xs font-medium text-slate-700">
                      {entry.questionId}
                    </span>
                    <ul className="mt-0.5">
                      {entry.changes.map((change, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-slate-600 flex items-start gap-1.5"
                        >
                          <span
                            className="text-amber-500 mt-1 shrink-0"
                            aria-hidden="true"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="12" r="5" />
                            </svg>
                          </span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
            onClick={onConfirm}
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing..." : "Confirm & Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
