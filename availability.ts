import { addMinutes, isBefore, isAfter, startOfDay, set } from 'date-fns';
import type { BusySlot, OpeningHour } from './types';

/**
 * Pure function that computes bookable start times for a given day.
 * This powers the 24/7 self-serve DateTimePicker - clients only ever
 * see slots that are actually free, so there's no back-and-forth.
 */
export function getAvailableSlots(opts: {
  date: Date;
  openingHour: OpeningHour | undefined;
  busySlots: BusySlot[]; // already filtered to the relevant staff member (or all, if "any staff")
  durationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  minLeadMinutes: number;
  now?: Date;
}): Date[] {
  const { date, openingHour, busySlots, durationMinutes, bufferMinutes, slotIntervalMinutes, minLeadMinutes } = opts;
  const now = opts.now ?? new Date();

  if (!openingHour || openingHour.is_closed) return [];

  const day = startOfDay(date);
  const [openH, openM] = openingHour.open_time.split(':').map(Number);
  const [closeH, closeM] = openingHour.close_time.split(':').map(Number);

  const dayOpen = set(day, { hours: openH, minutes: openM, seconds: 0, milliseconds: 0 });
  const dayClose = set(day, { hours: closeH, minutes: closeM, seconds: 0, milliseconds: 0 });
  const earliestBookable = addMinutes(now, minLeadMinutes);

  const slots: Date[] = [];
  let candidate = dayOpen;

  while (isBefore(addMinutes(candidate, durationMinutes), dayClose) || +addMinutes(candidate, durationMinutes) === +dayClose) {
    const candidateEnd = addMinutes(candidate, durationMinutes);

    const isFarEnoughAhead = !isBefore(candidate, earliestBookable);
    const fits = !isAfter(candidateEnd, dayClose);

    const overlapsExisting = busySlots.some((busy) => {
      const busyStart = addMinutes(new Date(busy.start_time), -bufferMinutes);
      const busyEnd = addMinutes(new Date(busy.end_time), bufferMinutes);
      return isBefore(candidate, busyEnd) && isAfter(candidateEnd, busyStart);
    });

    if (isFarEnoughAhead && fits && !overlapsExisting) {
      slots.push(candidate);
    }

    candidate = addMinutes(candidate, slotIntervalMinutes);
  }

  return slots;
}
