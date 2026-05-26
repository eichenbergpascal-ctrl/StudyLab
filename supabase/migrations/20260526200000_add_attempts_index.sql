CREATE INDEX IF NOT EXISTS idx_attempts_user_incorrect
ON attempts(user_id, is_correct)
WHERE is_correct = false;
