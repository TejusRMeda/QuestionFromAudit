-- Migration 015: Tighten RLS policies
--
-- Context: All prior RLS policies used USING(true) / WITH CHECK(true),
-- meaning the public anon key could read/write all data directly.
--
-- Strategy: Server-side API routes now use the service_role key (bypasses RLS).
-- This migration drops all permissive "Allow public" policies and replaces
-- them with restrictive ones. The only direct-client access allowed is
-- auth-scoped (master_questionnaires for the owning user).
--
-- Trust users access data through API routes (which use service_role),
-- so they are not affected by these policy changes.

-- ============================================================
-- LEGACY TABLES: projects, questions, suggestions
-- These are accessed only via legacy API routes (service_role).
-- Block all direct access.
-- ============================================================

-- projects
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert projects" ON projects;
CREATE POLICY "Deny direct access to projects" ON projects FOR ALL USING (false);

-- questions
DROP POLICY IF EXISTS "Allow public read questions" ON questions;
DROP POLICY IF EXISTS "Allow public insert questions" ON questions;
CREATE POLICY "Deny direct access to questions" ON questions FOR ALL USING (false);

-- suggestions
DROP POLICY IF EXISTS "Allow public read suggestions" ON suggestions;
DROP POLICY IF EXISTS "Allow public insert suggestions" ON suggestions;
DROP POLICY IF EXISTS "Allow public update suggestions" ON suggestions;
DROP POLICY IF EXISTS "Allow public delete suggestions" ON suggestions;
CREATE POLICY "Deny direct access to suggestions" ON suggestions FOR ALL USING (false);

-- ============================================================
-- master_questionnaires
-- Auth users can manage their own. Drop the "Allow public" policies.
-- Keep the user-scoped ones from migration 005.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read master_questionnaires" ON master_questionnaires;
DROP POLICY IF EXISTS "Allow public insert master_questionnaires" ON master_questionnaires;
-- Existing policies from migration 005/010 remain:
--   "Users can read own masters"    SELECT  USING (auth.uid() = user_id)
--   "Users can insert own masters"  INSERT  WITH CHECK (auth.uid() = user_id)
--   "Users can delete own masters"  DELETE  USING (auth.uid() = user_id)

-- ============================================================
-- master_questions
-- Accessed via service_role in API routes. Block direct access.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read master_questions" ON master_questions;
DROP POLICY IF EXISTS "Allow public insert master_questions" ON master_questions;
CREATE POLICY "Deny direct access to master_questions" ON master_questions FOR ALL USING (false);

-- ============================================================
-- trust_instances
-- Accessed via service_role in API routes. Keep the delete policy
-- for auth users, drop the permissive ones.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read trust_instances" ON trust_instances;
DROP POLICY IF EXISTS "Allow public insert trust_instances" ON trust_instances;
DROP POLICY IF EXISTS "Allow public update trust_instances" ON trust_instances;
-- Existing policy remains:
--   "Users can delete own trust instances" DELETE USING (exists...)

-- ============================================================
-- instance_questions
-- Accessed via service_role in API routes. Block direct access.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read instance_questions" ON instance_questions;
DROP POLICY IF EXISTS "Allow public insert instance_questions" ON instance_questions;
CREATE POLICY "Deny direct access to instance_questions" ON instance_questions FOR ALL USING (false);

-- ============================================================
-- instance_suggestions
-- Accessed via service_role in API routes. Block direct access.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read instance_suggestions" ON instance_suggestions;
DROP POLICY IF EXISTS "Allow public insert instance_suggestions" ON instance_suggestions;
DROP POLICY IF EXISTS "Allow public update instance_suggestions" ON instance_suggestions;
DROP POLICY IF EXISTS "Allow public delete instance_suggestions" ON instance_suggestions;
CREATE POLICY "Deny direct access to instance_suggestions" ON instance_suggestions FOR ALL USING (false);

-- ============================================================
-- suggestion_comments
-- Accessed via service_role in API routes. Block direct access.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read suggestion_comments" ON suggestion_comments;
DROP POLICY IF EXISTS "Allow public insert suggestion_comments" ON suggestion_comments;
DROP POLICY IF EXISTS "Allow public delete suggestion_comments" ON suggestion_comments;
CREATE POLICY "Deny direct access to suggestion_comments" ON suggestion_comments FOR ALL USING (false);

-- ============================================================
-- instance_section_reviews
-- Accessed via service_role in API routes. Block direct access.
-- ============================================================

DROP POLICY IF EXISTS "Allow public read instance_section_reviews" ON instance_section_reviews;
DROP POLICY IF EXISTS "Allow public insert instance_section_reviews" ON instance_section_reviews;
DROP POLICY IF EXISTS "Allow public update instance_section_reviews" ON instance_section_reviews;
DROP POLICY IF EXISTS "Allow public delete instance_section_reviews" ON instance_section_reviews;
CREATE POLICY "Deny direct access to instance_section_reviews" ON instance_section_reviews FOR ALL USING (false);
