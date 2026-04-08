# Project Progress

**Last Updated:** January 23, 2026

## Overview

This is a **Questionnaire Suggestion Tool** - a web-based platform that digitizes the questionnaire review process for healthcare trusts. Trust clients can review questions and submit suggestions via unique shareable links (no login required), while account managers view and manage suggestions from a centralized dashboard.

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript 5.9+ |
| Styling | Tailwind CSS 4.1+ with DaisyUI 5.0+ |
| Database | Supabase (PostgreSQL) |
| CSV Parsing | PapaParse |

---

## Current Status: ~40-50% Complete

### Completed Features

#### 1. Database Schema
- **projects** table - Stores project metadata with trust name, trust link ID, and admin link ID
- **questions** table - Stores uploaded questions with category, text, answer type, and options
- **suggestions** table - Stores user suggestions with status tracking, internal comments, and response messages
- Row-level security (RLS) policies for public access
- Proper foreign keys and indexes

#### 2. CSV Upload & Project Creation (`/upload`)
- Drag-and-drop file upload interface
- CSV validation with 5 required columns:
  - `Question_ID`, `Category`, `Question_Text`, `Answer_Type`, `Answer_Options`
- Supports up to 500 questions per project
- 5MB file size limit
- Generates two unique cryptographically secure links:
  - **Trust Review Link** - for public question review
  - **Admin Link** - for account manager dashboard
- Real-time validation feedback with specific error messages
- CSV format requirements and examples displayed

#### 3. Question Display & Review (`/review/[linkId]`)
- Displays all questions for a trust (no authentication required)
- Shows question ID, category badges, full text, answer type, and options
- Search functionality to find questions
- Category filtering
- Responsive grid layout
- Loading and error states
- Count of existing suggestions per question

#### 4. API Endpoints
- `POST /api/upload` - Upload CSV and create project
- `GET /api/review/[linkId]` - Fetch questions for review page

---

### Remaining Features

#### Critical (Core MVP)
- [ ] **Suggestion Submission Modal** - Form to submit suggestions on review page
- [ ] **Suggestion API Endpoint** - `POST /api/suggestions` to handle submissions
- [ ] **Suggestion Display** - Show existing suggestions on question cards
- [ ] **Admin Dashboard** - Interface to view all suggestions across trusts
- [ ] **Suggestion Status Management** - Approve/reject workflow
- [ ] **Response Messages** - Allow account managers to respond to suggestions

#### Nice to Have
- [ ] Rate limiting on suggestion submissions
- [ ] Email notifications for status changes
- [ ] Internal comments for account managers
- [ ] Export functionality

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── upload/             # CSV upload endpoint
│   │   └── review/[linkId]/    # Question review endpoint
│   ├── upload/                  # CSV upload page
│   ├── review/[linkId]/         # Public question review page
│   └── dashboard/               # Admin dashboard (placeholder)
├── components/                   # Reusable UI components
├── libs/
│   └── supabase/                # Supabase client setup
├── types/                        # TypeScript type definitions
├── supabase/
│   └── migrations/              # Database migrations
│       ├── 001_initial_schema.sql
│       └── 002_add_answer_columns.sql
└── config.ts                    # Application configuration
```

---

## Database Migrations Applied

1. **001_initial_schema.sql** - Created projects, questions, and suggestions tables with RLS policies
2. **002_add_answer_columns.sql** - Added answer_type and answer_options columns to questions table

---

## Next Steps

1. Implement suggestion submission modal on the review page
2. Create `POST /api/suggestions` endpoint
3. Add suggestion display to question cards
4. Build the admin dashboard at `/admin/[adminLinkId]`
5. Implement suggestion status management (approve/reject)
6. Add response message functionality

---

## Development Notes

- The system uses **no authentication** for trust users - access is controlled via unique shareable links
- Admin access is also link-based (via `admin_link_id`)
- All Supabase credentials are configured in `.env.local`
