lets# Trust Instance Page — Design Evaluation Report

## Executive Summary

### Top 5 Critical Issues (Cross-Agent Consensus)

| # | Issue | Severity | Agent(s) | Primary File(s) |
|---|-------|----------|----------|-----------------|
| 1 | **No progress indicator** — trust users have zero sense of audit completion | P1 | Visual Storyteller, UX Researcher, UX Architect | `page.tsx` |
| 2 | **Brand color inconsistency** — patient view hardcodes `#0075DF` instead of brand `#4A90A4` | P1 | Brand Guardian, UI Designer | `QuestionsList.tsx:230-332` |
| 3 | **No onboarding for first-time trust users** — arrives via shared link with no guidance | P1 | UX Researcher, Whimsy Injector | `page.tsx`, `EmptyPanelState.tsx` |
| 4 | **Divider touch target 4px wide** — below WCAG 44px minimum for interactive elements | P1 | UI Designer, UX Architect | `ResizableDivider.tsx:111` |
| 5 | **`text-base-content/60` contrast** — 60% opacity text likely fails WCAG AA 4.5:1 ratio | P1 | UI Designer, Brand Guardian | Multiple files |

### Top 5 Quick Wins

| # | Win | Effort | Impact | File(s) |
|---|-----|--------|--------|---------|
| 1 | Replace `#0075DF` with CSS variable referencing `#4A90A4` | 15 min | High — brand consistency | `QuestionsList.tsx` |
| 2 | Widen divider hit area from 4px to 44px with transparent padding | 15 min | High — accessibility | `ResizableDivider.tsx` |
| 3 | Add category color indicators to question cards (left border) | 30 min | Medium — visual grouping | `QuestionsList.tsx` |
| 4 | Add transition animations to tab switches | 20 min | Medium — perceived polish | `EditPanel.tsx`, `MobileEditModal.tsx` |
| 5 | Improve EmptyPanelState with contextual guidance text | 20 min | Medium — first-time UX | `EmptyPanelState.tsx` |

### Priority Matrix

| Issue | Severity | Agent(s) | Fix | File(s) |
|-------|----------|----------|-----|---------|
| No progress indicator | P1 | Storyteller, Researcher | Add progress bar to header showing reviewed/total | `page.tsx` |
| Brand color `#0075DF` mismatch | P1 | Brand Guardian, UI Designer | Replace with CSS variable / brand primary | `QuestionsList.tsx` |
| No onboarding | P1 | Researcher, Whimsy | Add welcome state or tooltip tour | `page.tsx`, `EmptyPanelState.tsx` |
| 4px divider touch target | P1 | UI Designer, Architect | Widen interactive area to 44px | `ResizableDivider.tsx` |
| 60% opacity text contrast | P1 | UI Designer, Brand Guardian | Increase to `/70` or `/80`, verify ratio | Multiple |
| Flat question list — no grouping | P2 | Storyteller, UI Designer | Group by category, add color accents | `QuestionsList.tsx` |
| Panel/Modal toggle confusion | P2 | Researcher | Remove toggle or add explanation; default to panel on desktop | `page.tsx:312-324` |
| Bland empty states | P2 | Whimsy, Storyteller, Researcher | Add contextual illustrations and guidance copy | `EmptyPanelState.tsx`, `QuestionsList.tsx:380-404` |
| Missing transitions | P3 | Whimsy | Add CSS transitions for tab switch, panel open, card selection | `EditPanel.tsx`, `MobileEditModal.tsx` |
| No design token system | P3 | Architect | Extract spacing/color into CSS custom properties | Global |

---

## Agent Evaluations

### UX Architect

**Focus**: Layout, CSS systems, responsive strategy, component hierarchy

#### Layout System Assessment

The split-screen layout uses percentage-based widths (`leftWidthPercent` state) with `window.innerWidth` for constraint calculations (`SplitScreenLayout.tsx:57-67`). This works but has architectural gaps:

- **No CSS Grid** — The entire layout is `flex` with inline `width` styles. CSS Grid would provide better control for the split-screen pattern with `grid-template-columns: ${left}% 4px 1fr`.
- **Percentage widths calculated in JS** — `containerWidth` is tracked via `window.innerWidth` with debounced resize listener (`SplitScreenLayout.tsx:52-67`). A `ResizeObserver` on the container element would be more accurate and responsive.
- **Min-width constraints in JS** — `MIN_LEFT_WIDTH: 320` and `MIN_RIGHT_WIDTH: 400` (`SplitScreenLayout.tsx:16-17`) are enforced in the `handleResize` callback. CSS `minmax()` in a Grid layout would handle this declaratively.

#### Responsive Strategy

- **`window.innerWidth < 768` detection** (`page.tsx:94-98`) — Uses imperative JS instead of CSS media queries or `useMediaQuery` hook. The debounced resize listener adds complexity.
- **Mobile breakpoint is correct** (768px aligns with DaisyUI's `md:` breakpoint), but the implementation creates a potential mismatch: CSS `md:hidden`/`md:block` classes on `SplitScreenLayout.tsx:117,126,136` use CSS breakpoints while the `isMobile` state uses JS measurement. These could briefly disagree during resize.
- **No tablet-specific layout** — Between 768px and ~1100px, both panels render but the right panel gets squeezed below `MIN_RIGHT_WIDTH: 400px`. No intermediate layout exists.

#### Component Hierarchy Gaps

- **EditPanel and MobileEditModal duplicate tab rendering** — Both files (`EditPanel.tsx:143-203`, `MobileEditModal.tsx:141-201`) contain identical `renderTabContent()` switch statements. A shared `TabContentRenderer` component would eliminate this duplication.
- **No layout token system** — `max-w-[1800px]` appears in multiple places (`page.tsx:299,347`). No shared layout constants.
- **Header is 3 sections** (title, filters, content) but they're sibling `div`s — a `PageHeader` compound component would improve reusability.

#### Recommendations

1. **P2** — Migrate `SplitScreenLayout` to CSS Grid with `minmax()` constraints (`SplitScreenLayout.tsx`)
2. **P2** — Replace `window.innerWidth` detection with CSS media queries or `useMediaQuery` hook (`page.tsx:89-104`)
3. **P3** — Extract shared `TabContentRenderer` from `EditPanel.tsx` and `MobileEditModal.tsx`
4. **P3** — Create layout constants file for `max-w-[1800px]`, `MIN_LEFT_WIDTH`, etc.
5. **P2** — Add tablet breakpoint (768-1024px) with collapsed right panel or bottom sheet

---

### UX Researcher

**Focus**: User behavior, task flows, usability, cognitive load

#### Trust User Persona

The trust user arrives via a shared link (`/instance/[trustLinkId]`) with **no authentication, no prior context, and no onboarding**. They are:
- A clinical professional (nurse, consultant, admin) reviewing a pre-operative questionnaire
- First-time visitor to this specific interface
- Goal: Review questions and submit structured feedback
- Mental model: "I received a link, I need to check these questions and flag issues"

#### Task Flow Evaluation

**Expected flow**: Arrive via link → Understand context → Browse questions → Select question → Edit/suggest changes → Review → Submit

**Issues found**:

1. **No welcome state** (`page.tsx:295-530`) — The page loads directly into the split-screen with an empty right panel. A first-time user sees "Select a Question" with a pencil icon (`EmptyPanelState.tsx`) but no explanation of the workflow: browse left, edit right, submit suggestions.

2. **Panel/Modal toggle is confusing** (`page.tsx:312-324`) — The header contains a "Panel | Modal" toggle that switches between split-screen and full-width+modal modes. Trust users don't understand what "Panel" vs "Modal" means in this context. This is a development/demo feature that should not be exposed to end users, or should be relabeled (e.g., "Side-by-side" / "Full screen").

3. **"Audit | Patient" toggle lacks context** (`page.tsx:325-338`) — Users see two view modes but aren't told what they do. "Audit" view shows structured metadata (category badges, characteristics, answer types). "Patient" view shows questions as patients would see them. A tooltip or label would help.

4. **5-tab panel overhead** (`EditPanel.tsx:222-254`) — Settings, Content, Help, Logic, Review. A trust user making a simple text suggestion must navigate past Settings and find the Content tab. For simple changes, this is excessive cognitive load. Consider: pre-selecting the most relevant tab based on question type, or collapsing less-used tabs.

5. **No confirmation of submission impact** (`ReviewTab.tsx:304-318`) — After clicking "Submit Suggestion," users get a toast (`page.tsx:225`) but stay on the same question. No clear next-action guidance ("Continue reviewing other questions" or "View your submitted suggestions").

6. **Question navigation is scroll-only** — No way to jump to a specific question, category, or use keyboard navigation between questions. The question list can be very long (20+ questions typical).

#### Cognitive Load Issues

- **Badge overload on question cards** (`QuestionsList.tsx:491-500`) — Each card shows: category badge, conditional badge, suggestion count badge, answer type label, characteristic badges, helper icon. For complex questions, this is 5-6 visual elements competing for attention.
- **No visual distinction between reviewed and unreviewed questions** — Users can't tell which questions they've already looked at.

#### Recommendations

1. **P1** — Add welcome/onboarding state for first-time trust users with 3-step guidance (`page.tsx`, `EmptyPanelState.tsx`)
2. **P1** — Remove or rename Panel/Modal toggle — default to panel on desktop, modal on mobile (`page.tsx:312-324`)
3. **P2** — Add "reviewed" visual state to question cards (subtle checkmark or background change) (`QuestionsList.tsx`)
4. **P2** — Auto-select Content tab when a question is selected (most common edit) (`useEditPanelState.ts`)
5. **P2** — Add post-submission guidance: "Suggestion submitted! Continue reviewing or view all suggestions" (`page.tsx:225-237`)
6. **P3** — Add category jump links or keyboard shortcuts for question navigation (`page.tsx`)

---

### UI Designer

**Focus**: Design tokens, color, typography, spacing, WCAG AA

#### Design Token Audit

The page relies entirely on DaisyUI semantic classes (`bg-base-100`, `text-base-content`, `border-base-300`) with **no explicit design token system**:

- **No CSS custom properties** for spacing, typography, or component-specific values
- **Magic numbers** scattered throughout: `max-w-[1800px]`, `min-h-[400px]`, `gap-3`, `p-4`, `py-3`, `px-4`
- **DaisyUI handles theming** (light/dark via semantic classes), but any customization beyond DaisyUI's defaults requires ad-hoc classes
- **Patient view uses raw hex values** (`#0075DF`, `#414141`, `#0058A7`) that bypass DaisyUI's theme system entirely (`QuestionsList.tsx:230-351`)

#### Color Contrast Check

**`text-base-content/60`** (60% opacity) appears in:
- Loading state: `page.tsx:255`
- Error state: `page.tsx:283`
- Header subtitle: `page.tsx:303`
- Filter text: `page.tsx:351,391`
- Empty state: `EmptyPanelState.tsx:27`
- Tab inactive text: `EditPanel.tsx:237`
- Settings labels: `SettingsTab.tsx:65,66,108`
- Content labels: `ContentTab.tsx:273,350`
- Help labels: `HelpTab.tsx:127,134`
- Logic labels: `LogicTab.tsx:109,241`
- Review labels: `ReviewTab.tsx:83,109`

With DaisyUI's default light theme (`base-content` = `#1f2937` on `base-100` = `#ffffff`), 60% opacity yields `rgba(31,41,55,0.6)` — approximately `#7c8492` on white. This gives a contrast ratio of **~4.2:1**, which **fails WCAG AA for normal text** (requires 4.5:1). At `text-base-content/70`, the ratio improves to ~5.3:1 (passes).

#### Touch Target Audit

- **Resizable divider**: `w-1` = 4px wide (`ResizableDivider.tsx:111`). The hover area extends via `inset-y-0 -left-1 -right-1` (adds 4px each side = 12px total), but this is still far below the 44px minimum. The actual interactive hit area is the `div` element itself at 4px.
- **Tab indicator dots**: `w-2 h-2` = 8px (`EditPanel.tsx:245-248`). These are not interactive but appear to be (they look like status indicators, not buttons). If users try to click them expecting action, the target is too small.
- **Mobile tab buttons**: Adequate at `px-4 py-3` (~44px height) (`MobileEditModal.tsx:289`)
- **Question cards**: Good — full card is clickable with `role="button"` and `tabIndex={0}` (`QuestionsList.tsx:556-572`)

#### Component State Coverage

| Component | Default | Hover | Focus | Active | Disabled | Loading | Error | Empty |
|-----------|---------|-------|-------|--------|----------|---------|-------|-------|
| Question Card | Yes | Yes | Yes (keyboard) | Yes (selected) | No | No | No | Yes |
| Tab Button | Yes | Yes | No visible focus ring | Yes | No | No | No | N/A |
| ResizableDivider | Yes | Yes | Yes (keyboard arrows) | Yes (dragging) | No | No | No | N/A |
| Submit Button | Yes | Via DaisyUI | Via DaisyUI | No | Yes | Yes | No | N/A |
| EmptyPanelState | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Yes (bland) |

Missing states:
- **No loading skeleton** for question cards during fetch
- **No error state per-card** (only page-level error)
- **Tab buttons lack visible focus ring** — only `border-b-2` change on active, no `:focus-visible` outline

#### WCAG AA Findings

1. **Contrast failure**: `text-base-content/60` at ~4.2:1 (see above) — affects ~20+ elements
2. **Touch target**: Divider at 4px (12px with hover) — requires 44px minimum
3. **Missing focus indicators**: Tab buttons in `EditPanel.tsx:230-251` have no `:focus-visible` style
4. **Color-only differentiation**: Tab indicator dots use color alone (green for changes, red for errors) with no shape/icon difference (`EditPanel.tsx:243-249`)
5. **Patient view custom radio/checkbox** (`QuestionsList.tsx:280-302`) — uses `appearance-none` with custom spans. The accessible name comes from adjacent `<label>`, which is correct, but the visual indicator relies on `peer-checked` CSS that may not be announced to screen readers properly.

#### Recommendations

1. **P1** — Replace all `text-base-content/60` with `text-base-content/70` or higher across all files
2. **P1** — Widen `ResizableDivider` interactive area to 44px minimum (`ResizableDivider.tsx:111`)
3. **P1** — Add `:focus-visible` outline to tab buttons (`EditPanel.tsx:234`, `MobileEditModal.tsx:289`)
4. **P2** — Add shape differentiation to indicator dots (e.g., dot for changes, triangle for errors) (`EditPanel.tsx:243-249`)
5. **P2** — Add loading skeleton state for question list during fetch (`page.tsx:250-258`)
6. **P3** — Extract design tokens into CSS custom properties for spacing scale and component values

---

### Brand Guardian

**Focus**: Brand identity, color consistency, voice/tone

#### Brand Color Audit

**Primary brand color**: `#4A90A4` (teal-blue, defined in app config and used consistently in DaisyUI theme)

**Patient view color mismatch**: The patient view uses `#0075DF` (bright blue) throughout `QuestionsList.tsx`:
- Focus rings: `focus:ring-[#0075DF] focus:border-[#0075DF]` (lines 230, 245, 261)
- Radio checked: `peer-checked:bg-[#0075DF]` (line 291)
- Checkbox checked: `peer-checked:bg-[#0075DF]` (line 330)
- Focus outlines: `peer-focus:ring-[#0075DF]` (lines 293, 332)
- Selected state: `ring-[#0075DF]/30 bg-blue-50/50` (lines 424, 439)
- "Add Suggestion" text: `text-[#0075DF] hover:text-[#0058A7]` (line 461)

This `#0075DF` appears to come from the MyPreOp/UltraMed patient-facing style guide, not the QuestionAudit brand. When users toggle between Audit and Patient views, the entire color identity shifts from teal-blue to bright blue — creating brand confusion.

**Other hardcoded colors in patient view**:
- Text: `#414141` (lines 428, 351, 446) — a custom gray that doesn't match DaisyUI's `text-base-content`
- Hover text: `#0058A7` (line 461) — darker variant of the off-brand blue

**Audit view colors**: Correctly use DaisyUI semantic classes (`text-primary`, `bg-primary/5`, `border-primary`) which resolve to `#4A90A4`.

#### Microcopy Voice Analysis

The current microcopy is functional but generic:

| Element | Current Copy | Assessment |
|---------|-------------|------------|
| Page title | `{instance.trustName}` | Good — personalized |
| Subtitle | `{count} questions` | Bare — no context |
| Empty panel | "Select a Question" / "Click on any question from the list to view its details and suggest changes." | Generic, slightly instructional |
| Loading | "Loading questions..." | Standard |
| Error | "Unable to Load Questionnaire" / "The link may be invalid or expired. Please contact your account manager." | Good — actionable |
| Submit success | "Suggestion submitted successfully!" | Generic toast |
| Filter empty | "No questions match your filters" | Standard |
| Review empty | "No changes have been made yet. Use the tabs above to suggest changes." | Slightly confusing — "tabs above" may not be visible |

**Voice assessment**: The tone is neutral/instructional. For a clinical audit tool, this is appropriate, but could be warmer. The voice doesn't convey expertise or trustworthiness — it reads like default placeholder text.

#### Clinical Identity Alignment

The app serves NHS trusts reviewing clinical questionnaires. The visual identity should convey:
- **Trustworthiness** — established, reliable
- **Clinical competence** — professional, not playful
- **Collaborative** — review and feedback, not top-down

Currently, the design is visually generic (DaisyUI defaults) with no distinct clinical identity beyond the brand color.

#### Recommendations

1. **P1** — Replace all `#0075DF` instances in patient view with brand-derived colors. If the intent is to preview UltraMed's patient styling, add a clear visual boundary (e.g., a "Patient Preview" frame/label) rather than changing the app's own color scheme (`QuestionsList.tsx:230-461`)
2. **P1** — Replace hardcoded `#414141` with DaisyUI semantic classes (`QuestionsList.tsx:428,351,446`)
3. **P2** — Refine subtitle from bare "X questions" to "X questions to review" or "Reviewing X questions" (`page.tsx:303-305`)
4. **P2** — Add "Questionnaire Audit" branding in header alongside trust name (`page.tsx:302`)
5. **P3** — Develop clinical voice guidelines: "Warm professional" — helpful without being casual, expert without being cold
6. **P3** — Add subtle clinical identity elements (NHS-appropriate iconography, trust logo placeholder)

---

### Whimsy Injector (Clinical Calibration)

**Context**: This is a clinical audit tool used by NHS professionals. Whimsy must be calibrated to "reassuring competence" — subtle delight that reduces cognitive load without undermining professionalism.

#### Empty State Personality

**`EmptyPanelState.tsx`** — Current: generic pencil icon in a gray circle, "Select a Question" heading, one line of instruction text.

Assessment: This is the first thing users see in the right panel. It communicates nothing about the tool's value or workflow. The pencil icon is generic — it could be any editing interface.

Suggested personality injection:
- Replace pencil with a purpose-specific illustration (clipboard + checkmark, or stethoscope + document)
- Add a brief welcome message: "Ready to review? Select a question from the list to start suggesting improvements."
- Include a subtle hint: "Your feedback helps improve patient questionnaires across the trust."

**No-results empty state** (`QuestionsList.tsx:380-404`) — Current: sad face icon + "No questions match your filters". Uses the same generic icon pattern. Could be warmer: "No matches — try adjusting your search or clearing filters."

#### Loading/Success State Evaluation

**Loading** (`page.tsx:250-258`): Standard spinner + "Loading questions..." — functional but bland. For a clinical tool, a skeleton loader would be more professional and reduce perceived wait time.

**Success** (`page.tsx:225`): `toast.success("Suggestion submitted successfully!")` — A standard toast notification. This is the key moment of accomplishment — the user has completed their primary task. Currently it's identical to any other toast.

Suggested: After submission, briefly highlight the question card with a success state (green border pulse, subtle checkmark), and update the subtitle to show progress ("8 of 24 reviewed").

#### Micro-Interaction Opportunities

| Interaction | Current | Suggested | Calibration |
|-------------|---------|-----------|-------------|
| Card selection | Instant border change | Subtle 150ms border/background transition | Professional — no bounce or scale |
| Tab switch | Instant content swap | 200ms fade or slide transition | Smooth, not distracting |
| Divider drag | Smooth (good) | Add subtle snap feedback at 50% mark | Helpful precision aid |
| Submission | Toast only | Brief confetti would be inappropriate. Instead: success state on card + progress update | Clinical — achievement without celebration |
| Card hover | `hover:shadow-sm` | Good as-is, could add 100ms transition | Already calibrated |
| Filter apply | Instant list update | 150ms fade for filtered items | Reduces jarring list change |

#### Contextual Delight ("Reassuring Competence")

The right tone for this tool:
- **DO**: Smooth transitions, helpful empty states, clear progress feedback, satisfying completion states
- **DON'T**: Confetti, bouncy animations, emoji-heavy microcopy, gamification elements

Specific opportunities:
1. **Completion satisfaction** — When all questions have suggestions, show a subtle "Review complete" state
2. **Progress visualization** — A thin progress bar in the header (see Visual Storyteller section)
3. **Smooth state changes** — CSS transitions on all interactive elements (currently many are instant)

#### Recommendations

1. **P2** — Redesign `EmptyPanelState` with contextual illustration and guidance copy (`EmptyPanelState.tsx`)
2. **P2** — Add CSS `transition-all duration-150` to card selection, tab switches, and filter changes (`QuestionsList.tsx:558`, `EditPanel.tsx:234`)
3. **P2** — Replace loading spinner with skeleton loader (`page.tsx:250-258`)
4. **P3** — Add post-submission card highlight (brief green border transition) (`QuestionsList.tsx`)
5. **P3** — Improve no-results empty state copy and icon (`QuestionsList.tsx:380-404`)
6. **P3** — Add subtle completion state when all questions reviewed (`page.tsx`)

---

### Visual Storyteller

**Focus**: Information hierarchy, visual flow, progress visualization

#### Information Hierarchy Assessment

**Current question card** (`QuestionsList.tsx:487-551`) contains these visual layers:

1. Category badge (`badge-ghost badge-sm`) — gray pill
2. Conditional badge (`badge-info badge-outline badge-sm`) — blue pill
3. Suggestion count badge (`badge-info badge-sm`) — blue pill
4. Question text (`text-sm text-base-content`) — main content
5. Helper display (collapsible) — additional info
6. Answer inputs (radio/checkbox/text) — interactive
7. "Add Suggestion" button (modal mode only)

**Problem**: Layers 1-3 all use similar-sized badges with low visual differentiation. The category badge is `badge-ghost` (gray background) — it doesn't visually distinguish "Who I Am" from "My Health" from "Allergies." All categories look identical, creating a flat, undifferentiated list.

**Visual weight is inverted**: Metadata (badges) appears above the question text, competing for first-read attention. The user's eye should land on the question text first.

#### Visual Flow (Left → Right Narrative)

The intended narrative: **Browse questions (left) → Select → Edit details (right) → Submit**

Current issues:
1. **Left panel has no visual grouping** — Questions are a single continuous list. No category headers, no visual breaks, no grouping indicators.
2. **Right panel empty state doesn't guide the eye** — The pencil icon is centered but doesn't direct attention back to the left panel. The flow is broken.
3. **Selected question lacks emphasis** — The selected card gets `border-primary ring-2 ring-primary/20` but the right panel header repeats the same question info in a smaller format. There's no visual "connection" between left card and right panel.

#### Progress Visualization Gap

**No progress tracking exists.** Trust users reviewing 24+ questions have no way to know:
- How many questions they've reviewed
- How many suggestions they've submitted
- Whether they're "done"

This is the single biggest visual storytelling failure. The audit is a **journey** (start → middle → complete), but the interface presents it as a **static list** with no sense of progression.

V3 Dashboard Grid exploration solves this with a segmented progress bar showing reviewed/in-progress/remaining.

#### Category Visual Grouping

All design explorations address this:
- **V1 Clean Clinical**: Left-border color accents per category (`.category-who { border-left-color: #4A90A4; }`)
- **V2 Notion-style**: Collapsible sidebar groups with section headers
- **V3 Dashboard Grid**: Color-coded filter chips with category dot indicators

The current implementation has none of these. Every card looks the same regardless of category.

#### Recommendations

1. **P1** — Add progress bar to header showing reviewed/submitted/total questions (`page.tsx:298-342`)
2. **P2** — Add category color accents to question cards (left border or top accent) (`QuestionsList.tsx:558`)
3. **P2** — Reorder card content: question text first, then metadata badges below (`QuestionsList.tsx:487-501`)
4. **P2** — Add category group headers when browsing all categories (`QuestionsList.tsx:480-585`)
5. **P2** — Create visual connection between selected card and edit panel (matching accent color, connected line, or breadcrumb) (`EditPanel.tsx:207-219`, `QuestionsList.tsx`)
6. **P3** — Add "audit complete" celebration state when all questions have been reviewed (`page.tsx`)

---

## Cross-Cutting Themes

Issues flagged by 3+ agents are highest priority:

### 1. Empty States Need Redesign (Whimsy, Researcher, Storyteller)
Both `EmptyPanelState.tsx` and the no-results state in `QuestionsList.tsx:380-404` are generic and unhelpful. All three agents flag the need for contextual guidance, visual personality, and workflow hints.

### 2. Progress/Completion Tracking Missing (Storyteller, Researcher, Architect)
No visual feedback on audit progress. All three agents identify this as a critical gap in the user journey. Users need to know where they are and when they're done.

### 3. Category Visual Distinction (Storyteller, UI Designer, Architect)
The flat question list with uniform `badge-ghost` styling makes it impossible to visually scan by category. All explorations solve this differently.

### 4. Brand Color Inconsistency (Brand Guardian, UI Designer)
The `#0075DF` in patient view breaks brand identity. Both agents flag this as a P1 issue requiring immediate fix.

### 5. Accessibility Gaps (UI Designer, Architect)
The 4px divider, missing focus indicators, and contrast issues affect usability for all users, not just those with disabilities. Both agents flag multiple WCAG AA failures.

### 6. Transition/Animation Missing (Whimsy, Storyteller)
Nearly all state changes are instant — tab switches, card selection, panel opening, filter application. Both agents recommend subtle CSS transitions for professional polish.

---

## Design Exploration References

| Issue | V1 Clean Clinical | V2 Notion-style | V3 Dashboard Grid | Recommendation |
|-------|-------------------|-----------------|-------------------|----------------|
| Progress indicator | No | No | **Yes** — segmented progress bar with reviewed/in-progress/remaining | Adopt V3's progress bar pattern |
| Category visual grouping | **Yes** — left-border color accents per category | **Yes** — collapsible sidebar groups with headers | **Yes** — color-coded filter chips | Hybrid: V1's border accents + V3's filter chips |
| Information hierarchy | **Yes** — clean card layout, answer chips inline | Partially — sidebar is compact but detail pane is document-style | **Yes** — tile grid with hover quick-actions | V1's card layout for list, V3's hover actions |
| Brand consistency | **Yes** — uses `#4A90A4` throughout | **Yes** — uses `#4A90A4` | **Yes** — uses `#4A90A4` | All explorations are consistent; current code is not |
| Empty states | Basic | Not shown | Not shown | None address this; needs original design |
| Edit panel design | **Yes** — floating panel with vertical icon sidebar | **Yes** — inline editing on hover | Partially — slide-in drawer | V1's floating panel is most polished |
| Responsive design | Implied but not shown | Desktop-only | Desktop-only | None fully address responsive; keep current mobile modal approach |
| Search/filter UX | Simple search + dropdown | Sidebar search | Search + filter chips | V3's filter chips are most intuitive |
| Loading states | Not shown | Not shown | Not shown | None address this; needs original design |
| Micro-interactions | Minimal | Inline edit hover hint | Tile hover lift + quick-actions | V3's hover pattern is most practical |

### Best Exploration or Hybrid

**Recommended approach**: Hybrid of V1 + V3

- **V3's progress bar** — Essential for audit completion tracking
- **V3's filter chips** — Replace dropdown with category chips with color dots
- **V1's card layout** — Clean clinical aesthetic with left-border category accents
- **V1's floating edit panel** — Vertical icon sidebar is more compact than horizontal tabs
- **Current mobile modal** — Best mobile approach (keep MobileEditModal)
- **V3's hover quick-actions** — "Edit" button appears on hover, reducing visual clutter

---

## Implementation Roadmap

### Phase 1: Critical (1-2 days) — Accessibility + Brand Consistency

**Day 1: Accessibility fixes**

| Task | File | Change |
|------|------|--------|
| Replace `text-base-content/60` with `/70` | All files (20+ instances) | Find/replace opacity class |
| Widen divider hit area to 44px | `ResizableDivider.tsx:111` | Add `px-5` padding to outer div, keep visual `w-1` inner element |
| Add `:focus-visible` to tab buttons | `EditPanel.tsx:234`, `MobileEditModal.tsx:289` | Add `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` |
| Add shape to indicator dots | `EditPanel.tsx:243-249` | Error: triangle icon; Changes: filled circle |

**Day 2: Brand consistency**

| Task | File | Change |
|------|------|--------|
| Replace `#0075DF` with brand color | `QuestionsList.tsx` (10 instances) | Replace with `var(--color-primary, #4A90A4)` or DaisyUI `primary` class |
| Replace `#414141` with semantic class | `QuestionsList.tsx` (3 instances) | Replace with `text-base-content` |
| Replace `#0058A7` hover color | `QuestionsList.tsx:461` | Replace with DaisyUI `hover:text-primary-focus` |
| Add "Patient Preview" label to patient view | `QuestionsList.tsx:410` | Add banner: "Showing patient view — colors match UltraMed styling" |

### Phase 2: UX Improvements (3-5 days) — Task Flow, Hierarchy, Progress

**Days 3-4: Core UX**

| Task | File | Change |
|------|------|--------|
| Add progress bar to header | `page.tsx:298-342` | Add thin segmented bar showing suggestion count / total questions |
| Remove Panel/Modal toggle (or hide behind setting) | `page.tsx:312-324` | Remove toggle; default to panel on desktop, modal on mobile |
| Add category color accents to cards | `QuestionsList.tsx:558` | Add `border-l-4` with category-specific colors |
| Add category group headers | `QuestionsList.tsx:480-485` | Group `filteredQuestions` by category, render headers between groups |
| Reorder card content (text first) | `QuestionsList.tsx:487-551` | Move question text above badges |

**Day 5: Onboarding + Empty States**

| Task | File | Change |
|------|------|--------|
| Redesign EmptyPanelState | `EmptyPanelState.tsx` | Contextual illustration + welcome message + 3-step guide |
| Add welcome overlay for first visit | `page.tsx` | Check `localStorage` for first-visit flag; show brief orientation |
| Improve no-results state | `QuestionsList.tsx:380-404` | Better icon + "Try adjusting your search" copy |
| Add post-submission guidance | `page.tsx:225-237` | Replace toast with inline success state + "Continue reviewing" CTA |

### Phase 3: Polish (2-3 days) — Micro-Interactions, Tokens, Delight

**Days 6-7: Transitions + Loading**

| Task | File | Change |
|------|------|--------|
| Add CSS transitions to cards | `QuestionsList.tsx:558` | `transition-all duration-150 ease-in-out` (already has `transition-all`) — verify timing |
| Add tab switch transition | `EditPanel.tsx:257` | Wrap tab content in fade transition |
| Replace loading spinner with skeleton | `page.tsx:250-258` | Render 6-8 skeleton cards instead of centered spinner |
| Add filter transition | `QuestionsList.tsx:480` | `transition-opacity duration-150` on list container |

**Day 8: Token System (optional)**

| Task | File | Change |
|------|------|--------|
| Extract spacing tokens | `tailwind.config.ts` | Define semantic spacing scale in Tailwind extend |
| Extract color tokens for categories | `tailwind.config.ts` | Add `cat-*` color palette for category accents |
| Extract layout constants | New: `lib/layout.ts` | `MAX_CONTENT_WIDTH`, `MIN_LEFT_PANEL`, `MIN_RIGHT_PANEL` |

---

## File Reference

| File | Path | Description | Issues Found |
|------|------|-------------|-------------|
| `page.tsx` | `app/instance/[trustLinkId]/page.tsx` | Main page — header, filters, layout orchestration, state management | No progress indicator, Panel/Modal toggle confusion, no onboarding, `text-base-content/60` contrast, JS-based mobile detection |
| `QuestionsList.tsx` | `components/questionnaire/panel/QuestionsList.tsx` | Question cards, audit + patient views, answer inputs | Brand color `#0075DF` mismatch (10 instances), flat list (no category grouping), badge hierarchy inverted, `text-base-content/60` contrast |
| `EditPanel.tsx` | `components/questionnaire/panel/EditPanel.tsx` | Tab system, question header, empty state wrapper | Missing tab focus indicators, no tab transitions, indicator dots lack shape differentiation |
| `EmptyPanelState.tsx` | `components/questionnaire/panel/EmptyPanelState.tsx` | Empty state when no question selected | Generic icon, no workflow guidance, no contextual illustration |
| `SplitScreenLayout.tsx` | `components/questionnaire/panel/SplitScreenLayout.tsx` | Split-screen with resizable divider | Percentage-based (not Grid), JS resize detection, no tablet breakpoint |
| `ResizableDivider.tsx` | `components/questionnaire/panel/ResizableDivider.tsx` | Draggable panel divider | 4px touch target (needs 44px), keyboard support exists but visual feedback limited |
| `MobileEditModal.tsx` | `components/questionnaire/panel/MobileEditModal.tsx` | Full-screen modal for mobile editing | Duplicated tab rendering logic with EditPanel, no transitions for tab content |
| `SettingsTab.tsx` | `components/questionnaire/panel/tabs/SettingsTab.tsx` | Settings tab — required toggle, advanced details | `text-base-content/60` contrast on labels |
| `ContentTab.tsx` | `components/questionnaire/panel/tabs/ContentTab.tsx` | Content tab — question text, answer type, options editor | Complex but functional; `text-base-content/60` contrast |
| `HelpTab.tsx` | `components/questionnaire/panel/tabs/HelpTab.tsx` | Help tab — helper content management | `text-base-content/60` contrast; `dangerouslySetInnerHTML` on line 149 (potential XSS if helper content not sanitized) |
| `LogicTab.tsx` | `components/questionnaire/panel/tabs/LogicTab.tsx` | Logic tab — conditional display logic, relationship diagram | Good relationship visualization; `text-base-content/60` contrast |
| `ReviewTab.tsx` | `components/questionnaire/panel/tabs/ReviewTab.tsx` | Review tab — changes summary, submission form | No post-submit guidance; submit button lacks loading transition |
| `UnsavedChangesDialog.tsx` | `components/questionnaire/panel/UnsavedChangesDialog.tsx` | Modal warning for unsaved changes | Adequate; uses HeadlessUI transitions |
| `v1-clean-clinical.html` | `design-explorations/v1-clean-clinical.html` | Design exploration — minimal card layout, category accents, floating edit panel | Best card design; uses brand `#4A90A4` correctly |
| `v2-notion-style.html` | `design-explorations/v2-notion-style.html` | Design exploration — sidebar navigation, inline editing, document layout | Best navigation; collapsible category groups |
| `v3-dashboard-grid.html` | `design-explorations/v3-dashboard-grid.html` | Design exploration — tile grid, progress bar, filter chips, slide-in drawer | Best progress indicator; best filter UX |
