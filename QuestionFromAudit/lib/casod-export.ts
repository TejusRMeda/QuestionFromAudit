/**
 * CASOD CSV Export — Consolidation Logic
 *
 * Pure functions that transform instance_questions + instance_suggestions
 * into CasodCsvRow[] for CSV export.
 */

import type { CasodCsvRow } from "@/types/casodExport";
import type { ComponentChanges } from "@/types/editPanel";
import type { EnableWhen } from "@/types/question";
import {
  translateEnableWhen,
  buildCharacteristicMap,
  type QuestionForMapping,
} from "@/lib/enableWhen";

/** DB row shape for instance_questions */
export interface ExportQuestion {
  id: number;
  question_id: string;
  category: string;
  question_text: string;
  answer_type: string | null;
  answer_options: string | null;
  section: string | null;
  page: string | null;
  characteristic: string | null;
  required: boolean;
  enable_when: EnableWhen | null;
  has_helper: boolean;
  helper_type: string | null;
  helper_name: string | null;
  helper_value: string | null;
}

/** DB row shape for instance_suggestions */
export interface ExportSuggestion {
  id: number;
  submitter_name: string;
  submitter_email: string | null;
  suggestion_text: string;
  reason: string;
  status: string;
  internal_comment: string | null;
  response_message: string | null;
  component_changes: ComponentChanges | null;
}

/**
 * Main entry point: consolidate questions + grouped suggestions into CASOD rows.
 * Only questions that appear in suggestionsMap are included.
 */
export function consolidateSuggestionsToRows(
  questions: ExportQuestion[],
  suggestionsMap: Map<number, ExportSuggestion[]>,
  allQuestions: QuestionForMapping[]
): CasodCsvRow[] {
  const characteristicMap = buildCharacteristicMap(allQuestions);
  const rows: CasodCsvRow[] = [];

  for (const q of questions) {
    const suggestions = suggestionsMap.get(q.id);
    if (!suggestions || suggestions.length === 0) continue;

    rows.push({
      "Type of change": "Edit",
      Section: q.section || q.category || "",
      "Question/ text": q.question_text,
      Required: q.required ? "TRUE" : "FALSE",
      "Answer option": formatOptions(q.answer_options),
      "Include answer in summary row": "FALSE",
      "Branching off/ Positioning": buildBranchingText(
        q.enable_when,
        characteristicMap
      ),
      "Suggested Change": buildSuggestedChangeText(suggestions),
      Content: buildContentColumn(suggestions),
      "Weblink and link text": buildWeblinkColumn(suggestions),
      Recommendations: "",
      "Ultramed Response": buildUltramedResponseText(suggestions),
      "Trust Response": buildTrustResponseText(suggestions),
      "MAIN Change (internal use)": "FALSE",
      "Built in questionnaire(s) (internal use)": "FALSE",
      "Built in bottom report(s) (internal use)": "FALSE",
      "Built in top report(s) (internal use)": "FALSE",
    });
  }

  return rows;
}

/** Format pipe-separated answer options into a readable string */
function formatOptions(answerOptions: string | null): string {
  if (!answerOptions) return "";
  return answerOptions
    .split("|")
    .map((o) => o.trim())
    .filter(Boolean)
    .join(", ");
}

/** Translate EnableWhen JSON to human-readable branching text */
function buildBranchingText(
  enableWhen: EnableWhen | null,
  characteristicMap: Map<string, import("@/lib/enableWhen").CharacteristicSource>
): string {
  if (!enableWhen || !enableWhen.conditions || enableWhen.conditions.length === 0) {
    return "";
  }
  const translated = translateEnableWhen(enableWhen, characteristicMap);
  return translated.summary;
}

/** Concatenate all suggestion texts with submitter attribution */
function buildSuggestedChangeText(suggestions: ExportSuggestion[]): string {
  if (suggestions.length === 1) {
    return suggestions[0].suggestion_text;
  }
  return suggestions
    .map((s) => `${s.submitter_name}: ${s.suggestion_text}`)
    .join(" | ");
}

/** Build Content column from component_changes */
function buildContentColumn(suggestions: ExportSuggestion[]): string {
  const details: string[] = [];

  for (const s of suggestions) {
    const cc = s.component_changes;
    if (!cc) continue;

    // Content changes: question text or options
    if (cc.content) {
      if (cc.content.questionText) {
        details.push(
          `Question text: "${cc.content.questionText.from}" → "${cc.content.questionText.to}"`
        );
      }
      if (cc.content.answerType) {
        details.push(
          `Answer type: ${cc.content.answerType.from} → ${cc.content.answerType.to}`
        );
      }
      if (cc.content.options) {
        const parts: string[] = [];
        if (cc.content.options.added.length > 0) {
          parts.push(`+${cc.content.options.added.length} added`);
        }
        if (cc.content.options.modified.length > 0) {
          parts.push(`${cc.content.options.modified.length} modified`);
        }
        if (cc.content.options.removed.length > 0) {
          parts.push(`-${cc.content.options.removed.length} removed`);
        }
        if (parts.length > 0) {
          details.push(`Options: ${parts.join(", ")}`);
        }
      }
    }

    // Help changes with contentBlock type
    if (cc.help) {
      const isContentBlock =
        cc.help.helperType?.to === "contentBlock" ||
        (!cc.help.helperType && cc.help.helperValue);
      if (isContentBlock && cc.help.helperValue) {
        details.push(
          `Help content: "${cc.help.helperName?.to || "Updated"}"`
        );
      }
    }
  }

  if (details.length === 0) return "Leave as is";
  return `Edit: ${details.join("; ")}`;
}

/** Build Weblink column from component_changes.help (webLink type) */
function buildWeblinkColumn(suggestions: ExportSuggestion[]): string {
  const details: string[] = [];

  for (const s of suggestions) {
    const help = s.component_changes?.help;
    if (!help) continue;

    const isWebLink = help.helperType?.to === "webLink";
    if (isWebLink && help.helperValue) {
      const name = help.helperName?.to || "Link";
      details.push(`${name}: ${help.helperValue.to}`);
    }
  }

  if (details.length === 0) return "Leave as is";
  return `Edit: ${details.join("; ")}`;
}

/** Build Trust Response from suggestion reasons */
function buildTrustResponseText(suggestions: ExportSuggestion[]): string {
  if (suggestions.length === 1) {
    return suggestions[0].reason;
  }
  return suggestions
    .map((s) => `${s.submitter_name}: ${s.reason}`)
    .join(" | ");
}

/** Build Ultramed Response from internal comments and response messages */
function buildUltramedResponseText(suggestions: ExportSuggestion[]): string {
  const parts: string[] = [];

  for (const s of suggestions) {
    const entries: string[] = [];
    if (s.response_message) entries.push(s.response_message);
    if (s.internal_comment) entries.push(`[Internal] ${s.internal_comment}`);
    if (entries.length > 0) {
      if (suggestions.length > 1) {
        parts.push(`${s.submitter_name}: ${entries.join(" / ")}`);
      } else {
        parts.push(entries.join(" / "));
      }
    }
  }

  return parts.join(" | ");
}
