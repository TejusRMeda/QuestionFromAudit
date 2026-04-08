# QuestionAudit -- Testing Swarm Remediation Plan

**Generated:** 2026-04-08
**Source:** 8-agent testing swarm (Accessibility Auditor, API Tester, Evidence Collector, Performance Benchmarker, Reality Checker, Test Results Analyzer, Tool Evaluator, Workflow Optimizer)
**Total Findings:** 80+
**Verdict:** NOT PRODUCTION READY

This document is a comprehensive, actionable TODO list organized into phases. Each task includes full context so an agent can pick it up without needing the original swarm reports.

---

## Phase 1: Critical Security Fixes

These issues make the application trivially exploitable today. **Nothing else matters until these are resolved.**

---

### 1.1 Fix Row Level Security (RLS) Policies

**Priority:** CRITICAL
**Why:** Every RLS policy across all 14 migrations uses `USING (true)` / `WITH CHECK (true)`. The Supabase anon key is public (embedded in frontend as `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Anyone with browser DevTools can bypass all API routes and directly read/write/delete ALL data in every table via the Supabase JS client.

**Files to modify:**
- `supabase/migrations/001_create_tables.sql` -- `projects`, `questions`, `suggestions` (legacy tables)
- `supabase/migrations/003_master_trust_schema.sql` -- `master_questionnaires`, `master_questions`, `trust_instances`, `instance_questions`, `instance_suggestions`
- `supabase/migrations/006_add_suggestion_comments.sql` -- `suggestion_comments`
- `supabase/migrations/013_add_delete_policies.sql` -- DELETE policies
- `supabase/migrations/014_add_section_reviews.sql` -- `instance_section_reviews`, UPDATE policies

**Tasks:**

- [ ] **1.1.1** Create a new migration file (e.g., `015_tighten_rls_policies.sql`) that drops all existing permissive policies and replaces them with scoped ones
- [ ] **1.1.2** For `master_questionnaires`: SELECT/UPDATE/DELETE should require `auth.uid() = user_id`. INSERT should require `auth.uid() IS NOT NULL` and set `user_id = auth.uid()`
- [ ] **1.1.3** For `master_questions`: SELECT should require the parent `master_questionnaire` is owned by `auth.uid()` (join check). INSERT/UPDATE/DELETE same ownership check
- [ ] **1.1.4** For `trust_instances`: SELECT should allow if `auth.uid()` owns the parent master OR if accessed via a valid `trust_link_id` (requires an RPC function or a service_role approach). INSERT requires auth + master ownership. DELETE requires auth + master ownership
- [ ] **1.1.5** For `instance_questions`: SELECT should allow if the parent `trust_instance` is accessible (same logic as trust_instances). No direct INSERT/UPDATE/DELETE by clients
- [ ] **1.1.6** For `instance_suggestions`: SELECT should allow if the parent instance is accessible. INSERT should allow if the parent instance's `submission_status != 'submitted'`. UPDATE (status changes) should require auth + master ownership. DELETE should require either auth + master ownership OR match on submitter identity
- [ ] **1.1.7** For `suggestion_comments`: SELECT/INSERT should allow if the parent suggestion's instance is accessible. DELETE should require auth + ownership
- [ ] **1.1.8** For `instance_section_reviews`: SELECT/INSERT/DELETE should allow if the parent instance is accessible and `submission_status != 'submitted'`
- [ ] **1.1.9** For legacy tables (`projects`, `questions`, `suggestions`): Either drop these tables entirely if unused, or restrict to `auth.uid() = user_id`
- [ ] **1.1.10** **Alternative approach:** Switch the server-side Supabase client (`libs/supabase/server.ts`) to use `SUPABASE_SERVICE_ROLE_KEY` instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This bypasses RLS server-side (the recommended Supabase pattern for server routes). Then tighten RLS to block all direct client access via the anon key. Update `.env.example` to include the new key
- [ ] **1.1.11** Test every API route after RLS changes to verify no regressions
- [ ] **1.1.12** Verify the browser-side Supabase client (`libs/supabase/client.ts`) can no longer read/write data it shouldn't (test with DevTools)

---

### 1.2 Fix XSS Vulnerability (dangerouslySetInnerHTML)

**Priority:** CRITICAL
**Why:** `helperValue` from CSV uploads is rendered as raw HTML. A malicious CSV with `<script>` tags in the `HelperValue` column executes JavaScript in every trust user's browser.

**Files to modify:**
- `components/questionnaire/HelperDisplay.tsx` (line 77)
- `components/questionnaire/panel/tabs/HelpTab.tsx` (line 154)

**Tasks:**

- [ ] **1.2.1** Install DOMPurify: `npm install isomorphic-dompurify` (works in both server and client environments)
- [ ] **1.2.2** In `HelperDisplay.tsx`, replace `dangerouslySetInnerHTML={{ __html: helperValue }}` with `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(helperValue) }}`
- [ ] **1.2.3** In `HelpTab.tsx`, apply the same DOMPurify sanitization to `currentHelperValue` before rendering
- [ ] **1.2.4** Consider creating a shared `<SafeHtml content={value} />` component that wraps DOMPurify sanitization, so this pattern is reusable and centralized
- [ ] **1.2.5** Add a unit test that verifies `<script>`, `onerror`, `onclick`, and other XSS vectors are stripped from helper values
- [ ] **1.2.6** Audit the rest of the codebase for any other `dangerouslySetInnerHTML` usage (grep for it)

---

### 1.3 Add Authentication to Admin Endpoints

**Priority:** CRITICAL
**Why:** `GET /api/masters/[adminLinkId]`, `POST .../instances`, and `GET .../suggestions` require only the admin link ID -- no Supabase Auth check. The DELETE handler does check auth, but GET/POST do not. Combined with the RLS issue, admin link IDs are extractable from the database.

**Files to modify:**
- `app/api/masters/[adminLinkId]/route.ts` -- GET handler (lines 8-73)
- `app/api/masters/[adminLinkId]/instances/route.ts` -- POST handler (line 18)
- `app/api/masters/[adminLinkId]/suggestions/route.ts` -- GET handler (line 23)

**Tasks:**

- [ ] **1.3.1** In the GET handler of `masters/[adminLinkId]/route.ts`, add `const { data: { user } } = await supabase.auth.getUser()` and verify `user` is not null. Return 401 if unauthenticated
- [ ] **1.3.2** After fetching the master questionnaire by `admin_link_id`, verify `master.user_id === user.id`. Return 403 if the authenticated user doesn't own this master
- [ ] **1.3.3** Apply the same auth + ownership check to the POST handler in `instances/route.ts`
- [ ] **1.3.4** Apply the same auth + ownership check to the GET handler in `suggestions/route.ts`
- [ ] **1.3.5** Remove `adminLinkId: master.admin_link_id` from the GET response body (line 60 of `masters/[adminLinkId]/route.ts`) -- it's the secret token and the caller already knows it from the URL
- [ ] **1.3.6** Verify the frontend still works after these changes (the admin pages must send auth cookies with requests)

---

### 1.4 Fix Comment Author Type Impersonation

**Priority:** CRITICAL
**Why:** The `authorType` field in the POST body of `/api/instance/[trustLinkId]/suggestions/[suggestionId]/comments/route.ts` is trusted from the client. A trust user can set `authorType: "admin"` and their comment displays as an admin comment.

**Files to modify:**
- `app/api/instance/[trustLinkId]/suggestions/[suggestionId]/comments/route.ts` -- POST handler

**Tasks:**

- [ ] **1.4.1** In the POST handler, call `supabase.auth.getUser()` to check if the requester is authenticated
- [ ] **1.4.2** If authenticated and `user.id` matches the owner of the parent master questionnaire (requires a join query through suggestion -> instance_question -> trust_instance -> master_questionnaire), set `authorType = "admin"`
- [ ] **1.4.3** Otherwise, force `authorType = "trust_user"` regardless of what the client sent
- [ ] **1.4.4** Remove the client-side `authorType` field from the request body entirely -- derive it server-side only

---

### 1.5 Add Security Headers

**Priority:** HIGH
**Why:** No CSP, X-Frame-Options, HSTS, X-Content-Type-Options, or Referrer-Policy headers are configured. Combined with the XSS vulnerability, this is severe.

**Files to modify:**
- `next.config.js`

**Tasks:**

- [ ] **1.5.1** Add a `headers()` async function to `next.config.js` that applies to all routes `/(.*)`
- [ ] **1.5.2** Add `X-Frame-Options: DENY` (prevents clickjacking)
- [ ] **1.5.3** Add `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- [ ] **1.5.4** Add `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **1.5.5** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains` (HSTS)
- [ ] **1.5.6** Add a `Content-Security-Policy` that restricts `script-src` to `'self'`, `style-src` to `'self' 'unsafe-inline'` (needed for Tailwind), `img-src` to `'self' data:`, and `connect-src` to `'self'` plus the Supabase URL
- [ ] **1.5.7** Test that the app still works with CSP enabled (fonts, scripts, Supabase connections)

---

### 1.6 Lock Mutations on Submitted Instances

**Priority:** HIGH
**Why:** After `submission_status = "submitted"`, only the `/submit` endpoint rejects re-submission. The suggestion creation, modification, deletion, and section review endpoints do NOT check submission status.

**Files to modify:**
- `app/api/instance/[trustLinkId]/suggestions/route.ts` -- POST handler
- `app/api/instance/[trustLinkId]/suggestions/[suggestionId]/route.ts` -- PATCH, DELETE handlers
- `app/api/instance/[trustLinkId]/section-reviews/route.ts` -- POST, DELETE handlers

**Tasks:**

- [ ] **1.6.1** In each mutation endpoint listed above, after fetching the trust instance, add a check: `if (instance.submission_status === "submitted") return NextResponse.json({ message: "This review has already been submitted." }, { status: 403 })`
- [ ] **1.6.2** Apply the same check to the comment creation endpoint if post-submission comments should be blocked
- [ ] **1.6.3** Add an E2E or integration test verifying that POST/PATCH/DELETE on suggestions returns 403 after submission

---

### 1.7 Remove or Protect Legacy API Routes

**Priority:** HIGH
**Why:** Legacy routes (`/api/admin/[adminLinkId]`, `/api/review/[linkId]`, `/api/questions/[questionId]/suggestions`, `/api/suggestions/`, `/api/suggestions/[id]`) query old `projects`/`questions`/`suggestions` tables with zero authentication. The PUT handler on `/api/suggestions/[id]` allows updating suggestion status with no auth.

**Files to audit/remove:**
- `app/api/admin/[adminLinkId]/route.ts`
- `app/api/review/[linkId]/route.ts`
- `app/api/questions/[questionId]/suggestions/route.ts`
- `app/api/suggestions/route.ts`
- `app/api/suggestions/[id]/route.ts`

**Tasks:**

- [ ] **1.7.1** Determine if any frontend pages still reference these legacy routes (grep for `/api/admin/`, `/api/review/`, `/api/questions/`, `/api/suggestions`)
- [ ] **1.7.2** If no frontend references exist, delete these route files entirely
- [ ] **1.7.3** If frontend pages still use them, add authentication checks matching the new routes' pattern
- [ ] **1.7.4** Consider dropping the legacy tables (`projects`, `questions`, `suggestions`) if they are no longer needed -- create a migration that drops them
- [ ] **1.7.5** Remove the `/api/instance-questions/[questionId]/suggestions/route.ts` endpoint (unscoped, no auth) -- the trust-scoped version at `/api/instance/[trustLinkId]/suggestions` already provides this data

---

### 1.8 Fix Suggestion Status Update Auth

**Priority:** HIGH
**Why:** The PATCH endpoint at `/api/instance/[trustLinkId]/suggestions/[suggestionId]/route.ts` allows anyone with the trust link to approve/reject suggestions -- no admin auth required.

**Files to modify:**
- `app/api/instance/[trustLinkId]/suggestions/[suggestionId]/route.ts` -- PATCH handler

**Tasks:**

- [ ] **1.8.1** Add `supabase.auth.getUser()` check to the PATCH handler
- [ ] **1.8.2** Verify the authenticated user owns the parent master questionnaire before allowing status changes
- [ ] **1.8.3** Return 401 for unauthenticated requests, 403 for non-owners

---

### 1.9 Fix CASOD Export Data Leakage

**Priority:** MEDIUM-HIGH
**Why:** The export endpoint at `/api/instance/[trustLinkId]/export/casod/route.ts` returns `internal_comment` in the CSV, which is intended for admin-only viewing. Any trust user with the link can export and see internal comments.

**Files to modify:**
- `app/api/instance/[trustLinkId]/export/casod/route.ts` (line 57)

**Tasks:**

- [ ] **1.9.1** Remove `internal_comment` from the Supabase select query in the export endpoint
- [ ] **1.9.2** Alternatively, restrict this endpoint to authenticated admins only (add auth check + master ownership verification)
- [ ] **1.9.3** Audit all other endpoints that return `internal_comment` and ensure it's only exposed to authenticated admins

---

## Phase 2: Stability and Monitoring

These issues don't enable exploitation but cause reliability problems, hide bugs, and make production debugging impossible.

---

### 2.1 Add Error Tracking (Sentry)

**Priority:** HIGH
**Why:** Zero error tracking exists. Every server error goes to `console.error` and is lost on Vercel after the request completes.

**Tasks:**

- [ ] **2.1.1** Install Sentry: `npx @sentry/wizard@latest -i nextjs`
- [ ] **2.1.2** Configure Sentry DSN in environment variables, add to `.env.example`
- [ ] **2.1.3** Verify the global error boundary (`app/error.tsx`) reports to Sentry
- [ ] **2.1.4** Remove or redact the raw `error?.message` display in `app/error.tsx` line 136 -- show a generic message to users, send the real error to Sentry
- [ ] **2.1.5** Add Sentry to API route error handlers (wrap existing `console.error` calls)
- [ ] **2.1.6** Configure source maps upload in the Vercel build step

---

### 2.2 Enable TypeScript Strict Mode

**Priority:** HIGH
**Why:** `tsconfig.json` has `"strict": false`. Only `noImplicitAny` is enabled. `strictNullChecks`, `strictFunctionTypes`, and other safety checks are off, hiding potential null/undefined runtime crashes.

**Files to modify:**
- `tsconfig.json`
- All files that produce type errors after enabling strict

**Tasks:**

- [ ] **2.2.1** Set `"strict": true` in `tsconfig.json`
- [ ] **2.2.2** Run `npx tsc --noEmit` and fix all resulting type errors
- [ ] **2.2.3** Focus especially on: non-null assertions (`user!.id` in `dashboard/page.tsx:79`), untyped Supabase responses, `as any` casts (12+ instances across API routes and components)
- [ ] **2.2.4** Replace `any` types with proper interfaces -- key locations:
  - `app/signin/page.tsx:22` (`e: any`)
  - `app/api/instance/[trustLinkId]/suggestions/route.ts:109,117` (`row: any`, `s: any`)
  - `app/api/instance/[trustLinkId]/route.ts:82,90,127` (three `any` casts)
  - `components/questionnaire/panel/tabs/LogicTab.tsx:68` (`as any` to pass undefined)
  - `app/api/admin/[adminLinkId]/route.ts:91` (`s: any`)
  - `app/api/masters/[adminLinkId]/suggestions/route.ts:101` (`q: any`)
- [ ] **2.2.5** Generate Supabase types with `supabase gen types typescript --project-id <id> > types/database.ts` to replace untyped query responses

---

### 2.3 Implement Zod Validation in API Routes

**Priority:** HIGH
**Why:** Zod v3.24 is installed but never imported or used. All 20 API routes use manual `if (!field)` checks, duplicated and inconsistent. `componentChanges` JSON is accepted with zero server-side structure validation.

**Files to modify:**
- Create `lib/validations/` directory with shared schemas
- All 20 API route files under `app/api/`

**Tasks:**

- [ ] **2.3.1** Create `lib/validations/suggestion.ts` with schemas:
  ```
  CreateSuggestionSchema: instanceQuestionId (int, positive), submitterName (string, 1-100), submitterEmail (email, optional), suggestionText (string, 1-2000), reason (string, 1-1000), componentChanges (optional, structured)
  UpdateSuggestionSchema: status (enum: approved, rejected, pending), responseMessage (string, optional), internalComment (string, optional)
  ```
- [ ] **2.3.2** Create `lib/validations/comment.ts` with schema: authorName (string, 1-100), authorEmail (email, optional), content (string, 1-2000)
- [ ] **2.3.3** Create `lib/validations/master.ts` with schema: name (string, 1-200), questions (array, 1-500, each with proper structure)
- [ ] **2.3.4** Create `lib/validations/instance.ts` with schema: trustName (string, 1-200), members (array of objects with name and email)
- [ ] **2.3.5** Create `lib/validations/componentChanges.ts` matching the `ComponentChanges` interface from `types/editPanel.ts` -- import the canonical type, don't redefine it
- [ ] **2.3.6** Replace manual validation in each API route with `Schema.safeParse(body)` -- return 400 with `result.error.flatten()` on failure
- [ ] **2.3.7** Share validation schemas between client forms and server routes where applicable
- [ ] **2.3.8** Remove the duplicated `ComponentChanges` interface definitions from `app/api/suggestions/route.ts` and `app/api/instance/[trustLinkId]/suggestions/route.ts` -- import from the shared location

---

### 2.4 Add Rate Limiting

**Priority:** MEDIUM
**Why:** No rate limiting exists on any endpoint. Suggestion creation, comment creation, CSV upload, and the health endpoint are all unlimited.

**Tasks:**

- [ ] **2.4.1** Install `@upstash/ratelimit` and `@upstash/redis` (or use Vercel KV)
- [ ] **2.4.2** Create a rate limiting middleware or utility function in `lib/rateLimit.ts`
- [ ] **2.4.3** Apply rate limits to mutation endpoints:
  - `/api/masters` POST: 10 requests per hour per user
  - `/api/instance/[trustLinkId]/suggestions` POST: 30 requests per hour per IP
  - `/api/instance/[trustLinkId]/suggestions/[id]/comments` POST: 60 requests per hour per IP
  - `/api/instance/[trustLinkId]/submit` POST: 5 requests per hour per IP
- [ ] **2.4.4** Return 429 status with `Retry-After` header when limit is exceeded
- [ ] **2.4.5** Add rate limit headers to responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)

---

### 2.5 Add Runtime Environment Variable Validation

**Priority:** MEDIUM
**Why:** The code uses `process.env.NEXT_PUBLIC_SUPABASE_URL!` with non-null assertions. If env vars are missing, the app crashes with unhelpful errors at runtime.

**Tasks:**

- [ ] **2.5.1** Create `lib/env.ts` with a Zod schema validating all required env vars at startup:
  ```
  NEXT_PUBLIC_SUPABASE_URL (url), NEXT_PUBLIC_SUPABASE_ANON_KEY (string, min 1),
  SUPABASE_SERVICE_ROLE_KEY (string, min 1, if switching to service role),
  NEXT_PUBLIC_SITE_URL (url), SENTRY_DSN (url, optional)
  ```
- [ ] **2.5.2** Import and call the validation in `next.config.js` or a top-level module so the build fails fast on missing vars
- [ ] **2.5.3** Update `.env.example` to document ALL required and optional env vars with descriptions
- [ ] **2.5.4** Remove all `!` non-null assertions on `process.env` values -- use the validated env object instead

---

### 2.6 Fix Error Message Leakage

**Priority:** LOW-MEDIUM
**Why:** `app/error.tsx` line 136 exposes raw `error?.message` to end users, potentially leaking internal details (stack traces, DB errors).

**Files to modify:**
- `app/error.tsx`

**Tasks:**

- [ ] **2.6.1** Replace `{error?.message}` with a generic user-facing message: "An unexpected error occurred. Please try again."
- [ ] **2.6.2** Log the full error to Sentry (after 2.1 is done) or console for debugging
- [ ] **2.6.3** Add a server-side error layout for Server Component errors (`app/global-error.tsx`)

---

## Phase 3: Performance Optimization

---

### 3.1 Dynamically Import ReactFlow

**Priority:** HIGH (easy win)
**Why:** `@xyflow/react` (3.9 MB) is statically imported in the instance page but only used in the optional Logic tab. Its CSS is also globally imported.

**Files to modify:**
- `app/instance/[trustLinkId]/page.tsx` (line 24)
- `globals.css` (ReactFlow CSS import)

**Tasks:**

- [ ] **3.1.1** Replace `import LogicFlowView from "@/components/questionnaire/panel/LogicFlowView"` with `const LogicFlowView = dynamic(() => import("@/components/questionnaire/panel/LogicFlowView"), { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><span className="loading loading-spinner" /></div> })`
- [ ] **3.1.2** Remove `@import "@xyflow/react/dist/style.css"` from `globals.css`
- [ ] **3.1.3** Add `import "@xyflow/react/dist/style.css"` as a side-effect import at the top of `LogicFlowView.tsx`
- [ ] **3.1.4** Verify the Logic tab still renders correctly after the change

---

### 3.2 Parallelize Serial Supabase Queries

**Priority:** HIGH (easy win)
**Why:** The instance GET endpoint makes 5 sequential Supabase queries that only depend on `instance.id`. Parallelizing them could cut TTFB by 40-60%.

**Files to modify:**
- `app/api/instance/[trustLinkId]/route.ts`

**Tasks:**

- [ ] **3.2.1** After the first query (fetch trust instance), wrap queries 2-5 in `Promise.all()`:
  ```typescript
  const [questionsResult, quickActionsResult, newQuestionsResult, sectionReviewsResult] = await Promise.all([
    supabase.from("instance_questions")...,
    supabase.from("instance_suggestions")...,
    supabase.from("instance_suggestions")...,
    supabase.from("instance_section_reviews")...,
  ]);
  ```
- [ ] **3.2.2** Apply the same parallelization pattern to `app/api/admin/[adminLinkId]/route.ts` if the legacy route is kept
- [ ] **3.2.3** In the comments route (`comments/route.ts`), consolidate the 3 separate validation queries into fewer queries

---

### 3.3 Refactor Pages to Server Components

**Priority:** HIGH (significant effort)
**Why:** All main pages are `"use client"` with `useEffect` + `fetch` data loading. Users see a loading spinner while JS downloads, hydrates, then fetches. This destroys LCP and wastes the key advantage of Next.js App Router.

**Files to modify:**
- `app/instance/[trustLinkId]/page.tsx`
- `app/review/[linkId]/page.tsx`
- `app/admin/[adminLinkId]/page.tsx`
- `app/dashboard/upload/page.tsx`
- `app/dashboard/page.tsx`

**Tasks:**

- [ ] **3.3.1** For each page, create a Server Component wrapper that fetches data using the Supabase server client, then passes it as props to a client sub-component (e.g., `page.tsx` becomes the server component, `InstancePageClient.tsx` becomes the client component)
- [ ] **3.3.2** Start with the instance page as the highest-traffic page for trust users
- [ ] **3.3.3** Use Next.js `loading.tsx` files for each route to leverage Suspense streaming
- [ ] **3.3.4** Remove the `useEffect` + `fetch` + loading spinner pattern from each refactored page
- [ ] **3.3.5** Add skeleton loading components (the instance page already has one -- extend to other pages)
- [ ] **3.3.6** Test that data is present in the initial HTML (view source should contain content, not just a spinner)

---

### 3.4 Consolidate UI Libraries

**Priority:** MEDIUM
**Why:** Three overlapping UI component libraries ship simultaneously: `@headlessui/react` (~2 MB), `@base-ui/react` (~14 MB via Shadcn), and `@radix-ui/react-tooltip` + `react-tooltip` (~2 MB). All provide dialog, transition, and accessibility primitives.

**Files to modify:**
- 9 files using `@headlessui/react` Dialog/Transition
- `components/ui/tooltip.tsx` (uses `react-tooltip`)

**Tasks:**

- [ ] **3.4.1** Identify all files importing `@headlessui/react` (grep for `from "@headlessui/react"`)
- [ ] **3.4.2** For each HeadlessUI `Dialog`/`Transition` usage, migrate to the existing Shadcn `Dialog` component at `components/ui/dialog.tsx`. Key files:
  - `SuggestionDetailModal.tsx`
  - `SuggestionModal.tsx`
  - `InstanceSuggestionModal.tsx`
  - `ViewSuggestionsModal.tsx`
  - `SuggestionThreadModal.tsx`
  - `CreateTrustModal.tsx`
  - `MobileEditModal.tsx`
  - Any others found in 3.4.1
- [ ] **3.4.3** After all migrations, remove `@headlessui/react` from `package.json`
- [ ] **3.4.4** Replace `react-tooltip` usage in `components/ui/tooltip.tsx` with the Radix tooltip (already available via `@radix-ui/react-tooltip`)
- [ ] **3.4.5** Remove `react-tooltip` from `package.json`
- [ ] **3.4.6** Remove duplicate font: pick either Inter or Geist (not both) in `app/layout.tsx`. Both are sans-serif body fonts

---

### 3.5 Add Client-Side Data Caching

**Priority:** MEDIUM
**Why:** Every navigation or action triggers a full network round trip. No SWR, React Query, or Next.js cache. All responses have `Cache-Control: private, no-store`. The instance page calls `fetchInstance()` (re-fetching ALL data) after every single action.

**Tasks:**

- [ ] **3.5.1** Install TanStack Query: `npm install @tanstack/react-query`
- [ ] **3.5.2** Create a QueryClientProvider wrapper in `app/layout.tsx` or a providers file
- [ ] **3.5.3** Replace manual `fetch` + `useState` + `useEffect` patterns with `useQuery` / `useMutation` hooks
- [ ] **3.5.4** Configure `staleTime` and `refetchOnWindowFocus` appropriately per query type
- [ ] **3.5.5** Replace full `fetchInstance()` refetches after mutations with targeted cache invalidation via `queryClient.invalidateQueries`
- [ ] **3.5.6** Add optimistic updates for suggestion creation/deletion and section review toggling

---

### 3.6 Memoize Expensive Computations

**Priority:** LOW-MEDIUM
**Why:** `validate()` is called during render without memoization in the review page. `filteredSuggestions` and `statusCounts` computed inline in the admin page.

**Files to modify:**
- `app/review/[linkId]/page.tsx` (lines 555, 588)
- `app/admin/[adminLinkId]/page.tsx`

**Tasks:**

- [ ] **3.6.1** In the review page, wrap `editPanelState.validate()` calls in `useMemo` (match the instance page pattern at line 513)
- [ ] **3.6.2** In the admin page, wrap `filteredSuggestions` and `statusCounts` in `useMemo`
- [ ] **3.6.3** Consider debouncing `handleAnswerChange` to reduce re-renders on keystroke

---

### 3.7 Clean Up Dependencies

**Priority:** LOW
**Why:** Several unnecessary packages inflate install size and create confusion.

**Files to modify:**
- `package.json`

**Tasks:**

- [ ] **3.7.1** Move `shadcn` from `dependencies` to `devDependencies` (CLI tool, not runtime)
- [ ] **3.7.2** Move `eslint` and `eslint-config-next` from `dependencies` to `devDependencies`
- [ ] **3.7.3** Remove `@types/mongoose` (MongoDB never used)
- [ ] **3.7.4** Remove `@types/react-syntax-highlighter` (never imported)
- [ ] **3.7.5** Remove `@types/mdx` (no MDX files exist)
- [ ] **3.7.6** Remove `zod` if not implementing Zod validation (or keep if implementing 2.3)
- [ ] **3.7.7** Fix package name from `"vibe-coder-web"` to `"question-audit"` or similar
- [ ] **3.7.8** Fix `next-sitemap` config: replace `https://shipfa.st` with `https://questionaireaudit.com`

---

## Phase 4: Architecture Improvements

---

### 4.1 Decompose Instance Page God Component

**Priority:** HIGH
**Why:** `app/instance/[trustLinkId]/page.tsx` is 1216 lines with 25+ useState hooks, 15+ callbacks, 450 lines of duplicated JSX (three nearly identical SplitScreenLayout blocks), and concurrent fetch race conditions with no AbortController.

**Tasks:**

- [ ] **4.1.1** Create `contexts/InstanceContext.tsx` providing instance data, questions, suggestions, section reviews, and mutation callbacks
- [ ] **4.1.2** Extract data fetching into a custom hook `hooks/useInstanceData.ts` (modeled after the well-designed `useEditPanelState.ts`). Include AbortController for fetch cancellation
- [ ] **4.1.3** Extract suggestion-related state into `hooks/useInstanceSuggestions.ts`
- [ ] **4.1.4** Extract section review state into `hooks/useSectionReviews.ts`
- [ ] **4.1.5** Extract quick action state into `hooks/useQuickActions.ts`
- [ ] **4.1.6** Refactor the three duplicated `SplitScreenLayout` blocks into a single block where `rightPanel` is selected by a switch/conditional on `demoMode`
- [ ] **4.1.7** Add AbortController to `fetchInstance` and all other fetch calls. Return cleanup functions from useEffect
- [ ] **4.1.8** Target: reduce the page component to ~200-300 lines, composing the extracted hooks and context
- [ ] **4.1.9** Also decompose other large page components:
  - `app/review/[linkId]/page.tsx` (609 lines)
  - `app/admin/[adminLinkId]/page.tsx` (422 lines)

---

### 4.2 Extract Duplicated Code

**Priority:** MEDIUM (easy win)
**Why:** `generateSecureLinkId()` is duplicated in 2 API routes. `ComponentChanges` interface is defined 3 times. `lib/` and `libs/` directories have confusingly similar names.

**Tasks:**

- [ ] **4.2.1** Move `generateSecureLinkId()` from `app/api/masters/route.ts` and `app/api/masters/[adminLinkId]/instances/route.ts` into `lib/linkId.ts`. Import from the shared location
- [ ] **4.2.2** Remove the `ComponentChanges` interface redefinitions in `app/api/suggestions/route.ts` and `app/api/instance/[trustLinkId]/suggestions/route.ts` -- import from `types/editPanel.ts`
- [ ] **4.2.3** Consolidate `lib/` and `libs/` into a single `lib/` directory. Move `libs/supabase/` to `lib/supabase/`, `libs/seo.ts` to `lib/seo.ts`. Update all imports
- [ ] **4.2.4** Remove the `design-explorations/` directory if it's scratch work (11 files)

---

### 4.3 Add Dashboard Pagination

**Priority:** MEDIUM
**Why:** The dashboard page executes a deeply nested Supabase query joining `master_questionnaires -> trust_instances -> instance_questions -> instance_suggestions` in a single call with no pagination. This fetches ALL suggestions for ALL trusts across ALL masters on every load.

**Files to modify:**
- `app/dashboard/page.tsx`

**Tasks:**

- [ ] **4.3.1** Add pagination to the master questionnaires query (e.g., 10 per page)
- [ ] **4.3.2** Lazy-load suggestion counts per trust instance (don't fetch all suggestions upfront)
- [ ] **4.3.3** Add a "Load more" or pagination UI to the dashboard
- [ ] **4.3.4** Consider separate API endpoints for dashboard stats vs. full questionnaire lists

---

## Phase 5: Testing Infrastructure

---

### 5.1 Add Unit Tests for Critical Pure Functions

**Priority:** HIGH
**Why:** The most complex data-transforming logic has zero unit tests. These are pure functions with no dependencies -- trivial to test, highest risk reduction per effort.

**Tasks:**

- [ ] **5.1.1** `types/question.ts` -- Test `parseEnableWhen()`:
  - All operator types (`=`, `<`, `>`, `exists`, `!=`)
  - AND/OR combinators
  - Malformed strings, empty input, missing operators
  - Nested conditions
- [ ] **5.1.2** `types/question.ts` -- Test `groupRowsByQuestion()`:
  - Normal grouping by LinkId
  - Duplicate IDs, empty rows, missing required fields
  - 500-question stress test
- [ ] **5.1.3** `types/question.ts` -- Test `rowsToQuestion()`:
  - All 20+ item types (`string`, `integer`, `decimal`, `boolean`, `choice`, `open-choice`, `date`, `dateTime`, `time`, `text`, `display`, `group`, `quantity`, `attachment`, `reference`, `url`, `coding`, `calculated-bmi`, `calculated-score`, `calculated-days`, `section-header`)
  - Missing optional fields, edge cases for each type
- [ ] **5.1.4** `lib/enableWhen.ts` -- Test `buildCharacteristicMap()`:
  - Question-level vs option-level characteristics
  - Missing data, empty questions array
- [ ] **5.1.5** `lib/enableWhen.ts` -- Test `translateEnableWhen()`:
  - All operator types, readable English output
  - Unknown operators, missing characteristic references
- [ ] **5.1.6** `lib/casod-export.ts` -- Test `consolidateSuggestionsToRows()`:
  - Various suggestion combinations
  - Test all 7 helper functions (`formatOptions`, `buildBranchingText`, `buildContentColumn`, etc.)
  - Empty suggestions, suggestions with component changes
- [ ] **5.1.7** `lib/calculators.ts` -- Test BMI computation:
  - Normal cases, zero height (division by zero), null inputs
  - `parseCalculatorAnswer()` with malformed JSON
  - `getCalculatorConfig()` for unknown calculator types

---

### 5.2 Add CI/CD Pipeline

**Priority:** HIGH
**Why:** Tests exist but never run automatically. No `.github/workflows/` directory. Tests may not run before deployment.

**Tasks:**

- [ ] **5.2.1** Create `.github/workflows/ci.yml` with:
  - Trigger on push to `main` and all PRs
  - Node.js setup (match version from `package.json` engines or `.nvmrc`)
  - `npm ci` for clean installs
  - `npm run lint` (ESLint)
  - `npm run test` (Vitest unit tests)
  - `npx tsc --noEmit` (TypeScript type checking)
- [ ] **5.2.2** Add Playwright E2E tests as a separate CI job (slower, can run in parallel)
- [ ] **5.2.3** Add coverage thresholds in `vitest.config.ts`:
  ```typescript
  coverage: {
    thresholds: { lines: 30, branches: 30, functions: 30, statements: 30 }
  }
  ```
  Start low, ratchet up as tests are added
- [ ] **5.2.4** Block PR merges on test failure (configure branch protection rules)

---

### 5.3 Add Developer Tooling

**Priority:** MEDIUM
**Why:** No Prettier, no pre-commit hooks. Code formatting is inconsistent (tabs vs spaces). Developers can commit unlinted code.

**Tasks:**

- [ ] **5.3.1** Install Prettier: `npm install -D prettier eslint-config-prettier`
- [ ] **5.3.2** Create `.prettierrc` with project conventions (2-space indent, no trailing commas, etc.)
- [ ] **5.3.3** Install Husky + lint-staged: `npm install -D husky lint-staged && npx husky init`
- [ ] **5.3.4** Configure lint-staged in `package.json`:
  ```json
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md,css}": ["prettier --write"]
  }
  ```
- [ ] **5.3.5** Add a custom ESLint config file (`eslint.config.js`) extending `next/core-web-vitals` with additional rules (e.g., `no-explicit-any`)
- [ ] **5.3.6** Run `npx prettier --write .` once to format the entire codebase, commit as a standalone formatting commit

---

### 5.4 Add API Route Tests

**Priority:** MEDIUM
**Why:** 20 API routes with zero unit tests. The extracted validation tests don't test actual route handlers.

**Tasks:**

- [ ] **5.4.1** Create test utilities for API route testing: mock Supabase client, mock Request/Response objects
- [ ] **5.4.2** Test the suggestion POST route: valid input, missing fields, too-long fields, invalid email, missing `instanceQuestionId`
- [ ] **5.4.3** Test the suggestion PATCH route: valid status change, invalid status, non-existent suggestion
- [ ] **5.4.4** Test the masters POST route: valid CSV data, duplicate linkIds, empty questions array, 500+ questions
- [ ] **5.4.5** Test auth checks on admin endpoints (after 1.3 is implemented): unauthenticated request returns 401, wrong user returns 403

---

## Phase 6: Accessibility Fixes

23 issues found by the Accessibility Auditor. Grouped by priority.

---

### 6.1 High Priority Accessibility Fixes

- [ ] **6.1.1** **Fix custom tabs ARIA semantics** -- `EditPanel.tsx` (lines 224-260) and `MobileEditModal.tsx` (lines 265-294): Add `role="tablist"` to container, `role="tab"` + `aria-selected` + `aria-controls` to each button, `role="tabpanel"` + `id` to content area. Or migrate to the existing `components/ui/tabs.tsx` which already uses Base UI Tab primitives with proper ARIA
- [ ] **6.1.2** **Fix form label associations** -- Add `id` to all form inputs and `htmlFor` to their labels in:
  - `SuggestionModal.tsx` -- DaisyUI labels missing `htmlFor`/`id`
  - `SuggestionDetailModal.tsx:256`
  - `CommentInput.tsx:74-102` -- all inputs use only `placeholder`, no `<label>`
  - `ContentTab.tsx:572-598` -- new option fields
  - `QuestionsList.tsx:104-144` -- answer inputs
  - `CreateTrustModal.tsx` Step1 (line 403), Step2 (line 459)
  - `dashboard/upload/page.tsx` -- DaisyUI labels
- [ ] **6.1.3** **Link error messages to form fields** -- For every input with validation errors across `SuggestionModal`, `InstanceSuggestionModal`, `CommentInput`, `ReviewTab`, `ContentTab`, `HelpTab`: set `aria-invalid="true"` on the input, give the error element an `id`, add `aria-describedby={errorId}` to the input
- [ ] **6.1.4** **Fix toast announcements** -- Configure error toasts to use `ariaProps: { role: "alert", "aria-live": "assertive" }` in the `<Toaster>` config at `LayoutClient.tsx:12`

---

### 6.2 Medium Priority Accessibility Fixes

- [ ] **6.2.1** **Add skip navigation link** -- In `app/layout.tsx`, add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` as the first focusable element. Add `id="main-content"` to the `<main>` element
- [ ] **6.2.2** **Add `aria-label="Close"` to modal close buttons** -- `SuggestionModal.tsx:152`, `ViewSuggestionsModal.tsx:117`, `SuggestionDetailModal.tsx:135`, `SuggestionThreadModal.tsx:257`
- [ ] **6.2.3** **Fix color contrast** -- Replace `text-slate-400` (3.0:1) with `text-slate-500` or darker for all body text. Audit all `/40` and `/50` opacity modifiers on `text-base-content`
- [ ] **6.2.4** **Make upload drop zone keyboard accessible** -- `dashboard/upload/page.tsx:352-365`: Add `tabIndex={0}`, `role="button"`, `aria-label`, and `onKeyDown` for Enter/Space
- [ ] **6.2.5** **Fix patient view question cards** -- `QuestionsList.tsx:428-480`: Add `role="button"`, `tabIndex={0}`, `onKeyDown` (matching the default view pattern)
- [ ] **6.2.6** **Add `aria-pressed` to custom checkboxes** in `CreateTrustModal.tsx` Step3 (lines 528-551)
- [ ] **6.2.7** **Fix QuickActionsMenu keyboard navigation** -- `QuickActionsMenu.tsx:185-199`: Add `role="menu"`, `role="menuitem"`, arrow key navigation, Escape to close
- [ ] **6.2.8** **Add live regions for loading states** -- Wrap loading spinners in `<div role="status" aria-live="polite">` in `ViewSuggestionsModal.tsx:155`, `ConversationThread.tsx:52`, instance page skeleton
- [ ] **6.2.9** **Fix tab status indicators** -- `EditPanel.tsx:244-256`: Add `<span className="sr-only">Has validation errors</span>` or `<span className="sr-only">Has pending changes</span>` inside each indicator
- [ ] **6.2.10** **Fix select elements** -- `ContentTab.tsx:324-338` and `HelpTab.tsx:229-239`: Add `id` to `<select>` and `htmlFor` to `<Label>`
- [ ] **6.2.11** **Fix switch toggle labels** -- `SettingsTab.tsx:120-121` and `HelpTab.tsx:199-200`: Add `aria-label` to switches
- [ ] **6.2.12** **Fix touch target sizes** -- "Remove member" buttons in `CreateTrustModal.tsx:441-449` (12x12px SVG) need min 24x24px touch target

---

### 6.3 Low Priority Accessibility Fixes

- [ ] **6.3.1** Add `aria-hidden="true"` to all decorative SVG icons throughout the codebase
- [ ] **6.3.2** Add `aria-valuenow`, `aria-valuemin`, `aria-valuemax` to `ResizableDivider.tsx`
- [ ] **6.3.3** Ensure each page has exactly one `<h1>`, with proper `<h2>` -> `<h3>` hierarchy
- [ ] **6.3.4** Add `aria-live="polite"` to the auto-close countdown in `CreateTrustModal.tsx` Step 5
- [ ] **6.3.5** Add `aria-hidden="true"` to the SVG in the mobile back button (`SplitScreenLayout.tsx:149-157`)

---

## Phase 7: Miscellaneous Fixes

---

### 7.1 Fix useEffect / React Rules Violations

- [ ] **7.1.1** `SuggestionThreadModal.tsx:92-96`: Add `fetchComments` to the useEffect dependency array, or wrap `fetchComments` in `useCallback`
- [ ] **7.1.2** `CreateTrustModal.tsx:78`: Fix the eslint-disable for `react-hooks/exhaustive-deps` -- memoize `handleDone` with `useCallback` instead of suppressing
- [ ] **7.1.3** `instance/[trustLinkId]/page.tsx`: Wrap `fetchInstance` in `useCallback` and add it to the useEffect dependency array. Add AbortController for cleanup
- [ ] **7.1.4** `ViewSuggestionsModal.tsx`: Add fetch cancellation to prevent state updates on unmounted components

---

### 7.2 Fix Non-Atomic Trust Creation

- [ ] **7.2.1** `CreateTrustModal.tsx:114-147`: The sequential POST loop for creating trust instances has no rollback on partial failure. Either:
  - Create a single API endpoint that accepts multiple questionnaire IDs and creates all instances in a database transaction, OR
  - Add error recovery UI showing which instances succeeded/failed with retry options

---

### 7.3 Add `maxLength` to Textareas

- [ ] **7.3.1** Add `maxLength` HTML attribute to all textareas that have character limits: `SuggestionModal.tsx:253`, `CommentInput.tsx:106`, `ReviewTab.tsx:277`
- [ ] **7.3.2** Ensure the character count display caps at 0 remaining (not negative)

---

### 7.4 Persist Reviewer Name

- [ ] **7.4.1** In `useEditPanelState.ts`, persist `submitterName` to `localStorage` (the quick actions flow already uses `localStorage.getItem("qa-reviewer-name")` but the edit panel does not)
- [ ] **7.4.2** On hook initialization, read from localStorage to pre-fill the name

---

## Summary Checklist

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1. Critical Security | 35 tasks | BLOCKING -- do first |
| 2. Stability & Monitoring | 25 tasks | Do before production |
| 3. Performance | 25 tasks | Do before production |
| 4. Architecture | 15 tasks | Do within first month |
| 5. Testing Infrastructure | 20 tasks | Do within first month |
| 6. Accessibility | 21 tasks | Do within first month |
| 7. Miscellaneous | 8 tasks | Do as time allows |
| **Total** | **~149 tasks** | |
