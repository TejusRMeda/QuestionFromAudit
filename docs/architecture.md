# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + DaisyUI 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Email | Resend |
| Payments | Stripe |
| CSV Parsing | PapaParse |
| Validation | Zod |
| Notifications | React Hot Toast |

## Directory Structure

```
/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing page
│   ├── dashboard/
│   │   ├── page.tsx            # User dashboard
│   │   └── upload/page.tsx     # CSV upload page
│   ├── masters/[adminLinkId]/
│   │   ├── page.tsx            # Master dashboard
│   │   └── suggestions/page.tsx # Master suggestions overview
│   ├── instance/[trustLinkId]/
│   │   ├── page.tsx            # Trust review interface
│   │   └── suggestions/page.tsx # Instance suggestions view
│   └── api/                    # API routes (see API Reference)
├── components/
│   └── questionnaire/          # Questionnaire UI components
│       └── panel/              # Edit panel tabs
├── types/
│   ├── question.ts             # CSV parsing types & validation
│   └── editPanel.ts            # Edit state & component changes types
├── lib/
│   └── enableWhen.ts           # Conditional logic translation
├── hooks/
│   └── useEditPanelState.ts    # Edit panel state management
├── libs/                       # Infrastructure helpers (Supabase, email, etc.)
├── supabase/migrations/        # Database migrations
└── resources/                  # Sample CSV files
```

## Data Model

The system uses a three-tier data model to keep master templates isolated from per-trust suggestion data.

```
User (Supabase Auth)
  └── Master Questionnaire          (uploaded CSV template)
        ├── Master Questions        (questions from CSV)
        └── Trust Instance         (copy shared with one trust)
              ├── Instance Questions (copied from master at creation)
              └── Instance Suggestions (per-question feedback)
                    └── Suggestion Comments (threaded discussion)
```

### Key Relationships

- **Master → Instance**: One-to-many. A master can have many trust instances.
- **Instance → Instance Questions**: Created by copying master questions at instance creation time. Changes to the master do not affect existing instances.
- **Instance Question → Suggestions**: One-to-many. Multiple suggestions can exist for the same question.
- **Suggestion → Comments**: One-to-many threaded conversation.

## Access Control

| Actor | Access Method | Scope |
|---|---|---|
| Account Manager | Supabase Auth session | Owns masters, manages instances, reviews suggestions |
| Trust User | Random secure link (`trustLinkId`) | Read-only questions + submit suggestions on their instance |
| Public | None | Landing page only |

Link IDs are generated with Node.js `crypto.randomBytes(16)` encoded as base64url, making them effectively unguessable (128 bits of entropy).

## Component Architecture

### Trust User Interface (instance page)

```
/instance/[trustLinkId]/page.tsx
  ├── SplitScreenLayout (desktop)   — left: question list, right: edit panel
  │     ├── QuestionsList           — searchable, filterable list
  │     └── EditPanel               — tabbed editor
  │           ├── SettingsTab
  │           ├── ContentTab
  │           ├── HelpTab
  │           ├── LogicTab
  │           └── ReviewTab
  └── MobileEditModal (mobile)      — full-screen modal version of edit panel
```

State for the edit panel is managed entirely in `useEditPanelState` hook (`/hooks/useEditPanelState.ts`), which tracks per-tab changes, dirty state, and validation errors.

### Admin Interface (master/suggestions pages)

The admin interface is server-component-driven with client-side modals for actions (approve, reject, respond, comment).
