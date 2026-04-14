-- Migration: Master Questionnaire Curation Workspace
-- Adds draft/published workflow for masters, plus hide/lock flags for questions.
-- Account managers can preview, curate, and publish before sharing with trusts.

-- 1. Add status column to master_questionnaires (default 'published' so existing masters are unaffected)
ALTER TABLE master_questionnaires ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE master_questionnaires DROP CONSTRAINT IF EXISTS master_questionnaires_status_check;
ALTER TABLE master_questionnaires ADD CONSTRAINT master_questionnaires_status_check
  CHECK (status IN ('draft', 'published'));

-- 2. Add curation flags to master_questions
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE master_questions ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- 3. Add is_locked to instance_questions (copied from master at instance creation)
ALTER TABLE instance_questions ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- 4. Index for filtering non-hidden questions during instance creation
CREATE INDEX IF NOT EXISTS idx_master_questions_hidden ON master_questions(master_id, is_hidden);
