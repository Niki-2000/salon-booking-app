import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../lib/supabase';
import { Card, Spinner } from '../components/ui';
import ServiceSelect from '../components/booking/ServiceSelect';
import DateTimePicker from '../components/booking/DateTimePicker';
import ClientDetailsForm, { type ClientDetails } from '../components/booking/ClientDetailsForm';
import PaymentStep from '../components/booking/PaymentStep';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import type { Service } from '../lib/types';

type Step = 'service' | 'datetime' | 'details' | 'payment' | 'confirmed';

export default function BookingPage() {
  const { business, openingHours, services, staff, loading } = useBusiness();

  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [slot, setSlot] = useState<{ start: Date; staffId: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountDue, setAmountDue] = useState(0);
  const [paid, setPaid] = useState(false);

  if (loading || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  async function handleClientSubmit(details: ClientDetails) {
    if (!service || !slot) return;
    setSubmitting(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('create-booking', {
      body: {
        service_id: service.id,
        staff_id: slot.staffId,
        start_time: slot.start.toISOString(),
        client: {
          full_name: details.full_name,
          email: details.email,
          phone: details.phone,
          marketing_opt_in: details.marketing_opt_in,
        },
        booking_note: details.booking_note,
      },
    });

    setSubmitting(false);

    if (invokeError || data?.error) {
      setError(data?.error ?? 'Something went wrong creating your booking. Please try again.');
      return;
    }

    setAmountDue(data.amount_due ?? 0);

    if (data.client_secret) {
      setClientSecret(data.client_secret);
      setStep('payment');
    } else {
      setStep('confirmed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-6 flex items-center gap-3">
          {business.logo_url && <img src={business.logo_url} alt={business.name} className="h-10 w-10 rounded-full object-cover" />}
          <h1 className="text-xl font-bold text-slate-900">{business.name}</h1>
        </div>

        <Card className="p-5">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {step === 'service' && (
            <ServiceSelect
              services={services}
              currency={business.currency}
              onSelect={(s) => {
                setService(s);
                setStep('datetime');
              }}
            />
          )}

          {step === 'datetime' && service && (
            <DateTimePicker
              service={service}
              staffList={staff}
              business={business}
              openingHours={openingHours}
              onSelect={(s) => {
                setSlot(s);
                setStep('details');
              }}
              onBack={() => setStep('service')}
            />
          )}

          {step === 'details' && (
            <ClientDetailsForm
              submitting={submitting}
              onSubmit={handleClientSubmit}
              onBack={() => setStep('datetime')}
            />
          )}

          {step === 'payment' && clientSecret && (
            <PaymentStep
              clientSecret={clientSecret}
              amountDue={amountDue}
              currency={business.currency}
              onPaid={() => {
                setPaid(true);
                setStep('confirmed');
              }}
            />
          )}

          {step === 'confirmed' && service && slot && (
            <BookingConfirmation business={business} service={service} start={slot.start} amountDue={amountDue} paid={paid} />
          )}
        </Card>
      </div>
    </div>
  );
}
