-- Example data so the app isn't empty on first run. Delete or edit all
-- of this from the Admin dashboard - none of it is required.

insert into opening_hours (day_of_week, is_closed, open_time, close_time) values
  (0, true,  '09:00', '17:00'),  -- Sunday: closed
  (1, false, '09:00', '18:00'),  -- Monday
  (2, false, '09:00', '18:00'),  -- Tuesday
  (3, false, '09:00', '18:00'),  -- Wednesday
  (4, false, '09:00', '20:00'),  -- Thursday (late night)
  (5, false, '09:00', '18:00'),  -- Friday
  (6, false, '09:00', '16:00')   -- Saturday
on conflict (day_of_week) do nothing;

insert into services (name, description, duration_minutes, price, payment_type, deposit_amount, deposit_is_percent, color, sort_order) values
  ('Cut & Finish',       'Wash, cut and blow-dry',                45,  35.00, 'none',    null,  false, '#7c3aed', 1),
  ('Colour & Cut',       'Full colour with cut and finish',       120, 95.00, 'deposit', 20,    true,  '#ec4899', 2),
  ('Curly Cut & Style',  'Dry-cut curl specialist service',       60,  55.00, 'deposit', 15.00, false, '#0ea5e9', 3),
  ('Bridal Trial',       'Hair trial ahead of the big day',       90,  75.00, 'full',    null,  false, '#f59e0b', 4),
  ('Manicure',           'Classic manicure',                      40,  25.00, 'none',    null,  false, '#22c55e', 5);

insert into reminder_rules (label, offset_minutes, subject, message) values
  ('Day-before reminder', 1440, 'Reminder: your appointment is tomorrow',
   'Hi {{client_name}}, just a reminder that you have a {{service_name}} appointment tomorrow, {{appointment_date}} at {{appointment_time}}. See you then! Reply to this email if you need to reschedule.'),
  ('2-hour reminder', 120, 'See you soon!',
   'Hi {{client_name}}, this is a reminder that your {{service_name}} appointment is today at {{appointment_time}}. We look forward to seeing you!');
