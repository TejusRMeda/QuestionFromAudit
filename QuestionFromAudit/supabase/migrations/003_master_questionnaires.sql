-- Migration: Master Questionnaires & Trust Instances
-- Enables account managers to upload master questionnaires and share instances with trusts

-- Master questionnaires table (uploaded by account managers)
CREATE TABLE IF NOT EXISTS master_questionnaires (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  admin_link_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master questions table (questions from the CSV)
CREATE TABLE IF NOT EXISTS master_questions (
  id BIGSERIAL PRIMARY KEY,
  master_id BIGINT NOT NULL REFERENCES master_questionnaires(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_type TEXT CHECK (answer_type IN ('text', 'radio', 'multi_select')),
  answer_options TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust instances table (shared copies for each trust)
CREATE TABLE IF NOT EXISTS trust_instances (
  id BIGSERIAL PRIMARY KEY,
  master_id BIGINT NOT NULL REFERENCES master_questionnaires(id) ON DELETE CASCADE,
  trust_name TEXT NOT NULL,
  trust_link_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instance questions table (copy of master questions for each instance)
CREATE TABLE IF NOT EXISTS instance_questions (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES trust_instances(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_type TEXT CHECK (answer_type IN ('text', 'radio', 'multi_select')),
  answer_options TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instance suggestions table (isolated per instance)
CREATE TABLE IF NOT EXISTS instance_suggestions (
  id BIGSERIAL PRIMARY KEY,
  instance_question_id BIGINT NOT NULL REFERENCES instance_questions(id) ON DELETE CASCADE,
  submitter_name TEXT NOT NULL,
  submitter_email TEXT,
  suggestion_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  internal_comment TEXT,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_master_questions_master_id ON master_questions(master_id);
CREATE INDEX IF NOT EXISTS idx_master_questionnaires_admin_link ON master_questionnaires(admin_link_id);
CREATE INDEX IF NOT EXISTS idx_trust_instances_master_id ON trust_instances(master_id);
CREATE INDEX IF NOT EXISTS idx_trust_instances_trust_link ON trust_instances(trust_link_id);
CREATE INDEX IF NOT EXISTS idx_instance_questions_instance_id ON instance_questions(instance_id);
CREATE INDEX IF NOT EXISTS idx_instance_suggestions_question_id ON instance_suggestions(instance_question_id);
CREATE INDEX IF NOT EXISTS idx_instance_suggestions_status ON instance_suggestions(status);

-- Trigger to auto-update instance_suggestions.updated_at
DROP TRIGGER IF EXISTS update_instance_suggestions_updated_at ON instance_suggestions;
CREATE TRIGGER update_instance_suggestions_updated_at
  BEFORE UPDATE ON instance_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE master_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for master_questionnaires
CREATE POLICY "Allow public read master_questionnaires" ON master_questionnaires FOR SELECT USING (true);
CREATE POLICY "Allow public insert master_questionnaires" ON master_questionnaires FOR INSERT WITH CHECK (true);

-- Allow public read/write for master_questions
CREATE POLICY "Allow public read master_questions" ON master_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert master_questions" ON master_questions FOR INSERT WITH CHECK (true);

-- Allow public read/write for trust_instances
CREATE POLICY "Allow public read trust_instances" ON trust_instances FOR SELECT USING (true);
CREATE POLICY "Allow public insert trust_instances" ON trust_instances FOR INSERT WITH CHECK (true);

-- Allow public read/write for instance_questions
CREATE POLICY "Allow public read instance_questions" ON instance_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert instance_questions" ON instance_questions FOR INSERT WITH CHECK (true);

-- Allow public read/write for instance_suggestions
CREATE POLICY "Allow public read instance_suggestions" ON instance_suggestions FOR SELECT USING (true);
CREATE POLICY "Allow public insert instance_suggestions" ON instance_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update instance_suggestions" ON instance_suggestions FOR UPDATE USING (true);
