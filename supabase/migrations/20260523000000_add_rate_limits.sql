CREATE TABLE rate_limits (
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, action)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limits_policy ON rate_limits FOR ALL USING (user_id = auth.uid());
