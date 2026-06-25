import { useEffect, useState } from 'react';
import { addDays, startOfDay } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../context/BusinessContext';
import { Badge, Button, Card, Select, Spinner } from '../ui';
import { formatDateLabel, formatMoney, formatTimeLabel } from '../../lib/format';
import type { Appointment, AppointmentStatus } from '../../lib/types';

const STATUS_TONE: Record<AppointmentStatus, 'blue' | 'green' | 'red' | 'amber'> = {
  confirmed: 'blue',
  completed: 'green',
  no_show: 'red',
  cancelled: 'amber',
};

export default function CalendarView() {
  const { business } = useBusiness();
  const [dayOffset, setDayOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const date = startOfDay(addDays(new Date(), dayOffset));

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, clients(*), services(*)')
      .gte('start_time', date.toISOString())
      .lt('start_time', addDays(date, 1).toISOString())
      .order('start_time');
    setAppointments((data as unknown as Appointment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayOffset]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    load();
  }

  async function markPaid(appt: Appointment) {
    await supabase
      .from('appointments')
      .update({ payment_status: 'paid_full', amount_paid: appt.total_price })
      .eq('id', appt.id);
    await supabase.from('payments').insert({
      appointment_id: appt.id,
      amount: appt.total_price - appt.amount_paid,
      type: 'manual',
      status: 'succeeded',
    });
    load();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setDayOffset((d) => d - 1)}>
            &larr;
          </Button>
          <span className="text-sm font-medium text-slate-700">{formatDateLabel(date)}</span>
          <Button variant="ghost" onClick={() => setDayOffset((d) => d + 1)}>
            &rarr;
          </Button>
          {dayOffset !== 0 && (
            <Button variant="secondary" onClick={() => setDayOffset(0)}>
              Today
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">No appointments booked for this day.</Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="w-20 shrink-0 text-sm font-semibold text-slate-900">
                {formatTimeLabel(new Date(appt.start_time))}
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="font-medium text-slate-900">{appt.clients?.full_name}</p>
                <p className="text-xs text-slate-500">{appt.clients?.phone || appt.clients?.email}</p>
              </div>
              <div className="min-w-[140px] flex-1">
                <p className="text-sm text-slate-700">{appt.services?.name}</p>
                <p className="text-xs text-slate-500">{formatMoney(appt.total_price, business?.currency)}</p>
              </div>
              <div>
                {appt.payment_status === 'paid_full' && <Badge tone="green">Paid</Badge>}
                {appt.payment_status === 'deposit_paid' && <Badge tone="blue">Deposit paid</Badge>}
                {appt.payment_status === 'unpaid' && <Badge tone="amber">Unpaid</Badge>}
                {appt.payment_status === 'refunded' && <Badge tone="slate">Refunded</Badge>}
              </div>
              {appt.payment_status !== 'paid_full' && (
                <Button variant="secondary" onClick={() => markPaid(appt)}>
                  Mark as paid
                </Button>
              )}
              <Select
                className="w-36"
                value={appt.status}
                onChange={(e) => updateStatus(appt.id, e.target.value as AppointmentStatus)}
              >
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="no_show">No-show</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Badge tone={STATUS_TONE[appt.status]}>{appt.status.replace('_', ' ')}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
