# User Workflows

## Account Manager Workflow

### 1. Upload a Questionnaire

1. Sign in at `/dashboard` using your account.
2. Click **Upload** → navigate to `/dashboard/upload`.
3. Drag and drop (or browse for) a CSV file in MyPreOp format.
4. Enter a questionnaire name and click **Upload**.
5. Validation runs immediately — errors are shown inline with row numbers. Fix and re-upload if needed.
6. On success you are redirected to the master dashboard (`/masters/[adminLinkId]`).

### 2. Create a Trust Instance

From the master dashboard:

1. Enter the trust organization's name (e.g., `"St. Thomas' Trust"`).
2. Click **Create Instance**.
3. A shareable link is generated (e.g., `https://questionaireaudit.com/instance/abc123`).
4. Copy the link and send it to the trust team.

You can create as many instances as needed — one per trust organization — all from the same master template.

### 3. Review Suggestions

- **All trusts at once**: `/masters/[adminLinkId]/suggestions` — aggregated view grouped by trust and status.
- **One trust at a time**: Click into a specific instance from the master dashboard.

For each suggestion you can:
- **Approve** or **Reject** — sets the status visible to the trust user.
- **Add a response message** — shown to the submitter.
- **Add an internal comment** — only visible to account managers.
- **View comment threads** — see back-and-forth conversation with submitters.

---

## Trust User Workflow

### 1. Open Your Review Link

Open the link received from the account manager (no login required).

You land on the question review interface for your trust's instance.

### 2. Browse Questions

- **Search** the question list by typing in the search box.
- **Filter** by category/section using the filter dropdown.
- Each question card shows:
  - Question ID, category, section, page
  - Answer type and options
  - Required status
  - Conditional logic (EnableWhen) in plain English
  - Helper text/link if present
  - Count of existing suggestions from your team

### 3. Propose a Change

1. Click a question to open it in the edit panel (or modal on mobile).
2. Work through the tabs:

   | Tab | What you can change |
   |---|---|
   | **Settings** | Toggle whether the question is required |
   | **Content** | Edit question text, answer type, add/modify/remove options |
   | **Help** | Edit helper name, type (text or link), and value |
   | **Logic** | Describe desired changes to conditional display logic |
   | **Review** | Enter your name, email, and notes (50–2000 chars), then submit |

3. At least one change must be made across any tab before you can submit.
4. Navigating away from an unsaved question prompts a warning.

### 4. Track Submissions

- Visit `/instance/[trustLinkId]/suggestions` to see all suggestions on your instance.
- Filter by status: **Pending**, **Approved**, **Rejected**.
- View the account manager's response message when they act on your suggestion.
- Add follow-up comments to start a conversation.

---

## Suggestion Status Lifecycle

```
[Submitted] → Pending
                 ├── Approved  (account manager action)
                 └── Rejected  (account manager action)
```

Status changes are visible to trust users on the suggestions page.
