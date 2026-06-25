import { useState, type FormEvent } from 'react';
import { Button, Input, Label, Textarea } from '../ui';

export interface ClientDetails {
  full_name: string;
  email: string;
  phone: string;
  marketing_opt_in: boolean;
  booking_note: string;
}

export default function ClientDetailsForm({
  onSubmit,
  onBack,
  submitting,
}: {
  onSubmit: (details: ClientDetails) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [details, setDetails] = useState<ClientDetails>({
    full_name: '',
    email: '',
    phone: '',
    marketing_opt_in: true,
    booking_note: '',
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(details);
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={onBack} className="mb-3 text-sm text-slate-500 hover:text-slate-700">
        &larr; Back
      </button>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Your details</h2>

      <div className="space-y-3">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            required
            value={details.full_name}
            onChange={(e) => setDetails({ ...details, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">We'll send your booking confirmation and reminders here.</p>
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={details.phone}
            onChange={(e) => setDetails({ ...details, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="note">Anything we should know? (optional)</Label>
          <Textarea
            id="note"
            rows={3}
            placeholder="Allergies, preferences, requests..."
            value={details.booking_note}
            onChange={(e) => setDetails({ ...details, booking_note: e.target.value })}
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={details.marketing_opt_in}
            onChange={(e) => setDetails({ ...details, marketing_opt_in: e.target.checked })}
          />
          Keep me posted about offers and availability
        </label>
      </div>

      <Button type="submit" className="mt-5 w-full" disabled={submitting}>
        {submitting ? 'Booking...' : 'Continue'}
      </Button>
    </form>
  );
}
