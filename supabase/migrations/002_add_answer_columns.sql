-- Migration: Add answer_type and answer_options columns to questions table
-- These columns store the expected answer format for each question

-- Add answer_type column with CHECK constraint
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS answer_type TEXT CHECK (answer_type IN ('text', 'radio', 'multi_select'));

-- Add answer_options column (pipe-separated options like "Option1|Option2|Option3")
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS answer_options TEXT;

-- Add comments for documentation
COMMENT ON COLUMN questions.answer_type IS 'Type of answer expected: text, radio, or multi_select';
COMMENT ON COLUMN questions.answer_options IS 'Pipe-separated list of answer options (e.g., "Yes|No|Maybe"). Required for radio/multi_select, empty for text.';
