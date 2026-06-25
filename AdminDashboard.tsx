import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { Spinner } from '../components/ui';
import CalendarView from '../components/admin/CalendarView';
import ClientList from '../components/admin/ClientList';
import ServicesManager from '../components/admin/ServicesManager';
import ReminderSettings from '../components/admin/ReminderSettings';
import WaitlistPanel from '../components/admin/WaitlistPanel';
import AnalyticsSnapshot from '../components/admin/AnalyticsSnapshot';
import SettingsPanel from '../components/admin/SettingsPanel';

const TABS = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'clients', label: 'Clients' },
  { id: 'services', label: 'Services' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminDashboard() {
  const { business } = useBusiness();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<TabId>('calendar');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) navigate('/admin/login');
  }, [session, navigate]);

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <h1 className="mb-6 truncate text-base font-bold text-slate-900">{business?.name ?? 'Salon'}</h1>
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                tab === t.id ? 'bg-brand-primary text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-8 block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100"
        >
          Sign out
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {tab === 'calendar' && <CalendarView />}
        {tab === 'clients' && <ClientList />}
        {tab === 'services' && <ServicesManager />}
        {tab === 'reminders' && <ReminderSettings />}
        {tab === 'waitlist' && <WaitlistPanel />}
        {tab === 'analytics' && <AnalyticsSnapshot />}
        {tab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
