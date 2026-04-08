# Testing Feature: Automated Form Filling via Playwright

## Context
Account managers need a way to simulate patients filling out assessments for internal testing. We automate the **real patient-facing app** using Playwright. Users select a questionnaire and a persona type, the system generates randomised-but-realistic answers based on persona rules, and Playwright fills + submits the actual form. Filled assessments appear in the portal as real submissions.

**No AI/API dependency.** Answer generation is rule-based with randomisation — each run produces varied but persona-consistent data, at zero cost.

**Based on CTO (Aimee) recommendation:** Generate a reusable form map from the schema, generate persona answers from rules, then run Playwright scripts against the patient app. The form map and Playwright navigation logic are reusable — only the persona answers change between runs.

## Key Decisions
- **Answer generation**: Rule-based with randomisation per persona (no AI, no API costs)
- **Browser automation**: Playwright (headless) to fill the real patient app
- **Patient app**: Separate repo, standard web app (browser-based, not a mobile app), accessed via unique assessment links
- **Execution**: UI-triggered from QuestionAudit Testing dashboard (non-devs can use it)
- **Conditionals**: Handled naturally — Playwright fills pages as they appear, conditional questions only show if prior answers trigger them
- **Personas**: Predefined persona profiles with configurable attribute ranges
- **Persistence**: Test runs saved to DB + results viewable in dashboard

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  QuestionAudit Dashboard (/dashboard/testing)       │
│                                                     │
│  1. User picks questionnaire + persona type         │
│  2. User pastes assessment URL(s)                   │
│  3. Clicks "Run"                                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  POST /api/testing/generate                         │
│                                                     │
│  a) Fetch form map from master_questions            │
│  b) Apply persona rules + randomisation             │
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

## Persona Rules Engine

### How it works

Each persona defines **attribute ranges** and **answer tendencies**. The engine walks each question and picks an answer based on the persona's rules + randomisation within those bounds.

### Persona profiles

**Healthy (age 20-40)**
- Age: random 20-40
- Gender: random
- Medical history questions: 90% "No", 10% minor issues
- Medications: none or 1 common (e.g., contraceptive, antihistamine)
- Allergies: none or 1 common (e.g., penicillin)
- BMI: height/weight in healthy range (BMI 19-25)
- Smoking/alcohol: non-smoker or occasional, low alcohol
- Text fields: short, simple answers

**Fairly Healthy (age 40-65)**
- Age: random 40-65
- Medical history: 30-50% "Yes" on common conditions (high blood pressure, cholesterol, asthma)
- Medications: 1-3 (e.g., statins, inhalers, blood pressure meds)
- Allergies: 0-2
- BMI: slightly overweight range (BMI 25-30)
- Smoking: ex-smoker or never, moderate alcohol
- Previous operations: 0-2 minor (e.g., appendectomy, wisdom teeth)
- Text fields: moderate detail

**Poor Health (age 55-85)**
- Age: random 55-85
- Medical history: 60-80% "Yes" across multiple conditions (diabetes, heart disease, COPD, arthritis)
- Medications: 4-8 (polypharmacy)
- Allergies: 1-3
- BMI: overweight or obese (BMI 28-38)
- Smoking: current or heavy ex-smoker
- Previous operations: 2-5 (hip replacement, cardiac stent, etc.)
- ICU admissions: 0-2
- Text fields: detailed medical history
- Frailty score: moderate to high

### Answer generation by question type

| Answer Type | Generation Strategy |
|-------------|-------------------|
| `radio` | Weighted random pick from options based on persona tendency |
| `checkbox` | Select N options (N varies by persona) with weighted probability |
| `text-field` | Pick from a pool of realistic values per question context |
| `text-area` / `text-paragraph` | Pick from longer text templates, vary by persona |
| `phone-number` | Random valid UK mobile (07xxx) |
| `age` | From persona's age range |
| `number-input` | Context-dependent (e.g., units of alcohol per week) |
| `date` | Random recent date within sensible range |
| `allergy-list` | Pick N from common allergies pool |
| `medication-list` | Pick N from common medications pool (name + dose + frequency) |
| `previous-operation-list` | Pick N from common operations pool |
| `i-c-u-list` | Pick N from common ICU admission reasons |
| `bmi-calculator` | Generate height/weight matching persona's BMI range |
| `forage` | Derived from persona's age |
| `frailty-score` | Derived from persona's health profile |
| `calculator` | Derived from relevant inputs |
| `spacer` / `content-block` / `alert` / `send-button` | Skip (display only) |

### Question-context matching

The engine uses **keyword matching on question text** to pick contextually appropriate answers. For example:
- Question contains "smoke" → use persona's smoking tendency
- Question contains "alcohol" / "drink" → use persona's alcohol range
- Question contains "diabetes" / "blood sugar" → use persona's diabetes flag
- Question contains "name" → pick from a names pool
- Question contains "NHS" / "hospital" → pick from hospitals pool
- Generic yes/no medical question → use persona's medical history probability

This is stored as a configurable rules map in `lib/testing/personaRules.ts`, easy to extend.

---

## Phase 1: Foundation (can start now)

### 1.1 Install dependencies
- `npm install playwright` — browser automation (library only, not test runner)
- `npx playwright install chromium` — install browser binary

### 1.2 New types — `types/testing.ts`
```
PersonaType = "healthy" | "fairly_healthy" | "poor_health"
PersonaProfile { type, ageRange, genderWeights, medicalHistoryProbability, ... }
TestRun { id, userId, masterId, personaType, generatedProfile (JSONB), answers (JSONB),
          assessmentUrls (string[]), status, playwrightLog, createdAt }
GeneratedAnswer { questionId, value, answerType }
FormMapEntry { questionId, questionText, answerType, options, section, page, required }
```

### 1.3 Database migration — `supabase/migrations/015_test_runs.sql`

**`test_runs`**:
- id, user_id (FK auth.users), master_id (FK master_questionnaires)
- persona_type (TEXT) — healthy / fairly_healthy / poor_health
- generated_profile (JSONB) — the randomised attribute snapshot (age, gender, conditions chosen)
- answers (JSONB) — generated answers keyed by question_id
- assessment_urls (TEXT[]) — the assessment URLs that were filled
- status (generating | filling | completed | partially_completed | failed)
- playwright_log (TEXT)
- error_message (TEXT)
- created_at
- RLS: user-scoped

### 1.4 Form map builder — `lib/testing/formMap.ts`
Extracts simplified question map from master_questions:
```
{ questionId, questionText, answerType, options[], characteristic, section, page, required }
```

### 1.5 Persona rules engine — `lib/testing/personaRules.ts`
- Defines the 3 persona profiles with attribute ranges
- Keyword-to-tendency mapping for question context matching
- Pools of realistic values (names, medications, allergies, operations, hospitals)

### 1.6 Answer generator — `lib/testing/generateAnswers.ts`
- Takes form map + persona type
- Rolls a random profile within persona's ranges (age, gender, specific conditions)
- Walks each question, matches context via keywords, picks answer per rules
- Returns `{ answers, generatedProfile }`

### 1.7 Playwright form filler — `lib/testing/playwrightFiller.ts`
- Launches headless Chromium
- Navigates to assessment URL
- On each page: locates form fields, fills answers by type
- Advances through pages, submits at the end
- Returns success/failure + log

**NOTE:** Exact selectors depend on patient app DOM — see Phase 4.

---

## Phase 2: API Routes

All under `app/api/testing/`:

### 2.1 `POST /api/testing/generate`
- Auth check, receive `{ masterId, personaType }`
- Build form map from master_questions
- Run persona rules engine → answers + profile
- Save to test_runs (status: "generated")
- Return for preview

### 2.2 `POST /api/testing/execute`
- Receive `{ runId, assessmentUrls: string[] }`
- Load answers from test_run
- For each URL: launch Playwright, fill form, submit
- Update status + log

### 2.3 `GET /api/testing/runs` — list runs
### 2.4 `GET /api/testing/runs/[runId]` — single run detail
### 2.5 `DELETE /api/testing/runs/[runId]` — delete a run

---

## Phase 3: UI

### 3.1 Sidebar nav item
**File:** `components/dashboard/DashboardSidebar.tsx`
Add 5th entry: `{ href: "/dashboard/testing", label: "Testing", exact: false, icon: <beaker SVG> }`

### 3.2 Testing dashboard — `app/dashboard/testing/page.tsx`
Lists past test runs with status badges. "New Test Run" button.

### 3.3 New test run wizard — `app/dashboard/testing/new/page.tsx`
3-step flow:

**Step 1 — Select Questionnaire + Persona:**
- Dropdown of master questionnaires
- Persona picker: 3 cards (Healthy / Fairly Healthy / Poor Health) with summary of what each generates

**Step 2 — Preview Answers:**
- Shows the randomised profile (age, gender, conditions)
- Shows generated answers grouped by section/page
- "Regenerate" button to roll new random values within the same persona

**Step 3 — Fill Assessment:**
- Paste one or more assessment URLs
- Click "Fill Form(s)"
- Real-time progress display
- Final status per URL

### 3.4 Run detail — `app/dashboard/testing/[runId]/page.tsx`
Shows persona profile, answers, URLs filled, status, Playwright log.

### 3.5 Shared components — `components/testing/`
- `PersonaPicker.tsx` — 3 persona cards with descriptions
- `AnswerPreview.tsx` — generated answers grouped by section/page
- `QuestionAnswer.tsx` — single question + answer display
- `FillProgress.tsx` — real-time progress during Playwright execution
- `TestRunCard.tsx` — summary card for listing
- `ProfileSummary.tsx` — shows the randomised patient profile (age, gender, conditions)

---

## Phase 4: Patient App Integration (blocked — needs patient app repo)

Once the patient app repo is available:
1. Inspect DOM structure — how questions render, what selectors to use
2. Map question IDs to DOM elements
3. Understand page navigation (Next/Back/Submit)
4. Understand special inputs (allergy list, medication search, BMI calculator)
5. Update `lib/testing/playwrightFiller.ts` with real selectors
6. Store selector config in `lib/testing/formSelectors.ts`

---

## Reusability Matrix

| Artifact | Created once | Reused for |
|----------|-------------|------------|
| Form map (from master_questions) | Per questionnaire | Every persona + every run |
| Persona rules | Once (extend as needed) | Every run |
| Playwright navigation script | Once per patient app version | Every run |
| Selector config | Once per patient app version | Every run |

**Cost per run: zero.** No API calls, no external dependencies.

---

## Critical Files to Modify
- `components/dashboard/DashboardSidebar.tsx` — add nav item

## Critical Files to Create
- `supabase/migrations/015_test_runs.sql`
- `types/testing.ts`
- `lib/testing/formMap.ts` — form map builder
- `lib/testing/personaRules.ts` — persona profiles, keyword matching, value pools
- `lib/testing/generateAnswers.ts` — rule-based answer generator
- `lib/testing/playwrightFiller.ts` — Playwright automation
- `lib/testing/formSelectors.ts` — patient app DOM selectors (Phase 4)
- `app/api/testing/generate/route.ts`
- `app/api/testing/execute/route.ts`
- `app/api/testing/runs/route.ts`
- `app/api/testing/runs/[runId]/route.ts`
- `app/dashboard/testing/page.tsx`
- `app/dashboard/testing/new/page.tsx`
- `app/dashboard/testing/[runId]/page.tsx`
- `components/testing/PersonaPicker.tsx`
- `components/testing/AnswerPreview.tsx`
- `components/testing/QuestionAnswer.tsx`
- `components/testing/FillProgress.tsx`
- `components/testing/TestRunCard.tsx`
- `components/testing/ProfileSummary.tsx`

## Verification
1. Run migration locally
2. Verify "Testing" nav item appears
3. Generate answers for each persona type — verify varied but realistic outputs
4. Regenerate — verify different random values within same persona bounds
5. (After Phase 4) Run Playwright against a real assessment URL
6. Verify runs appear in listing with correct status

## What We Need From the Patient App Team
1. **Repo access** — to inspect DOM structure and form field selectors
2. **How are form fields identified?** — data attributes? name fields? aria-labels?
3. **Page navigation pattern** — multi-page wizard? Single scrollable page?
4. **Special input handling** — allergy list, medication search, BMI calculator
5. **Auth requirements** — does the assessment URL work without login?
6. **Test/staging environment** — safe URL for automated fills
