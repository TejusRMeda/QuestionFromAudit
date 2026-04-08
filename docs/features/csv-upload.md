# CSV Upload & Parsing

**Location:** `/app/dashboard/upload/page.tsx`, `/app/api/masters/route.ts`, `/types/question.ts`

## CSV Format

The system uses the **MyPreOp format** — a 13-column CSV where each row can represent either a question or an answer option for the preceding question.

### Required Columns

| Column | Description |
|---|---|
| `Id` | Question identifier (e.g. `Q001`). Rows with the same Id are grouped as options for one question. |
| `Section` | Section heading |
| `Page` | Page number or name |
| `ItemType` | Answer type (see supported types below) |
| `Question` | Question text (max 1000 chars). Only present on the first row of a question group. |
| `Option` | Option label for multi-option questions (max 100 chars) |
| `Characteristic` | Pipe-separated characteristic keys linked to this option (e.g. `patient_is_female`) |
| `Required` | `"true"` or `"false"` |
| `EnableWhen` | Conditional display expression (see [Conditional Logic](./conditional-logic.md)) |
| `HasHelper` | `"true"` or `"false"` |
| `HelperType` | `"text"` or `"link"` |
| `HelperName` | Helper label |
| `HelperValue` | Helper body text or URL |

### Supported Item Types

```
radio, checkbox, text-field, textarea, number, date,
dropdown, slider, toggle, heading, info, image,
signature, file-upload, rating, scale, matrix,
matrix-checkbox, time, datetime
```

### Multi-Row Questions

Questions with multiple options span multiple CSV rows sharing the same `Id`:

```csv
Id,Section,Page,ItemType,Question,Option,Characteristic,...
Q010,General,1,radio,What is your gender?,Male,patient_is_male,...
Q010,General,1,radio,,Female,patient_is_female,...
Q010,General,1,radio,,Other,,...
```

The `Question` text appears only on the first row. All other fields (Section, Page, ItemType, Required, EnableWhen, HasHelper, etc.) are taken from the first row in the group.

---

## Parsing Pipeline

Source: `/types/question.ts`

1. **PapaParse** reads the raw CSV string into row arrays.
2. **Column validation** — ensures all 13 columns are present.
3. **`groupRowsByQuestion(rows)`** — groups rows by `Id` into a `Map<string, CsvRow[]>`.
4. **`rowsToQuestion(rows)`** — converts each group into a `ParsedQuestion` object:
   - Extracts question metadata from the first row
   - Collects `Option` and `Characteristic` values across all rows
   - Calls `parseEnableWhen()` on the `EnableWhen` string
5. **Per-question validation** — checks each `ParsedQuestion` for errors.
6. Results are returned as `{ questions: ParsedQuestion[], errors: string[], warnings: string[] }`.

---

## Validation Rules

### Errors (block upload)

| Rule | Message pattern |
|---|---|
| Missing column | `"Missing required column: {name}"` |
| Unknown item type | `"Row {n}: Invalid ItemType '{type}'"` |
| Empty question text | `"Question {id}: Question text is required"` |
| Question text too long | `"Question {id}: Question text exceeds 1000 characters"` |
| Option text too long | `"Question {id}: Option '{text}' exceeds 100 characters"` |
| Radio/checkbox with fewer than 2 options | `"Question {id}: radio/checkbox questions require at least 2 options"` |
| More than 500 questions | `"File exceeds maximum of 500 questions"` |

### Warnings (shown but don't block upload)

| Rule | Message pattern |
|---|---|
| More than 20 options on a question | `"Question {id}: Has {n} options — consider splitting"` |

---

## `ParsedQuestion` Type

```typescript
interface ParsedQuestion {
  questionId: string;
  category: string;         // maps to Section in CSV
  section: string;
  page: string;
  questionText: string;
  answerType: MyPreOpItemType;
  answerOptions: string[];
  characteristic: string;   // pipe-joined characteristics
  required: boolean;
  enableWhen: EnableWhen | null;
  hasHelper: boolean;
  helperType: string;
  helperName: string;
  helperValue: string;
}
```

---

## UI Features

- Drag-and-drop file picker
- Accepts `.csv` files only
- Inline error and warning display with row numbers
- Submit button disabled while errors exist
- Redirects to master dashboard on success
