-- Migration: Suggestion Comments (Conversation Thread)
-- Enables threaded conversations between admins and trust users on suggestions

-- Suggestion comments table
CREATE TABLE IF NOT EXISTS suggestion_comments (
  id BIGSERIAL PRIMARY KEY,
  suggestion_id BIGINT NOT NULL REFERENCES instance_suggestions(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('admin', 'trust_user')),
  author_name TEXT NOT NULL,
  author_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suggestion_comments_suggestion_id ON suggestion_comments(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_comments_created_at ON suggestion_comments(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for suggestion_comments
CREATE POLICY "Allow public read suggestion_comments" ON suggestion_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert suggestion_comments" ON suggestion_comments FOR INSERT WITH CHECK (true);
