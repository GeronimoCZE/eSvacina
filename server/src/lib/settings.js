import { prisma } from '../db.js';
import { cacheGet, cacheSet, invalidate } from './cache.js';

/**
 * Every setting the admin can change, grouped. Defaults are merged with
 * whatever is stored, so adding a new setting here makes it appear in the
 * admin panel without a migration.
 */
export const DEFAULT_SETTINGS = {
  general: {
    siteName: 'eSvačina',
    tagline: 'Zdravé svačiny, které chutnají',
    contactEmail: 'info@esvacina.cz',
    contactPhone: '+420 777 123 456',
    address: 'Zdravá 12, 110 00 Praha 1',
    companyId: '12345678',
    vatId: 'CZ12345678',
    currency: 'Kč',
    locale: 'cs-CZ',
    announcement: 'Doprava zdarma při nákupu nad 1 500 Kč 🚚',
    showAnnouncement: true,
  },
  appearance: {
    primaryColor: '#16a34a',
    accentColor: '#f97316',
    darkColor: '#0f172a',
    backgroundColor: '#fafaf7',
    radius: 16,
    fontFamily: 'Inter',
    logoText: 'eSvačina',
    logoEmoji: '🥑',
    animations: true,
  },
  homepage: {
    showHero: true,
    showCategories: true,
    showNew: true,
    showTrending: true,
    showSale: true,
    showRecipes: true,
    showBlog: true,
    showNewsletter: true,
    showBenefits: true,
    newDays: 45,
    productsPerSection: 8,
  },
  shop: {
    productsPerPage: 24,
    lowStockThreshold: 5,
    allowBackorder: false,
    taxRate: 12,
    pricesIncludeTax: true,
  },
  shipping: {
    freeShippingThreshold: 1500,
    methods: [
      { id: 'zasilkovna', name: 'Zásilkovna – výdejní místo', nameEn: 'Zásilkovna (Packeta) – pickup point', carrier: 'Zásilkovna', price: 69, eta: '1–2', pickupPoint: true, codAllowed: true, active: true },
      { id: 'balikovna', name: 'Balíkovna', nameEn: 'Balíkovna – pickup point', carrier: 'Česká pošta', price: 59, eta: '1–2', pickupPoint: true, codAllowed: true, active: true },
      { id: 'cp-napostu', name: 'Česká pošta – Balík Na poštu', nameEn: 'Czech Post – collect at post office', carrier: 'Česká pošta', price: 89, eta: '1–2', pickupPoint: true, codAllowed: true, active: true },
      { id: 'cp-doruky', name: 'Česká pošta – Balík Do ruky', nameEn: 'Czech Post – home delivery', carrier: 'Česká pošta', price: 129, eta: '1–2', pickupPoint: false, codAllowed: true, active: true },
      { id: 'ppl', name: 'PPL – doručení na adresu', nameEn: 'PPL – home delivery', carrier: 'PPL', price: 119, eta: '1', pickupPoint: false, codAllowed: true, active: true },
      { id: 'ppl-parcelshop', name: 'PPL Parcelshop', nameEn: 'PPL Parcelshop', carrier: 'PPL', price: 79, eta: '1–2', pickupPoint: true, codAllowed: true, active: true },
      { id: 'dpd', name: 'DPD – doručení na adresu', nameEn: 'DPD – home delivery', carrier: 'DPD', price: 125, eta: '1', pickupPoint: false, codAllowed: true, active: true },
      { id: 'dpd-pickup', name: 'DPD Pickup – výdejní místo', nameEn: 'DPD Pickup point', carrier: 'DPD', price: 85, eta: '1–2', pickupPoint: true, codAllowed: true, active: true },
      { id: 'gls', name: 'GLS – doručení na adresu', nameEn: 'GLS – home delivery', carrier: 'GLS', price: 115, eta: '1–2', pickupPoint: false, codAllowed: true, active: true },
      { id: 'pickup', name: 'Osobní odběr Praha', nameEn: 'Pickup in Prague', carrier: 'eSvačina', price: 0, eta: '0', pickupPoint: false, codAllowed: true, active: true },
    ],
  },
  payments: {
    // type: cash | card | stripe | bank. card and stripe go through Stripe Checkout.
    methods: [
      { id: 'card', type: 'card', name: 'Platba kartou online', nameEn: 'Credit or debit card', fee: 0, active: true },
      { id: 'stripe', type: 'stripe', name: 'Stripe (Apple Pay, Google Pay, Link)', nameEn: 'Stripe (Apple Pay, Google Pay, Link)', fee: 0, active: true },
      { id: 'cash', type: 'cash', name: 'Hotově při převzetí (dobírka)', nameEn: 'Cash on delivery', fee: 39, active: true },
      { id: 'bank', type: 'bank', name: 'Bankovní převod', nameEn: 'Bank transfer', fee: 0, active: true },
    ],
    bankAccount: '123456789/0100',
    iban: 'CZ65 0100 0000 0012 3456 7890',
    stripePublishableKey: '',
    stripeTestMode: true,
  },
  localization: {
    enableEnglish: true,
    currencies: ['EUR', 'USD'],
    defaultCurrencyEn: 'EUR',
    // Leave at 0 to use the live Czech National Bank rate; any other number is CZK per unit.
    manualRateEUR: 0,
    manualRateUSD: 0,
    // Percentage added to the converted price to cover card/conversion fees.
    markupPercent: 0,
  },
  english: {
    tagline: 'Healthy snacks that taste great',
    announcement: 'Free shipping on orders over 1,500 CZK 🚚',
    metaTitle: 'eSvačina – healthy food, snacks and ingredients',
    metaDescription: 'Protein bars, nuts, superfoods, gluten-free bakery and hundreds of healthy recipes. Free shipping over 1,500 CZK.',
    keywords: 'healthy food, snacks, protein, nuts, organic, vegan, Czech',
    cookieTitle: 'We use cookies 🍪',
    cookieText: 'They help us improve the site and show you relevant content. Necessary cookies are always on, the rest only with your consent.',
    maintenanceMessage: "We're improving our shop right now. Back soon!",
  },
  features: {
    reviews: true,
    reviewsRequireApproval: false,
    questions: true,
    questionsRequireApproval: false,
    reactions: true,
    favorites: true,
    recipes: true,
    blog: true,
    newsletter: true,
    coupons: true,
    registration: true,
    guestCheckout: true,
  },
  seo: {
    metaTitle: 'eSvačina – zdravé potraviny, svačiny a suroviny',
    metaDescription:
      'Proteinové tyčinky, ořechy, superpotraviny, bezlepkové pečivo a stovky zdravých receptů. Doprava zdarma nad 1 500 Kč.',
    keywords: 'zdravé potraviny, svačiny, protein, ořechy, bio, vegan',
  },
  social: {
    instagram: 'https://instagram.com/esvacina',
    facebook: 'https://facebook.com/esvacina',
    tiktok: '',
    youtube: '',
  },
  cookies: {
    enabled: true,
    title: 'Používáme cookies 🍪',
    text: 'Pomáhají nám vylepšovat web a nabízet vám relevantní obsah. Nezbytné cookies jsou vždy zapnuté, ostatní jen s vaším souhlasem.',
    analytics: true,
    marketing: true,
  },
  maintenance: {
    enabled: false,
    message: 'Právě vylepšujeme náš obchod. Brzy jsme zpět!',
  },
};

const CACHE_KEY = 'settings:all';

function merge(defaults, stored) {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(stored)) return defaults;
    // Lists of methods keep the admin's order and choices but gain fields added in newer versions.
    const byId = new Map(defaults.filter((d) => d && d.id).map((d) => [d.id, d]));
    return stored.map((item) => (item && item.id && byId.has(item.id) ? { ...byId.get(item.id), ...item } : item));
  }
  if (defaults && typeof defaults === 'object') {
    const out = { ...defaults };
    if (stored && typeof stored === 'object') {
      for (const k of Object.keys(stored)) {
        out[k] = k in defaults ? merge(defaults[k], stored[k]) : stored[k];
      }
    }
    return out;
  }
  return stored === undefined || stored === null ? defaults : stored;
}

export async function getSettings() {
  const hit = await cacheGet(CACHE_KEY);
  if (hit) return hit;
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const settings = {};
  for (const group of Object.keys(DEFAULT_SETTINGS)) {
    settings[group] = merge(DEFAULT_SETTINGS[group], stored[group]);
  }
  await cacheSet(CACHE_KEY, settings, 300);
  return settings;
}

export async function saveSettings(patch) {
  for (const [group, value] of Object.entries(patch)) {
    if (!(group in DEFAULT_SETTINGS) || typeof value !== 'object') continue;
    await prisma.setting.upsert({
      where: { key: group },
      update: { value },
      create: { key: group, value },
    });
  }
  // Settings influence nearly every public response (prices, toggles).
  await invalidate('');
  return getSettings();
}

/** Public settings in the visitor's language: English texts replace the Czech ones. */
export function localizeSettings(settings, lang) {
  if (lang !== 'en') return settings;
  const en = settings.english;
  const pickEn = (value, fallback) => (typeof value === 'string' && value.trim() ? value : fallback);
  const named = (m) => ({ ...m, name: pickEn(m.nameEn, m.name) });
  return {
    ...settings,
    general: {
      ...settings.general,
      tagline: pickEn(en.tagline, settings.general.tagline),
      announcement: pickEn(en.announcement, settings.general.announcement),
      locale: 'en',
    },
    seo: {
      metaTitle: pickEn(en.metaTitle, settings.seo.metaTitle),
      metaDescription: pickEn(en.metaDescription, settings.seo.metaDescription),
      keywords: pickEn(en.keywords, settings.seo.keywords),
    },
    cookies: { ...settings.cookies, title: pickEn(en.cookieTitle, settings.cookies.title), text: pickEn(en.cookieText, settings.cookies.text) },
    maintenance: { ...settings.maintenance, message: pickEn(en.maintenanceMessage, settings.maintenance.message) },
    shipping: { ...settings.shipping, methods: settings.shipping.methods.map(named) },
    payments: { ...settings.payments, methods: settings.payments.methods.map(named) },
  };
}
