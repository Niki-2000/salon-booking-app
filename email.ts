// Small wrapper around the Resend API (resend.com) plus a couple of
// helpers for turning {{tokens}} into a styled, on-brand HTML email.
// Swap this file out if you'd rather use SendGrid/Postmark/SES - every
// other function only calls sendEmail() and renderTemplate().

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'Bookings <bookings@example.com>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set - skipping email send.', opts.subject);
    return { skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error (${res.status}): ${text}`);
  }
  return res.json();
}

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_match, key) => vars[key] ?? '');
}

// Wraps any message body in a simple branded HTML shell.
export function emailShell(opts: {
  businessName: string;
  primaryColor: string;
  bodyHtml: string;
}) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
    <div style="background:${opts.primaryColor}; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <h1 style="color:#fff; font-size: 18px; margin:0;">${opts.businessName}</h1>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding: 24px; border-radius: 0 0 12px 12px;">
      ${opts.bodyHtml}
    </div>
  </div>`;
}

export function appointmentSummaryHtml(opts: {
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
  amountDueLabel: string;
}) {
  return `
  <table style="width:100%; font-size:14px; color:#0f172a; margin: 12px 0;">
    <tr><td style="padding:4px 0; color:#64748b;">Service</td><td style="text-align:right;"><strong>${opts.serviceName}</strong></td></tr>
    <tr><td style="padding:4px 0; color:#64748b;">Date</td><td style="text-align:right;">${opts.dateLabel}</td></tr>
    <tr><td style="padding:4px 0; color:#64748b;">Time</td><td style="text-align:right;">${opts.timeLabel}</td></tr>
    <tr><td style="padding:4px 0; color:#64748b;">Total price</td><td style="text-align:right;">${opts.priceLabel}</td></tr>
    <tr><td style="padding:4px 0; color:#64748b;">Due now</td><td style="text-align:right;"><strong>${opts.amountDueLabel}</strong></td></tr>
  </table>`;
}
