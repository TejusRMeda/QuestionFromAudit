# Usability Testing Plan

## Why We Can Test Without Clinicians

The core UX patterns in this app are domain-agnostic:

- **Uploading structured data** (CSV → validated questionnaire)
- **Sharing content for review** (generating links, managing reviewers)
- **Proposing structured changes** to specific items (tabbed editor, from/to diffs)
- **Reviewing and managing feedback** (approve/reject, threaded comments)

These patterns exist across many industries. By using the [generalized onboarding CSV](../resources/usability-test-onboarding.csv), we remove health-specific content entirely.

---

## Participant Types

We need people who match the **behavioral patterns** of real users, not the domain.

### Role A: "Manager" (maps to Account Manager)

People who regularly **collect structured feedback** on documents, forms, or processes from external reviewers.

| Participant Type | Why They Match |
|---|---|
| **Quality / Compliance Auditors** | Review structured checklists, collect feedback from teams, track resolution — near-identical workflow |
| **Survey Designers / Researchers** | Build structured questionnaires, iterate based on reviewer feedback, understand question types and logic |
| **HR / People Operations** | Manage onboarding forms, policy documents, collect sign-off from department heads |
| **Training / L&D Coordinators** | Create course assessments, share with SMEs for review, incorporate feedback |
| **Project Managers** | Share deliverables for structured review, track feedback across stakeholders |

### Role B: "Reviewer" (maps to Trust User)

People who regularly **review structured content** created by others and provide specific, actionable feedback.

| Participant Type | Why They Match |
|---|---|
| **Content Editors / Technical Writers** | Review and mark up structured documents with specific change requests |
| **QA / Test Engineers** | Evaluate items systematically, propose specific fixes with rationale |
| **Team Leads reviewing process docs** | Review SOPs, checklists, training materials — suggest changes with justification |
| **Subject Matter Experts** | Review forms/surveys in their domain, suggest wording or logic changes |
| **Product Managers** | Review specs and forms, give structured feedback on content and flow |

### Ideal Mix (8–10 participants)

| # | Role | Participant Type | Why |
|---|---|---|---|
| 2 | Manager | Quality/Compliance Auditor | Closest real-world match to account manager workflow |
| 1 | Manager | Survey Designer / Researcher | Understands question structure, conditional logic |
| 1 | Manager | HR / People Operations | Natural fit with onboarding CSV theme |
| 2 | Reviewer | Content Editor / Technical Writer | Strong at proposing structured changes to text |
| 1 | Reviewer | QA / Test Engineer | Systematic, good at evaluating structured items |
| 1 | Reviewer | Team Lead / SME | Reviews forms in their domain, suggests changes |
| 1–2 | Both | Product Manager | Can test both flows, gives meta-feedback on the tool itself |

### Demographic Criteria

- **Age**: 25–55 (working professionals)
- **Tech comfort**: Moderate to high (uses web apps daily for work)
- **Device**: Must have access to both desktop and mobile (we test responsive layout)
- **No requirement**: Domain expertise in healthcare, clinical knowledge, or medical questionnaires

---

## Screener Questionnaire (for Userlytics)

### Screener Title
**Structured Feedback Tool — Usability Study**

### Screener Description
We're testing a web-based tool for managing structured questionnaires and collecting reviewer feedback. We're looking for professionals who regularly review or manage forms, surveys, checklists, or similar structured content as part of their work. No specific domain expertise is required. Sessions are moderated and last approximately 45–50 minutes.

---

### Screening Questions

**S1. Which of the following best describes your current role?** *(Single select — QUALIFYING)*

- [ ] Quality, compliance, or audit role
- [ ] Survey design or research role
- [ ] HR, people operations, or recruitment
- [ ] Training, learning & development, or education
- [ ] Content editing, technical writing, or documentation
- [ ] QA, testing, or quality engineering
- [ ] Product management or product ownership
- [ ] Project or programme management
- [ ] Team lead or department manager
- [ ] None of the above → **DISQUALIFY**

**S2. How often do you review or give feedback on structured documents (forms, surveys, checklists, process documents)?** *(Single select — QUALIFYING)*

- [ ] Daily → **QUALIFY**
- [ ] A few times a week → **QUALIFY**
- [ ] A few times a month → **QUALIFY**
- [ ] Rarely (a few times a year) → **DISQUALIFY**
- [ ] Never → **DISQUALIFY**

**S3. When you give feedback on a document or form, how do you typically do it?** *(Multi-select — QUALIFYING, must select at least 2)*

- [ ] Mark up specific sections with comments or change requests
- [ ] Write a summary of recommended changes
- [ ] Use a tracked changes or redlining tool
- [ ] Discuss verbally in a meeting
- [ ] Fill in a feedback form or template
- [ ] I don't typically give structured feedback → **DISQUALIFY if only selection**

**S4. Have you ever been responsible for collecting and managing feedback from multiple reviewers on the same document?** *(Single select — SEGMENT, not disqualifying)*

- [ ] Yes, regularly — this is a core part of my role → **Tag: Manager candidate**
- [ ] Yes, occasionally
- [ ] No, I'm usually the reviewer, not the collector → **Tag: Reviewer candidate**

**S5. Which of the following have you worked with in the past 12 months?** *(Multi-select — QUALIFYING, must select at least 1)*

- [ ] Online surveys or questionnaires (creating or reviewing)
- [ ] Compliance or audit checklists
- [ ] Onboarding or training forms
- [ ] Process documentation or SOPs
- [ ] Assessment or evaluation forms
- [ ] None of the above → **DISQUALIFY**

**S6. How comfortable are you using web-based tools and applications for your work?** *(Single select — QUALIFYING)*

- [ ] Very comfortable — I use multiple web apps daily → **QUALIFY**
- [ ] Comfortable — I regularly use web apps → **QUALIFY**
- [ ] Somewhat comfortable — I use a few basic tools → **QUALIFY (borderline)**
- [ ] Not very comfortable → **DISQUALIFY**

**S7. What devices do you have available for this study?** *(Multi-select — QUALIFYING)*

- [ ] Desktop or laptop computer → **Required**
- [ ] Smartphone (iPhone or Android)
- [ ] Tablet

*Must select "Desktop or laptop computer" to qualify.*

**S8. Have you participated in a usability study in the past 3 months?** *(Single select — PREFERENCE)*

- [ ] Yes → **Deprioritize (not disqualify)**
- [ ] No → **Prefer**

---

### Qualification Logic

**QUALIFY if:**
- S1 ≠ "None of the above"
- S2 = Daily, A few times a week, or A few times a month
- S3 has ≥ 2 selections (excluding the disqualify option)
- S5 has ≥ 1 selection (excluding "None")
- S6 ≠ "Not very comfortable"
- S7 includes "Desktop or laptop computer"

**SEGMENT by:**
- S4 answer determines role assignment (Manager vs Reviewer)
- S1 answer determines participant type for diversity tracking

**TARGET:** 8–10 qualified participants with a 50/50 split between Manager and Reviewer candidates.

---

## Moderated Test Script

### Session Overview

| Item | Detail |
|---|---|
| **Duration** | 45–50 minutes |
| **Format** | Moderated, remote (screen share + video) |
| **Tool** | Userlytics (or Zoom/Teams as backup) |
| **Prototype** | Live staging environment with test data |
| **CSV file** | `usability-test-onboarding.csv` (employee onboarding theme) |

### Pre-Session Setup (Moderator)

1. Ensure staging environment is running and clean
2. Have the CSV file ready to share via chat/link
3. Pre-create one master questionnaire with 2 trust instances (with sample suggestions) for the review tasks
4. Prepare the trust review link for reviewer tasks
5. Have note-taking template open

---

### Introduction (3 minutes)

> Hi [Name], thanks for joining today. My name is [Moderator] and I'll be guiding you through this session.
>
> We're testing a web tool that helps teams manage structured questionnaires — things like onboarding forms, checklists, surveys — and collect specific feedback from reviewers. Today we'll use an employee onboarding questionnaire as our example content.
>
> A few things before we start:
>
> - **We're testing the tool, not you.** There are no wrong answers or wrong moves. If something is confusing, that's exactly the kind of thing we want to learn.
> - **Please think aloud** as you work. Tell me what you're looking at, what you expect to happen, and what you're thinking as you make decisions.
> - **You can ask questions at any time**, but I may hold off answering until after a task so I don't influence your approach.
> - **This session will be recorded** for our team to review. Your identity will remain confidential.
>
> Do you have any questions before we begin?

---

### Warm-Up Questions (2 minutes)

> Before we dive in, I'd like to understand a bit about your work:
>
> 1. Can you briefly describe what you do in your role?
> 2. Do you ever review forms, surveys, or checklists as part of your work? What does that process look like today?
> 3. When you want to suggest a change to a form or document, how do you typically communicate that?

*Purpose: Establish baseline mental model and vocabulary. Note any frustrations with current review processes.*

---

### Scenario A: Account Manager Flow (20 minutes)

*Assign to participants tagged as "Manager candidates" in screener. Reviewer candidates skip to Scenario B.*

#### Context Setting

> Imagine you're responsible for managing an employee onboarding questionnaire that your company uses. Different regional offices need to review and suggest changes to this questionnaire. You'll use this tool to upload the questionnaire, share it with a regional office for review, and then manage their feedback.

---

#### Task A1: Sign In and Orient (2 minutes)

> Please open the tool at [staging URL]. Take a moment to look around the dashboard. Tell me what you see and what you think you can do here.

**Observe:**
- First impressions of the dashboard
- Can they identify the upload action?
- Do they understand the navigation?

**Prompts (if stuck):**
- "What do you think happens if you click [element]?"
- "Where would you go to add a new questionnaire?"

---

#### Task A2: Upload a Questionnaire (5 minutes)

> I'm going to share a CSV file with you. This is an employee onboarding questionnaire. Please upload it using the tool.

*Share the CSV file via chat.*

> Walk me through what you're doing and what you see as you upload it.

**Observe:**
- Can they find the upload page?
- Do they understand the drag-and-drop or browse interaction?
- How do they react to the validation feedback?
- Do they understand the success state and what to do next?

**Follow-up questions:**
- "What did you expect to happen after uploading?"
- "Was there anything confusing about that process?"

---

#### Task A3: Create a Trust Instance (3 minutes)

> Now imagine you want to share this questionnaire with the "London Regional Office" for them to review. How would you do that?

**Observe:**
- Can they find the instance creation UI?
- Do they understand the concept of creating an instance for a specific organization?
- Can they successfully generate and copy the share link?
- Do they understand what happens when the link is shared?

**Follow-up questions:**
- "What do you think happens when someone opens that link?"
- "If you needed to share with a second office, what would you do?"

---

#### Task A4: Review Suggestions (10 minutes)

> Some reviewers have already submitted suggestions on another questionnaire. Let me take you to that view now.

*Direct participant to the pre-seeded master with suggestions.*

> Take a look at the suggestions that have come in. Walk me through what you see.

**Sub-tasks:**
1. **Browse suggestions** — "Can you find all the suggestions that are still pending?"
2. **Understand a suggestion** — "Pick one suggestion and tell me what change the reviewer is proposing."
3. **Act on a suggestion** — "Go ahead and approve or reject that suggestion. Add a response explaining your decision."
4. **View a conversation** — "One of the suggestions has comments on it. Can you find and read the conversation?"

**Observe:**
- Can they filter/sort suggestions by status?
- Do they understand the ComponentChanges display (from → to diffs)?
- Is the approve/reject flow intuitive?
- Can they find and follow conversation threads?

**Follow-up questions:**
- "How does this compare to how you normally review feedback?"
- "Is there anything missing from this view that you'd want?"
- "Was it clear what the reviewer was asking to change?"

---

### Scenario B: Trust Reviewer Flow (20 minutes)

*Assign to participants tagged as "Reviewer candidates" in screener. Manager candidates skip to Scenario B after completing A.*

#### Context Setting

> Imagine your team lead has sent you a link to review a company onboarding questionnaire. They want your specific feedback on the questions — what should be changed, added, or removed. You'll use this tool to review the questions and submit your suggestions.

---

#### Task B1: Open the Review Link and Orient (3 minutes)

> Please open this link: [pre-seeded trust instance link]. Take a moment to look around. What do you see? What do you think you can do here?

**Observe:**
- First impressions of the question list
- Do they understand the layout (list + detail)?
- Can they identify the question cards and their information?
- Do they notice the search and filter controls?

**Prompts (if stuck):**
- "What information can you see about each question?"
- "How would you find a specific question?"

---

#### Task B2: Search and Filter (2 minutes)

> There are quite a few questions here. Can you find the questions about "workspace" or "equipment"?

**Observe:**
- Do they use search or filters?
- Is the section/category filtering intuitive?
- Can they navigate to the right questions efficiently?

---

#### Task B3: Propose a Simple Change (7 minutes)

> Let's say you think one of the questions about working location needs different wording. Find that question and propose a change to the question text.

**Observe:**
- Can they select a question to open the edit panel?
- Desktop: Do they understand the split-screen layout?
- Mobile (if testing): Do they understand the modal interaction?
- Can they find the Content tab and edit question text?
- Do they understand the from/to change display?

**Follow-up:**
- "What do you think happens to your change after you submit it?"
- "Was it clear how to edit the question?"

---

#### Task B4: Propose a Multi-Tab Change (5 minutes)

> Now find the question about "home office equipment needs." You want to: (1) make it a required question, (2) add a new option "Webcam" to the list, and (3) explain why in your notes. Go ahead and make those changes and submit.

**Observe:**
- Can they navigate between tabs (Settings, Content)?
- Can they toggle the required field?
- Can they add a new option?
- Do they understand the Review tab summary?
- Can they fill in name, email, and notes (50 char minimum)?
- Is the submission flow clear?

**Follow-up:**
- "Was it clear what each tab was for?"
- "Did the review summary match what you expected?"
- "Anything confusing about submitting?"

---

#### Task B5: Track Suggestions (3 minutes)

> You've submitted some suggestions. Now find where you can see all the suggestions your team has made, and check their status.

**Observe:**
- Can they find the suggestions page?
- Do they understand the status indicators (Pending, Approved, Rejected)?
- Can they find the manager's response on a processed suggestion?
- Can they add a follow-up comment?

---

### Cross-Role Task (if time permits, 5 minutes)

*For participants who completed their primary scenario early, or for PM participants testing both roles.*

> Now I'd like you to switch perspectives. [If they did Manager tasks:] Imagine you're the reviewer receiving a link. [If they did Reviewer tasks:] Imagine you're the manager who uploaded this questionnaire and is now reviewing suggestions.

*Run 1–2 tasks from the other scenario to capture cross-role insights.*

---

### Mobile Spot-Check (3 minutes, if participant has mobile device)

> Could you open the same link on your phone? I'd like to see how a couple of things feel on a smaller screen.

1. Browse the question list
2. Open one question to view details
3. Attempt to make a small change

**Observe:**
- Does the modal (vs split-screen) interaction make sense?
- Can they navigate tabs on mobile?
- Any touch target issues?

---

### Debrief (5 minutes)

> Thank you, that was really helpful. I have a few final questions:
>
> 1. **Overall impression** — How would you describe this tool to a colleague?
> 2. **Ease of use** — On a scale of 1–7 (1 = very difficult, 7 = very easy), how easy was it to [upload a questionnaire / propose a change]?
> 3. **Best part** — What worked well or felt intuitive?
> 4. **Worst part** — What was the most frustrating or confusing moment?
> 5. **Missing features** — Is there anything you expected to be able to do but couldn't?
> 6. **Comparison** — How does this compare to how you currently review forms or collect feedback?
> 7. **Would you use it?** — If this tool were available for your work, would you use it? Why or why not?

---

### Post-Session (Moderator)

Immediately after the session, record:

1. **Top 3 usability issues** observed (severity: critical / major / minor)
2. **Top 3 things that worked well**
3. **Participant quotes** that captured key moments
4. **Task completion** — which tasks succeeded, which needed prompts, which failed
5. **Unexpected behaviours** — anything the participant did that we didn't anticipate

---

## Metrics to Track Across Sessions

| Metric | How to Measure |
|---|---|
| **Task success rate** | % of tasks completed without moderator intervention |
| **Time on task** | Seconds per task (from instruction to completion) |
| **Error rate** | Wrong paths, misclicks, or dead ends per task |
| **Ease rating** | Self-reported 1–7 per role scenario |
| **SUS score** | System Usability Scale (post-session survey, optional) |
| **Critical issues** | Issues that blocked task completion |
| **Learnability** | Did participants improve on second/third tasks? |

---

## Summary Table

| Item | File |
|---|---|
| Test CSV | `resources/usability-test-onboarding.csv` |
| Screener | This document (Screener section above) |
| Test script | This document (Moderated Test Script above) |
| Participant types | This document (Participant Types above) |
