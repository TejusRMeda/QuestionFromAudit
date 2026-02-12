-- Migration: Add MyPreOp format columns
-- Adds new columns to support the MyPreOp 13-column CSV format

-- ============================================================================
-- Update answer_type constraint to include new types
-- ============================================================================

-- Drop existing constraint on questions table
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_answer_type_check;

-- Add new constraint with expanded types
ALTER TABLE questions ADD CONSTRAINT questions_answer_type_check
  CHECK (answer_type IN ('text', 'radio', 'multi_select', 'checkbox', 'text-field', 'text-area', 'text-paragraph', 'phone-number', 'age', 'number-input', 'allergy-list'));

-- Drop existing constraint on master_questions table
ALTER TABLE master_questions DROP CONSTRAINT IF EXISTS master_questions_answer_type_check;

-- Add new constraint with expanded types
ALTER TABLE master_questions ADD CONSTRAINT master_questions_answer_type_check
  CHECK (answer_type IN ('text', 'radio', 'multi_select', 'checkbox', 'text-field', 'text-area', 'text-paragraph', 'phone-number', 'age', 'number-input', 'allergy-list'));

-- Drop existing constraint on instance_questions table
ALTER TABLE instance_questions DROP CONSTRAINT IF EXISTS instance_questions_answer_type_check;

-- Add new constraint with expanded types
ALTER TABLE instance_questions ADD CONSTRAINT instance_questions_answer_type_check
  CHECK (answer_type IN ('text', 'radio', 'multi_select', 'checkbox', 'text-field', 'text-area', 'text-paragraph', 'phone-number', 'age', 'number-input', 'allergy-list'));

-- ============================================================================
-- Add new columns to questions table
-- ============================================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS page TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS characteristic TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS enable_when JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS has_helper BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS helper_type TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS helper_name TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS helper_value TEXT;

-- ============================================================================
-- Add new columns to master_questions table
-- ============================================================================

ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS page TEXT;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS characteristic TEXT;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT false;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS enable_when JSONB;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS has_helper BOOLEAN DEFAULT false;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS helper_type TEXT;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS helper_name TEXT;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS helper_value TEXT;

-- ============================================================================
-- Add new columns to instance_questions table
-- ============================================================================

ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS page TEXT;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS characteristic TEXT;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT false;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS enable_when JSONB;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS has_helper BOOLEAN DEFAULT false;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS helper_type TEXT;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS helper_name TEXT;
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS helper_value TEXT;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN questions.section IS 'Section grouping from MyPreOp format (e.g., "Who I Am")';
COMMENT ON COLUMN questions.page IS 'Page within section from MyPreOp format (e.g., "Personal Details")';
COMMENT ON COLUMN questions.characteristic IS 'Pipe-separated option identifiers/tags (e.g., "patient_is_male|patient_is_female")';
COMMENT ON COLUMN questions.required IS 'Whether the question is required';
COMMENT ON COLUMN questions.enable_when IS 'Conditional display logic as JSONB (e.g., {"questionId": "...", "operator": "=", "answer": "true"})';
COMMENT ON COLUMN questions.has_helper IS 'Whether the question has helper content';
COMMENT ON COLUMN questions.helper_type IS 'Type of helper: contentBlock, webLink, etc.';
COMMENT ON COLUMN questions.helper_name IS 'Display name for the helper';
COMMENT ON COLUMN questions.helper_value IS 'Helper content or URL';

COMMENT ON COLUMN master_questions.section IS 'Section grouping from MyPreOp format (e.g., "Who I Am")';
COMMENT ON COLUMN master_questions.page IS 'Page within section from MyPreOp format (e.g., "Personal Details")';
COMMENT ON COLUMN master_questions.characteristic IS 'Pipe-separated option identifiers/tags (e.g., "patient_is_male|patient_is_female")';
COMMENT ON COLUMN master_questions.required IS 'Whether the question is required';
COMMENT ON COLUMN master_questions.enable_when IS 'Conditional display logic as JSONB (e.g., {"questionId": "...", "operator": "=", "answer": "true"})';
COMMENT ON COLUMN master_questions.has_helper IS 'Whether the question has helper content';
COMMENT ON COLUMN master_questions.helper_type IS 'Type of helper: contentBlock, webLink, etc.';
COMMENT ON COLUMN master_questions.helper_name IS 'Display name for the helper';
COMMENT ON COLUMN master_questions.helper_value IS 'Helper content or URL';

COMMENT ON COLUMN instance_questions.section IS 'Section grouping from MyPreOp format (e.g., "Who I Am")';
COMMENT ON COLUMN instance_questions.page IS 'Page within section from MyPreOp format (e.g., "Personal Details")';
COMMENT ON COLUMN instance_questions.characteristic IS 'Pipe-separated option identifiers/tags (e.g., "patient_is_male|patient_is_female")';
COMMENT ON COLUMN instance_questions.required IS 'Whether the question is required';
COMMENT ON COLUMN instance_questions.enable_when IS 'Conditional display logic as JSONB (e.g., {"questionId": "...", "operator": "=", "answer": "true"})';
COMMENT ON COLUMN instance_questions.has_helper IS 'Whether the question has helper content';
COMMENT ON COLUMN instance_questions.helper_type IS 'Type of helper: contentBlock, webLink, etc.';
COMMENT ON COLUMN instance_questions.helper_name IS 'Display name for the helper';
COMMENT ON COLUMN instance_questions.helper_value IS 'Helper content or URL';
