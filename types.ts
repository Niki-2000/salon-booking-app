export interface BusinessSettings {
  id: number;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  currency: string;
  timezone: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  booking_buffer_minutes: number;
  slot_interval_minutes: number;
  min_lead_minutes: number;
  cancellation_window_hours: number;
  booking_horizon_days: number;
  stripe_enabled: boolean;
}

export interface OpeningHour {
  day_of_week: number; // 0 = Sunday
  is_closed: boolean;
  open_time: string; // 'HH:MM:SS'
  close_time: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string | null;
  photo_url: string | null;
  active: boolean;
}

export type PaymentType = 'full' | 'deposit' | 'none';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  payment_type: PaymentType;
  deposit_amount: number | null;
  deposit_is_percent: boolean;
  color: string | null;
  active: boolean;
  sort_order: number;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  marketing_opt_in: boolean;
  created_at: string;
}

export interface ClientStats {
  client_id: string;
  completed_visits: number;
  no_shows: number;
  total_spent: number;
  last_visit: string | null;
  next_visit: string | null;
}

export interface ClientNote {
  id: string;
  client_id: string;
  appointment_id: string | null;
  note: string;
  created_by: string;
  created_at: string;
}

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid_full' | 'refunded';

export interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  staff_id: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  total_price: number;
  amount_paid: number;
  stripe_payment_intent_id: string | null;
  booking_note: string | null;
  created_at: string;
  clients?: Client;
  services?: Service;
  staff?: Staff;
}

export interface ReminderRule {
  id: string;
  label: string;
  offset_minutes: number;
  channel: string;
  enabled: boolean;
  subject: string;
  message: string;
}

export interface WaitlistEntry {
  id: string;
  client_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  service_id: string | null;
  preferred_date: string | null;
  preferred_time_range: string | null;
  notes: string | null;
  status: 'waiting' | 'notified' | 'booked' | 'expired';
  created_at: string;
}

export interface BusySlot {
  id: string;
  staff_id: string | null;
  service_id: string;
  start_time: string;
  end_time: string;
}
