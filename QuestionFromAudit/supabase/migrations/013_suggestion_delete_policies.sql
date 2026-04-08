-- Migration: Add missing DELETE policies for suggestion tables
-- Fixes bug where suggestion deletions were silently blocked by RLS

-- Allow public delete for instance_suggestions (matches existing SELECT/INSERT/UPDATE policies)
CREATE POLICY "Allow public delete instance_suggestions" ON instance_suggestions
FOR DELETE USING (true);

-- Allow public delete for suggestion_comments (matches existing SELECT/INSERT policies)
CREATE POLICY "Allow public delete suggestion_comments" ON suggestion_comments
FOR DELETE USING (true);

-- Allow public delete for legacy suggestions table (matches existing SELECT/INSERT/UPDATE policies)
CREATE POLICY "Allow public delete suggestions" ON suggestions
FOR DELETE USING (true);
