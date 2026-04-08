# Database Schema

All tables live in Supabase (PostgreSQL). Migrations are in `/supabase/migrations/`.

---

## `master_questionnaires`

Represents a questionnaire template uploaded by an account manager.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Human-readable questionnaire name |
| `admin_link_id` | text | Unique token for account manager access |
| `user_id` | uuid | FK to Supabase auth user (owner) |
| `created_at` | timestamptz | |

---

## `master_questions`

Questions belonging to a master questionnaire. Created when the CSV is uploaded.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `master_id` | uuid | FK → `master_questionnaires.id` |
| `question_id` | text | Original ID from CSV (e.g. `"Q001"`) |
| `category` | text | Question category/group |
| `question_text` | text | The question text |
| `answer_type` | text | One of 20+ `MyPreOpItemType` values |
| `answer_options` | text[] | Array of option labels |
| `section` | text | Section heading |
| `page` | text | Page number/name |
| `characteristic` | text | Pipe-separated characteristic keys (e.g. `"patient_is_female\|patient_age"`) |
| `required` | boolean | Whether question is required |
| `enable_when` | jsonb | Structured conditional logic (`EnableWhen` type) |
| `has_helper` | boolean | Whether question has helper content |
| `helper_type` | text | `"text"` or `"link"` |
| `helper_name` | text | Helper label text |
| `helper_value` | text | Helper body text or URL |

---

## `trust_instances`

A copy of a master questionnaire shared with one trust organization.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `master_id` | uuid | FK → `master_questionnaires.id` |
| `trust_name` | text | Name of the trust (e.g. `"St. Thomas' Trust"`) |
| `trust_link_id` | text | Unique token for trust user access |
| `created_at` | timestamptz | |

---

## `instance_questions`

A snapshot of master questions at the time the instance was created. Isolated from future master edits.

Columns are identical to `master_questions` except:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `instance_id` | uuid | FK → `trust_instances.id` |
| *(all other columns same as `master_questions`)* | | |

---

## `instance_suggestions`

A structured suggestion on a single instance question.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `instance_question_id` | uuid | FK → `instance_questions.id` |
| `submitter_name` | text | Name provided at submission |
| `submitter_email` | text | Email provided at submission |
| `suggestion_text` | text | Free-text notes (50–2000 chars) |
| `reason` | text | (legacy field, kept for compatibility) |
| `status` | text | `"pending"` \| `"approved"` \| `"rejected"` |
| `internal_comment` | text | Account manager internal note (not shown to users) |
| `response_message` | text | Account manager response (visible to submitter) |
| `component_changes` | jsonb | Structured change set — see [Suggestion System](./features/suggestion-system.md) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## `suggestion_comments`

Comments on a suggestion (threaded conversation).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `suggestion_id` | uuid | FK → `instance_suggestions.id` |
| `submitter_name` | text | Display name of commenter |
| `comment_text` | text | Comment body |
| `created_at` | timestamptz | |

---

## Migration History

| File | Description |
|---|---|
| `001_questionnaire_tables.sql` | Initial schema (projects, questions, suggestions) |
| `002_add_answer_columns.sql` | Added `answer_type`, `answer_options` |
| `003_master_questionnaires.sql` | Master/instance architecture |
| `004_mypreop_format.sql` | MyPreOp-specific columns (section, page, characteristic, etc.) |
| `005_user_masters.sql` | Added `user_id` to `master_questionnaires` |
| `006_suggestion_comments.sql` | Added `suggestion_comments` table |
| `007_expand_item_types.sql` | Support for 20+ item types |
| `008_component_suggestions.sql` | Added `component_changes` JSONB to suggestions |
| `009_master_delete_policy.sql` | RLS policy for master deletion |
| `010_enforce_user_id.sql` | Authentication enforcement on master operations |
