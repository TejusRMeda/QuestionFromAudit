# Code Review Learnings

Patterns and gotchas discovered through code reviews. Read this before writing new code.

---

## Patterns to Always Follow

1. **Handle rollback errors** — When cleaning up after a failed operation (e.g., deleting an orphaned record), wrap the cleanup in error handling too. Don't assume the cleanup will succeed.

2. **Preserve array alignment** — When storing parallel arrays (like options and characteristics as pipe-separated strings), never `filter(Boolean)` on one without the other. Empty entries are positional placeholders.

3. **Handle browser API failures** — `navigator.clipboard`, geolocation, etc. can fail silently. Always wrap in try-catch with a user-facing fallback.

4. **Validate parsed integers** — Always check `isNaN(parseInt(...))` and return 400 before using the result in a database query. Supabase will parameterize it (no SQL injection), but `NaN` causes confusing DB errors.

5. **Use single join queries** — Prefer Supabase `!inner` joins over two-step fetch-then-`.in()` queries. The `.in()` clause has a ~1000 item PostgreSQL limit and adds a round-trip.

6. **No debug logging in production** — Remove `console.log` before committing, or guard with `process.env.NODE_ENV === 'development'`. Use `console.error` only for genuine error paths.

7. **Sequence callbacks after state updates** — If a parent callback (like `onCommentAdded`) triggers a refetch, defer it with `queueMicrotask(() => callback())` so React state propagates first. Avoids brief stale UI flashes.

---

## Still Open

No open items. All issues from past code reviews have been resolved.

---

## Feature Reference: Conversation Threads

The suggestion system supports threaded comments between admins and trust users.

**Table:** `suggestion_comments` (migration 006)
**Endpoints:**
- `GET/POST /api/instance/[trustLinkId]/suggestions/[suggestionId]/comments`
- Comment counts are included in suggestion list responses

**Components:** `ConversationThread`, `CommentInput`, `SuggestionThreadModal`

**Behaviour:** Admin comments shown on left (primary), trust user comments on right (secondary). `authorType` is determined server-side from auth status — never trusted from the request body.

---

## Resolved (April 2026 Audit)

These items were identified in earlier reviews and have been fixed. Keeping them here for historical context only.

- ~~Duplicate validation logic~~ → Shared Zod schemas in `lib/validations/`
- ~~Magic validation numbers~~ → Defined in Zod schemas with `.max()` constraints
- ~~No rate limiting~~ → `lib/rateLimit.ts` applied to all mutation endpoints
- ~~Duplicate characteristic parsing~~ → Extracted to `lib/enableWhen.ts` → `parseCharacteristics()`
- ~~Test files use old CSV format~~ → Tests updated, 86 new tests added
- ~~`lib/` vs `libs/` confusion~~ → Merged into single `lib/` folder
- ~~`as unknown as` type casts~~ → Replaced with proper typed assertions + optional chaining
- ~~N+1 query in suggestions route~~ → Uses `!inner` join now (comment counts still use `.in()` which is acceptable)
- ~~Race condition in comment submission~~ → Fixed with `queueMicrotask`
- ~~Missing parseInt NaN check~~ → Added to comments route
- ~~Debug console.log in upload route~~ → Upload route removed entirely (legacy)
- ~~EnableWhen regex fragility~~ → Fixed: multi-char operators (`<=`, `>=`, `!=`) now matched before single-char; `exists` uses word boundary to avoid false matches in characteristic names; split regex uses `\b` for AND/OR
- ~~EnableWhenDisplay accessibility~~ → Added `role="note"` and `aria-label` to `EnableWhenDisplay.tsx`
- ~~Legacy instance-questions route~~ → Deleted. `InstanceViewSuggestionsModal` migrated to use trust-scoped `/api/instance/[trustLinkId]/suggestions` endpoint
