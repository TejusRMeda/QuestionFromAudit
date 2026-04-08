# MyPreOp CSV Format Migration - Changes Summary

## Overview
Migrated CSV upload from the 5-column format to the MyPreOp 13-column format where each option is on its own row.

### Format Change
**Old Format (5 columns, pipe-separated options):**
```csv
Question_ID,Category,Question_Text,Answer_Type,Answer_Options
Q001,Medical,Do you smoke?,radio,Yes|No|Previously
```

**New Format (13 columns, one option per row):**
```csv
Id,Section,Page,ItemType,Question,Option,Characteristic,Required,EnableWhen,HasHelper,HelperType,HelperName,HelperValue
Q001,Who I Am,Personal Details,radio,Select your gender,Male,patient_is_male,TRUE,,FALSE,,,
Q001,Who I Am,Personal Details,radio,Select your gender,Female,patient_is_female,TRUE,,FALSE,,,
```

---

## Files Created

### 1. Database Migration
**File:** `supabase/migrations/004_mypreop_format.sql`

Added new columns to `questions`, `master_questions`, and `instance_questions` tables:
- `section TEXT` - Section grouping
- `page TEXT` - Page within section
- `characteristic TEXT` - Pipe-separated option identifiers/tags
- `required BOOLEAN DEFAULT false`
- `enable_when JSONB` - Conditional display logic
- `has_helper BOOLEAN DEFAULT false`
- `helper_type TEXT`
- `helper_name TEXT`
- `helper_value TEXT`

Updated `answer_type` constraint to allow new types:
- `radio`, `checkbox`, `text-field`, `text-area`, `text-paragraph`, `phone-number`, `age`, `number-input`, `allergy-list`

### 2. TypeScript Types
**File:** `types/question.ts`

New interfaces and utilities:
- `MyPreOpCsvRow` - Raw CSV row structure
- `ParsedQuestion` - Grouped question with options array
- `EnableWhen`, `EnableWhenCondition` - Conditional logic types
- `QuestionOption` - Option with characteristic
- `MYPREOP_ITEM_TYPES` - Valid item types constant
- `MYPREOP_REQUIRED_COLUMNS` - Required CSV columns
- `ITEM_TYPES_REQUIRING_OPTIONS` - Types needing 2+ options (radio, checkbox)
- `ITEM_TYPES_NO_OPTIONS` - Types with no options (text-field, etc.)
- `parseEnableWhen()` - Parse EnableWhen string to structured object
- `groupRowsByQuestion()` - Group CSV rows by Id
- `rowsToQuestion()` - Convert grouped rows to ParsedQuestion

---

## Files Modified

### 3. Upload Page
**File:** `app/upload/page.tsx`

Changes:
- Updated imports to use new types from `@/types/question`
- Changed `validateCSV()` to:
  - Check for 13 required columns
  - Group rows by Id using `groupRowsByQuestion()`
  - Convert groups to questions using `rowsToQuestion()`
  - Validate item types against `MYPREOP_ITEM_TYPES`
  - Validate options based on item type
  - Validate helper fields when `HasHelper=TRUE`
- Updated UI format info section to show new column names and example

### 4. Masters Upload Page
**File:** `app/masters/upload/page.tsx`

Same changes as upload page - mirrors the validation and parsing logic.

### 5. Upload API Route
**File:** `app/api/upload/route.ts`

Changes:
- Updated imports to use new types
- Changed validation to use `MYPREOP_ITEM_TYPES` and `ITEM_TYPES_REQUIRING_OPTIONS`
- Updated question insertion to include new fields:
  - `section`, `page`, `characteristic`
  - `required`, `enable_when`
  - `has_helper`, `helper_type`, `helper_name`, `helper_value`
- Options converted to pipe-separated string for `answer_options` (backward compatibility)
- Characteristics converted to pipe-separated string

### 6. Masters API Route
**File:** `app/api/masters/route.ts`

Same changes as upload API route.

### 7. CSV Validation Tests
**File:** `__tests__/csv-validation.test.ts`

Completely rewritten to test MyPreOp format:
- Row grouping tests
- `rowsToQuestion` conversion tests
- `parseEnableWhen` parsing tests
- Question validation tests for all item types
- Warning tests (20+ options, long options, single-question sections, helper validation)
- Complete valid CSV tests

---

## Test File Type Fixes (Pre-existing issues)

### `__tests__/api/suggestions.test.ts`
- Added explicit `SuggestionPayload` type to payload variables with `submitterEmail: undefined`

### `__tests__/api/upload.test.ts`
- Added explicit `UploadPayload` type to empty questions array test

### `__tests__/components/AnswerInputs.test.tsx`
- Added explicit `string` type to `searchTerm` and `categoryFilter` variables

---

## New Item Types Supported

| Type | Requires Options | Description |
|------|-----------------|-------------|
| `radio` | Yes (2+) | Single choice |
| `checkbox` | Yes (2+) | Multiple choice |
| `text-field` | No | Single line text input |
| `text-area` | No | Multi-line text input |
| `text-paragraph` | No | Display text only |
| `phone-number` | No | Phone number input |
| `age` | No | Age input |
| `number-input` | No | Numeric input |
| `allergy-list` | No | Special allergy list input |

---

## EnableWhen Parsing

Supports conditional display logic parsing:
- Simple: `(characteristic=value)`
- AND: `(char1=true) AND(char2=true)`
- OR: `(char1=true) OR(char2=true)`
- Operators: `=`, `<`, `>`, `<=`, `>=`, `!=`, `exists`

---

## Verification Steps

1. **Run Migration:** Apply `004_mypreop_format.sql` to add new columns
2. **Run Tests:** `npm test` - All 28 CSV validation tests pass
3. **Type Check:** `npx tsc --noEmit` - No type errors
4. **Build:** `npm run build` - Verify production build works
5. **Test Upload:** Upload sample file at `/resources/Mypreop Sample - mypreop-patient-questionnaire-production (1).csv`
