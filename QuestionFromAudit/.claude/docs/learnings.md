# Code Review Learnings

This document tracks issues found during code reviews and patterns to follow.

## Code Review - January 2026

### Critical Issues Fixed

#### 1. Database Rollback Error Handling
**Location:** `app/api/upload/route.ts:141`, `app/api/masters/route.ts:139`

**Problem:** When question insertion fails, the rollback (project deletion) had no error handling. If deletion failed, orphaned projects would remain in the database.

**Fix:** Added error handling for rollback operations:
```typescript
if (questionsError) {
  const { error: deleteError } = await supabase.from("projects").delete().eq("id", project.id);
  if (deleteError) {
    console.error("Rollback failed:", deleteError);
  }
  return NextResponse.json({ message: "Failed to save questions" }, { status: 500 });
}
```

#### 2. Characteristic Alignment Bug
**Location:** `app/api/upload/route.ts:118-123`, `app/api/masters/route.ts`

**Problem:** `filter(Boolean)` on characteristics broke position alignment with options. If options were "Yes|No|Maybe" with characteristics "yes_char||maybe_char", filtering produced "yes_char|maybe_char" - misaligning "maybe_char" with "No".

**Fix:** Remove `filter(Boolean)` to preserve position alignment:
```typescript
characteristic: q.options.length > 0
  ? q.options.map((opt) => opt.characteristic || "").join("|")
  : null,
```

#### 3. Clipboard API Error Handling
**Location:** `app/upload/page.tsx:288`, `app/masters/upload/page.tsx`

**Problem:** `navigator.clipboard.writeText()` can fail (no HTTPS, denied permission), but success toast always showed.

**Fix:** Wrap in try-catch with fallback message:
```typescript
try {
  await navigator.clipboard.writeText(adminUrl);
  toast.success("Admin link copied to clipboard!", { duration: 4000 });
} catch {
  toast.success(`Project created! Admin URL: ${adminUrl}`, { duration: 8000 });
}
```

### Code Quality Improvements

#### 4. Removed Unused Variable
**Location:** `app/upload/page.tsx:76`, `app/masters/upload/page.tsx`

**Problem:** `questionIndex` was declared and incremented but never used.

**Fix:** Removed the unused variable.

### Patterns to Follow

1. **Always handle rollback errors** - When cleaning up after failures, wrap in try-catch or check for errors
2. **Preserve array alignment** - When storing parallel arrays (options/characteristics), don't filter one without the other
3. **Handle browser API failures gracefully** - Clipboard, geolocation, etc. can fail; always have fallbacks
4. **Remove dead code** - Unused variables add confusion; delete them

### Known Technical Debt

1. **Duplicate validation logic** - Same validation exists in 4 files (upload pages and API routes). Consider extracting to shared utility.
2. **Test files use old format** - Tests reference old CSV format (Question_ID, Category) instead of MyPreOp format (id, section, itemType). Tests pass but don't validate actual API contract.
3. **Magic numbers** - Values like 500, 1000, 5MB should be constants.

---

## Feature Implementation - January 2026

### Suggestion Conversation Thread Feature

Transforms the single `response_message` field into a threaded conversation system where admins and trust users can exchange messages.

#### Database Changes

**New Table: `suggestion_comments`** (`supabase/migrations/006_suggestion_comments.sql`)
```sql
CREATE TABLE suggestion_comments (
  id BIGSERIAL PRIMARY KEY,
  suggestion_id BIGINT NOT NULL REFERENCES instance_suggestions(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('admin', 'trust_user')),
  author_name TEXT NOT NULL,
  author_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/instance/[trustLinkId]/suggestions/[suggestionId]/comments` | Fetch all comments for a suggestion |
| POST | `/api/instance/[trustLinkId]/suggestions/[suggestionId]/comments` | Add a new comment |

**Modified endpoints** to include `commentCount` per suggestion:
- `GET /api/instance/[trustLinkId]/suggestions`
- `GET /api/instance-questions/[questionId]/suggestions`

#### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ConversationThread` | `components/questionnaire/ConversationThread.tsx` | Chat-style display with admin messages (primary) on left, trust user messages (secondary) on right |
| `CommentInput` | `components/questionnaire/CommentInput.tsx` | Form for adding comments with name, email, message |
| `SuggestionThreadModal` | `components/questionnaire/SuggestionThreadModal.tsx` | Full modal for viewing/participating in thread |

#### UI Changes

**Admin View** (`/instance/[trustLinkId]/suggestions`):
- Comment count badges on suggestion cards
- "View Thread" button opens conversation modal
- Admins can reply in threads

**Trust User View** (`/instance/[trustLinkId]` via InstanceViewSuggestionsModal):
- Comment count badges on suggestions
- "View Thread" button for each suggestion
- Trust users can reply in threads

#### Files Modified

| File | Change |
|------|--------|
| `app/api/instance/[trustLinkId]/suggestions/route.ts` | Added `commentCount` to response |
| `app/api/instance-questions/[questionId]/suggestions/route.ts` | Added `commentCount` to response |
| `app/instance/[trustLinkId]/suggestions/page.tsx` | Added thread modal, comment badges |
| `components/questionnaire/InstanceViewSuggestionsModal.tsx` | Added thread modal, `trustLinkId` prop |
| `app/instance/[trustLinkId]/page.tsx` | Pass `trustLinkId` to modal |

#### Deployment

Run the database migration:
```bash
supabase db push
# or manually run supabase/migrations/006_suggestion_comments.sql
```

---

## Code Review - February 2026 (feature/enable-when branch)

### Critical Issues Found

#### 1. N+1 Query Pattern in Suggestions Route
**Location:** `app/api/instance/[trustLinkId]/suggestions/route.ts:35-82`

**Problem:** Two-step query (fetch all question IDs, then filter suggestions with `.in()`) instead of a single join-based query. The `.in()` clause has a PostgreSQL limit (~1000 items) and adds an unnecessary round-trip.

**Recommendation:** Revert to join-based filtering with `!inner` to let PostgreSQL handle the filtering in a single query.

#### 2. Missing parseInt Validation for suggestionId
**Location:** `app/api/instance/[trustLinkId]/suggestions/[suggestionId]/comments/route.ts:218`

**Problem:** `parseInt(suggestionId, 10)` is used without checking for `NaN`. While Supabase parameterizes queries (preventing SQL injection), `NaN` will cause a database error instead of a clean 400 response.

**Recommendation:** Validate `parseInt` result and return 400 if `isNaN`.

#### 3. Unsafe Type Assertions (`as unknown as`)
**Location:** `app/api/instance/[trustLinkId]/suggestions/[suggestionId]/comments/route.ts:64, 206`

**Problem:** `as unknown as { instance_id: number }` bypasses TypeScript safety entirely. If the nested join object is missing or schema changes, this throws a runtime error.

**Recommendation:** Use type guards or optional chaining instead of double casting.

### Important Issues Found

#### 4. Debug console.log Left in Production
**Location:** `app/api/upload/route.ts:102-111`

**Problem:** Debug logging of first question's characteristic data is left in production code.

**Recommendation:** Remove or guard with `process.env.NODE_ENV === 'development'`.

#### 5. Duplicate Characteristic Parsing
**Location:** `app/instance/[trustLinkId]/page.tsx`, `app/review/[linkId]/page.tsx`, `components/questionnaire/SuggestionThreadModal.tsx`

**Problem:** The pattern `question.characteristic.split("|").map((c) => c.trim())` is duplicated in 3+ files.

**Recommendation:** Extract to `lib/characteristics.ts` utility function.

#### 6. EnableWhen Regex Edge Cases
**Location:** `types/question.ts:149` (parseEnableWhen function)

**Problem:** The regex split pattern `\s*(?:AND|OR)\s*|\)(?:AND|OR)\(` may not handle conditions without whitespace around operators (e.g., `age<16ANDexists`).

**Recommendation:** Make regex more flexible: `/\s*\)?\s*(?:AND|OR)\s*\(?\s*/`

#### 7. Race Condition in Comment Submission
**Location:** `components/questionnaire/SuggestionThreadModal.tsx:112-148`

**Problem:** `onCommentAdded?.()` fires immediately after `setComments`, potentially triggering a parent refetch before React state propagates, causing a brief stale UI flash.

**Recommendation:** Sequence the callback after state update via microtask.

### Suggestions

#### 8. Magic Numbers Should Be Constants
**Problem:** Validation limits (100, 1000, 2000) are hardcoded across API routes.

**Recommendation:** Extract to `lib/constants.ts` as `VALIDATION_LIMITS`.

#### 9. Missing Rate Limiting
**Problem:** No rate limiting on POST routes for comments/suggestions.

**Recommendation:** Add rate limiting middleware to prevent spam abuse.

#### 10. Missing Accessibility Attributes
**Location:** `components/questionnaire/EnableWhenDisplay.tsx`

**Recommendation:** Add `role="note"` and `aria-label` for screen readers on the conditional logic display.

### Updated Patterns to Follow

5. **Validate parsed integers** - Always check `isNaN(parseInt(...))` before using in database queries
6. **Avoid `as unknown as` casts** - Use type guards or optional chaining for Supabase nested join results
7. **Don't leave debug logging** - Remove `console.log` or guard behind `NODE_ENV` before committing
8. **Use single join queries** - Prefer Supabase `!inner` joins over two-step `.in()` queries for related data

### Updated Technical Debt

4. **Duplicate characteristic parsing** - `split("|").map(c => c.trim())` pattern in 3+ files. Extract to shared utility.
5. **Magic validation numbers** - Hardcoded limits (100, 1000, 2000) in API routes. Extract to constants.
6. **No rate limiting** - POST endpoints for comments/suggestions have no abuse protection.
