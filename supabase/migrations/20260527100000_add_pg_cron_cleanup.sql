-- Migration: Replace unsecured /api/cleanup-sessions route with a pg_cron job.
-- The old route used the service role key with no auth check — anyone could call it.
-- This job runs the same cleanup logic directly in PostgreSQL on a daily schedule.

-- Enable pg_cron extension (available on all Supabase hosted projects)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant cron schema access to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the cleanup job (idempotent: unschedule first if it already exists)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-abandoned-sessions')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-abandoned-sessions');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'cleanup-abandoned-sessions',
  '0 3 * * *',
  $$
    UPDATE public.exam_sessions
    SET status = 'abandoned', updated_at = now()
    WHERE status = 'in_progress'
      AND created_at < now() - interval '7 days';
  $$
);
