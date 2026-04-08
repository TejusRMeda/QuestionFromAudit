-- Cleanup Orphaned Suggestions Script
-- Run this in your Supabase SQL Editor

-- First, let's see what orphaned data exists (preview only)
-- Orphaned instance_suggestions (question was deleted but suggestion remains)
SELECT
  'instance_suggestions with missing questions' as issue,
  COUNT(*) as count
FROM instance_suggestions s
LEFT JOIN instance_questions q ON s.instance_question_id = q.id

-- instance_suggestions where the question's instance no longer exists
SELECT
  'instance_suggestions with missing instances' as issue,
  COUNT(*) as count
FROM instance_suggestions s
JOIN instance_questions q ON s.instance_question_id = q.id
LEFT JOIN trust_instances i ON q.instance_id = i.id
WHERE i.id IS NULL;

-- Old suggestions table (legacy system)
SELECT
  'old suggestions table' as issue,
  COUNT(*) as count
FROM suggestions;

-- ============================================
-- CLEANUP COMMANDS (uncomment to execute)
-- ============================================

-- 1. Delete instance_suggestions where the question no longer exists
-- DELETE FROM instance_suggestions
-- WHERE instance_question_id NOT IN (
--   SELECT id FROM instance_questions
-- );

-- 2. Delete instance_suggestions where the instance no longer exists
-- DELETE FROM instance_suggestions
-- WHERE instance_question_id IN (
--   SELECT q.id FROM instance_questions q
--   LEFT JOIN trust_instances i ON q.instance_id = i.id
--   WHERE i.id IS NULL
-- );

-- 3. Delete ALL data from the old suggestions table (legacy system)
-- Only do this if you're sure you no longer need the old project-based suggestions
-- TRUNCATE TABLE suggestions;

-- 4. Or delete specific old suggestions older than a certain date
-- DELETE FROM suggestions WHERE created_at < '2025-01-01';
