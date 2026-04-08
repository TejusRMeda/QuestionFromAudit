# Master Questionnaires

**Location:** `/app/dashboard/page.tsx`, `/app/masters/[adminLinkId]/page.tsx`, `/app/api/masters/`

## What is a Master Questionnaire?

A master questionnaire is the authoritative template for a clinical questionnaire. It is created by uploading a CSV and owned by the account manager who uploaded it.

The master is never edited directly after upload. Instead, account managers create **trust instances** — isolated copies shared with individual trust organizations for review.

---

## Creating a Master

1. Sign in and navigate to `/dashboard/upload`.
2. Upload a CSV and provide a name.
3. The API validates the CSV, parses all questions, and stores them in:
   - `master_questionnaires` — one row for the questionnaire
   - `master_questions` — one row per question

A unique `admin_link_id` (128-bit random token) is generated and returned. This token is the account manager's key to the master.

---

## Dashboard

**URL:** `/dashboard`

Shows all master questionnaires owned by the current user in a table:

| Column | Description |
|---|---|
| Name | Questionnaire name |
| Questions | Number of questions |
| Created | Creation date |
| Actions | Link to master page, delete button |

Clicking a questionnaire name navigates to `/masters/[adminLinkId]`.

---

## Master Dashboard

**URL:** `/masters/[adminLinkId]`

Shows:
- Questionnaire name and metadata
- List of all trust instances with their shareable links
- Form to create a new trust instance (enter trust name → generates link)
- Link to the suggestions overview page

### Creating an Instance

Enter the trust organization's name and click **Create Instance**. The backend:
1. Creates a `trust_instances` row with a new random `trust_link_id`
2. Copies all `master_questions` into `instance_questions` (a snapshot)

The shareable link is `https://{domain}/instance/{trust_link_id}`.

---

## Deleting a Master

From the dashboard, click the delete icon next to a questionnaire. A confirmation modal appears. On confirm:
- The master questionnaire is deleted
- All associated master questions, trust instances, instance questions, and suggestions are cascade-deleted
- Requires authentication and ownership (enforced by RLS)

---

## Suggestions Overview

**URL:** `/masters/[adminLinkId]/suggestions`

Aggregated view of all suggestions across all trust instances for this master.

- Grouped by trust instance
- Shows pending / approved / rejected counts per trust
- Links through to the per-instance suggestions view
