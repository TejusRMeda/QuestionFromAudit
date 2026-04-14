-- Tag suggestions and comments captured during a usability-testing session so
-- they can be filtered out of the real review queue.

ALTER TABLE instance_suggestions
ADD COLUMN IF NOT EXISTS is_test_session BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN instance_suggestions.is_test_session IS
  'TRUE when the suggestion was submitted via a /testing link (usability session). Hidden from admin queue by default.';

CREATE INDEX IF NOT EXISTS idx_instance_suggestions_is_test_session
ON instance_suggestions (is_test_session);

ALTER TABLE suggestion_comments
ADD COLUMN IF NOT EXISTS is_test_session BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN suggestion_comments.is_test_session IS
  'TRUE when the comment was authored via a /testing link.';
