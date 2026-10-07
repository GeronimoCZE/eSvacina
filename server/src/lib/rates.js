import { prisma } from '../db.js';
import { cacheGet, cacheSet } from './cache.js';
import { getSettings } from './settings.js';

/**
 * Exchange rates expressed as CZK per 1 unit of a foreign currency.
 * Source order: Czech National Bank daily fixing (published each business day
 * at 14:30), then the ECB via Frankfurter, then the last rates we stored, then
 * a hardcoded approximation so checkout never breaks.
 */
export const SUPPORTED = ['EUR', 'USD'];
const CNB_URL =
  'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=CZK&to=EUR,USD';
const FALLBACK = { EUR: 24.3, USD: 20.8 };
const CACHE_KEY = 'rates:live';
const TTL = 60 * 60; // re-check every hour; CNB publishes once a day
const STORE_KEY = 'ratesCache';

/** Parse the CNB daily text file: "06.10.2026 #193" then "země|měna|množství|kód|kurz" rows. */
export function parseCnb(text) {
  const lines = text.trim().split(/\r?\n/);
  const [dateStr] = lines[0].split(' ');
  const [d, m, y] = dateStr.split('.').map(Number);
  const rates = {};
  for (const line of lines.slice(2)) {
    const [, , amount, code, rate] = line.split('|');
    if (!code || !rate) continue;
    rates[code] = Number(rate.replace(',', '.')) / Number(amount);
  }
  if (!SUPPORTED.every((c) => rates[c] > 0)) throw new Error('CNB file is missing EUR/USD');
  return { date: new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10), rates: pick(rates) };
}

const pick = (rates) => Object.fromEntries(SUPPORTED.map((c) => [c, Math.round(rates[c] * 10000) / 10000]));

async function fetchWithTimeout(url, ms = 5000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'eSvacina/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fromCnb() {
  const res = await fetchWithTimeout(CNB_URL);
  return { ...parseCnb(await res.text()), source: 'ČNB' };
}

async function fromFrankfurter() {
  const res = await fetchWithTimeout(FRANKFURTER_URL);
  const data = await res.json();
  // Frankfurter returns units of foreign currency per 1 CZK; invert it.
  const rates = Object.fromEntries(SUPPORTED.map((c) => [c, 1 / data.rates[c]]));
  return { date: data.date, rates: pick(rates), source: 'ECB' };
}

async function fetchLive() {
  for (const source of [fromCnb, fromFrankfurter]) {
    try {
      const result = await source();
      await prisma.setting.upsert({
        where: { key: STORE_KEY },
        update: { value: result },
        create: { key: STORE_KEY, value: result },
      });
      return { ...result, fetchedAt: new Date().toISOString() };
    } catch (err) {
      console.warn(`[rates] ${source.name} failed: ${err.message}`);
    }
  }
  const stored = await prisma.setting.findUnique({ where: { key: STORE_KEY } }).catch(() => null);
  if (stored?.value?.rates) return { ...stored.value, stale: true };
  return { date: null, rates: FALLBACK, source: 'fallback', stale: true };
}

let inflight = null;

/** Current rates with admin overrides and markup applied. */
export async function getRates() {
  let live = await cacheGet(CACHE_KEY);
  if (!live) {
    inflight ||= fetchLive().finally(() => (inflight = null));
    live = await inflight;
    // Retry sooner when we had to fall back.
    await cacheSet(CACHE_KEY, live, live.stale ? 10 * 60 : TTL);
  }
  const { localization } = await getSettings();
  const markup = 1 + (Number(localization.markupPercent) || 0) / 100;
  const rates = {};
  const overridden = [];
  for (const c of SUPPORTED) {
    const manual = Number(localization[`manualRate${c}`]) || 0;
    if (manual > 0) overridden.push(c);
    // Dividing CZK by a smaller rate yields a higher foreign price, so markup lowers the rate.
    rates[c] = Math.round(((manual > 0 ? manual : live.rates[c]) / markup) * 10000) / 10000;
  }
  return {
    base: 'CZK',
    rates,
    date: live.date,
    source: overridden.length === SUPPORTED.length ? 'manual' : live.source,
    overridden,
    stale: Boolean(live.stale),
    currencies: localization.currencies.filter((c) => SUPPORTED.includes(c)),
    defaultCurrency: localization.defaultCurrencyEn,
  };
}

/** Convert a CZK amount; foreign currencies round to cents. */
export function convert(czk, currency, rates) {
  if (currency === 'CZK') return Math.round(czk * 100) / 100;
  return Math.round((czk / rates[currency]) * 100) / 100;
}
