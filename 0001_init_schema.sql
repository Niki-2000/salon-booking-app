-- =====================================================================
-- Salon / Beauty Booking App - core schema
-- One salon per deployment (this is a white-label template - every
-- business that buys it gets its own Supabase project and its own copy
-- of these tables).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- business_settings: singleton row (id is always 1). This is the
-- single source of truth for branding/personalisation - everything
-- here is editable from Admin > Settings, no code changes required.
-- ---------------------------------------------------------------------
create table business_settings (
  id int primary key default 1,
  name text not null default 'My Salon',
  logo_url text,
  primary_color text not null default '#7c3aed',
  secondary_color text not null default '#0f172a',
  currency text not null default 'GBP',
  timezone text not null default 'Europe/London',
  address text,
  phone text,
  email text,
  booking_buffer_minutes int not null default 0,
  slot_interval_minutes int not null default 15,
  min_lead_minutes int not null default 60,
  cancellation_window_hours int not null default 24,
  booking_horizon_days int not null default 60,
  stripe_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into business_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- opening_hours: one row per day of week (0 = Sunday ... 6 = Saturday)
-- ---------------------------------------------------------------------
create table opening_hours (
  day_of_week int primary key check (day_of_week between 0 and 6),
  is_closed boolean not null default false,
  open_time time not null default '09:00',
  close_time time not null default '17:30'
);

-- ---------------------------------------------------------------------
-- staff: optional - leave empty for a single-chair business
-- ---------------------------------------------------------------------
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table staff_hours (
  staff_id uuid not null references staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  is_off boolean not null default false,
  open_time time,
  close_time time,
  primary key (staff_id, day_of_week)
);

-- ---------------------------------------------------------------------
-- services: the menu of bookable services + how they should be paid for
-- ---------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes int not null default 30,
  price numeric(10,2) not null default 0,
  -- 'full'    -> client must pay the full price online at booking
  -- 'deposit' -> client pays a deposit online, balance at appointment
  -- 'none'    -> no online payment, client pays at the appointment
  payment_type text not null default 'none' check (payment_type in ('full','deposit','none')),
  deposit_amount numeric(10,2),
  deposit_is_percent boolean not null default false,
  color text default '#7c3aed',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table staff_services (
  staff_id uuid references staff(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ---------------------------------------------------------------------
-- clients: the salon's client list / mini-CRM
-- ---------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  marketing_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index clients_email_idx on clients (lower(email)) where email is not null;

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid not null references services(id),
  staff_id uuid references staff(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','deposit_paid','paid_full','refunded')),
  total_price numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  stripe_payment_intent_id text,
  booking_note text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_reason text
);
create index appointments_start_time_idx on appointments (start_time);
create index appointments_client_idx on appointments (client_id);
create index appointments_stripe_pi_idx on appointments (stripe_payment_intent_id);

-- ---------------------------------------------------------------------
-- client_notes: free-form notes / service history entries, separate
-- from the booking itself so staff can log things like patch test
-- results, formula used, allergies, preferences, etc.
-- ---------------------------------------------------------------------
create table client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  note text not null,
  created_by text default 'staff',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- reminder_rules: fully configurable by the salon owner - add as many
-- as they like (e.g. "48 hours before", "2 hours before").
-- ---------------------------------------------------------------------
create table reminder_rules (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  offset_minutes int not null,
  channel text not null default 'email',
  enabled boolean not null default true,
  subject text not null default 'Appointment reminder',
  message text not null default 'Hi {{client_name}}, just a reminder of your {{service_name}} appointment on {{appointment_date}} at {{appointment_time}}.',
  created_at timestamptz not null default now()
);

create table reminder_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  reminder_rule_id uuid not null references reminder_rules(id) on delete cascade,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  unique (appointment_id, reminder_rule_id)
);

-- ---------------------------------------------------------------------
-- payments: a log of every payment event tied to an appointment
-- ---------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  stripe_payment_intent_id text,
  amount numeric(10,2) not null,
  type text not null check (type in ('deposit','full','balance','manual')),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- waitlist: clients waiting for a slot to free up
-- ---------------------------------------------------------------------
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  service_id uuid references services(id),
  preferred_date date,
  preferred_time_range text,
  notes text,
  status text not null default 'waiting' check (status in ('waiting','notified','booked','expired')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- views
-- ---------------------------------------------------------------------

-- Per-client stats used by the CRM screen
create or replace view client_stats as
select
  c.id as client_id,
  count(a.id) filter (where a.status = 'completed') as completed_visits,
  count(a.id) filter (where a.status = 'no_show') as no_shows,
  coalesce(sum(a.amount_paid) filter (where a.status in ('completed','confirmed')), 0) as total_spent,
  max(a.start_time) filter (where a.status = 'completed') as last_visit,
  min(a.start_time) filter (where a.status = 'confirmed' and a.start_time > now()) as next_visit
from clients c
left join appointments a on a.client_id = c.id
group by c.id;

-- Narrow, anonymous-safe view of busy slots so the public booking page
-- can compute availability without ever exposing client details. This
-- view is owned by the migration role, so it runs with that role's
-- privileges and bypasses the appointments table's RLS - the anon key
-- only ever sees id/staff/service/start/end through this view.
create or replace view public_busy_slots as
select id, staff_id, service_id, start_time, end_time
from appointments
where status = 'confirmed';

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table business_settings enable row level security;
alter table opening_hours enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_hours enable row level security;
alter table staff_services enable row level security;
alter table clients enable row level security;
alter table client_notes enable row level security;
alter table appointments enable row level security;
alter table reminder_rules enable row level security;
alter table reminder_log enable row level security;
alter table payments enable row level security;
alter table waitlist enable row level security;

-- Public (anon) read access for whatever is needed to RENDER the
-- public booking page. Nothing here exposes client names/contact info.
create policy "public read business_settings" on business_settings for select using (true);
create policy "public read opening_hours" on opening_hours for select using (true);
create policy "public read services" on services for select using (active = true);
create policy "public read staff" on staff for select using (active = true);
create policy "public read staff_hours" on staff_hours for select using (true);
create policy "public read staff_services" on staff_services for select using (true);

grant select on public_busy_slots to anon, authenticated;
grant select on client_stats to authenticated;

-- Everything else (writes, client data, notes, payments, reminders) is
-- only reachable from the authenticated admin dashboard, or from the
-- service-role edge functions (create-booking, stripe-webhook,
-- send-reminders, notify-client) which bypass RLS entirely. The public
-- site never writes to the database directly - all booking writes go
-- through the create-booking edge function so slot conflicts and
-- payment creation can be validated server-side.
create policy "staff manage business_settings" on business_settings for all using (auth.role() = 'authenticated');
create policy "staff manage opening_hours" on opening_hours for all using (auth.role() = 'authenticated');
create policy "staff manage services" on services for all using (auth.role() = 'authenticated');
create policy "staff manage staff" on staff for all using (auth.role() = 'authenticated');
create policy "staff manage staff_hours" on staff_hours for all using (auth.role() = 'authenticated');
create policy "staff manage staff_services" on staff_services for all using (auth.role() = 'authenticated');
create policy "staff manage clients" on clients for all using (auth.role() = 'authenticated');
create policy "staff manage client_notes" on client_notes for all using (auth.role() = 'authenticated');
create policy "staff manage appointments" on appointments for all using (auth.role() = 'authenticated');
create policy "staff manage reminder_rules" on reminder_rules for all using (auth.role() = 'authenticated');
create policy "staff manage reminder_log" on reminder_log for all using (auth.role() = 'authenticated');
create policy "staff manage payments" on payments for all using (auth.role() = 'authenticated');
create policy "staff manage waitlist" on waitlist for all using (auth.role() = 'authenticated');
