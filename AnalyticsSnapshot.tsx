import { useEffect, useState } from 'react';
import { subDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Card } from '../ui';
import { formatMoney } from '../../lib/format';
import type { Appointment } from '../../lib/types';

export default function AnalyticsSnapshot() {
  const { business } = useBusiness();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    supabase
      .from('appointments')
      .select('*, services(name)')
      .gte('start_time', subDays(new Date(), 30).toISOString())
      .then(({ data }) => setAppointments((data as unknown as Appointment[]) ?? []));
  }, []);

  const last7 = appointments.filter((a) => new Date(a.start_time) >= subDays(new Date(), 7));
  const completed = appointments.filter((a) => a.status === 'completed');
  const noShows = appointments.filter((a) => a.status === 'no_show');
  const totalConsidered = completed.length + noShows.length;
  const noShowRate = totalConsidered > 0 ? Math.round((noShows.length / totalConsidered) * 100) : 0;
  const revenue7 = last7.reduce((sum, a) => sum + (a.amount_paid || 0), 0);

  const serviceCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    const name = a.services?.name ?? 'Unknown';
    serviceCounts[name] = (serviceCounts[name] ?? 0) + 1;
  });
  const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

  const byDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    byDay[d.toLocaleDateString('en-GB', { weekday: 'short' })] = 0;
  }
  last7.forEach((a) => {
    const key = new Date(a.start_time).toLocaleDateString('en-GB', { weekday: 'short' });
    if (key in byDay) byDay[key] += 1;
  });
  const maxCount = Math.max(1, ...Object.values(byDay));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Analytics (last 30 days)</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{last7.length}</p>
          <p className="text-xs text-slate-500">Bookings this week</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{formatMoney(revenue7, business?.currency)}</p>
          <p className="text-xs text-slate-500">Revenue this week</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{noShowRate}%</p>
          <p className="text-xs text-slate-500">No-show rate (30d)</p>
        </Card>
        <Card className="p-4">
          <p className="truncate text-2xl font-bold text-slate-900">{topService?.[0] ?? '-'}</p>
          <p className="text-xs text-slate-500">Most booked service</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Bookings per day, last 7 days</h3>
        <div className="flex items-end gap-3" style={{ height: 120 }}>
          {Object.entries(byDay).map(([day, count]) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-brand-primary"
                style={{ height: `${(count / maxCount) * 90}px`, minHeight: count > 0 ? 4 : 0 }}
              />
              <span className="text-xs text-slate-400">{day}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
