-- Migration: Enforce user_id on master questionnaires
-- Now that auth is required for all uploads, clean up orphaned records
-- and make user_id mandatory.

-- 1. Ensure delete policy exists (idempotent - safe if 009 was already applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'master_questionnaires'
      AND policyname = 'Users can delete own masters'
  ) THEN
    CREATE POLICY "Users can delete own masters" ON master_questionnaires
    FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 2. Delete orphaned questionnaires with no owner (cascade removes related data)
DELETE FROM master_questionnaires WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL now that all uploads require auth
ALTER TABLE master_questionnaires
ALTER COLUMN user_id SET NOT NULL;
