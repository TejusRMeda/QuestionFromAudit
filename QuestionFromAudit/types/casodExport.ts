/**
 * CASOD CSV Export Types
 *
 * Defines the 17-column CASOD template structure for exporting
 * trust feedback into a structured CSV format.
 */

/** One row in the CASOD CSV export (17 columns) */
export interface CasodCsvRow {
  "Type of change": string;
  Section: string;
  "Question/ text": string;
  Required: string;
  "Answer option": string;
  "Include answer in summary row": string;
  "Branching off/ Positioning": string;
  "Suggested Change": string;
  Content: string;
  "Weblink and link text": string;
  Recommendations: string;
  "Ultramed Response": string;
  "Trust Response": string;
  "MAIN Change (internal use)": string;
  "Built in questionnaire(s) (internal use)": string;
  "Built in bottom report(s) (internal use)": string;
  "Built in top report(s) (internal use)": string;
}

/** Ordered column keys for Papa.unparse */
export const CASOD_COLUMNS: (keyof CasodCsvRow)[] = [
  "Type of change",
  "Section",
  "Question/ text",
  "Required",
  "Answer option",
  "Include answer in summary row",
  "Branching off/ Positioning",
  "Suggested Change",
  "Content",
  "Weblink and link text",
  "Recommendations",
  "Ultramed Response",
  "Trust Response",
  "MAIN Change (internal use)",
  "Built in questionnaire(s) (internal use)",
  "Built in bottom report(s) (internal use)",
  "Built in top report(s) (internal use)",
];
