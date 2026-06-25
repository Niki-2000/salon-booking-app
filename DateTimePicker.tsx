import { useEffect, useMemo, useState } from 'react';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import { Button, Card, Select, Spinner } from '../ui';
import { supabase } from '../../lib/supabase';
import { getAvailableSlots } from '../../lib/availability';
import { formatDateLabel, formatTimeLabel } from '../../lib/format';
import type { BusinessSettings, BusySlot, OpeningHour, Service, Staff } from '../../lib/types';

export default function DateTimePicker({
  service,
  staffList,
  business,
  openingHours,
  onSelect,
  onBack,
}: {
  service: Service;
  staffList: Staff[];
  business: BusinessSettings;
  openingHours: OpeningHour[];
  onSelect: (slot: { start: Date; staffId: string | null }) => void;
  onBack: () => void;
}) {
  const [dayOffset, setDayOffset] = useState(0);
  const [staffId, setStaffId] = useState<string>('any');
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const date = useMemo(() => startOfDay(addDays(new Date(), dayOffset)), [dayOffset]);
  const openingHour = openingHours.find((h) => h.day_of_week === date.getDay());

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from('public_busy_slots')
      .select('*')
      .gte('start_time', date.toISOString())
      .lt('start_time', addDays(date, 1).toISOString())
      .then(({ data }) => {
        if (active) {
          setBusySlots(data ?? []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [date]);

  const relevantBusy = busySlots.filter((b) => staffId === 'any' || b.staff_id === staffId);

  const slots = getAvailableSlots({
    date,
    openingHour,
    busySlots: relevantBusy,
    durationMinutes: service.duration_minutes,
    bufferMinutes: business.booking_buffer_minutes,
    slotIntervalMinutes: business.slot_interval_minutes,
    minLeadMinutes: business.min_lead_minutes,
  });

  const maxOffset = business.booking_horizon_days;

  return (
    <div>
      <button onClick={onBack} className="mb-3 text-sm text-slate-500 hover:text-slate-700">
        &larr; Back to services
      </button>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Pick a date &amp; time</h2>

      {staffList.length > 0 && (
        <div className="mb-4 max-w-xs">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="any">Any available stylist</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" disabled={dayOffset === 0} onClick={() => setDayOffset((d) => Math.max(0, d - 1))}>
          &larr;
        </Button>
        <p className="font-medium text-slate-900">{isSameDay(date, new Date()) ? `Today, ${formatDateLabel(date)}` : formatDateLabel(date)}</p>
        <Button variant="ghost" disabled={dayOffset >= maxOffset} onClick={() => setDayOffset((d) => Math.min(maxOffset, d + 1))}>
          &rarr;
        </Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : slots.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No slots available this day. Try another date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.toISOString()}
                onClick={() => onSelect({ start: slot, staffId: staffId === 'any' ? null : staffId })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-primary hover:bg-brand-primary/5"
              >
                {formatTimeLabel(slot)}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
