# API Reference

All routes are under `/api/`. They return JSON and follow standard HTTP status codes.

---

## Masters

### `POST /api/masters`
Create a master questionnaire by uploading a CSV.

**Request body** (`multipart/form-data`):
| Field | Type | Description |
|---|---|---|
| `file` | File | CSV file in MyPreOp format |
| `name` | string | Questionnaire name |

**Response `201`**:
```json
{
  "adminLinkId": "abc123...",
  "questionCount": 48
}
```

**Errors**: `400` validation errors, `401` unauthenticated, `500` server error.

---

### `GET /api/masters/[adminLinkId]`
Fetch a master questionnaire and all its questions.

**Response `200`**:
```json
{
  "master": { "id": "...", "name": "Pre-op Assessment", "admin_link_id": "..." },
  "questions": [ { "id": "...", "question_id": "Q001", ... } ]
}
```

---

### `DELETE /api/masters/[adminLinkId]`
Delete a master questionnaire and all its instances/suggestions (cascade).

**Response `200`**: `{ "success": true }`

**Errors**: `401` unauthenticated, `403` not owner, `404` not found.

---

## Trust Instances

### `GET /api/masters/[adminLinkId]/instances`
List all trust instances for a master.

**Response `200`**: Array of instance objects with `trust_name`, `trust_link_id`, `created_at`, and a `suggestionCount`.

---

### `POST /api/masters/[adminLinkId]/instances`
Create a new trust instance.

**Request body** (`application/json`):
```json
{ "trustName": "St. Thomas' Trust" }
```

**Response `201`**:
```json
{
  "trustLinkId": "xyz789...",
  "trustName": "St. Thomas' Trust"
}
```

The endpoint copies all master questions to the new instance atomically.

---

## Instance (Trust User)

### `GET /api/instance/[trustLinkId]`
Fetch an instance and all its questions. Used by the trust review interface.

**Response `200`**:
```json
{
  "instance": { "id": "...", "trust_name": "...", "trust_link_id": "..." },
  "questions": [ { "id": "...", "question_text": "...", ... } ]
}
```

**Errors**: `404` if `trustLinkId` is not found.

---

## Suggestions

### `POST /api/instance/[trustLinkId]/suggestions`
Submit a suggestion on a question.

**Request body**:
```json
{
  "instanceQuestionId": "uuid",
  "submitterName": "Jane Smith",
  "submitterEmail": "jane@trust.nhs.uk",
  "suggestionText": "Minimum 50 character notes explaining the suggestion...",
  "componentChanges": {
    "settings": { "required": { "from": false, "to": true } },
    "content": {
      "questionText": { "from": "Original text", "to": "Updated text" },
      "options": [ { "type": "modify", "original": "Yes", "updated": "Definitely yes" } ]
    }
  }
}
```

**Response `201`**: Created suggestion object.

---

### `GET /api/instance/[trustLinkId]/suggestions`
Get all suggestions for an instance (used on the suggestions review page).

**Query params**: `?status=pending|approved|rejected` (optional filter)

**Response `200`**: Array of suggestion objects with nested question and comment count.

---

### `PATCH /api/instance/[trustLinkId]/suggestions/[suggestionId]`
Update a suggestion's status or add a response. Used by account managers.

**Request body** (all fields optional):
```json
{
  "status": "approved",
  "responseMessage": "Thank you, approved for next release.",
  "internalComment": "Checked with clinical lead."
}
```

**Response `200`**: Updated suggestion object.

---

### `DELETE /api/instance/[trustLinkId]/suggestions/[suggestionId]`
Delete a suggestion.

**Response `200`**: `{ "success": true }`

---

## Suggestion Comments

### `GET /api/instance/[trustLinkId]/suggestions/[suggestionId]/comments`
Get all comments on a suggestion.

**Response `200`**: Array of comment objects.

---

### `POST /api/instance/[trustLinkId]/suggestions/[suggestionId]/comments`
Add a comment to a suggestion.

**Request body**:
```json
{
  "submitterName": "Jane Smith",
  "commentText": "Can you clarify what you meant by..."
}
```

**Response `201`**: Created comment object.

---

## Error Format

All error responses return:
```json
{ "error": "Human-readable error message" }
```
