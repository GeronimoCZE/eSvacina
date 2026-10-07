import Stripe from 'stripe';
import { config } from '../config.js';

/**
 * Stripe Checkout. Without STRIPE_SECRET_KEY the shop runs in demo mode:
 * online payments are confirmed immediately so the flow can be tried end to end.
 */
let client = null;
export const stripeEnabled = () => Boolean(config.stripeSecretKey);
export function stripe() {
  if (!stripeEnabled()) return null;
  client ||= new Stripe(config.stripeSecretKey);
  return client;
}

// Currencies whose smallest unit is the whole unit are not used here; CZK, EUR and USD all use cents.
const toMinor = (amount) => Math.round(amount * 100);

/** Create a hosted Checkout session for an order. Returns { id, url }. */
export async function createCheckoutSession(order, { amount, currency, methodType, lang }) {
  const s = stripe();
  const base = `${config.publicUrl}${lang === 'en' ? '/en' : ''}/objednavka/${order.number}?email=${encodeURIComponent(order.email)}`;
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    customer_email: order.email,
    client_reference_id: order.number,
    locale: lang === 'en' ? 'en' : 'cs',
    // "card" restricts Checkout to cards; "stripe" lets Stripe offer every method enabled in the dashboard.
    ...(methodType === 'card' ? { payment_method_types: ['card'] } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: toMinor(amount),
          product_data: {
            name: lang === 'en' ? `eSvačina order ${order.number}` : `Objednávka eSvačina ${order.number}`,
            description: order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ').slice(0, 500),
          },
        },
      },
    ],
    metadata: { orderNumber: order.number },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour, the shortest Stripe allows is 30 min
    success_url: `${base}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}&cancelled=1`,
  });
  return { id: session.id, url: session.url };
}

export async function retrieveSession(id) {
  return stripe().checkout.sessions.retrieve(id);
}

export function constructEvent(rawBody, signature) {
  return stripe().webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
}
