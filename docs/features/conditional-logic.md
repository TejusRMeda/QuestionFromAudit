# Conditional Logic (EnableWhen)

**Location:** `/lib/enableWhen.ts`, `/types/question.ts`, `/components/questionnaire/EnableWhenDisplay.tsx`

## What is EnableWhen?

EnableWhen is a condition that determines whether a question should be shown to the patient. If the condition is not met, the question is hidden.

Conditions are based on **characteristics** — key-value pairs that travel with answer options. For example, the "Female" option on a gender question might carry the characteristic `patient_is_female`.

---

## CSV Format

In the CSV, `EnableWhen` is a string expression:

```
(patient_is_female=true) AND (patient_age>16)
```

### Operators

| Operator | Meaning |
|---|---|
| `=` | Equals |
| `!=` | Not equals |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |

### Conjunctions

- `AND` — all conditions must be true
- `OR` — any condition must be true

---

## Parsing

**Function:** `parseEnableWhen(str: string): EnableWhen | null` in `/types/question.ts`

Converts the CSV string into a structured object:

```typescript
interface EnableWhen {
  conjunction: "AND" | "OR";
  conditions: Array<{
    characteristic: string;   // e.g. "patient_is_female"
    operator: string;         // e.g. "="
    value: string;            // e.g. "true"
  }>;
}
```

**Example:**

Input: `"(patient_is_female=true) AND (patient_age>16)"`

Output:
```json
{
  "conjunction": "AND",
  "conditions": [
    { "characteristic": "patient_is_female", "operator": "=", "value": "true" },
    { "characteristic": "patient_age", "operator": ">", "value": "16" }
  ]
}
```

If parsing fails, the function returns `null` and a warning is recorded.

---

## Translation to Human-Readable Text

**Function:** `translateEnableWhen(enableWhen, questions)` in `/lib/enableWhen.ts`

Converts the structured `EnableWhen` object into a plain English sentence by resolving characteristic keys back to their source questions and option labels.

### How It Works

1. **`buildCharacteristicMap(questions)`** — iterates all questions and their options. Each option's pipe-separated `characteristic` string is split and each key is mapped to its source question text and option text.

   ```
   "patient_is_female" → { question: "What is your gender?", option: "Female" }
   ```

2. **`translateEnableWhen(enableWhen, charMap)`** — replaces each condition's characteristic key with the resolved label:

   - `(patient_is_female=true)` → `"'What is your gender?' is 'Female'"`
   - `(patient_age>16)` → `"'Age' is greater than '16'"`

3. Joins conditions with "AND" or "OR".

**Example output:** `"Shown when: 'What is your gender?' is 'Female' AND 'Age' is greater than '16'"`

If a characteristic cannot be resolved (no matching question/option found), the raw characteristic key is shown as a fallback.

---

## Display Component

**File:** `/components/questionnaire/EnableWhenDisplay.tsx`

Renders the human-readable translation below the question in the review interface. Only shown if `enableWhen` is not null.

---

## Storage

`enable_when` is stored as JSONB in both `master_questions` and `instance_questions`. The parsed `EnableWhen` object is stored directly — no re-parsing needed at read time.

---

## Example Characteristics

Common characteristic keys from the MyPreOp format:

| Key | Meaning |
|---|---|
| `patient_is_female` | Patient selected "Female" for gender |
| `patient_is_male` | Patient selected "Male" for gender |
| `patient_age` | Patient's age (numeric) |
| `patient_is_diabetic` | Patient has diabetes |
| `patient_is_smoker` | Patient is a smoker |

These are defined by the questionnaire itself — the system discovers them dynamically from the CSV rather than using a fixed dictionary.
