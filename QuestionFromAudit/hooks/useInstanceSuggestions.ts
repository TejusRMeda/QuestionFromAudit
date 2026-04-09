import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Suggestion } from "@/components/questionnaire/panel/SuggestionsListView";

export function useInstanceSuggestions(
  trustLinkId: string,
  activeTab: string,
  selectedSection: string | null
) {
  const queryClient = useQueryClient();

  const needsSuggestions =
    activeTab === "suggestions" ||
    activeTab === "change-requests" ||
    activeTab === "casod-report";

  const { data: suggestions = null, isLoading: suggestionsLoading } =
    useQuery<Suggestion[]>({
      queryKey: ["suggestions", trustLinkId],
      queryFn: async () => {
        const res = await fetch(
          `/api/instance/${trustLinkId}/suggestions`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data.suggestions;
      },
      enabled: needsSuggestions,
      staleTime: 30 * 1000,
    });

  const invalidateSuggestions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["suggestions", trustLinkId] });
  }, [queryClient, trustLinkId]);

  const displaySuggestions = useMemo(() => {
    if (!suggestions) return [];
    if (!selectedSection) return suggestions;
    return suggestions.filter(
      (s) => (s.question?.section || "General") === selectedSection
    );
  }, [suggestions, selectedSection]);

  return { suggestions, suggestionsLoading, invalidateSuggestions, displaySuggestions };
}
