import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";

interface Question {
  id: number;
  questionId: string;
  category: string;
  questionText: string;
  answerType: string | null;
  answerOptions: string | null;
  characteristic: string | null;
  section: string | null;
  page: string | null;
  enableWhen: import("@/types/question").EnableWhen | null;
  hasHelper: boolean | null;
  helperType: string | null;
  helperName: string | null;
  helperValue: string | null;
  suggestionCount: number;
  quickAction: "required" | "delete" | null;
}

export interface InstanceData {
  trustName: string;
  questionnaireName: string | null;
  createdAt: string;
  submissionStatus: "in_progress" | "submitted";
  sectionReviews: string[];
  questions: Question[];
  newQuestionSuggestions?: Array<{
    id: number;
    anchorQuestionId: number;
    position: "before" | "after";
    questionText: string;
    submitterName: string;
  }>;
}

export function useInstanceData(trustLinkId: string, initialData: InstanceData) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<InstanceData | null>(initialData);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchInstance = useCallback(async () => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`/api/instance/${trustLinkId}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to load questionnaire");
      }
      const data = await response.json();
      setInstance(data);
      return data as InstanceData;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      setError(err instanceof Error ? err.message : "Failed to load questionnaire");
      toast.error("Failed to load questionnaire");
      return null;
    } finally {
      setLoading(false);
    }
  }, [trustLinkId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { loading, error, instance, fetchInstance, setInstance };
}
