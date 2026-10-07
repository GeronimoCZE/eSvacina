import { LANG, LOCALE, formatMoney, plural as pluralize } from './i18n.js';

/** Plain CZK price (admin and anything that must stay in koruna). Storefront prices use useLocale().money. */
export const formatPrice = (n) => formatMoney(n, 'CZK');

export const formatDate = (d) => new Date(d).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString(LOCALE, { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const en = LANG === 'en';

export const TAGS = {
  vegan: { label: 'Vegan', emoji: '🌱' },
  'bez-lepku': { label: en ? 'Gluten-free' : 'Bez lepku', emoji: '🌾' },
  bio: { label: en ? 'Organic' : 'BIO', emoji: '🍃' },
  keto: { label: 'Keto', emoji: '🥑' },
  'bez-cukru': { label: en ? 'No added sugar' : 'Bez cukru', emoji: '🚫' },
  'high-protein': { label: 'High protein', emoji: '💪' },
  'bez-laktozy': { label: en ? 'Lactose-free' : 'Bez laktózy', emoji: '🥛' },
  raw: { label: 'Raw', emoji: '🥕' },
};
export const tagLabel = (t) => TAGS[t]?.label || t;

export const ORDER_STATUS = {
  PENDING: { label: en ? 'Awaiting payment' : 'Čeká na platbu', tone: 'warn' },
  PAID: { label: en ? 'Paid' : 'Zaplaceno', tone: 'info' },
  SHIPPED: { label: en ? 'Shipped' : 'Odesláno', tone: 'info' },
  DELIVERED: { label: en ? 'Delivered' : 'Doručeno', tone: 'ok' },
  CANCELLED: { label: en ? 'Cancelled' : 'Zrušeno', tone: 'bad' },
};

export const DIFFICULTY = en
  ? { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Challenging' }
  : { EASY: 'Snadné', MEDIUM: 'Středně těžké', HARD: 'Náročné' };

/**
 * Czech plural helper kept for existing calls: plural(n, one, few, many).
 * Pass English forms as a 5th argument [one, other] to get English output in English mode.
 */
export const plural = (n, one, few, many, enForms) => (enForms ? pluralize(n, [one, few, many], enForms) : pluralize(n, [one, few, many], [one, many]));
