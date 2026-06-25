// Generates a tiny .ics calendar file so clients can add their
// appointment to Google/Apple/Outlook calendar with one click.

function toICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function buildICS(opts: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salon Booking App//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(opts.start)}`,
    `DTEND:${toICSDate(opts.end)}`,
    `SUMMARY:${opts.title}`,
    opts.description ? `DESCRIPTION:${opts.description.replace(/\n/g, '\\n')}` : '',
    opts.location ? `LOCATION:${opts.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadICS(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
