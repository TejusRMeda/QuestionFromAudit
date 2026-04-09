import { useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import type { EditableQuestion } from "@/types/editPanel";

export function useSectionReviews(
  trustLinkId: string,
  initialSectionReviews: string[],
  initialSubmissionStatus: "in_progress" | "submitted",
  questions: EditableQuestion[],
  onRefresh: () => void
) {
  const [sectionReviews, setSectionReviews] = useState<Set<string>>(
    new Set(initialSectionReviews)
  );
  const [submissionStatus, setSubmissionStatus] = useState<"in_progress" | "submitted">(
    initialSubmissionStatus
  );
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const allSectionNames = useMemo(() => {
    return new Set(questions.map((q) => q.section || "General"));
  }, [questions]);

  const allSectionsReviewed =
    allSectionNames.size > 0 &&
    [...allSectionNames].every((s) => sectionReviews.has(s));

  const syncFromFetch = useCallback((data: { submissionStatus?: string; sectionReviews?: string[] }) => {
    if (data.submissionStatus) setSubmissionStatus(data.submissionStatus as "in_progress" | "submitted");
    if (data.sectionReviews) setSectionReviews(new Set(data.sectionReviews));
  }, []);

  const handleMarkSectionReviewed = useCallback(
    async (sectionName: string, hasSuggestions: boolean, reviewerName: string) => {
      try {
        const res = await fetch(`/api/instance/${trustLinkId}/section-reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionName, reviewerName, hasSuggestions }),
        });
        if (!res.ok) throw new Error();
        setSectionReviews((prev) => new Set([...prev, sectionName]));
        toast.success(`Section "${sectionName}" marked as reviewed`);
      } catch {
        toast.error("Failed to save section review");
      }
    },
    [trustLinkId]
  );

  const handleUnreviewSection = useCallback(
    async (sectionName: string, reviewerName: string) => {
      try {
        const res = await fetch(
          `/api/instance/${trustLinkId}/section-reviews?sectionName=${encodeURIComponent(sectionName)}&reviewerName=${encodeURIComponent(reviewerName)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error();
        setSectionReviews((prev) => {
          const next = new Set(prev);
          next.delete(sectionName);
          return next;
        });
        toast.success(`Section "${sectionName}" unmarked`);
      } catch {
        toast.error("Failed to remove section review");
      }
    },
    [trustLinkId]
  );

  const handleSubmitReview = useCallback(async () => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/instance/${trustLinkId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit review");
      }
      setSubmissionStatus("submitted");
      setShowSubmitDialog(false);
      toast.success("Review submitted successfully!");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [trustLinkId, onRefresh]);

  return {
    sectionReviews,
    submissionStatus,
    isSubmittingReview,
    showSubmitDialog,
    setShowSubmitDialog,
    allSectionNames,
    allSectionsReviewed,
    syncFromFetch,
    handleMarkSectionReviewed,
    handleUnreviewSection,
    handleSubmitReview,
  };
}
