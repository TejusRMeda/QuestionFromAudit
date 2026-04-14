/**
 * Testing-session view for the trust reviewer screen.
 *
 * Account managers generate a /instance/[trustLinkId]/testing URL with a
 * specific set of controls hidden so they can usability-test the suggestion
 * flow with first-time reviewers. Suggestions submitted in that view are
 * tagged is_test_session=true so they don't pollute the real review queue.
 */

/** Controls that can be hidden in a testing-session view. */
export type HideableControl =
  | "style"       // Audit ↔ Patient Preview switch
  | "progress"    // Top progress bar
  | "mark"        // "Mark as Reviewed" / "No Changes Needed" buttons + section submit
  | "casod"       // CASOD Report tab
  | "changes"     // Change Requests tab
  | "suggestions" // Suggestions tab
  | "filters";    // Search + category filter bar

export const HIDEABLE_CONTROLS: ReadonlyArray<{
  key: HideableControl;
  label: string;
  description: string;
}> = [
  { key: "style",       label: "Audit ↔ Patient Preview switch", description: "Hides the toggle between audit-style and patient-style question rendering." },
  { key: "progress",    label: "Progress bar",                    description: "Hides the top bar showing how many questions have been reviewed." },
  { key: "mark",        label: "'Mark as Reviewed' controls",     description: "Hides the per-section review buttons and the final submit-review CTA." },
  { key: "suggestions", label: "Suggestions tab",                 description: "Hides the cross-section Suggestions list tab." },
  { key: "changes",     label: "Change Requests tab",             description: "Hides the cross-section Change Requests table tab." },
  { key: "casod",       label: "CASOD Report tab",                description: "Hides the CASOD report export tab." },
  { key: "filters",     label: "Search + category filters",       description: "Hides the search box and category dropdown above the questions list." },
];

export type LockedViewStyle = "audit" | "patient";

/**
 * Decoded testing-session config. Controls listed in `hide` are removed from
 * the UI; lockedViewStyle forces a specific value and removes the toggle.
 */
export interface TestingConfig {
  hide: Set<HideableControl>;
  lockedViewStyle: LockedViewStyle | null;
}

export const EMPTY_TESTING_CONFIG: TestingConfig = {
  hide: new Set(),
  lockedViewStyle: null,
};
