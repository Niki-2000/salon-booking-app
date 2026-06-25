import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project details.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge functions are called with supabase.functions.invoke(name, { body })
// from anywhere in the app - see BookingPage.tsx and PaymentStep.tsx for
// the create-booking call, and WaitlistPanel.tsx for notify-client.
