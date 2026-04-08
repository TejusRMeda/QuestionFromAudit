# Code Review Fixes & TODO List

**Date:** 2026-04-07
**Project:** QuestionFromAudit

---

## What Was Found & Why It Matters

### Critical

#### 1. Database permissions are too open
**Where:** `supabase/migrations/003_master_questionnaires.sql`, `013_suggestion_delete_policies.sql`

Right now, the database lets *anyone* read, create, edit, or delete suggestions — no questions asked. The API code does check that requests make sense (e.g. the suggestion belongs to the right instance), but if someone bypasses the API and talks to the database directly, there's nothing stopping them.

**Why it matters:** Your API is like a locked front door, but the database is an unlocked back door. Both need to be locked.

#### 2. Links are the only security for shared pages
**Where:** All public routes (`/api/review/[linkId]`, `/api/admin/[adminLinkId]`, `/api/instance/[trustLinkId]`, etc.)

Anyone with the link can see and interact with the questionnaire. The links are random enough that guessing is practically impossible, but they can leak through browser history, copy-paste accidents, or email forwarding.

**Why it matters:** If a link gets shared with the wrong person, there's no second layer of protection. Adding rate limiting would at least slow down anyone trying random links.

---

### High Priority

#### 3. Some admin routes don't check who you are
**Where:** `GET /api/masters/[adminLinkId]`, `GET /api/masters/[adminLinkId]/suggestions`

Creating a master questionnaire requires you to be logged in, but *viewing* one through the admin link doesn't. This might be intentional (so you can share admin links), but it's not documented anywhere, so it's unclear if this is a design choice or an oversight.

**Why it matters:** Without documentation, future developers (or future you) won't know if this is a bug or a feature.

#### 4. Some user inputs aren't validated
**Where:**
- `/app/api/instance/[trustLinkId]/export/casod/route.ts` — the `status` filter from the URL isn't checked against a list of valid values
- `/app/api/suggestions/[id]/route.ts` — `internalComment` and `responseMessage` have no length limit, but similar endpoints cap them at 1000 characters

**Why it matters:** Inconsistent validation means some paths let through bad data that others would reject. This can cause confusing bugs and makes the app less predictable.

---

### Medium Priority

#### 5. Creating a trust instance isn't atomic
**Where:** `/app/api/masters/[adminLinkId]/instances/route.ts`

When you create a trust instance, two things happen: (1) the instance row is created, (2) all the master questions are copied over. If step 2 fails, the code tries to delete the instance from step 1, but that cleanup isn't guaranteed to work either.

**Why it matters:** You could end up with an empty trust instance in the database — an instance with no questions attached. This would show up as a broken/empty questionnaire.

#### 6. Unsafe type casting in authorization checks
**Where:** Multiple routes (e.g., `[suggestionId]/route.ts`)

The code uses `as unknown as { instance_id: number }` to force TypeScript to accept a value without actually checking what it contains at runtime. If the database response shape ever changes, this would silently pass bad data instead of throwing an error.

**Why it matters:** Authorization decisions are being made based on unchecked data. If the data doesn't look like what the code assumes, the wrong person could get access.

#### 7. Email validation is missing in one place
**Where:** `/app/api/instance-questions/[questionId]/suggestions/route.ts`

Most endpoints that accept an email address validate it with a regex. This one doesn't.

**Why it matters:** Garbage data in the email field could cause issues downstream (e.g., if you ever send notification emails).

#### 8. Export filename can be empty
**Where:** `/app/api/instance/[trustLinkId]/export/casod/route.ts`

The trust name is sanitized for use as a filename by stripping special characters. If the name is entirely non-ASCII (e.g., a name in another language), the result is an empty string, giving you a file named `-casod-export.csv`.

**Why it matters:** It's a small bug, but it looks broken to the user.

---

## TODO List for Future Sessions

Copy the relevant items into your session prompt when you're ready to work on them.

### Critical — Do First
- [ ] **Tighten RLS policies** — Replace `USING (true)` on `instance_suggestions` with policies that verify the request is linked to a valid instance through the foreign key chain. Write a new migration file.
- [ ] **Add rate limiting** — Add rate limiting middleware for all public link-based routes to prevent brute-force link enumeration. Consider something like `next-rate-limit` or Supabase edge function rate limiting.

### High Priority
- [ ] **Document the auth model** — Write a clear comment block or doc explaining which routes require auth and which use link-based access, and why. This is a design decision that should be explicit.
- [ ] **Validate status filter** — In the CASOD export route, check `statusFilter` against `["all", "pending", "approved", "rejected"]` and return 400 for invalid values.
- [ ] **Add length validation** — In `PUT /api/suggestions/[id]`, add the same 1000-character limit for `internalComment` and `responseMessage` that exists in the other suggestion endpoints.

### Medium Priority
- [ ] **Make instance creation atomic** — Move the "create instance + copy questions" logic into a Supabase database function (stored procedure) that runs as a single transaction. This prevents orphaned instances.
- [ ] **Add runtime type checks** — Replace `as unknown as` casts in authorization checks with actual runtime validation (check that the expected fields exist and have the right types before using them).
- [ ] **Add email validation** — Add the email regex check to `/app/api/instance-questions/[questionId]/suggestions/route.ts` to match all other suggestion endpoints.
- [ ] **Fix empty filename** — Add a fallback (`|| "export"`) after sanitizing the trust name so the filename is never empty.

### Low Priority (Nice to Have)
- [ ] **Consistent error handling in middleware** — Wrap `updateSession` in a try/catch in `middleware.ts`.
- [ ] **Consider CORS headers** — If you ever need cross-origin API access, add explicit CORS configuration instead of relying on Next.js defaults.
