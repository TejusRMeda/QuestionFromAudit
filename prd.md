# Product Requirements Document
## Questionnaire Suggestion Tool (No-Login Version)

### Version: 1.0 MVP
### Last Updated: January 23, 2026

---

## 1. Product Overview

### Problem Statement
Currently, trust clients review questionnaires via PDF and submit change requests through Excel sheets. This creates:
- Tracking issues across multiple Excel files
- Version control problems
- Communication gaps between clients and account managers
- No centralized visibility for managing multiple trusts

### Solution
A web-based platform that digitizes the questionnaire review process with **zero authentication required**. Users access the system via unique shareable links.

### Core Value Proposition
- **For Trust Users:** View questions and submit suggestions without creating accounts
- **For Account Managers:** Centralized dashboard to track and manage all suggestions across multiple trusts

---

## 2. User Personas

### Persona 1: Trust User (Client)
**Role:** Healthcare professional reviewing questionnaires
**Technical Skill:** Low to medium
**Goals:**
- Quickly review questions
- Suggest improvements with rationale
- See what colleagues suggested
- Check status of their suggestions

**Pain Points:**
- Doesn't want to create another account/password
- Limited time for review
- Needs visibility into team's suggestions

### Persona 2: Account Manager (Internal)
**Role:** Manages relationships with multiple trust clients
**Technical Skill:** Medium
**Goals:**
- Track all suggestions across multiple trusts
- Coordinate with internal provider team
- Provide timely responses to clients
- Maintain audit trail of decisions

**Pain Points:**
- Juggling multiple Excel files
- No clear status tracking
- Manual follow-ups required
- Difficult to prioritize suggestions

---

## 3. Functional Requirements

### 3.1 CSV Upload & Project Creation

**FR-001: CSV Upload**
- System SHALL accept CSV files with columns: `Question_ID`, `Category`, `Question_Text`
- System SHALL validate CSV format before accepting
- System SHALL reject files with missing required columns
- System SHALL handle files up to 500 questions

**FR-002: Link Generation**
- System SHALL generate two unique links per project:
  - Trust Review Link (public, shareable)
  - Admin Dashboard Link (private, for account manager)
- Links SHALL use cryptographically secure random IDs (minimum 16 characters)
- Links SHALL be URL-safe (alphanumeric only)

**FR-003: Project Metadata**
- System SHALL store trust name with each project
- System SHALL store creation timestamp
- System SHALL assign unique project ID

### 3.2 Trust Review Interface

**FR-004: Question Display**
- System SHALL display all questions for a given trust via review link
- Each question SHALL show:
  - Question ID
  - Category
  - Full question text
  - Count of existing suggestions
- Questions SHALL be displayed in a scannable format (cards or table)

**FR-005: Suggestion Submission**
- Users SHALL be able to submit suggestions without login
- Suggestion form SHALL require:
  - Submitter Name (required)
  - Suggested Change (required, textarea)
  - Reason for Change (required, textarea)
- Suggestion form SHALL optionally accept:
  - Submitter Email
- System SHALL validate all required fields before submission
- System SHALL show success message after submission
- System SHALL allow multiple submissions per user

**FR-006: Colleague Visibility**
- Users SHALL see all suggestions made by others on the same question
- Suggestions SHALL display:
  - Submitter name
  - Suggestion text
  - Current status (Pending/Approved/Rejected)
  - Response from account manager (if any)
- Users SHALL NOT be able to edit or delete others' suggestions

### 3.3 Admin Dashboard

**FR-007: Suggestion List View**
- System SHALL display all suggestions for a project via admin link
- List SHALL show:
  - Question text (truncated)
  - Submitter name
  - Status
  - Submission date
- System SHALL support filtering by status (All/Pending/Approved/Rejected)
- System SHALL display total count of suggestions

**FR-008: Suggestion Management**
- Account manager SHALL be able to click any suggestion to view details
- Detail view SHALL show:
  - Full question text and category
  - Submitter name and email
  - Complete suggestion and reason
  - Submission timestamp
- Account manager SHALL be able to:
  - Add internal comments (not visible to trust users)
  - Change status (Pending → Approved/Rejected)
  - Add response message (visible to trust users)
- Changes SHALL save to database immediately
- Trust users SHALL see updates when they revisit review link

### 3.4 Status Updates & Visibility

**FR-009: Real-time Status**
- Trust users SHALL see current status when revisiting review link
- Status changes SHALL reflect within 5 seconds
- Status badges SHALL use color coding:
  - Pending: Yellow/Orange
  - Approved: Green
  - Rejected: Red

---

## 4. Technical Requirements

### 4.1 Technology Stack

**Frontend:**
- React 18+ with Vite
- React Router for routing
- Tailwind CSS for styling
- Axios for API calls

**Backend:**
- Node.js 18+
- Express.js
- SQLite3 database (file-based)
- csv-parser for CSV processing

**Rationale:**
- Single language (JavaScript) reduces complexity
- SQLite eliminates need for database server
- Vite provides fast development experience
- Minimal dependencies for easier maintenance

### 4.2 Database Schema

**Table: projects**
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trust_name TEXT NOT NULL,
  trust_link_id TEXT UNIQUE NOT NULL,
  admin_link_id TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Table: questions**
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**Table: suggestions**
```sql
CREATE TABLE suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  submitter_name TEXT NOT NULL,
  submitter_email TEXT,
  suggestion_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  internal_comment TEXT,
  response_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

### 4.3 API Endpoints

**POST /api/upload**
- Request: multipart/form-data with CSV file and trust_name
- Response: `{ trustLinkId, adminLinkId }`
- Validates CSV, creates project, returns links

**GET /api/review/:linkId**
- Request: trust_link_id as URL parameter
- Response: `{ trustName, questions: [...] }`
- Returns all questions with suggestion counts

**POST /api/suggestions**
- Request: `{ questionId, submitterName, submitterEmail, suggestionText, reason }`
- Response: `{ success: true, suggestionId }`
- Creates new suggestion

**GET /api/admin/:adminLinkId**
- Request: admin_link_id as URL parameter
- Response: `{ trustName, suggestions: [...] }`
- Returns all suggestions with question details

**PUT /api/suggestions/:id**
- Request: `{ status, internalComment, responseMessage }`
- Response: `{ success: true }`
- Updates suggestion details

**GET /api/questions/:questionId/suggestions**
- Request: question_id as URL parameter
- Response: `{ suggestions: [...] }`
- Returns all suggestions for specific question (for trust users to see)

### 4.4 Security Requirements

**SEC-001: Link Security**
- Link IDs SHALL use crypto.randomBytes with minimum 16 bytes
- Link IDs SHALL be URL-safe (base64url encoding)
- Links SHALL be unguessable (minimum 128-bit entropy)

**SEC-002: Input Validation**
- All user inputs SHALL be sanitized
- SQL injection protection via parameterized queries
- File upload SHALL be limited to CSV MIME type
- File size SHALL be limited to 5MB

**SEC-003: Rate Limiting**
- Suggestion submission SHALL be rate-limited to 10 per IP per minute
- CSV upload SHALL be rate-limited to 5 per IP per hour

**SEC-004: CORS**
- Backend SHALL configure CORS to allow frontend origin
- Production SHALL use environment-specific origins

### 4.5 Performance Requirements

**PERF-001: Response Times**
- Page load SHALL complete within 2 seconds
- API responses SHALL complete within 500ms
- CSV processing SHALL complete within 5 seconds for 500 questions

**PERF-002: Scalability**
- System SHALL support 50 concurrent users
- System SHALL handle 100 projects simultaneously
- Database SHALL support 10,000 suggestions without degradation

---

## 5. User Interface Requirements

### 5.1 Design Principles
- **Simplicity:** Minimal clicks to complete tasks
- **Clarity:** Clear labels and instructions
- **Feedback:** Immediate visual feedback for all actions
- **Responsiveness:** Works on desktop, tablet, and mobile

### 5.2 Key Screens

**Screen 1: Upload Page**
- Clean, centered layout
- Trust name input field
- File upload dropzone or button
- Clear instructions for CSV format
- Upload button (disabled until valid file selected)
- Loading spinner during upload
- Success state showing both generated links with copy buttons

**Screen 2: Trust Review Page**
- Header with trust name
- Question count indicator
- Grid or list of question cards
- Each card shows:
  - Question ID and category
  - Question text (full, no truncation)
  - Badge showing suggestion count
  - "Suggest Change" button
- Expandable section showing existing suggestions
- Responsive grid (1 column mobile, 2-3 columns desktop)

**Screen 3: Suggestion Modal**
- Modal overlay with form
- Shows original question at top (read-only)
- Form fields:
  - Name (required)
  - Email (optional)
  - Suggestion (required, textarea)
  - Reason (required, textarea)
- Character counter on textareas
- Cancel and Submit buttons
- Loading state on submit
- Success message before closing

**Screen 4: Admin Dashboard**
- Header with trust name and total suggestion count
- Filter tabs: All / Pending / Approved / Rejected
- Table or card view of suggestions:
  - Question text (truncated to 100 chars)
  - Submitter name
  - Status badge
  - Date submitted
  - Click to view details
- Empty state when no suggestions

**Screen 5: Suggestion Detail (Admin)**
- Full suggestion information:
  - Question text and category
  - Submitter details
  - Suggestion and reason
  - Timestamp
- Internal comment section (collapsed by default)
- Status dropdown
- Response message textarea (visible to trust)
- Save button
- Back button
- Success toast on save

### 5.3 Component Specifications

**Button Styles (Tailwind):**
- Primary: `bg-blue-600 hover:bg-blue-700 text-white`
- Secondary: `bg-gray-200 hover:bg-gray-300 text-gray-800`
- Danger: `bg-red-600 hover:bg-red-700 text-white`

**Status Badges:**
- Pending: `bg-yellow-100 text-yellow-800`
- Approved: `bg-green-100 text-green-800`
- Rejected: `bg-red-100 text-red-800`

**Form Inputs:**
- Standard: `border border-gray-300 rounded-md px-3 py-2`
- Focus: `focus:ring-2 focus:ring-blue-500`
- Error: `border-red-500`

---

## 6. Non-Functional Requirements

### 6.1 Usability
- System SHALL require zero training for trust users
- Forms SHALL provide inline validation
- Error messages SHALL be specific and actionable
- Success feedback SHALL be immediate and clear

### 6.2 Accessibility
- System SHALL meet WCAG 2.1 Level AA standards
- All interactive elements SHALL be keyboard accessible
- Color SHALL not be the only means of conveying information
- Form labels SHALL be properly associated with inputs

### 6.3 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 6.4 Mobile Responsiveness
- System SHALL be fully functional on mobile devices
- Touch targets SHALL be minimum 44x44 pixels
- Text SHALL be readable without zooming (minimum 16px)

---

## 7. Data Requirements

### 7.1 CSV Format Specification

**Required Columns:**
- `Question_ID`: Unique identifier (text or number)
- `Category`: Category name (text)
- `Question_Text`: Full question text (text, max 1000 characters)

**Example CSV:**
```csv
Question_ID,Category,Question_Text
Q001,Demographics,What is your age range?
Q002,Health,Do you have any chronic conditions?
Q003,Lifestyle,How often do you exercise per week?
```

**Validation Rules:**
- File must have header row with exact column names
- Question_ID must be unique within file
- No column can be empty
- Question_Text cannot exceed 1000 characters

### 7.2 Data Retention
- Projects SHALL be retained indefinitely
- No automatic deletion of projects or suggestions
- Future: Admin interface to manually archive old projects

---

## 8. Error Handling

### 8.1 User-Facing Errors

**CSV Upload Errors:**
- Invalid format: "CSV file format is invalid. Please check the file."
- Missing columns: "Required columns missing: [column names]"
- File too large: "File exceeds 5MB limit."
- Duplicate Question IDs: "Duplicate Question_ID found: [IDs]"

**Form Validation Errors:**
- Empty required field: "This field is required"
- Invalid email: "Please enter a valid email address"
- Text too long: "Maximum [X] characters allowed"

**Network Errors:**
- Connection failed: "Unable to connect. Please check your internet connection."
- Server error: "Something went wrong. Please try again."
- Timeout: "Request timed out. Please try again."

### 8.2 Link Errors

**Invalid Link:**
- Show: "Invalid or expired link. Please contact your account manager."
- Log error on backend for investigation

**Not Found:**
- Show: "Project not found. The link may be incorrect."

---

## 9. Future Enhancements (Out of Scope for MVP)

### Phase 2 (3-6 months)
- User authentication for account managers
- Email notifications on status changes
- Export suggestions to CSV/Excel
- Link expiration settings
- Edit/delete own suggestions (trust users)

### Phase 3 (6-12 months)
- Linear integration for ticket creation
- File attachments on suggestions
- Comment threads on suggestions
- Advanced filtering and search
- Analytics dashboard (suggestion trends, response times)
- Bulk status updates
- Custom workflow states beyond Pending/Approved/Rejected

### Phase 4 (12+ months)
- Real-time collaborative editing
- Version control for questionnaires
- Multi-language support
- AI-powered suggestion categorization
- Mobile native apps
- White-label customization per trust

---

## 10. Success Metrics

### Primary Metrics (Track after 3 months)
- **Adoption Rate:** % of trust users who submit at least one suggestion
- **Response Time:** Average time from suggestion submission to status update
- **Completion Rate:** % of uploaded questionnaires that receive suggestions
- **User Satisfaction:** Feedback score from both trust users and account managers

### Secondary Metrics
- Number of projects created per month
- Average suggestions per project
- Distribution of suggestion statuses
- Time spent on review page (engagement)
- Bounce rate on upload page

---

## 11. Acceptance Criteria

### MVP is considered complete when:

**Core Functionality:**
- [ ] Account manager can upload CSV and receive two unique links
- [ ] Trust users can view all questions via review link without login
- [ ] Trust users can submit suggestions with name and text
- [ ] Multiple trust users can see each other's suggestions
- [ ] Account manager can view all suggestions via admin link
- [ ] Account manager can update suggestion status
- [ ] Account manager can add response messages
- [ ] Trust users see updated status when revisiting review link

**Quality Standards:**
- [ ] Zero critical bugs
- [ ] All API endpoints return appropriate HTTP status codes
- [ ] All forms have client-side validation
- [ ] Error messages are user-friendly
- [ ] UI is responsive on mobile, tablet, desktop
- [ ] Page load times under 2 seconds
- [ ] No console errors in browser

**Documentation:**
- [ ] README with setup instructions
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] CSV format specification provided

---

## 12. Development Guidelines

### Code Standards
- Use ESLint with recommended React config
- Use Prettier for code formatting
- Write meaningful commit messages
- Use semantic versioning for releases

### Component Structure
```
frontend/src/
├── components/       # Reusable UI components
├── pages/           # Route components
├── services/        # API calls
├── utils/           # Helper functions
├── styles/          # Global styles
└── App.jsx          # Root component
```

### Testing Strategy (Future)
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual testing checklist for releases

---

## 13. Deployment Requirements

### Environment Variables

**Backend:**
```
NODE_ENV=production
PORT=3000
DATABASE_PATH=/path/to/database.db
CORS_ORIGIN=https://yourdomain.com
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=10
```

**Frontend:**
```
VITE_API_URL=https://api.yourdomain.com
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] CORS configured for production domain
- [ ] File upload directory writable
- [ ] HTTPS enabled
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error logging enabled

---

## 14. Support & Maintenance

### Known Limitations
- No user authentication (by design)
- Links never expire (future enhancement)
- No real-time updates (must refresh page)
- CSV format is rigid (no flexibility)
- File size limited to 5MB
- Single language (English only)

### Troubleshooting Guide
**Issue:** CSV upload fails
- Check CSV format matches specification
- Verify file size under 5MB
- Check for special characters in Question_ID

**Issue:** Link doesn't work
- Verify link was copied completely
- Check browser console for errors
- Try different browser

**Issue:** Suggestions not appearing
- Refresh the page
- Clear browser cache
- Check if suggestion was submitted successfully

---

## 15. Glossary

**Trust:** A healthcare organization (client) reviewing questionnaires

**Account Manager:** Internal team member managing trust relationships

**Suggestion:** A proposed change to a questionnaire question submitted by a trust user

**Review Link:** Public URL allowing trust users to view and suggest changes to questions

**Admin Link:** Private URL allowing account managers to manage suggestions

**Status:** Current state of a suggestion (Pending, Approved, or Rejected)

**Internal Comment:** Note added by account manager, not visible to trust users

**Response Message:** Reply from account manager visible to trust users

---

## Document Control

**Version History:**
- v1.0 (Jan 23, 2026): Initial MVP specification

**Approval:**
- Product Owner: [Name]
- Technical Lead: [Name]
- UX Designer: [Name]

**Review Schedule:**
- Review after MVP launch
- Quarterly updates thereafter