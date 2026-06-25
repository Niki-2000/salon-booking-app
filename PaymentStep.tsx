import { useState, type FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button, Card } from '../ui';
import { formatMoney } from '../../lib/format';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
  : null;

export default function PaymentStep({
  clientSecret,
  amountDue,
  currency,
  onPaid,
}: {
  clientSecret: string;
  amountDue: number;
  currency: string;
  onPaid: () => void;
}) {
  if (!stripePromise) {
    return (
      <Card className="p-4 text-sm text-amber-700">
        Stripe isn't configured yet (missing VITE_STRIPE_PUBLISHABLE_KEY). Add your publishable key to .env to take
        online payments.
      </Card>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Pay {formatMoney(amountDue, currency)} to confirm</h2>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm onPaid={onPaid} />
      </Elements>
    </div>
  );
}

function CheckoutForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    onPaid();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-4">
        <PaymentElement />
      </Card>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <Button type="submit" className="mt-4 w-full" disabled={!stripe || submitting}>
        {submitting ? 'Processing...' : 'Pay now'}
      </Button>
    </form>
  );
}
