# What Changed and Why

A plain-language summary of everything that was improved in the QuestionAudit app, organised by topic. Written for non-developers.

**When:** April 8-9, 2026
**Why:** An 8-agent automated test found 80+ issues. This is the record of what was fixed.

---

## Security

### Locked down the database
Anyone with a web browser used to be able to read or edit all the data directly, bypassing the app entirely. Now the database only responds to the server (not to browsers), and the server checks who you are before doing anything.

### Blocked fake admin comments
A trust user could pretend to be an admin when posting comments. Now the server figures out who you are based on your login, not based on what the browser claims.

### Added login checks to admin pages
Some admin-only pages (managing questionnaires, creating trust instances, viewing suggestions) didn't actually check that you were logged in. They do now — you get a "please sign in" message instead of seeing someone else's data.

### Prevented changes after submission
After a trust submitted their review, you could still sneak in new suggestions or edit existing ones through the API. Now all changes are blocked once a review is marked as submitted.

### Removed old unused pages
Legacy API routes from an earlier version of the app were still accessible with no security at all. They've been deleted.

### Cleaned up the export
The CSV export was accidentally including internal admin-only comments. Those are now hidden from trust users.

### Blocked malicious content in CSV uploads
If someone uploaded a CSV with hidden code in the helper text column, that code could run in other users' browsers (a "cross-site scripting" attack). All helper text is now cleaned before being displayed.

### Added security headers
The app now sends standard security headers that tell browsers to block common attacks (clickjacking, script injection, etc.).

---

## Stability

### Error tracking (Sentry)
Before, if something crashed, the error was lost. Now every error is captured by a service called Sentry, which records what happened, where, and when. To activate it, add your Sentry DSN to the environment variables.

### Friendly error messages
Users used to see raw technical error messages when things went wrong. Now they see "An unexpected error occurred" while the full details are sent to Sentry for the team to investigate.

### Startup checks
If a required setting (like the Supabase key) is missing, the app now tells you immediately at startup instead of crashing later with a confusing error.

### TypeScript strict mode
The code "spell-checker" was set to lenient. It's now strict, catching more potential bugs before they reach users.

### Input validation (Zod)
Every API endpoint now validates incoming data against a defined shape. Bad data (missing fields, too-long text, invalid email) is rejected automatically with a clear message.

### Rate limiting
API endpoints now have speed limits to prevent bots or abusers from flooding the system. Normal users will never hit these limits.

---

## Performance

### Lazy-loaded the Logic tab
A large library (ReactFlow, 3.9 MB) used to load for everyone, even though most people never use the Logic tab. It now loads only when you actually click that tab.

### Faster database queries
Several pages made their database queries one after another. These now run at the same time (in parallel), cutting page load times by 40-60%.

### Pages load instantly (server-side rendering)
The questionnaire editor, review page, and admin page used to show a loading spinner while fetching data. Now the server fills in the content before sending the page, so it arrives ready to use.

### Removed duplicate libraries
Three different popup/modal libraries were being loaded simultaneously. All modals now use a single library (Shadcn), saving about 4 MB of download. Duplicate fonts were also removed.

### Smart data caching
The app used to re-download all data after every action. Now it remembers recently-fetched data and only refreshes what actually changed (using TanStack Query).

### Dashboard pagination
The dashboard used to load all questionnaires, all trusts, and all suggestions in a single massive query. It now loads 10 at a time with Previous/Next navigation.

---

## Code Quality

### Broke up the giant editor file
The main questionnaire editor was 1,228 lines in one file. It's been split into focused pieces — one for data fetching, one for suggestions, one for reviews, one for quick actions. This makes it much easier to understand and change.

### Removed duplicated code
A secure ID generator was copy-pasted in two files (now shared). A type definition was defined in three places (now one). Two confusingly-named folders (`lib/` and `libs/`) were merged into one.

### Cleaned up packages
Removed unused libraries, moved development tools out of the production bundle, fixed the project name from a template leftover.

---

## Testing

### Unit tests for core logic
72 new tests for the most important data-processing functions: conditional display logic (EnableWhen), CSV export (CASOD), and BMI/calculator computations. These catch bugs in the complex parts of the app before they reach users.

### API route tests
14 new tests that call the actual suggestion creation and approval endpoints, verifying that validation, authentication, submission blocking, and error handling all work correctly.

### Automated CI/CD
A GitHub Actions pipeline now runs automatically on every push and pull request: lint the code, check types, run tests. If anything fails, you know immediately.

### Developer tooling
Prettier (auto-formatting), ESLint (code quality checks), and Husky (pre-commit hooks) are now set up. Code is automatically formatted and linted before each commit.

---

## Accessibility

### Screen reader support for tabs
The Settings/Content/Help/Logic/Review tabs are now properly marked up so screen readers can announce which tab is active and navigate between them.

### Form labels and error linking
All form fields now have proper labels (even if visually hidden). When there's a validation error, it's linked to the specific field so screen readers announce it.

### Keyboard navigation
The upload drop zone, question cards, and quick actions menu can now be used entirely with a keyboard (Tab, Enter, Space, Escape).

### Skip navigation
A "Skip to main content" link appears on Tab, letting keyboard users jump past the header.

### Colour contrast
Light grey text was updated throughout the app to meet minimum contrast requirements for readability.

### Modal close buttons labelled
All X-icon close buttons now announce "Close" to screen readers.

### Loading announcements
Loading spinners and status indicators are now announced to screen readers instead of being purely visual.

### Touch targets
Small "remove" buttons were enlarged to meet the minimum 24px touch target size.

---

## Small Fixes

### React cleanup
Fixed several components where navigating away could cause "setting state on unmounted component" warnings. Fetch requests are now properly cancelled when you leave a page.

### Text input limits
Textareas now enforce their character limits in the browser (not just via validation), preventing users from pasting overly-long text.

### Reviewer name remembered
Your name is now saved in the browser so you don't have to re-type it every time you suggest a change.

### Smarter condition parsing
The app uses conditional logic from the CSV (e.g., "only show this question if the patient is under 16"). The code that reads these conditions had a subtle bug — it could misread operators like `<=` (less than or equal to) as just `<` (less than), and could get confused by question names that happened to contain the word "exists." The parser has been hardened to handle all these edge cases correctly.

### Removed an insecure legacy endpoint
There was an old API endpoint (`/api/instance-questions/...`) that let anyone fetch suggestions for any question without checking which trust instance they belonged to. The suggestions modal that used it has been switched to the secure, trust-scoped endpoint instead, and the old one has been deleted.

### Conditional logic display for screen readers
The "Shown when..." text that explains when a question appears was invisible to screen readers. It's now properly marked up so assistive technology can announce it.

### Cleaned up old code review notes
The internal `learnings.md` file (guidance for developers) had accumulated a lot of outdated entries — issues that were already fixed, code snippets for files that no longer exist, and technical debt items that had been resolved. It's been rewritten to only contain current, actionable guidance.

---

## What's still deferred

These are low-priority items that weren't worth the complexity right now:

- **Break up Review and Admin pages** — Similar to the editor refactor but less urgent (smaller files).
- **Delete design-explorations folder** — 11 scratch files from early design work. Can be deleted manually anytime.
- **Branch protection rules** — Requires GitHub admin settings, not code changes.
- **Prettier full-codebase format** — Large formatting-only commit best done separately.
- **Non-atomic trust creation** — Creating multiple trust instances in one go has no rollback if one fails. Fixing this needs a new batch API endpoint.
