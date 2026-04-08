# QuestionAudit Documentation

QuestionAudit is a questionnaire audit and suggestion management system. It allows account managers to upload clinical questionnaires (in MyPreOp CSV format), share them with trust organizations, and collect structured feedback on individual questions.

## Documentation Index

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | System design, tech stack, and data model |
| [Database Schema](./database-schema.md) | All tables, columns, and relationships |
| [API Reference](./api-reference.md) | All API endpoints and their request/response shapes |
| [Workflows](./workflows.md) | End-to-end user flows for account managers and trust users |
| **Features** | |
| [CSV Upload & Parsing](./features/csv-upload.md) | Uploading and validating MyPreOp CSV files |
| [Master Questionnaires](./features/master-questionnaires.md) | Creating and managing master questionnaire templates |
| [Trust Instances](./features/trust-instances.md) | Creating and sharing instances with trust organizations |
| [Suggestion System](./features/suggestion-system.md) | Submitting, reviewing, and managing suggestions |
| [Conditional Logic](./features/conditional-logic.md) | EnableWhen logic parsing and display |

## Quick Start

### Account Manager
1. Sign in at `/dashboard`
2. Upload a CSV at `/dashboard/upload`
3. Go to the master page and create a trust instance
4. Share the instance link with the trust team
5. Review suggestions at `/masters/[adminLinkId]/suggestions`

### Trust User
1. Open the link received from the account manager
2. Browse and search questions
3. Select a question and use the edit panel to propose changes
4. Submit with your name, email, and notes
5. Track your submission at `/instance/[trustLinkId]/suggestions`
