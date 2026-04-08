# Suggestion System

**Location:** `/components/questionnaire/EditPanel.tsx`, `/hooks/useEditPanelState.ts`, `/types/editPanel.ts`, `/app/api/instance/[trustLinkId]/suggestions/`

## Overview

Instead of free-form comments, trust users propose **structured, component-level changes** to specific questions. Each suggestion records exactly what changed (or should change) using a typed `ComponentChanges` object.

---

## Edit Panel Tabs

### Settings Tab
**File:** `/components/questionnaire/panel/SettingsTab.tsx`

Toggle whether the question should be **Required**.

Change is recorded as:
```json
{ "settings": { "required": { "from": false, "to": true } } }
```

---

### Content Tab
**File:** `/components/questionnaire/panel/ContentTab.tsx`

Edit:
- **Question text** — free text field (shows from/to diff)
- **Answer type** — dropdown of all 20+ supported types
- **Options** — add new options, modify existing ones, mark options for removal

Option changes are recorded as typed operations:
```json
{
  "content": {
    "questionText": { "from": "Original?", "to": "Updated?" },
    "answerType": { "from": "radio", "to": "checkbox" },
    "options": [
      { "type": "add",    "updated": "New option text" },
      { "type": "modify", "original": "Old text", "updated": "New text" },
      { "type": "remove", "original": "Option to delete" }
    ]
  }
}
```

---

### Help Tab
**File:** `/components/questionnaire/panel/HelpTab.tsx`

Edit helper content:
- **Has helper** toggle
- **Helper type** — `text` or `link`
- **Helper name** — label shown to patients
- **Helper value** — body text or URL

Change recorded as:
```json
{
  "help": {
    "hasHelper": { "from": false, "to": true },
    "helperType": { "from": null, "to": "link" },
    "helperName": { "from": null, "to": "Learn more" },
    "helperValue": { "from": null, "to": "https://..." }
  }
}
```

---

### Logic Tab
**File:** `/components/questionnaire/panel/LogicTab.tsx`

Describe desired changes to the conditional display logic (EnableWhen). This is a free-text field since logic changes require clinical review.

Recorded as:
```json
{ "logic": { "description": "Should also show for patients under 18..." } }
```

---

### Review Tab
**File:** `/components/questionnaire/panel/ReviewTab.tsx`

Before submitting:
- Displays a summary of all proposed changes across all tabs
- Requires:
  - **Name** — submitter's full name
  - **Email** — submitter's email address
  - **Notes** — 50–2000 character explanation of the rationale

Submit button is disabled if:
- No changes have been made across any tab
- Notes are below 50 characters or above 2000
- Name or email is missing

---

## `ComponentChanges` Type

Defined in `/types/editPanel.ts`:

```typescript
interface ComponentChanges {
  settings?: {
    required?: { from: boolean; to: boolean };
  };
  content?: {
    questionText?: { from: string; to: string };
    answerType?: { from: string; to: string };
    options?: Array<
      | { type: "add"; updated: string }
      | { type: "modify"; original: string; updated: string }
      | { type: "remove"; original: string }
    >;
  };
  help?: {
    hasHelper?: { from: boolean; to: boolean };
    helperType?: { from: string | null; to: string | null };
    helperName?: { from: string | null; to: string | null };
    helperValue?: { from: string | null; to: string | null };
  };
  logic?: {
    description: string;
  };
}
```

---

## State Management

**File:** `/hooks/useEditPanelState.ts`

The `useEditPanelState` hook manages the entire edit panel lifecycle:

| Method | Purpose |
|---|---|
| `selectQuestion(q)` | Select a question (warns if unsaved changes exist) |
| `updateSettings(changes)` | Update settings tab state |
| `updateContent(changes)` | Update content tab state |
| `updateHelp(changes)` | Update help tab state |
| `updateLogic(changes)` | Update logic tab state |
| `hasChanges()` | Returns true if any tab has changes |
| `validate()` | Validates all fields, returns `ValidationErrors` |
| `getSubmissionData()` | Assembles the API request payload |
| `reset()` | Clears all state after successful submission |

---

## Viewing Suggestions

### Component Changes Display
**File:** `/components/questionnaire/ComponentChangesDisplay.tsx`

Renders `component_changes` JSONB in a human-readable format:
- Settings: "Required: No → Yes"
- Content: Shows from/to diffs for text; add/modify/remove badges for options
- Help: Shows each changed helper field
- Logic: Shows the description text

### Suggestion Detail Modal
**File:** `/components/questionnaire/SuggestionDetailModal.tsx`

Opens when clicking a suggestion. Shows:
- Submitter name, email, date
- Status badge
- Full component changes (via `ComponentChangesDisplay`)
- Notes / rationale
- Account manager response (if any)
- Comment thread

---

## Comment Threads

**File:** `/components/questionnaire/ConversationThread.tsx`

Both trust users and account managers can add comments to a suggestion. Comments are ordered chronologically and show the commenter's name and timestamp.

This enables back-and-forth clarification without changing the suggestion status.

---

## Validation Limits

| Field | Minimum | Maximum |
|---|---|---|
| Notes | 50 characters | 2000 characters |
| Submitter name | 1 character | — |
| Changes required | 1 component | — |
