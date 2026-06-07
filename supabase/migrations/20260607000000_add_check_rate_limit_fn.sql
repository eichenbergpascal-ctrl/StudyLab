CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_per_hour int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO rate_limits (user_id, action, count, window_start)
  VALUES (p_user_id, p_action, 1, now())
  ON CONFLICT (user_id, action) DO UPDATE
    SET
      count = CASE
        WHEN rate_limits.window_start < now() - interval '1 hour'
        THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - interval '1 hour'
        THEN now()
        ELSE rate_limits.window_start
      END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_per_hour;
END;
$$;
