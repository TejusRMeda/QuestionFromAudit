# Trust Instances

**Location:** `/app/instance/[trustLinkId]/page.tsx`, `/app/api/masters/[adminLinkId]/instances/`, `/app/api/instance/[trustLinkId]/`

## What is a Trust Instance?

A trust instance is a shareable copy of a master questionnaire for a specific trust organization. Each instance:

- Gets its own unique access link (`trust_link_id`)
- Contains a snapshot of the master questions at creation time
- Accumulates suggestions independently from other instances

Multiple trusts can review the same master questionnaire simultaneously, with their suggestions kept separate.

---

## Instance Data Model

At instance creation time, all `master_questions` are copied to `instance_questions`. From that point the two are decoupled — edits to the master (future uploads) do not affect existing instances.

```
Trust Instance
├── trust_name        "St. Thomas' Trust"
├── trust_link_id     "abc123xyz..."  (access token)
└── instance_questions[]
      └── instance_suggestions[]
```

---

## Trust User Interface

**URL:** `/instance/[trustLinkId]`

No login required. Accessible to anyone with the link.

### Question List (left panel / top on mobile)

- Displays all questions for the instance
- **Search**: Filters by question text in real time
- **Filter**: Filter by category/section via dropdown
- Each question card shows:
  - Question ID and category badge
  - Truncated question text
  - Answer type badge
  - Suggestion count (number of existing suggestions from the team)

### Question Detail / Edit Panel (right panel / modal on mobile)

When a question is selected, the full edit panel opens. See [Suggestion System](./suggestion-system.md) for details on submitting suggestions.

The panel displays read-only question information:
- Full question text
- Answer type and all options
- Required indicator
- Section, page, characteristic
- Conditional logic in plain English (via EnableWhen translation)
- Helper content (text or link)

---

## Responsive Layout

| Viewport | Layout |
|---|---|
| Desktop | Split-screen — question list on left, edit panel on right |
| Mobile | Question list full-width; edit panel opens as full-screen modal |

**Component:** `SplitScreenLayout.tsx` handles the desktop layout. `MobileEditModal.tsx` handles the mobile overlay.

---

## Unsaved Changes Warning

If you have unsaved changes in the edit panel and click a different question, a warning modal appears:

> "You have unsaved changes. Are you sure you want to leave?"

You can choose to discard changes and continue, or stay and finish your edits.

---

## Instance Suggestions View

**URL:** `/instance/[trustLinkId]/suggestions`

Trust users can view all suggestions submitted by anyone on their instance:

- Shows submitter name, question, status badge, and notes
- Filter by status (Pending / Approved / Rejected)
- Filter by category
- Click any suggestion to view full detail including component changes and account manager response
- Add comments to start a conversation
