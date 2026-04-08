-- Migration: Allow authenticated users to delete trust instances they own (via parent master)
-- Cascading foreign keys handle deletion of related instance_questions, instance_suggestions, etc.

CREATE POLICY "Users can delete own trust instances" ON trust_instances
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM master_questionnaires
    WHERE master_questionnaires.id = trust_instances.master_id
      AND master_questionnaires.user_id = auth.uid()
  )
);
