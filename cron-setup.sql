-- Run this in the Supabase SQL editor AFTER deploying the send-reminders
-- edge function, once you know your project's function URL.
-- Requires the pg_cron and pg_net extensions (enable them under
-- Database > Extensions in the Supabase dashboard first).

select cron.schedule(
  'send-reminders-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.functions.supabase.co/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's running:
-- select * from cron.job;
-- select * from cron.job_run_details order by start_time desc limit 10;

-- To remove it later:
-- select cron.unschedule('send-reminders-every-5-min');
