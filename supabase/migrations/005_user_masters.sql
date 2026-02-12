-- Migration: Link master questionnaires to authenticated users
-- Enables logged-in users to see their own masters on the dashboard

-- Add user_id column (nullable for backward compatibility with anonymous uploads)
ALTER TABLE master_questionnaires
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_master_questionnaires_user_id ON master_questionnaires(user_id);

-- Update RLS policies to allow users to read their own masters
-- Keep existing public policies for anonymous access via admin_link_id
CREATE POLICY "Users can read own masters" ON master_questionnaires
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own masters" ON master_questionnaires
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
