import { addMinutes } from 'date-fns';
import { Button, Card } from '../ui';
import { formatDateLabel, formatMoney, formatTimeLabel } from '../../lib/format';
import { buildICS, downloadICS } from '../../lib/ics';
import type { BusinessSettings, Service } from '../../lib/types';

export default function BookingConfirmation({
  business,
  service,
  start,
  amountDue,
  paid,
}: {
  business: BusinessSettings;
  service: Service;
  start: Date;
  amountDue: number;
  paid: boolean;
}) {
  const end = addMinutes(start, service.duration_minutes);

  function handleAddToCalendar() {
    const ics = buildICS({
      title: `${service.name} at ${business.name}`,
      description: `Booked via ${business.name}`,
      location: business.address ?? undefined,
      start,
      end,
    });
    downloadICS('appointment.ics', ics);
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h2 className="text-lg font-semibold text-slate-900">You're booked!</h2>
      <p className="mt-1 text-sm text-slate-500">A confirmation email is on its way to you.</p>

      <Card className="mt-5 p-4 text-left">
        <p className="font-medium text-slate-900">{service.name}</p>
        <p className="text-sm text-slate-500">
          {formatDateLabel(start)} at {formatTimeLabel(start)}
        </p>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">{amountDue > 0 ? (paid ? 'Paid now' : 'Due now') : 'Payment'}</span>
          <span className="font-medium text-slate-900">
            {amountDue > 0 ? formatMoney(amountDue, business.currency) : 'Pay at appointment'}
          </span>
        </div>
      </Card>

      <Button variant="secondary" className="mt-4 w-full" onClick={handleAddToCalendar}>
        Add to calendar
      </Button>

      <p className="mt-4 text-xs text-slate-400">
        Need to change anything? Cancellations within {business.cancellation_window_hours} hours of your
        appointment may not be refundable - just reply to your confirmation email and we'll help.
      </p>
    </div>
  );
}
