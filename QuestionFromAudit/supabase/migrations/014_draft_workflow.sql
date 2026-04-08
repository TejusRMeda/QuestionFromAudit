-- Migration: Draft-then-Submit Workflow
-- Trust users save drafts during review, then submit all at once.
-- Nothing is visible to account managers until submission.

-- 1. Expand instance_suggestions status to include 'draft'
ALTER TABLE instance_suggestions DROP CONSTRAINT IF EXISTS instance_suggestions_status_check;
ALTER TABLE instance_suggestions ADD CONSTRAINT instance_suggestions_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- 2. Add submission_status to trust_instances
ALTER TABLE trust_instances ADD COLUMN IF NOT EXISTS submission_status TEXT DEFAULT 'in_progress'
  CHECK (submission_status IN ('in_progress', 'submitted'));

-- 3. Create instance_section_reviews table
CREATE TABLE IF NOT EXISTS instance_section_reviews (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES trust_instances(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  has_suggestions BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instance_id, section_name, reviewer_name)
);

CREATE INDEX IF NOT EXISTS idx_section_reviews_instance ON instance_section_reviews(instance_id, reviewer_name);

-- RLS policies for instance_section_reviews
ALTER TABLE instance_section_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read instance_section_reviews" ON instance_section_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert instance_section_reviews" ON instance_section_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update instance_section_reviews" ON instance_section_reviews FOR UPDATE USING (true);
CREATE POLICY "Allow public delete instance_section_reviews" ON instance_section_reviews FOR DELETE USING (true);

-- Allow public update on trust_instances (for submission_status)
CREATE POLICY "Allow public update trust_instances" ON trust_instances FOR UPDATE USING (true);
