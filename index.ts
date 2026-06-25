// Stripe calls this whenever a PaymentIntent we created changes state.
// Register it in the Stripe Dashboard -> Developers -> Webhooks,
// pointing at https://YOUR_PROJECT_REF.functions.supabase.co/stripe-webhook
// listening for payment_intent.succeeded and payment_intent.payment_failed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import Stripe from 'https://esm.sh/stripe@15.8.0?target=denonext';
import { sendEmail, emailShell } from '../_shared/email.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-04-10' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = intent.metadata?.appointment_id;
      const kind = intent.metadata?.payment_kind === 'full' ? 'full' : 'deposit';
      if (appointmentId) {
        const amount = intent.amount_received / 100;

        const { data: appt } = await supabase
          .from('appointments')
          .select('*, clients(full_name, email), services(name)')
          .eq('id', appointmentId)
          .single();

        if (appt) {
          await supabase
            .from('appointments')
            .update({
              payment_status: kind === 'full' ? 'paid_full' : 'deposit_paid',
              amount_paid: amount,
            })
            .eq('id', appointmentId);

          await supabase.from('payments').insert({
            appointment_id: appointmentId,
            stripe_payment_intent_id: intent.id,
            amount,
            type: kind,
            status: 'succeeded',
          });

          if (appt.clients?.email) {
            await sendEmail({
              to: appt.clients.email,
              subject: 'Payment received - thank you!',
              html: emailShell({
                businessName: 'Your Salon',
                primaryColor: '#7c3aed',
                bodyHtml: `<p>Hi ${appt.clients.full_name}, we've received your ${kind === 'full' ? 'payment' : 'deposit'} of £${amount.toFixed(2)} for your ${appt.services?.name ?? 'appointment'}. See you soon!</p>`,
              }),
            }).catch((e) => console.error('Payment receipt email failed:', e));
          }
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const appointmentId = intent.metadata?.appointment_id;
      if (appointmentId) {
        await supabase.from('payments').insert({
          appointment_id: appointmentId,
          stripe_payment_intent_id: intent.id,
          amount: (intent.amount ?? 0) / 100,
          type: intent.metadata?.payment_kind === 'full' ? 'full' : 'deposit',
          status: 'failed',
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Webhook handler error', { status: 500 });
  }
});
