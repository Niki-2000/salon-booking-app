import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { fallbackBranding } from '../config/branding';
import type { BusinessSettings, OpeningHour, Service, Staff } from '../lib/types';

interface BusinessContextValue {
  business: BusinessSettings | null;
  openingHours: OpeningHour[];
  services: Service[];
  staff: Staff[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

// This is the heart of "personalise it yourself, no code required": it
// loads the salon's settings/services/hours from Supabase and applies
// the brand colours as CSS variables, so anything saved in
// Admin > Settings shows up immediately across the whole app.
export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [businessRes, hoursRes, servicesRes, staffRes] = await Promise.all([
      supabase.from('business_settings').select('*').eq('id', 1).single(),
      supabase.from('opening_hours').select('*').order('day_of_week'),
      supabase.from('services').select('*').eq('active', true).order('sort_order'),
      supabase.from('staff').select('*').eq('active', true).order('name'),
    ]);

    if (businessRes.data) {
      setBusiness(businessRes.data);
      document.documentElement.style.setProperty('--brand-primary', businessRes.data.primary_color || fallbackBranding.primaryColor);
      document.documentElement.style.setProperty('--brand-secondary', businessRes.data.secondary_color || fallbackBranding.secondaryColor);
      document.title = businessRes.data.name || fallbackBranding.businessName;
    }
    if (hoursRes.data) setOpeningHours(hoursRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <BusinessContext.Provider value={{ business, openingHours, services, staff, loading, refresh: load }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
