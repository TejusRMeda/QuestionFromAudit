# Testing Feature: AI-Powered Form Filling via Playwright

## Context
Account managers need a way to simulate patients filling out assessments for internal testing. Rather than building an internal simulation, we automate the **real patient-facing app** using Playwright. Users select a questionnaire, build a custom patient persona, Claude AI generates realistic answers, and Playwright fills + submits the actual form. This means filled assessments appear in the portal as real submissions.

**Based on CTO (Aimee) recommendation:** Generate a reusable form map from the schema, use Claude to generate persona answers, then run Playwright scripts against the patient app. The form map and Playwright navigation logic are reusable — only the persona answers change between runs.

## Key Decisions
- **AI**: Anthropic Claude SDK (`@anthropic-ai/sdk`) for answer generation
- **Browser automation**: Playwright (headless) to fill the real patient app
- **Patient app**: Separate repo, accessed via unique assessment links (e.g., `patient-app.com/assessment/<unique-id>`)
- **Execution**: UI-triggered from QuestionAudit Testing dashboard (non-devs can use it)
- **Conditionals**: EnableWhen handled naturally — Playwright fills pages as they appear, conditional questions only show if prior answers trigger them
- **Personas**: Fully custom free-form builder, saveable for reuse
- **Persistence**: Test runs saved to DB + results viewable in dashboard

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  QuestionAudit Dashboard (/dashboard/testing)       │
│                                                     │
│  1. User picks questionnaire + builds persona       │
│  2. User pastes assessment URL(s)                   │
│  3. Clicks "Run"                                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  POST /api/testing/generate                         │
│                                                     │
│  a) Fetch form map from master_questions            │
│  b) Send to Claude → get persona answers JSON       │
│  c) Save answers to test_runs table                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  POST /api/testing/execute                          │
│                                                     │
│  a) Load answers from test_runs                     │
│  b) Launch Playwright (headless)                    │
│  c) Navigate to assessment URL                      │
│  d) For each page: find questions, fill answers     │
│  e) Submit form                                     │
│  f) Update test_run status → completed/failed       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Patient App (separate repo)                        │
│  Real form submission → data in portal              │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation

### 1.1 Install dependencies
- `npm install @anthropic-ai/sdk` — AI answer generation
- `npm install playwright` — browser automation (NOT `@playwright/test`, just the library)
- `npx playwright install chromium` — install browser binary
- Add `ANTHROPIC_API_KEY` to `.env.local`

### 1.2 New types — `types/testing.ts`
```
TestPersona { id, userId, name, description, structuredAttributes (age, gender, conditions, medications) }
TestRun { id, userId, masterId, personaId?, personaSnapshot, answers (JSONB), assessmentUrls (string[]),
          status (generating/filling/completed/failed), playwrightLog (text), error_message, generationMetadata, createdAt }
GeneratedAnswer { questionId, value, answerType }
FormMap { questionId, questionText, answerType, options, section, page, required }
```

### 1.3 Database migration — `supabase/migrations/015_test_runs.sql`
Two tables:

**`test_personas`**:
- id, user_id (FK auth.users), name, description, structured_attributes (JSONB)
- created_at, updated_at
- RLS: user-scoped

**`test_runs`**:
- id, user_id (FK auth.users), master_id (FK master_questionnaires)
- persona_id (FK test_personas, nullable), persona_snapshot (JSONB)
- answers (JSONB) — generated answers keyed by question_id
- assessment_urls (TEXT[]) — the assessment URLs that were filled
- status (generating | filling | completed | partially_completed | failed)
- playwright_log (TEXT) — stdout/stderr from the Playwright run
- error_message (TEXT)
- generation_metadata (JSONB) — model, tokens, latency
- created_at
- RLS: user-scoped

### 1.4 Form map builder — `lib/testing/formMap.ts`
Extracts a simplified question map from master_questions:
```
{ questionId, questionText, answerType, options[], characteristic, section, page, required }
```
This is Aimee's step 1 — a reusable representation of the form structure that Claude can reason about.

### 1.5 AI answer generator — `lib/testing/generateAnswers.ts`
- Takes form map + persona → calls Claude → returns answers JSON
- System prompt: "You are simulating a patient filling out a pre-operative medical questionnaire..."
- Prompt includes the form map with question types and options
- Response format: `{ "questionId": { value, answerType } }` per question
- Handles all types: radio (pick one option), checkbox (pick multiple), text, date, age, phone, allergy-list, medication-list, etc.
- Display-only types (spacer, content-block, alert, send-button) excluded from generation
- Model: `claude-sonnet-4-20250514`, max_tokens: 8192

### 1.6 Playwright form filler — `lib/testing/playwrightFiller.ts`
**This is the key piece that requires knowledge of the patient app's DOM structure.**

Template script that:
1. Launches headless Chromium
2. Navigates to assessment URL
3. On each page, locates form fields (by question ID, data attributes, or label text)
4. Fills each field based on answer type:
   - Radio: click the matching option
   - Checkbox: check matching options
   - Text/textarea: type the value
   - Date: fill date picker
   - Allergy/medication lists: interact with list UI
5. Clicks "Next" to advance through pages
6. Clicks "Submit" on the final page
7. Returns success/failure + log

**NOTE:** The exact selectors/navigation logic will be filled in once the patient app repo is available. For now, we'll build the scaffold with configurable selectors stored in a `formSelectors` config.

---

## Phase 2: API Routes

All under `app/api/testing/`:

### 2.1 `POST /api/testing/generate`
- Auth check, receive `{ masterId, persona }`
- Build form map from master_questions
- Call Claude to generate answers
- Save to test_runs (status: "generating" → "generated")
- Return the run with answers (user can preview before executing)

### 2.2 `POST /api/testing/execute`
- Receive `{ runId, assessmentUrls: string[] }`
- Load the test run's answers
- For each URL: launch Playwright, fill form, submit
- Update test_run status + playwright_log
- Return results

### 2.3 `GET /api/testing/runs` — list runs (optional masterId filter)
### 2.4 `GET /api/testing/runs/[runId]` — single run detail
### 2.5 `DELETE /api/testing/runs/[runId]` — delete a run
### 2.6 `GET/POST /api/testing/personas` — list and create personas
### 2.7 `DELETE /api/testing/personas/[personaId]` — delete persona

---

## Phase 3: UI

### 3.1 Sidebar nav item
**File:** `components/dashboard/DashboardSidebar.tsx`
Add 5th entry: `{ href: "/dashboard/testing", label: "Testing", exact: false, icon: <beaker SVG> }`

### 3.2 Testing dashboard — `app/dashboard/testing/page.tsx`
Server component. Lists past test runs with:
- Questionnaire name, persona name, date, status badge
- Status: generating / ready to fill / filling / completed / failed
- "New Test Run" button

### 3.3 New test run wizard — `app/dashboard/testing/new/page.tsx`
Client component, 4-step flow:

**Step 1 — Select Questionnaire:** Dropdown of user's master questionnaires.

**Step 2 — Build Persona:** Free-form textarea ("65 year old female, diabetic, previous hip replacement, takes metformin") + collapsible structured fields (age, gender, conditions, medications). Save/load persona buttons.

**Step 3 — Preview Answers:** After generation, show the AI's answers grouped by section/page. User can review before filling. Option to regenerate if answers look wrong.

**Step 4 — Fill Assessment:** User pastes one or more assessment URLs. Clicks "Fill Form(s)". Shows real-time status (filling page 1/5... page 2/5... done). Final status: success/failure per URL.

### 3.4 Run detail — `app/dashboard/testing/[runId]/page.tsx`
Shows: persona used, generated answers, assessment URLs filled, status, Playwright log (collapsible).

### 3.5 Shared components — `components/testing/`
- `PersonaBuilder.tsx` — persona form with free text + structured fields + save/load
- `AnswerPreview.tsx` — renders generated answers grouped by section/page for review
- `QuestionAnswer.tsx` — single question + generated answer display
- `FillProgress.tsx` — real-time progress during Playwright execution
- `TestRunCard.tsx` — summary card for listing page
- `TestingStepper.tsx` — step indicator (1-2-3-4)

---

## Phase 4: Patient App Integration (requires patient app repo)

Once the patient app repo is available:
1. Inspect the DOM structure — how questions are rendered, what selectors to use
2. Map question IDs to DOM elements (data attributes, name fields, or label associations)
3. Understand page navigation (Next/Back buttons, page indicators)
4. Understand special inputs (allergy list builder, medication search, BMI calculator)
5. Update `lib/testing/playwrightFiller.ts` with real selectors
6. Store selector config in `lib/testing/formSelectors.ts` for maintainability

---

## Reusability (per Aimee's design)

| Artifact | Created once | Reused for |
|----------|-------------|------------|
| Form map (from master_questions) | Per questionnaire | Every persona + every run |
| Playwright navigation script | Once per patient app version | Every run |
| Selector config | Once per patient app version | Every run |
| Persona answers | Per persona per questionnaire | Multiple assessment URLs |

Only the **persona answers** (step 3 in Aimee's plan) change between runs. Everything else is reusable.

---

## Critical Files to Modify
- `components/dashboard/DashboardSidebar.tsx` — add nav item

## Critical Files to Create
- `supabase/migrations/015_test_runs.sql`
- `types/testing.ts`
- `lib/testing/formMap.ts` — form map builder from master_questions
- `lib/testing/generateAnswers.ts` — Claude API answer generation
- `lib/testing/playwrightFiller.ts` — Playwright automation script
- `lib/testing/formSelectors.ts` — patient app DOM selector config (filled in Phase 4)
- `app/api/testing/generate/route.ts`
- `app/api/testing/execute/route.ts`
- `app/api/testing/runs/route.ts`
- `app/api/testing/runs/[runId]/route.ts`
- `app/api/testing/personas/route.ts`
- `app/api/testing/personas/[personaId]/route.ts`
- `app/dashboard/testing/page.tsx`
- `app/dashboard/testing/new/page.tsx`
- `app/dashboard/testing/[runId]/page.tsx`
- `components/testing/PersonaBuilder.tsx`
- `components/testing/AnswerPreview.tsx`
- `components/testing/QuestionAnswer.tsx`
- `components/testing/FillProgress.tsx`
- `components/testing/TestRunCard.tsx`
- `components/testing/TestingStepper.tsx`

## Verification
1. Run migration locally: `npx supabase migration up`
2. Start dev server, verify "Testing" nav item appears
3. Generate answers for a questionnaire + persona — verify realistic outputs
4. Preview answers in the UI — verify grouping by section/page
5. (After Phase 4) Run Playwright against a real assessment URL — verify form fills correctly
6. Verify completed runs appear in the listing with correct status
7. Test with a large questionnaire to check token limits

## Open Questions (for Phase 4)
- What selectors does the patient app use for form fields? (data-question-id, name, aria-label?)
- How does the patient app handle page navigation? (multi-page wizard, single scrollable page?)
- Are there any special interactions (autocomplete, search dropdowns, drag-and-drop)?
- Does the patient app require any auth/cookies to access an assessment URL?
