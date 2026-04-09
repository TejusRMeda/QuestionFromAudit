## Project Documentation

- PRD: .claude/docs/prd.md
- Tech Spec: .claude/docs/tech-spec.md
- Learnings: .claude/docs/learnings.md
- What Changed: ../docs/what-changed-and-why.md
- Remediation Plan: ../docs/testing-swarm-remediation-plan.md

Before implementing features, read the relevant PRD section. Always refer to learnings.md when writing new code to avoid repeating mistakes.

## Coding Standards

These standards were established through a comprehensive security/quality audit (April 2026). Follow them when writing new code or modifying existing code.

### Security
- **Server-side Supabase:** Use `createServiceClient()` (service role key) for all server-side data access. Never use the anon key server-side. The anon key is only for the browser-side auth client.
- **Auth on admin endpoints:** Every admin endpoint must call `createClient()` → `auth.getUser()` and verify `user.id` matches the resource owner. Return 401 if unauthenticated, 403 if wrong user.
- **Trust user endpoints need no login** but must validate the `trust_link_id` exists.
- **Derive authorType server-side:** Never trust `authorType` from the request body. Check auth status to determine if admin or trust_user.
- **Block mutations after submission:** Check `instance.submission_status !== "submitted"` before any create/update/delete on suggestions, comments, or section reviews.
- **Sanitize HTML:** Use `DOMPurify.sanitize()` via `isomorphic-dompurify` for any user content rendered with `dangerouslySetInnerHTML`. Prefer the shared `<SafeHtml>` component.
- **No secrets in responses:** Never include `admin_link_id`, `internal_comment`, or `service_role_key` in responses to unauthenticated users.

### API Routes
- **Validate with Zod:** Use schemas from `lib/validations/` — never manual `if (!field)` checks. Return `parsed.error.issues[0].message` on failure with status 400.
- **Rate limit mutations:** Apply `applyRateLimit()` from `lib/rateLimit.ts` to POST/PATCH/DELETE endpoints.
- **Parallel queries:** Use `Promise.all()` for independent Supabase queries. Never chain sequential awaits when queries don't depend on each other.
- **Environment variables:** Import from `lib/env.ts` — never use `process.env.X!` with non-null assertions.

### Frontend
- **Server Components first:** New pages should be Server Components that fetch data and pass it as props to a Client Component (e.g., `page.tsx` → `PageClient.tsx`). Add `loading.tsx` skeletons.
- **One UI library:** Use Shadcn/Base UI (`components/ui/dialog.tsx`) for all modals. Do not add HeadlessUI, Radix dialogs, or other modal libraries.
- **TanStack Query for client data:** Use `useQuery`/`useMutation` for client-side fetching, not manual `useState` + `useEffect` + `fetch`. Configure appropriate `staleTime`.
- **Memoize expensive computations:** Wrap `validate()`, `filteredSuggestions`, `statusCounts`, and similar derived state in `useMemo`.
- **useEffect cleanup:** Always use `AbortController` for fetch calls in `useEffect`. Return a cleanup function that calls `controller.abort()`.
- **useCallback for fetch functions:** Wrap fetch functions passed to `useEffect` dependency arrays in `useCallback`.
- **No eslint-disable:** Fix the root cause instead of suppressing hooks/exhaustive-deps warnings.

### Accessibility
- **Tabs:** Use `role="tablist"`, `role="tab"` + `aria-selected` + `aria-controls`, `role="tabpanel"` + matching IDs.
- **Form fields:** Every input needs a `<label>` with `htmlFor`/`id`. Use `className="sr-only"` for visually-hidden labels. Link errors with `aria-invalid` + `aria-describedby`.
- **Interactive divs:** If a `<div>` has `onClick`, add `role="button"`, `tabIndex={0}`, and `onKeyDown` for Enter/Space.
- **Close buttons:** Always add `aria-label="Close"` to icon-only buttons.
- **Decorative SVGs:** Add `aria-hidden="true"` to icons that are next to text labels.
- **Loading states:** Wrap spinners in `<div role="status" aria-live="polite">`.
- **Colour:** Use `text-slate-500` or darker for body text (not `text-slate-400`). Minimum 4.5:1 contrast ratio.
- **Touch targets:** Minimum 24x24px for all interactive elements.

### Testing
- **Unit tests** for pure functions go in `__tests__/utils/`. Use vitest.
- **API route tests** go in `__tests__/api/`. Mock Supabase with helpers from `__tests__/helpers/supabase-mock.ts`.
- **Test naming:** `describe("function/route name")` → `it("returns/does X when Y")`.
- **Coverage thresholds** are set in `vitest.config.ts` (currently 30% min). Ratchet up when adding tests.

### Code Organisation
- **Single `lib/` folder** — no `libs/`. Supabase clients in `lib/supabase/`.
- **Shared utilities:** If a function appears in 2+ files, extract to `lib/`. Examples: `lib/linkId.ts`, `lib/rateLimit.ts`.
- **Types in `types/`** — one source of truth per type. Never redefine `ComponentChanges` or similar interfaces locally.
- **Hooks in `hooks/`** — extract complex state logic from page components into custom hooks.
- **Validation schemas in `lib/validations/`** — shared between client forms and server routes.
