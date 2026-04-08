-- Migration: Allow authenticated users to delete their own master questionnaires
-- Cascading foreign keys handle deletion of related master_questions, trust_instances, etc.

CREATE POLICY "Users can delete own masters" ON master_questionnaires
FOR DELETE USING (auth.uid() = user_id);
