# Salon &amp; Beauty Booking App

A white-label, 24/7 online booking system built for hairdressers and beauty
professionals - designed so you can sell it as a product: each salon gets
their own copy, hosts their own data, and personalizes everything (name,
logo, colors, services, hours, payment rules, reminder timing) entirely
from an admin screen, with no code editing required.

## What's included

- **24/7 self-serve booking page** - clients pick a service, see real
  available times (computed live from your opening hours, buffer time, and
  existing bookings), enter their details, and confirm.
- **Client mini-CRM** - every booking captures name, phone, and email
  automatically. The Clients tab shows contact info, visit count, total
  spend, and a notes/service-history timeline you can add to freely (patch
  test results, formula used, preferences, allergies, anything).
- **Configurable email reminders** - add as many reminder rules as you
  like (e.g. "24 hours before", "2 hours before") with your own subject and
  message text. Timing is fully up to the salon owner.
- **Flexible payments via Stripe** - per service, choose full payment
  online, a deposit (fixed amount or percentage) with the balance paid at
  the appointment, or no online payment at all (pay when they arrive).
  Staff can also manually mark an in-person payment as received.
- **Waitlist** - keep a list of clients waiting for a slot and notify them
  by email with one click when something opens up.
- **Basic analytics** - bookings this week, revenue, no-show rate, and
  your most-booked service at a glance.
- **Booking confirmation emails with "Add to calendar"** - clients get a
  calendar file (.ics) so the appointment lands on their phone.

## Why this stack

You asked for the honest "what's best" answer rather than a forced choice,
so here it is:

**React + Supabase.** Supabase gives you a hosted Postgres database,
authentication, file storage, and serverless functions in one free-tier
project, and it's the backend that vibe-coding tools (Lovable, Bolt.new,
Replit) integrate with most natively, so dropping this into your tool of
choice and continuing to iterate on it with AI should be painless. The
alternative (Node/Express + SQLite) would mean each salon needs somewhere
to host a server, which is extra friction for non-technical buyers.

**Stripe for payments.** For a product you intend to resell beyond one
country, Stripe is the stronger pick over Square: it supports 45+
countries and 135+ currencies, has mature support for deposits/partial
capture, and its Payment Intents API automatically handles 3D Secure/SCA,
which UK and EU card networks increasingly require. Square's payment
processing is restricted to a much shorter list of countries (US, Canada,
UK, Australia, Japan, France, Spain, Ireland), so it would limit who you
could sell this to. If a future client already has a Square reader for
in-person tap payments, that can still run alongside this app since "pay
at appointment" just means Stripe isn't involved for that booking.

**Each salon gets their own copy.** Every business that buys this gets
their own free Supabase project and their own deployed copy of the app.
There's no shared database between salons, so there's nothing to
misconfigure that would let one salon see another's clients - simpler to
sell, simpler to support, and a clean story for data protection
(important in this industry given how much sensitive client info you
collect).

## Project structure

```
salon-booking-app/
  supabase/
    migrations/        SQL schema + example seed data
    functions/          Edge functions (booking, payments, emails, reminders)
    cron-setup.sql      Snippet to schedule the reminder function
  src/
    config/branding.ts  Fallback branding shown before the DB loads
    context/            Loads business settings/services/hours once, app-wide
    lib/                Supabase client, types, slot-availability engine, etc.
    components/booking/ The public booking flow
    components/admin/   The admin dashboard panels
    pages/               Top-level routes (booking page, admin login/dashboard)
```

## Setup (per salon)

1. **Create a Supabase project** at supabase.com (free tier is fine to
   start). Note your Project URL and anon key from Project Settings > API.
2. **Run the migrations.** In the Supabase SQL editor, run
   `supabase/migrations/0001_init_schema.sql` then
   `supabase/migrations/0002_seed_data.sql` (the seed data is just
   example services/hours you can edit or delete from the admin screen).
3. **Create an admin login.** Authentication > Users > Add user, with the
   salon owner's email and a password. This is the login for `/admin`.
4. **Create a Storage bucket** named `branding` (Storage > New bucket >
   Public) if you want logo uploads to work from Settings.
5. **Set up Stripe.** Create a Stripe account, grab the publishable and
   secret keys (Developers > API keys). Add a webhook endpoint pointing
   to `https://YOUR_PROJECT_REF.functions.supabase.co/stripe-webhook`
   listening for `payment_intent.succeeded` and
   `payment_intent.payment_failed`, then copy its signing secret.
6. **Set up Resend** (resend.com) for transactional email and verify a
   sending domain, or use their sandbox domain while testing.
7. **Copy `.env.example` to `.env`** and fill in `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, and `VITE_STRIPE_PUBLISHABLE_KEY`.
8. **Deploy the edge functions and set their secrets** (these are
   server-side only, never put them in `.env`):
   ```
   supabase functions deploy create-booking
   supabase functions deploy stripe-webhook
   supabase functions deploy send-reminders
   supabase functions deploy notify-client

   supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
   supabase secrets set STRIPE_SECRET_KEY=...
   supabase secrets set STRIPE_WEBHOOK_SECRET=...
   supabase secrets set RESEND_API_KEY=...
   supabase secrets set EMAIL_FROM="Your Salon <bookings@yoursalon.com>"
   ```
9. **Schedule reminders.** Enable the `pg_cron` and `pg_net` extensions
   (Database > Extensions), then run `supabase/cron-setup.sql` with your
   real function URL and anon key filled in.
10. **Install and run:**
    ```
    npm install
    npm run dev
    ```
    The booking page is at `/`, the admin dashboard at `/admin`.

## Using it in your vibe-coding app

This is a normal Vite + React + TypeScript project, so any tool that can
import an existing codebase can pick it up as-is. As of 2026, that's
**Bolt.new** and **Replit**, not Lovable. Lovable currently only builds
projects from a chat prompt and can export to a brand-new GitHub repo
afterward; it does not support importing pre-built code as a starting
point, so you can't paste or upload this project into it directly.

The reliable path for any of these tools is via GitHub:

1. Create a free GitHub account if you don't have one, and a new empty
   repository.
2. Push or upload this project's files into that repository (GitHub's
   web UI has a drag-and-drop "Add file > Upload files" option if you'd
   rather not use git commands).
3. **Bolt.new:** click the GitHub icon on the homepage, choose **Import
   from URL**, and paste your repository's URL.
   **Replit:** go to replit.com/import, choose GitHub, connect your
   account, and select the repository (or open
   `replit.com/github.com/<your-username>/<your-repo>` directly).

Once imported, each salon's copy can be customized further with
plain-English prompts ("change the booking flow to ask for a preferred
stylist photo upload", etc.) on top of this foundation, without touching
the database schema or payment logic, which is already wired up.

## What salons can personalize without touching code

Everything in the **Admin > Settings** screen writes straight to the
database and takes effect immediately: business name, logo, primary and
secondary colors, currency, address/contact details, opening hours,
booking buffer time, minimum notice period, and how far ahead clients can
book. **Admin > Services** controls the menu, pricing, duration, and
which payment mode applies to each service. **Admin > Reminders** controls
exactly when and what reminder emails say. None of this requires editing
a single file.

## Security notes

Row-level security is enabled on every table. The public booking page can
only read what it needs to render available slots (services, hours, and a
narrow `public_busy_slots` view with no client information in it) - it
never has direct write access. All booking, payment, and email logic runs
through the `create-booking`, `stripe-webhook`, `send-reminders`, and
`notify-client` edge functions using the Supabase service role key, so
slot double-booking, payment creation, and client data writes are all
validated server-side. Admin screens require a Supabase Auth session.

## Roadmap ideas (not built yet, but natural next steps)

- SMS reminders via Twilio, alongside or instead of email.
- Per-staff working hours and individual calendars for multi-chair salons
  (the `staff` and `staff_hours` tables already exist for this; the admin
  UI for editing them is the missing piece).
- Automatic release of a slot if an online payment isn't completed within
  a few minutes, so it doesn't sit reserved indefinitely.
- Deposit forfeiture rules for late cancellations, enforced automatically
  against the cancellation window already configurable in Settings.
- Post-appointment "leave a review" or "book your next visit" follow-up
  emails (the `send-reminders` pattern generalizes easily to this).
- Two-way Google Calendar sync for staff.
- A simple package/membership or loyalty-credit system for repeat
  clients.

## License

This codebase is yours to customize and resell as part of your own
product. There's no attribution requirement baked in.
