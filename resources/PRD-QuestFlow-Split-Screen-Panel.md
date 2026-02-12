# Product Requirements Document (PRD)
## QuestFlow: Split-Screen Panel-Based Suggestion System

---

**Document Type:** Product Requirements Document  
**Project:** QuestFlow - Questionnaire Review Platform  
**Feature:** Split-Screen Panel with Component-Level Editing  
**Version:** 1.0  
**Date:** February 9, 2026  
**Author:** [Your Name]  
**Status:** Draft - Pending Review  

---

## Document Control

| Role | Name | Date |
|------|------|------|
| **Product Manager** | [Name] | [Date] |
| **UX Designer** | [Your Name] | Feb 9, 2026 |
| **Engineering Lead** | [Name] | [Date] |
| **Stakeholder** | [Name] | [Date] |

**Approval Status:** ⬜ Draft | ⬜ In Review | ⬜ Approved | ⬜ Development Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Objectives](#goals--objectives)
4. [Success Metrics](#success-metrics)
5. [User Personas](#user-personas)
6. [User Stories & Use Cases](#user-stories--use-cases)
7. [Functional Requirements](#functional-requirements)
8. [Technical Requirements](#technical-requirements)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [User Interface Specifications](#user-interface-specifications)
11. [User Flows](#user-flows)
12. [Edge Cases & Error Handling](#edge-cases--error-handling)
13. [Dependencies & Integrations](#dependencies--integrations)
14. [Security & Privacy](#security--privacy)
15. [Phased Rollout Plan](#phased-rollout-plan)
16. [Out of Scope](#out-of-scope)
17. [Open Questions](#open-questions)
18. [Appendices](#appendices)

---

## Executive Summary

### Overview

QuestFlow is transitioning from a **modal-based suggestion interface** to a **split-screen panel-based system** that allows healthcare trust users to suggest granular changes to questionnaire components while maintaining full context of the questionnaire structure.

### Current State (Modal-Based System)

**How it works today:**
- User clicks "Suggest Change" on a question
- Modal popup appears, blocking the questionnaire view
- User writes free-text suggestion in single text area
- User submits suggestion
- Modal closes

**Problems with current approach:**
- ❌ Loses context - can't see surrounding questions
- ❌ Vague suggestions - "change this question" without specifics
- ❌ No granularity - can't distinguish between text change vs. logic change
- ❌ Account managers must interpret ambiguous requests
- ❌ No preview of changes
- ❌ Can't reference other questions while editing
- ❌ Mobile experience is cramped

### Proposed State (Panel-Based System)

**How it will work:**
- Split-screen interface: questions list (left) + edit panel (right)
- User clicks question → edit panel opens on right
- 5 tabbed sections for different components (Settings, Content, Help, Logic, Review)
- Structured forms for each component type
- Summary review before submission
- Context preserved - questions list always visible
- Mobile: Full-screen modal with same tab structure

**Benefits:**
- ✅ Context preserved - see surrounding questions
- ✅ Granular suggestions - specific to component
- ✅ Structured data - easy for account managers to process
- ✅ Preview capability - see changes before submitting
- ✅ Better mobile experience - dedicated full-screen focus
- ✅ Reduced back-and-forth - clear, actionable suggestions
- ✅ Audit trail - track exactly what was suggested

---

## Problem Statement

### Business Problem

**Current inefficiencies:**
- Account managers spend **2-3 hours per questionnaire** interpreting vague suggestions
- **30% of suggestions** require clarification calls/emails with trusts
- **Average 5-day turnaround** from suggestion to implementation
- **Manual tracking** in spreadsheets prone to errors
- Trusts frustrated by lack of visibility into suggestion status

**Impact:**
- Delayed questionnaire updates affect patient care
- Account manager time wasted on clarification instead of value-add work
- Poor trust satisfaction scores (NPS: 42)
- Difficult to scale beyond 10-15 trust accounts per account manager

### User Problem

**For Trust Users (Healthcare Professionals):**
- Can't see question context while suggesting changes
- Unclear what aspects of question can be changed
- No visibility into whether suggestion was understood correctly
- Can't preview how changes will look to patients
- Difficult to collaborate with colleagues on same questionnaire

**For Account Managers:**
- Ambiguous suggestions like "make this clearer" without specifics
- Must interpret intent ("Did they want to change the question text or add a helper?")
- Manual process to update questionnaires based on suggestions
- No structured data to export or analyze

### Technical Problem

- Modal-based UI doesn't scale to complex, multi-component editing
- No state management for multi-step suggestion workflows
- Mobile modal experience is cramped and difficult
- Lack of structured suggestion data in database

---

## Goals & Objectives

### Primary Goals

1. **Reduce suggestion ambiguity by 80%**
   - Structured forms eliminate vague free-text suggestions
   - Clear component-level editing

2. **Decrease account manager processing time by 50%**
   - From 2-3 hours to 1-1.5 hours per questionnaire
   - Reduce clarification calls from 30% to <5%

3. **Improve turnaround time by 40%**
   - From 5-day average to 3-day average
   - Faster processing due to clear, actionable suggestions

4. **Increase trust satisfaction (NPS) from 42 to 65+**
   - Better experience suggesting changes
   - Visibility into what can be edited
   - Preview capability builds confidence

### Secondary Goals

5. **Enable account managers to handle 50% more trust accounts**
   - From 10-15 accounts to 15-22 accounts
   - Due to reduced processing time

6. **Improve mobile experience**
   - 90%+ mobile usability score (currently 62%)
   - Dedicated full-screen editing experience

7. **Enable better analytics**
   - Track which components are most frequently changed
   - Identify patterns in suggestions
   - Inform questionnaire design best practices

### Non-Goals (Out of Scope for This Release)

- ❌ Real-time collaborative editing
- ❌ Inline editing by account managers (still separate admin interface)
- ❌ Visual logic builder for EnableWhen (text-based for MVP)
- ❌ Auto-save drafts (all-or-nothing submission)
- ❌ Version control / revision history
- ❌ Bulk editing multiple questions at once

---

## Success Metrics

### Primary KPIs

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| **Suggestion Clarity** | 70% need clarification | <5% need clarification | Track clarification emails/calls |
| **Account Manager Time** | 2.5 hrs/questionnaire | 1.25 hrs/questionnaire | Time tracking in admin dashboard |
| **Turnaround Time** | 5 days average | 3 days average | Date submitted → date resolved |
| **Trust NPS** | 42 | 65+ | Quarterly survey |

### Secondary KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Mobile Usability Score** | 90%+ | User testing (SUS score) |
| **Completion Rate** | 85%+ | % who start suggesting → submit |
| **Error Rate** | <5% | Submissions blocked by validation |
| **Preview Usage** | 70%+ | % of users who click preview before submit |
| **Component-Level Editing** | 80%+ | % of suggestions targeting specific component vs. general |

### Leading Indicators (Early Signals)

- **Week 1:** User adoption rate (% of trust users who try new interface)
- **Week 2:** Average time to complete first suggestion
- **Week 3:** Ratio of structured suggestions vs. "Other" free-text
- **Week 4:** Number of support tickets related to interface

---

## User Personas

### Persona 1: Sarah - Trust Clinical Lead

**Demographics:**
- Age: 42
- Role: Senior Nurse / Clinical Lead
- Experience: 15 years in healthcare
- Tech Savvy: Medium (comfortable with email, basic software)

**Goals:**
- Ensure questionnaires are clinically accurate
- Questions are clear and understandable for patients
- Workflow is efficient (limited time for admin tasks)

**Pain Points:**
- Current modal blocks view of other questions
- Can't compare similar questions
- Unclear what can be edited vs. fixed
- No way to preview changes

**Behaviors:**
- Reviews questionnaires in 30-45 minute sessions
- Often needs to reference clinical guidelines
- Collaborates with colleagues (shares feedback verbally, then one person submits)
- Primarily desktop user, occasionally tablet

**Needs from New System:**
- See context (surrounding questions) while editing
- Clear indication of what's editable
- Preview how changes look to patients
- Ability to explain clinical rationale for changes

---

### Persona 2: David - Account Manager

**Demographics:**
- Age: 34
- Role: Account Manager (manages 12 trust accounts)
- Experience: 5 years in client services
- Tech Savvy: High (uses multiple software tools daily)

**Goals:**
- Process suggestions quickly and accurately
- Minimize back-and-forth with trusts
- Maintain high trust satisfaction
- Scale to manage more accounts

**Pain Points:**
- Vague suggestions require interpretation
- Must manually track suggestions in spreadsheet
- Time-consuming clarification calls
- Difficult to prioritize suggestions

**Behaviors:**
- Processes suggestions in batches (2-3 hour blocks)
- Forwards suggestions to internal dev team
- Tracks in Excel (suggestion, status, date, notes)
- Juggles multiple trusts simultaneously

**Needs from New System:**
- Structured, clear suggestions
- Easy to export/track suggestions
- Prioritization indicators
- Reduce or eliminate clarification needs

---

### Persona 3: Emma - Trust User (Staff Nurse)

**Demographics:**
- Age: 28
- Role: Staff Nurse
- Experience: 3 years
- Tech Savvy: High (grew up with technology)

**Goals:**
- Provide feedback on questionnaires quickly
- Ensure questions make sense to patients
- Submit suggestions without hassle

**Pain Points:**
- Current interface feels clunky on mobile
- Not sure if her suggestions are understood
- Can't see status of submitted suggestions
- Wishes she could see colleagues' suggestions

**Behaviors:**
- Often reviews on mobile during breaks
- Provides practical, patient-facing feedback
- Wants quick, simple interactions
- May submit multiple suggestions in one session

**Needs from New System:**
- Mobile-friendly interface
- Clear, simple editing process
- Confidence suggestions were understood
- See suggestions from colleagues

---

## User Stories & Use Cases

### Epic 1: View & Browse Questionnaires

**US-1.1: As a trust user, I want to see the full list of questions in a questionnaire so that I can understand the overall structure.**

**Acceptance Criteria:**
- Questions list displayed on left side of screen (desktop)
- Questions grouped by Section and Page
- Each question shows: ID, question text (truncated), answer type, suggestion count
- Sections collapsible/expandable
- Search/filter capability

---

**US-1.2: As a trust user, I want to see statistics about the questionnaire so that I understand its current state.**

**Acceptance Criteria:**
- Stats banner at top showing:
  - Total questions
  - Questions with suggestions
  - My suggestions
  - Pending/approved/rejected counts
- Stats persist while scrolling (sticky)
- Responsive on mobile (collapsed to icons)

---

### Epic 2: Select & Edit Questions

**US-2.1: As a trust user, I want to select a question to edit so that I can suggest specific changes.**

**Acceptance Criteria:**
- Click question card → edit panel opens on right
- Selected question shows blue border + edit icon + "Editing" status
- Surrounding questions remain visible for context
- Selected question scrolls to center of viewport
- Edit panel displays question details in tabbed interface

---

**US-2.2: As a trust user, I want to suggest changes to question text so that it's clearer for patients.**

**Acceptance Criteria:**
- Content tab shows current question text
- Text area for suggested new text
- Character counter (if limit exists)
- Before/after comparison visible
- Can edit and revise before submitting

---

**US-2.3: As a trust user, I want to suggest adding/removing/modifying answer options so that questions capture the right information.**

**Acceptance Criteria:**
- Content tab shows current answer options
- Checkboxes to: Add option, Modify option, Remove option
- For new options: text input + characteristic (auto-generated or editable)
- For modified options: show original → suggested text
- Validation: minimum 2 options for radio/checkbox

---

**US-2.4: As a trust user, I want to suggest changes to helper text so that patients have better guidance.**

**Acceptance Criteria:**
- Help tab shows current helper content
- Can edit content block title and text
- Can add/modify/remove web links
- Can add multiple content blocks or links
- Preview of how helper appears

---

**US-2.5: As a trust user, I want to suggest changes to conditional logic so that questions appear in the right context.**

**Acceptance Criteria:**
- Logic tab shows current EnableWhen condition (if any)
- Shows parent question (what triggers this)
- Shows child questions (what this triggers)
- Visual flow diagram
- Text area to describe desired logic change (no visual builder in MVP)

---

**US-2.6: As a trust user, I want to change whether a question is required so that we don't force patients to answer inappropriate questions.**

**Acceptance Criteria:**
- Settings tab shows current required status
- Checkbox to suggest changing required ↔ optional
- Warning if changing affects dependent questions

---

### Epic 3: Review & Submit Suggestions

**US-3.1: As a trust user, I want to review all my changes before submitting so that I can catch any mistakes.**

**Acceptance Criteria:**
- Review tab shows summary of all changes grouped by tab
- Each change shows: Component, From (current), To (suggested)
- Tabs with no changes show "No changes suggested"
- Can navigate back to any tab to edit

---

**US-3.2: As a trust user, I want to provide a rationale for my suggestions so that account managers understand the context.**

**Acceptance Criteria:**
- Review tab has "Notes & Comments" text area (required)
- Minimum 50 characters enforced
- Placeholder text guides what to include
- Character counter shows (max 2000)

---

**US-3.3: As a trust user, I want to submit my suggestions so that they can be reviewed.**

**Acceptance Criteria:**
- Submit button in Review tab
- Validation runs on submit:
  - At least one change made
  - Notes field filled (min 50 chars)
  - No validation errors
- Loading spinner during submission
- Success confirmation shows
- Suggestion appears in questions list with badge count

---

**US-3.4: As a trust user, I want to be warned if I try to leave with unsaved changes so that I don't lose my work.**

**Acceptance Criteria:**
- Clicking another question triggers warning
- Closing browser/tab triggers warning
- Options: Keep Editing, Discard Changes
- Warning only if changes exist

---

### Epic 4: Mobile Experience

**US-4.1: As a mobile trust user, I want a focused editing experience so that I can suggest changes on my phone.**

**Acceptance Criteria:**
- Questions list view (full screen)
- Tap question → full-screen modal slides up
- Modal has same 5 tabs as desktop
- Tabs swipeable left/right
- Back button closes modal (with unsaved warning)

---

**US-4.2: As a mobile trust user, I want to easily navigate between tabs so that I can edit different components.**

**Acceptance Criteria:**
- Horizontal tab bar at top
- Active tab highlighted
- Swipe left/right to change tabs
- Tap tab name to jump directly
- Tab indicators show changed/error state

---

### Epic 5: Account Manager Review (Admin Side)

**US-5.1: As an account manager, I want to see structured suggestions so that I can process them quickly.**

**Acceptance Criteria:**
- Admin dashboard shows suggestions grouped by question
- Each suggestion shows:
  - Question ID and text
  - Component being changed (Settings, Content, Help, Logic)
  - Before/After values
  - Submitter name, email, date
  - Notes/comments from trust user
- Filter by: status, trust, date range, component type

---

**US-5.2: As an account manager, I want to approve/reject suggestions so that I can manage the workflow.**

**Acceptance Criteria:**
- Each suggestion has: Approve, Reject, Request Clarification buttons
- Text area for response message
- Status change triggers notification (future: email to trust user)
- Approved suggestions marked for implementation
- Rejected suggestions include reason

---

**US-5.3: As an account manager, I want to export suggestions so that I can share with the development team.**

**Acceptance Criteria:**
- Export to CSV button
- CSV includes all suggestion data
- Can filter before export
- Includes timestamp, status, submitter info

---

## Functional Requirements

### FR-1: Split-Screen Layout (Desktop)

**FR-1.1:** System SHALL display a split-screen interface with questions list on left (40-70% width) and edit panel on right (30-60% width).

**FR-1.2:** System SHALL allow user to drag vertical divider to adjust width proportions.

**FR-1.3:** System SHALL enforce minimum widths:
- Left panel: 30% or 320px, whichever is larger
- Right panel: 40% or 400px, whichever is larger

**FR-1.4:** System SHALL persist user's width preference in localStorage for session.

**FR-1.5:** System SHALL allow double-click on divider to reset to 50/50 default.

---

### FR-2: Stats Banner

**FR-2.1:** System SHALL display a stats banner at the top showing:
- Total questions
- Questions with suggestions
- My suggestions count
- Pending suggestions count
- Approved suggestions count
- Rejected suggestions count

**FR-2.2:** Stats banner SHALL be sticky (remain visible while scrolling).

**FR-2.3:** Stats SHALL update in real-time when suggestions are submitted.

**FR-2.4:** On mobile, stats SHALL collapse to icon-based compact view.

---

### FR-3: Questions List

**FR-3.1:** System SHALL display questions in hierarchical structure:
- Grouped by Section
- Sub-grouped by Page
- Ordered by display_order

**FR-3.2:** Each question card SHALL show:
- Question ID (alphanumeric)
- Section name
- Question text (truncated to 100 characters)
- Answer type icon
- Suggestion count badge (if >0)

**FR-3.3:** Sections SHALL be collapsible/expandable.

**FR-3.4:** System SHALL provide search functionality to filter questions by text.

**FR-3.5:** System SHALL support keyboard navigation (Tab, arrow keys).

---

### FR-4: Question Selection

**FR-4.1:** Clicking a question card SHALL:
- Add blue 3px border to card
- Add edit icon (✏️) to top-right
- Add "Editing" status text below content
- Change background to light blue (#eff6ff)
- Remove selection from previously selected question
- Scroll question to center of viewport
- Load question data into edit panel

**FR-4.2:** Selected state SHALL be clearly distinguishable from hover state.

**FR-4.3:** System SHALL show surrounding questions (minimum 1 before and 1 after) for context.

**FR-4.4:** Clicking same question again SHALL keep it selected (not toggle).

---

### FR-5: Empty State (Right Panel)

**FR-5.1:** When no question selected, right panel SHALL display:
- Empty state message: "Select a question to begin editing"
- Instructional icon (📝)
- Secondary text: "Click any question from the list on the left"

**FR-5.2:** On first visit, system SHALL display quick guide with:
- 4-5 bullet points explaining workflow
- "Got it" dismissal button
- Flag stored in localStorage to not show again

**FR-5.3:** System SHALL provide "Show guide" link to recall dismissed guide.

---

### FR-6: Edit Panel - Tab Structure

**FR-6.1:** Edit panel SHALL contain 5 tabs:
1. Settings
2. Content
3. Help
4. Logic
5. Review

**FR-6.2:** Tab navigation SHALL support:
- Click to switch tabs
- Keyboard (arrow keys) to switch tabs
- Active tab indicated by blue underline + bold text

**FR-6.3:** Tabs with changes SHALL show green dot indicator.

**FR-6.4:** Tabs with validation errors SHALL show red dot indicator.

**FR-6.5:** On mobile, tabs SHALL be horizontally scrollable and swipeable.

---

### FR-7: Settings Tab

**FR-7.1:** Settings tab SHALL display (read-only):
- Section name
- Page name
- Position (e.g., "Question 3 of 8")
- Question ID

**FR-7.2:** Settings tab SHALL allow editing:
- Required status (checkbox to suggest change)

**FR-7.3:** System SHALL show characteristics under collapsible "Advanced Details" section:
- Collapsed by default
- Shows option → characteristic mappings
- Read-only
- Small text, muted color

---

### FR-8: Content Tab

**FR-8.1:** Content tab SHALL display current:
- Question text
- Answer type (radio, checkbox, text-field, etc.)
- Answer options (if applicable)

**FR-8.2:** Content tab SHALL allow suggesting:
- New question text (textarea with character counter)
- Different answer type (dropdown)
- Add new option (text + characteristic)
- Modify existing option text
- Remove option (with confirmation)

**FR-8.3:** System SHALL validate:
- Radio/checkbox must have ≥2 options
- Characteristics must be unique per question
- Question text not empty

**FR-8.4:** Content tab SHALL include "Preview" button that opens modal showing:
- Before (current) view
- After (with suggested changes) view
- How question appears to patients

---

### FR-9: Help Tab

**FR-9.1:** Help tab SHALL display current:
- Helper enabled/disabled status
- Content block(s) - title and content
- Web link(s) - title and URL

**FR-9.2:** Help tab SHALL allow:
- Toggle helper on/off
- Edit content block title and content
- Add new content block
- Remove content block
- Add new web link (title + URL)
- Edit existing web link
- Remove web link

**FR-9.3:** System SHALL support multiple content blocks and multiple web links per question.

**FR-9.4:** System SHALL validate URLs (proper format).

---

### FR-10: Logic Tab

**FR-10.1:** Logic tab SHALL display (read-only):
- Current EnableWhen expression (if any)
- Plain English translation of expression
- Parent dependency (what question triggers this)
- Child dependencies (what questions this triggers)
- Visual flow diagram showing parent → this → children

**FR-10.2:** Logic tab SHALL allow suggesting:
- Changes to logic via text description (no visual builder in MVP)

**FR-10.3:** System SHALL show warning if question has children dependencies.

**FR-10.4:** Visual flow diagram SHALL use simple ASCII art or basic SVG.

---

### FR-11: Review Tab

**FR-11.1:** Review tab SHALL display summary grouped by:
- Settings changes
- Content changes
- Help changes
- Logic changes

**FR-11.2:** For each change, system SHALL show:
- Component type icon
- Field name
- From (current value)
- To (suggested value)

**FR-11.3:** Review tab SHALL include:
- "Notes & Comments" text area (required)
- Placeholder text guiding what to include
- Character counter (min 50, max 2000)
- Submitter name (auto-filled from account)
- Submitter email (auto-filled)
- Date (auto-filled)

**FR-11.4:** Review tab SHALL show "No changes suggested" for tabs with no edits.

**FR-11.5:** System SHALL provide "Back to Edit" link to return to tabs.

---

### FR-12: Submission & Validation

**FR-12.1:** Submit button SHALL be enabled only if:
- At least one change made across any tab
- Notes field filled (≥50 characters)
- No validation errors

**FR-12.2:** On submit, system SHALL:
- Validate all fields
- Show loading spinner
- POST suggestion data to server
- On success: Show success confirmation
- On error: Show error message, keep panel open

**FR-12.3:** Success confirmation SHALL:
- Display "Suggestions Submitted" message
- Offer options: "Edit Another Question" or "Return to Questions List"
- Update question card badge count

**FR-12.4:** System SHALL create suggestion records in database:
- One record per component changed (settings, content, help, logic)
- Link all records to same submission (submission_id)
- Include: question_id, component_type, current_value, suggested_value, submitter info, notes, timestamp

---

### FR-13: Unsaved Changes Warning

**FR-13.1:** System SHALL detect unsaved changes when user:
- Clicks different question card
- Clicks browser back button
- Closes browser tab/window
- Navigates away from page

**FR-13.2:** Warning dialog SHALL offer:
- "Keep Editing" - stay on current question
- "Discard Changes" - lose changes and proceed

**FR-13.3:** System SHALL not warn if no changes have been made.

---

### FR-14: Mobile Full-Screen Modal

**FR-14.1:** On mobile (<768px), clicking question SHALL:
- Open full-screen modal with slide-up animation (300ms)
- Display same 5-tab structure as desktop
- Show back button in header
- Show question ID in header

**FR-14.2:** Mobile modal tabs SHALL:
- Be horizontally scrollable
- Support swipe left/right to change tabs
- Show active tab indicator
- Show changed/error dots

**FR-14.3:** Mobile modal footer SHALL show:
- Cancel button (left)
- Next/Submit button (right)
- Next button on tabs 1-4
- Submit button on tab 5 (Review)

**FR-14.4:** Gestures SHALL be supported:
- Swipe from left edge → close modal (with warning if unsaved)
- Swipe left/right on tabs → change tabs
- Pull down from top → close modal (optional)

**FR-14.5:** Modal close SHALL trigger unsaved changes warning if applicable.

---

### FR-15: Responsive Breakpoints

**FR-15.1:** System SHALL adapt layout at breakpoints:
- Desktop: ≥1280px - Split screen with draggable divider
- Tablet landscape: 1024-1279px - Split screen, may disable drag
- Tablet portrait: 768-1023px - Full-screen modal
- Mobile: <768px - Full-screen modal

**FR-15.2:** Stats banner SHALL adapt:
- Desktop: Full text labels
- Tablet: Abbreviated labels
- Mobile: Icon-only compact view

---

### FR-16: Accessibility

**FR-16.1:** System SHALL support keyboard navigation:
- Tab key moves focus through interactive elements
- Arrow keys navigate between questions
- Enter/Space selects question
- Escape closes edit panel (with warning)

**FR-16.2:** System SHALL include ARIA labels:
- role="button" on question cards
- aria-pressed="true" on selected question
- role="tablist" on tab navigation
- aria-selected="true" on active tab

**FR-16.3:** System SHALL maintain sufficient contrast ratios:
- Text: ≥4.5:1 (WCAG AA)
- Large text: ≥3:1
- UI components: ≥3:1

**FR-16.4:** System SHALL not rely on color alone:
- Selected state: border + icon + text
- Tabs with changes: dot + label
- Errors: icon + color + text

---

## Technical Requirements

### TR-1: Frontend Technology Stack

**TR-1.1:** Frontend SHALL be built with:
- React 18+ (or current stable version)
- TypeScript (strongly typed)
- CSS Framework: Tailwind CSS or styled-components
- State Management: React Context or Redux (TBD with engineering)
- Routing: React Router

**TR-1.2:** Frontend SHALL be responsive:
- Mobile-first approach
- Flexbox and CSS Grid for layouts
- Media queries for breakpoints

**TR-1.3:** Browser support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE11 support required

---

### TR-2: Backend Technology Stack

**TR-2.1:** Backend SHALL be built with:
- Node.js + Express (or existing backend stack)
- RESTful API architecture
- Database: PostgreSQL or existing DB

**TR-2.2:** API endpoints SHALL include:
- GET /api/projects/:projectId/questions - Fetch all questions
- GET /api/questions/:questionId - Fetch single question details
- POST /api/suggestions - Submit suggestion
- GET /api/suggestions?questionId=X - Fetch suggestions for question
- PUT /api/suggestions/:id - Update suggestion (account manager only)
- GET /api/admin/:adminLinkId/suggestions - Fetch all (account manager)

---

### TR-3: Database Schema

**TR-3.1:** Questions table SHALL store:
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  question_id VARCHAR(50) NOT NULL,
  section VARCHAR(100),
  page VARCHAR(100),
  item_type VARCHAR(50),
  question_text TEXT,
  required BOOLEAN DEFAULT false,
  enable_when TEXT,
  has_helper BOOLEAN DEFAULT false,
  helper_type VARCHAR(20),
  helper_name VARCHAR(200),
  helper_value TEXT,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**TR-3.2:** Question Options table SHALL store:
```sql
CREATE TABLE question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text VARCHAR(200) NOT NULL,
  characteristic VARCHAR(100) NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**TR-3.3:** Suggestions table SHALL store:
```sql
CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  submission_id UUID NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  submitter_name VARCHAR(100) NOT NULL,
  submitter_email VARCHAR(100),
  component_type VARCHAR(50) NOT NULL,
  current_value JSONB,
  suggested_value JSONB,
  notes TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP
);
```

**TR-3.4:** Indexes SHALL be created on:
- questions.project_id
- questions.question_id
- suggestions.submission_id
- suggestions.question_id
- suggestions.status

---

### TR-4: API Response Format

**TR-4.1:** GET /api/projects/:projectId/questions response:
```json
{
  "trustName": "NHS Trust Name",
  "questions": [
    {
      "id": 1,
      "questionId": "zz9pdx4cA0UYnHqcrM3o",
      "section": "Who I Am",
      "page": "Allergies",
      "itemType": "radio",
      "questionText": "Are you allergic to any drugs?",
      "required": true,
      "enableWhen": null,
      "hasHelper": true,
      "helperType": "contentBlock",
      "helperName": "About Allergies",
      "helperValue": "<p>An allergy is...</p>",
      "options": [
        {
          "id": 1,
          "optionText": "Yes",
          "characteristic": "patient_has_allergies"
        },
        {
          "id": 2,
          "optionText": "No",
          "characteristic": "patient_has_no_allergies"
        }
      ],
      "suggestionCount": 2
    }
  ]
}
```

**TR-4.2:** POST /api/suggestions request body:
```json
{
  "submissionId": "uuid-v4",
  "questionId": 1,
  "submitterName": "Sarah Johnson",
  "submitterEmail": "s.johnson@nhs.uk",
  "notes": "The current question is too wordy...",
  "suggestions": [
    {
      "componentType": "question_text",
      "currentValue": {
        "questionText": "Are you allergic to any drugs or anything else?"
      },
      "suggestedValue": {
        "questionText": "Do you have any drug or latex allergies?"
      }
    },
    {
      "componentType": "options",
      "currentValue": {
        "options": [
          {"text": "Yes", "characteristic": "patient_has_allergies"},
          {"text": "No", "characteristic": "patient_has_no_allergies"}
        ]
      },
      "suggestedValue": {
        "options": [
          {"text": "Yes", "characteristic": "patient_has_allergies"},
          {"text": "No", "characteristic": "patient_has_no_allergies"},
          {"text": "Unknown", "characteristic": "patient_allergy_unknown"}
        ]
      }
    }
  ]
}
```

---

### TR-5: Performance Requirements

**TR-5.1:** Page load time SHALL be <2 seconds on 3G connection.

**TR-5.2:** Question selection SHALL respond within 100ms.

**TR-5.3:** Tab switching SHALL complete within 200ms.

**TR-5.4:** Draggable divider SHALL resize smoothly at 60fps.

**TR-5.5:** Modal animations SHALL run at 60fps on mobile devices.

**TR-5.6:** API responses SHALL return within:
- GET requests: <500ms
- POST requests: <1000ms

---

### TR-6: Data Validation

**TR-6.1:** Frontend validation SHALL check:
- Required fields not empty
- Email format valid
- URLs properly formatted
- Character limits enforced
- Minimum option count (2 for radio/checkbox)

**TR-6.2:** Backend validation SHALL check:
- All frontend validations (defense in depth)
- questionId exists in database
- submitterEmail matches authenticated user (if auth implemented)
- JSONB structure valid
- SQL injection prevention (parameterized queries)

**TR-6.3:** Validation errors SHALL return:
- HTTP 400 Bad Request
- JSON response with field-level errors
```json
{
  "error": "Validation failed",
  "fields": {
    "questionText": "Question text is required",
    "notes": "Notes must be at least 50 characters"
  }
}
```

---

### TR-7: State Management

**TR-7.1:** Application state SHALL track:
- Selected question ID
- Current active tab
- Changes made in each tab
- Validation errors
- Submission status

**TR-7.2:** Component state SHALL track:
- Panel width proportions
- Collapsed/expanded sections
- Form field values
- Preview modal open/closed

**TR-7.3:** Persistent state (localStorage) SHALL store:
- Panel width preference
- Quick guide dismissed flag
- User preferences (if any)

---

### TR-8: Error Handling

**TR-8.1:** Network errors SHALL:
- Show user-friendly error message
- Offer retry button
- Log error to monitoring service

**TR-8.2:** Validation errors SHALL:
- Highlight field with error
- Show inline error message
- Block submission until resolved

**TR-8.3:** Server errors (500) SHALL:
- Show generic error message
- Log full error details
- Offer contact support option

---

## Non-Functional Requirements

### NFR-1: Usability

**NFR-1.1:** System SHALL achieve >80% task success rate in user testing.

**NFR-1.2:** System SHALL achieve System Usability Scale (SUS) score >75.

**NFR-1.3:** First-time users SHALL complete their first suggestion within 5 minutes (without training).

**NFR-1.4:** Mobile users SHALL achieve >85% task success rate.

---

### NFR-2: Accessibility (WCAG 2.1 Level AA)

**NFR-2.1:** All functionality SHALL be keyboard accessible.

**NFR-2.2:** Color contrast ratios SHALL meet WCAG AA standards.

**NFR-2.3:** Screen reader support SHALL be tested with NVDA and VoiceOver.

**NFR-2.4:** Form labels and instructions SHALL be programmatically associated.

**NFR-2.5:** Focus indicators SHALL be clearly visible.

---

### NFR-3: Performance

**NFR-3.1:** System SHALL support questionnaires up to 200 questions without degradation.

**NFR-3.2:** Animations SHALL maintain 60fps on devices from last 3 years.

**NFR-3.3:** Bundle size SHALL be <500KB (gzipped) for initial load.

**NFR-3.4:** Time to Interactive (TTI) SHALL be <3 seconds on 4G.

---

### NFR-4: Compatibility

**NFR-4.1:** System SHALL work on:
- Desktop: Windows 10+, macOS 10.14+
- Mobile: iOS 13+, Android 9+
- Browsers: Chrome, Firefox, Safari, Edge (last 2 versions)

**NFR-4.2:** System SHALL degrade gracefully on:
- Older browsers (show message to upgrade)
- Slow networks (show loading states)
- Offline (show offline message)

---

### NFR-5: Scalability

**NFR-5.1:** System SHALL support:
- 100+ concurrent users per trust
- 50+ trusts reviewing simultaneously
- 10,000+ suggestions per month

**NFR-5.2:** Database queries SHALL use indexes and pagination.

**NFR-5.3:** Frontend SHALL use virtual scrolling for long question lists (>100).

---

### NFR-6: Maintainability

**NFR-6.1:** Code SHALL follow:
- ESLint/TSLint rules (frontend)
- Prettier for formatting
- Component-based architecture
- Commented where complex

**NFR-6.2:** Code coverage SHALL be ≥70% for unit tests.

**NFR-6.3:** Documentation SHALL include:
- Component API documentation
- Setup/deployment instructions
- Architecture decision records

---

## User Interface Specifications

### UI-1: Color Palette

```
Primary Blue: #2563eb
Light Blue: #eff6ff
Dark Blue: #1e40af

Gray Scale:
- Gray 900 (text): #111827
- Gray 700 (secondary text): #374151
- Gray 500 (muted): #6b7280
- Gray 300 (borders): #d1d5db
- Gray 100 (backgrounds): #f3f4f6
- Gray 50 (subtle backgrounds): #f9fafb

Success Green: #10b981
Warning Orange: #f59e0b
Error Red: #ef4444

Background: #ffffff
```

---

### UI-2: Typography

```
Font Family: 
- Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial
- Monospace: "Courier New", Courier, monospace (for IDs, technical details)

Font Sizes:
- xs: 12px (captions, helper text)
- sm: 14px (secondary text, labels)
- base: 16px (body text, inputs)
- lg: 18px (subheadings)
- xl: 20px (headings)
- 2xl: 24px (page titles)

Line Heights:
- Tight: 1.25 (headings)
- Normal: 1.5 (body text)
- Relaxed: 1.75 (long-form content)

Font Weights:
- Normal: 400
- Medium: 500 (labels, emphasis)
- Semibold: 600 (headings)
- Bold: 700 (strong emphasis)
```

---

### UI-3: Spacing Scale

```
4px  (0.25rem) - xs
8px  (0.5rem)  - sm
12px (0.75rem) - md
16px (1rem)    - base
24px (1.5rem)  - lg
32px (2rem)    - xl
48px (3rem)    - 2xl
64px (4rem)    - 3xl
```

---

### UI-4: Component Specifications

**Question Card (Default):**
```
Width: 100% of left panel
Padding: 16px
Border: 1px solid #d1d5db
Border-radius: 8px
Background: #ffffff
Margin-bottom: 8px
Cursor: pointer

Hover:
  Background: #f9fafb
  Border-color: #9ca3af

Selected:
  Border: 3px solid #2563eb
  Background: #eff6ff
  Box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1)
```

**Tab Navigation:**
```
Height: 48px
Border-bottom: 1px solid #e5e7eb
Background: #ffffff

Tab Button:
  Padding: 12px 16px
  Font-size: 14px
  Font-weight: 500
  Color: #6b7280 (inactive)
  
  Active:
    Color: #2563eb
    Border-bottom: 2px solid #2563eb
    Font-weight: 600
    
  Hover:
    Color: #374151
```

**Input Fields:**
```
Height: 40px (single-line)
Padding: 8px 12px
Border: 1px solid #d1d5db
Border-radius: 6px
Font-size: 14px
Background: #ffffff

Focus:
  Border-color: #2563eb
  Outline: 2px solid #bfdbfe
  
Error:
  Border-color: #ef4444
  Background: #fef2f2
```

**Buttons:**
```
Primary:
  Background: #2563eb
  Color: #ffffff
  Padding: 10px 20px
  Border-radius: 6px
  Font-weight: 500
  
  Hover: Background: #1e40af
  Active: Background: #1e3a8a
  Disabled: Background: #93c5fd, Cursor: not-allowed

Secondary:
  Background: #ffffff
  Color: #374151
  Border: 1px solid #d1d5db
  
  Hover: Background: #f9fafb
```

---

### UI-5: Animation Specifications

**Panel Transitions:**
```
Duration: 200ms
Easing: cubic-bezier(0.4, 0, 0.2, 1) // ease-in-out
Properties: width, transform
```

**Modal (Mobile):**
```
Slide In:
  Duration: 300ms
  Easing: cubic-bezier(0, 0, 0.2, 1) // ease-out
  Transform: translateY(100%) → translateY(0)
  
Slide Out:
  Duration: 250ms
  Easing: cubic-bezier(0.4, 0, 1, 1) // ease-in
  Transform: translateY(0) → translateY(100%)
```

**Tab Switch:**
```
Duration: 200ms
Easing: ease-in-out
Content fade: opacity 0 → 1
Indicator slide: transform translateX()
```

**Selection:**
```
Duration: 150ms
Easing: ease-in-out
Properties: border-color, background-color, box-shadow
```

---

## User Flows

### Flow 1: First-Time User - Submit Suggestion (Desktop)

```
1. User loads questionnaire review page
   ↓
2. Sees split screen: Questions list (left) + Empty panel with guide (right)
   ↓
3. Reads quick guide (4-5 bullets)
   ↓
4. Clicks "Got it" to dismiss guide
   ↓
5. Browses questions list, finds question to edit
   ↓
6. Clicks question card
   ↓
7. Question highlights (blue border + icon + "Editing" text)
   ↓
8. Edit panel opens with Settings tab active
   ↓
9. User clicks Content tab
   ↓
10. Edits question text in "Suggest new text" field
    ↓
11. Scrolls down, checks "Add new option"
    ↓
12. Fills in option text and characteristic
    ↓
13. Clicks Help tab
    ↓
14. Edits helper text
    ↓
15. Clicks Review tab
    ↓
16. Sees summary of all changes (question text, add option, helper text)
    ↓
17. Fills in "Notes & Comments" field (required, min 50 chars)
    ↓
18. Clicks Submit button
    ↓
19. Loading spinner shows
    ↓
20. Success confirmation appears
    ↓
21. User chooses "Return to Questions List"
    ↓
22. Question card now shows badge "1 suggestion"
    ↓
23. Edit panel closes, returns to empty state
```

**Total Steps:** 23  
**Expected Time:** 3-5 minutes  
**Error Scenarios:**
- Step 17: Notes too short → Inline error, cannot submit
- Step 18: Network error → Error message, retry option
- Step 6: Unsaved changes on previous question → Warning dialog

---

### Flow 2: Returning User - Quick Edit (Desktop)

```
1. User loads page (guide dismissed previously, not shown)
   ↓
2. Sees split screen with last-used panel width (restored from localStorage)
   ↓
3. Uses search to find specific question
   ↓
4. Clicks question
   ↓
5. Goes directly to Content tab (remembers from last time)
   ↓
6. Makes quick change to option text
   ↓
7. Clicks Review tab
   ↓
8. Fills notes field
   ↓
9. Submits
   ↓
10. Success
```

**Total Steps:** 10  
**Expected Time:** 1-2 minutes

---

### Flow 3: Mobile User - Submit Suggestion

```
1. User opens page on phone
   ↓
2. Sees questions list (full screen)
   ↓
3. Stats banner shows at top (icon-based, compact)
   ↓
4. Taps question card
   ↓
5. Full-screen modal slides up from bottom
   ↓
6. Modal shows header: "← Back | Q002"
   ↓
7. Tabs visible: [Settings | Content | ...]
   ↓
8. Currently on Settings tab (default)
   ↓
9. Swipes left to go to Content tab
   ↓
10. Edits question text
    ↓
11. Swipes left to Help tab
    ↓
12. Edits helper text
    ↓
13. Swipes left to Review tab
    ↓
14. Sees summary
    ↓
15. Fills notes (on-screen keyboard appears)
    ↓
16. Taps Submit button (footer)
    ↓
17. Loading spinner
    ↓
18. Success dialog
    ↓
19. Taps "Return to Questions List"
    ↓
20. Modal slides down
    ↓
21. Back to questions list, badge updated
```

**Total Steps:** 21  
**Expected Time:** 4-6 minutes (slower due to typing on mobile)

---

### Flow 4: Account Manager - Review Suggestions

```
1. Account manager logs into admin dashboard
   ↓
2. Sees list of all suggestions grouped by questionnaire
   ↓
3. Filters by "Pending" status
   ↓
4. Clicks on questionnaire "Allergy Pre-Op Form"
   ↓
5. Sees suggestions grouped by question
   ↓
6. Clicks on Question Q002
   ↓
7. Sees 3 suggestions:
   - Question text change
   - Add option
   - Helper text change
   ↓
8. Reviews each suggestion:
   - Sees before/after comparison
   - Reads trust user's notes/rationale
   ↓
9. Approves question text change
   ↓
10. Approves add option
    ↓
11. Rejects helper text change (adds response: "This conflicts with clinical guidelines")
    ↓
12. Marks suggestions as "Ready for Implementation"
    ↓
13. Exports approved suggestions to CSV
    ↓
14. Forwards CSV to internal dev team
```

**Total Steps:** 14  
**Expected Time:** 5-10 minutes per questionnaire

---

## Edge Cases & Error Handling

### Edge Case 1: Network Timeout During Submission

**Scenario:** User submits suggestion, but network times out before server responds.

**Handling:**
- Show loading spinner for max 30 seconds
- After 30s, show error: "Submission timed out. Please try again."
- Offer "Retry" button
- Do NOT clear form data (preserve user's work)
- Log error to monitoring service

**User Experience:**
```
[Submit button clicked]
  ↓
[Loading spinner... 30 seconds pass]
  ↓
[Error dialog appears]
  "We couldn't submit your suggestions due to a connection issue.
   Your changes have been saved. Click Retry to submit again."
  
  [Retry] [Cancel]
```

---

### Edge Case 2: User Opens Multiple Browser Tabs

**Scenario:** User opens same questionnaire in 2 browser tabs, makes different edits in each.

**Handling:**
- Each tab operates independently (no real-time sync in MVP)
- If user submits in Tab A, then Tab B, both suggestions recorded
- Account manager sees 2 separate submissions from same user
- Future: Add warning "You have this open in another tab"

---

### Edge Case 3: Question Deleted While User Is Editing

**Scenario:** Account manager deletes a question while trust user is editing it.

**Handling:**
- On submit, server returns 404 "Question not found"
- Frontend shows error: "This question has been removed from the questionnaire. Your changes cannot be submitted."
- Offer to return to questions list
- Log incident for review

---

### Edge Case 4: Very Long Question Text (>5000 characters)

**Scenario:** User pastes extremely long text into question field.

**Handling:**
- Enforce character limit: 2000 characters (configurable)
- Show character counter turning red when >1900
- Block submission if exceeded
- Error message: "Question text is too long (2145/2000 characters). Please shorten."

---

### Edge Case 5: User Tries to Remove All Options

**Scenario:** User unchecks all options in a radio question, leaving 0 options.

**Handling:**
- Validation error: "Radio questions must have at least 2 options"
- Highlight Options section with red border
- Block submission
- Suggest: "Please add at least 2 options or suggest changing the answer type"

---

### Edge Case 6: Browser Crash Mid-Edit

**Scenario:** Browser crashes while user is editing (not submitted yet).

**Handling:**
- In MVP: Changes lost (no auto-save)
- Show warning when user reopens: "You had unsaved changes. Auto-save is coming soon."
- Future: Implement localStorage auto-save every 30 seconds

---

### Edge Case 7: Conflicting Suggestions from Same Trust

**Scenario:** Two users from same trust submit conflicting suggestions on same question.

**Handling:**
- Both suggestions accepted and recorded
- Account manager dashboard shows both
- Account manager decides which to implement (or merges them)
- System does not attempt to resolve conflicts automatically

---

### Edge Case 8: EnableWhen References Non-Existent Question

**Scenario:** User suggests EnableWhen logic that references Question ID that doesn't exist.

**Handling:**
- In MVP: Accept as text description, no validation
- Account manager reviews manually
- Future: Validate questionId exists when visual builder implemented

---

### Edge Case 9: Special Characters in Input

**Scenario:** User enters special characters (HTML tags, SQL, emoji) in fields.

**Handling:**
- Sanitize input on backend (prevent XSS, SQL injection)
- Allow emoji and standard punctuation
- Strip or escape HTML tags
- Display properly on account manager side

---

### Edge Case 10: Extremely Large Questionnaire (500+ questions)

**Scenario:** Questionnaire has 500 questions, slow to load and scroll.

**Handling:**
- Implement virtual scrolling (only render visible questions)
- Paginate questions list (50 per page)
- Add loading skeleton while fetching
- Optimize with React.memo and useMemo

---

## Dependencies & Integrations

### Internal Dependencies

**DEP-1: Authentication System**
- Panel-based system relies on existing authentication
- User must be logged in to access questionnaire review
- User info (name, email) pulled from auth context

**DEP-2: Account Management System**
- Trust-to-account-manager assignments
- Admin dashboard integration
- Approval workflow

**DEP-3: Questionnaire CSV Upload System**
- Questions loaded from CSV upload feature
- Panel system displays questions from database populated by CSV parser

**DEP-4: Notification System (Future)**
- Not in MVP, but will integrate for:
  - Email notifications when suggestion status changes
  - Reminders for pending suggestions

---

### External Dependencies

**DEP-5: Email Service (Future, not MVP)**
- SendGrid, AWS SES, or similar
- For status update notifications
- Not blocking MVP launch

**DEP-6: Analytics/Monitoring**
- Google Analytics or Mixpanel
- Track user interactions, conversion funnels
- Error monitoring: Sentry or similar

**DEP-7: CDN (if applicable)**
- Static asset delivery
- Faster load times globally

---

### Third-Party Libraries

**DEP-8: React Libraries**
- react-router-dom: Navigation
- react-hook-form: Form state management
- zod or yup: Validation schemas

**DEP-9: UI Libraries (Optional)**
- Headless UI or Radix UI: Accessible components
- Tailwind CSS: Styling
- Framer Motion (optional): Advanced animations

**DEP-10: Utilities**
- lodash or lodash-es: Utility functions
- date-fns: Date formatting
- uuid: Generate submission IDs

---

## Security & Privacy

### SEC-1: Authentication & Authorization

**SEC-1.1:** All API endpoints SHALL require authentication (except public documentation).

**SEC-1.2:** Trust users SHALL only access questionnaires assigned to their trust.

**SEC-1.3:** Account managers SHALL only access suggestions for their assigned trusts.

**SEC-1.4:** System SHALL use JWT tokens or session-based auth (consistent with existing system).

---

### SEC-2: Data Protection

**SEC-2.1:** All data in transit SHALL be encrypted (HTTPS/TLS 1.2+).

**SEC-2.2:** Sensitive data at rest SHALL be encrypted (database-level encryption).

**SEC-2.3:** User emails SHALL be stored hashed or encrypted.

**SEC-2.4:** System SHALL comply with GDPR:
- Users can request data deletion
- Audit logs maintained
- Data retention policies enforced

---

### SEC-3: Input Validation & Sanitization

**SEC-3.1:** All user input SHALL be validated on backend (never trust frontend).

**SEC-3.2:** System SHALL sanitize HTML input to prevent XSS attacks.

**SEC-3.3:** Database queries SHALL use parameterized statements (prevent SQL injection).

**SEC-3.4:** File uploads (future) SHALL be scanned for malware.

---

### SEC-4: Rate Limiting

**SEC-4.1:** API endpoints SHALL be rate-limited:
- 100 requests per minute per user
- 1000 requests per hour per IP

**SEC-4.2:** Submission endpoint SHALL have stricter limits:
- 10 submissions per minute per user
- Prevent spam/abuse

---

### SEC-5: Privacy

**SEC-5.1:** System SHALL not track personal health information (PHI).

**SEC-5.2:** Questions and suggestions are metadata only (no patient data).

**SEC-5.3:** Analytics SHALL anonymize user data (no PII in analytics).

**SEC-5.4:** System SHALL provide privacy policy and terms of service.

---

### SEC-6: Audit Logging

**SEC-6.1:** System SHALL log:
- All suggestion submissions (who, what, when)
- Status changes (who approved/rejected)
- Failed login attempts
- API errors

**SEC-6.2:** Logs SHALL be retained for minimum 1 year.

**SEC-6.3:** Logs SHALL be accessible to authorized personnel only.

---

## Phased Rollout Plan

### Phase 1: MVP Development (Weeks 1-8)

**Goals:**
- Build core split-screen interface
- Implement all 5 tabs
- Desktop + mobile responsive
- Basic submission workflow

**Deliverables:**
- Functional split-screen UI (desktop)
- Full-screen modal (mobile)
- All 5 tabs implemented
- Submission to database working
- Basic admin dashboard (view suggestions)

**Success Criteria:**
- Can submit suggestion end-to-end
- Data persists correctly
- Mobile experience usable

---

### Phase 2: Alpha Testing (Week 9-10)

**Participants:**
- 2-3 friendly trust users
- 1-2 account managers

**Focus:**
- Usability testing
- Bug identification
- Gather feedback on tab organization
- Test mobile experience

**Activities:**
- Moderated user testing sessions
- Think-aloud protocol
- Task completion observation
- Post-test interviews

**Success Criteria:**
- 80%+ task success rate
- No critical bugs
- Positive feedback on UX

---

### Phase 3: Beta Testing (Week 11-12)

**Participants:**
- 1-2 full trusts (10-20 users)
- Their assigned account managers

**Focus:**
- Real-world usage
- Scale testing (multiple users simultaneously)
- Edge case discovery
- Performance validation

**Activities:**
- Production-like environment
- Real questionnaires
- Monitor analytics
- Support channel available

**Success Criteria:**
- 85%+ completion rate
- <5% error rate
- No performance degradation
- Positive NPS (>50)

---

### Phase 4: Gradual Rollout (Week 13-16)

**Week 13:** 25% of trusts (5-10 trusts)  
**Week 14:** 50% of trusts (10-20 trusts)  
**Week 15:** 75% of trusts (15-30 trusts)  
**Week 16:** 100% rollout

**Monitoring:**
- Real-time error tracking
- User feedback collection
- Performance dashboards
- Support ticket volume

**Rollback Plan:**
- If critical bugs found, revert to old modal system
- Database migrations reversible
- Feature flag to toggle new UI

---

### Phase 5: Post-Launch Optimization (Week 17+)

**Activities:**
- Analyze usage data
- Identify friction points
- A/B test improvements
- Plan Phase 2 features

**Potential Improvements:**
- Auto-save drafts
- Visual logic builder
- Collaborative editing
- Advanced analytics

---

## Out of Scope (For This Release)

### Future Enhancements (Post-MVP)

**F-1: Auto-Save Drafts**
- Save changes to localStorage every 30s
- Allow users to resume editing later
- Sync drafts to server when online

**F-2: Real-Time Collaborative Editing**
- Multiple users editing same questionnaire simultaneously
- See who else is viewing/editing
- Live updates when colleagues submit

**F-3: Visual Logic Builder**
- Drag-and-drop interface for EnableWhen conditions
- Visual flow diagram that's editable
- Automatically generate condition expressions

**F-4: Bulk Editing**
- Select multiple questions
- Apply same change to all (e.g., make all optional)
- Batch submission

**F-5: Version Control / Revision History**
- See previous versions of questions
- Compare versions side-by-side
- Restore previous version

**F-6: Advanced Analytics**
- Heatmaps of most-edited components
- Trust-level reports
- Suggestion patterns dashboard

**F-7: In-App Notifications**
- Toast notifications when status changes
- Unread badge counts
- Notification center

**F-8: Comments & Discussion Threads**
- Comment on specific suggestions
- Account manager asks clarifying questions
- Threaded conversations

**F-9: Template Library**
- Save common suggestions as templates
- Apply template to similar questions
- Organization-wide templates

**F-10: Accessibility Improvements**
- Screen reader testing and refinement
- High contrast mode
- Keyboard shortcut customization
- Focus mode (hide distractions)

---

### Explicitly Not Included

**N-1:** Patient-facing questionnaire interface (separate project)

**N-2:** Questionnaire creation/authoring tool (separate project)

**N-3:** Data analytics from patient responses (separate project)

**N-4:** Integration with electronic health records (EHR)

**N-5:** Multi-language support (English only for MVP)

**N-6:** Custom branding per trust (single brand for MVP)

**N-7:** Offline mode (requires internet connection)

**N-8:** Mobile native apps (web-based only)

---

## Open Questions

### Product Questions

**Q-1:** What is the expected volume of suggestions per questionnaire?
- **Impact:** Database sizing, performance optimization
- **Owner:** Product Manager
- **Due:** Week 1

**Q-2:** How quickly must account managers respond to suggestions?
- **Impact:** Notification urgency, SLA requirements
- **Owner:** Product Manager + Account Manager Lead
- **Due:** Week 1

**Q-3:** Are there compliance/audit requirements we need to address?
- **Impact:** Logging, data retention, access controls
- **Owner:** Legal/Compliance
- **Due:** Week 2

**Q-4:** Should trusts see each other's suggestions (within same trust)?
- **Impact:** Privacy, collaboration features
- **Owner:** Product Manager + UX
- **Due:** Week 1
- **Current Assumption:** Yes, colleagues can see each other's submissions

---

### Technical Questions

**Q-5:** What's the preferred state management approach?
- **Options:** Redux, Context API, Zustand, Jotai
- **Impact:** Architecture, complexity, learning curve
- **Owner:** Engineering Lead
- **Due:** Week 1

**Q-6:** Should we use a component library or build custom?
- **Options:** Headless UI, Material-UI, Ant Design, custom
- **Impact:** Development speed, design consistency
- **Owner:** Engineering + Design
- **Due:** Week 1

**Q-7:** What's the browser support requirement?
- **Options:** Modern only, IE11 support, etc.
- **Impact:** Polyfills, testing scope
- **Owner:** Product Manager
- **Due:** Week 1
- **Current Assumption:** Modern browsers only (Chrome, Firefox, Safari, Edge)

**Q-8:** Performance concerns with large questionnaires (200+ questions)?
- **Impact:** Virtual scrolling, pagination strategy
- **Owner:** Engineering Lead
- **Due:** Week 2

---

### Design Questions

**Q-9:** Should we add a visual preview of the full questionnaire flow?
- **Impact:** Development scope, user value
- **Owner:** UX Designer + Product Manager
- **Due:** Week 2

**Q-10:** Do we need dark mode support?
- **Impact:** CSS complexity, accessibility
- **Owner:** UX Designer
- **Due:** Week 2
- **Current Assumption:** No, light mode only for MVP

---

### Business Questions

**Q-11:** What's the rollback plan if trusts hate the new interface?
- **Impact:** Development effort, feature flags
- **Owner:** Product Manager
- **Due:** Week 1

**Q-12:** How will we train trusts on the new system?
- **Options:** Video tutorials, documentation, live training
- **Impact:** Support load, adoption rate
- **Owner:** Customer Success
- **Due:** Week 4

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Trust** | Healthcare organization (NHS Trust) that reviews questionnaires |
| **Account Manager** | Internal team member managing trust relationships and questionnaires |
| **Suggestion** | Proposed change to a questionnaire question submitted by trust user |
| **Component** | Specific part of a question (text, options, logic, helper, settings) |
| **EnableWhen** | Conditional logic that determines when a question appears based on previous answers |
| **Characteristic** | Technical identifier associated with each answer option (e.g., patient_has_allergies) |
| **Panel** | The right-side section of the split-screen interface where editing happens |
| **Modal** | Full-screen overlay on mobile devices for editing questions |
| **Tab** | One of 5 sections in the edit interface (Settings, Content, Help, Logic, Review) |

---

### Appendix B: User Research Findings (Informing This PRD)

**Research Conducted:** January 2026  
**Participants:** 8 trust users, 3 account managers

**Key Findings:**

1. **Context Loss with Modals**
   - 7/8 trust users complained about losing sight of other questions
   - "I need to see the question before this to understand the flow"
   - "I can't remember what the previous question asked"

2. **Vague Suggestions**
   - Account managers spend 40% of time clarifying suggestions
   - "They say 'make it clearer' but don't specify how"
   - "I have to guess if they want to change the text or add a helper"

3. **Mobile Frustration**
   - 5/8 users tried to use mobile, found it "cramped" and "difficult"
   - Small modal on mobile hard to type in
   - Gave up and switched to desktop

4. **Desire for Preview**
   - All users wanted to see "how it looks to patients"
   - Current system has no preview capability
   - Users unsure if their changes make sense

5. **Collaboration Challenges**
   - Users want to see what colleagues suggested
   - Currently, they email each other screenshots
   - No built-in collaboration features

**Recommendations from Research:**
- ✅ Split-screen maintains context (addresses #1)
- ✅ Structured forms prevent vagueness (addresses #2)
- ✅ Dedicated mobile experience (addresses #3)
- ✅ Preview button (addresses #4)
- ✅ Show colleague suggestions (addresses #5)

---

### Appendix C: Competitive Analysis

**Similar Products Analyzed:**

1. **SurveyMonkey** (questionnaire builder)
   - Has split-screen editing interface
   - Question list on left, properties on right
   - Inspiration for our layout

2. **Typeform** (form builder)
   - Mobile-first approach
   - One question at a time focus
   - Inspired our mobile full-screen modal

3. **Google Forms** (form builder)
   - Simple, clean interface
   - Inline editing (different from our approach)
   - Minimal complexity

4. **Qualtrics** (advanced survey tool)
   - Complex, powerful logic builder
   - Too advanced for our users
   - We simplified with text-based logic in MVP

**Key Takeaways:**
- Split-screen is industry standard for complex editing
- Mobile requires different UX (not just responsive)
- Users prefer structured forms over free-text
- Preview is expected feature

---

### Appendix D: Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Application                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │ Questions   │  │ Edit Panel  │  │ Mobile   │  │  │
│  │  │ List        │  │ (5 Tabs)    │  │ Modal    │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │     State Management (Context/Redux)        │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTPS/TLS
┌─────────────────────────────────────────────────────────┐
│                      Backend (API)                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Express.js Server                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │ Auth        │  │ Questions   │  │ Sugges-  │  │  │
│  │  │ Middleware  │  │ Routes      │  │ tions    │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │     Validation & Business Logic             │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │ Projects │  │ Questions│  │ Suggestions  │   │  │
│  │  │ Table    │  │ Table    │  │ Table        │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  │                                                   │  │
│  │  ┌──────────────────┐                            │  │
│  │  │ Question Options │                            │  │
│  │  │ Table            │                            │  │
│  │  └──────────────────┘                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### Appendix E: Data Flow Diagram

**Suggestion Submission Flow:**

```
1. User edits in tabs
   ↓
2. Changes tracked in React state
   {
     settings: {...},
     content: {...},
     help: {...},
     logic: {...}
   }
   ↓
3. User clicks Submit in Review tab
   ↓
4. Frontend validates locally
   ↓
5. POST /api/suggestions
   Body: {
     submissionId: uuid,
     questionId: 123,
     submitterName: "...",
     notes: "...",
     suggestions: [
       {component: "question_text", current: {...}, suggested: {...}},
       {component: "options", current: {...}, suggested: {...}}
     ]
   }
   ↓
6. Backend validates
   ↓
7. Backend creates records in suggestions table
   (one row per component changed, all linked by submissionId)
   ↓
8. Response 200 OK
   ↓
9. Frontend shows success message
   ↓
10. Frontend updates question badge count
    ↓
11. Frontend clears edit state
```

---

### Appendix F: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|----------|--------|------------|
| **Users find interface too complex** | Medium | High | - User testing in alpha/beta<br>- Quick guide on first use<br>- Contextual help tooltips |
| **Performance issues with large questionnaires** | Medium | Medium | - Virtual scrolling<br>- Pagination<br>- Performance testing with 200+ questions |
| **Mobile experience not good enough** | Low | High | - Dedicated mobile design<br>- Mobile-specific user testing<br>- Gesture support |
| **Data loss during network outage** | Medium | High | - Unsaved changes warning<br>- Future: Auto-save to localStorage<br>- Retry mechanism |
| **Account managers can't process suggestions fast enough** | Low | Medium | - Structured data export<br>- Bulk operations (future)<br>- Prioritization indicators |
| **Trusts resist change from modal** | Medium | Medium | - Gradual rollout<br>- Training materials<br>- Optional toggle (fallback to old system) |
| **Backend can't handle load** | Low | High | - Load testing before launch<br>- Auto-scaling infrastructure<br>- Rate limiting |
| **Security vulnerability** | Low | Critical | - Security audit before launch<br>- Input sanitization<br>- Penetration testing |

---

### Appendix G: Success Criteria Checklist

**Before Launch:**
- [ ] All functional requirements implemented
- [ ] All 5 tabs working (Settings, Content, Help, Logic, Review)
- [ ] Desktop split-screen responsive
- [ ] Mobile full-screen modal working
- [ ] Submission to database successful
- [ ] Admin dashboard can view suggestions
- [ ] User testing completed (>80% success rate)
- [ ] Security audit passed
- [ ] Performance benchmarks met (<2s load, <100ms interactions)
- [ ] Accessibility tested (WCAG AA compliance)

**Week 1 Post-Launch:**
- [ ] >70% of users try new interface
- [ ] <10% error rate
- [ ] No critical bugs reported
- [ ] <5 support tickets per day

**Month 1 Post-Launch:**
- [ ] Suggestion clarity improved (from 70% to >95%)
- [ ] Account manager processing time reduced 25%
- [ ] Trust NPS increased by 10+ points
- [ ] Mobile usability score >80%

**Month 3 Post-Launch:**
- [ ] All primary KPIs met (see Success Metrics section)
- [ ] Account managers handling 30% more accounts
- [ ] Turnaround time down to 3 days average
- [ ] Trust NPS at 65+

---

## Approval & Sign-Off

**This PRD requires approval from:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Manager** | ____________ | ____________ | __/__/__ |
| **UX Designer** | ____________ | ____________ | __/__/__ |
| **Engineering Lead** | ____________ | ____________ | __/__/__ |
| **Business Stakeholder** | ____________ | ____________ | __/__/__ |

**Approved for Development:** ☐ Yes | ☐ No | ☐ Conditional (see notes)

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

**Document Version:** 1.0  
**Last Updated:** February 9, 2026  
**Next Review:** After Alpha Testing (Week 10)

---

**END OF PRD**
