import { z } from 'zod';

/**
 * Server-side localisation. Content rows carry `translations: { en: {...} }`;
 * public responses are localised on the way out, so cached bodies stay
 * language-neutral and one cache entry serves both languages.
 */
export const LANGS = ['cs', 'en'];

export function langOf(req) {
  const raw = String(req.get('x-lang') || req.query.lang || '').toLowerCase();
  return LANGS.includes(raw) ? raw : 'cs';
}

const isPlain = (v) => v && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

/** Deep copy of `value` with translated fields merged in and `translations` removed. */
export function localize(value, lang) {
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (!isPlain(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === 'translations') continue;
    out[k] = localize(v, lang);
  }
  const tr = value.translations?.[lang];
  if (lang !== 'cs' && isPlain(tr)) {
    // Only override fields the response already has, so a select stays a select.
    for (const [k, v] of Object.entries(tr)) {
      if (k in out && (typeof v === 'string' ? v.trim() : v != null)) out[k] = v;
    }
  }
  return out;
}

/** Pick a translated field from a raw row without localising the whole object. */
export const tr = (row, field, lang) => (lang !== 'cs' && row?.translations?.[lang]?.[field]?.trim?.()) || row?.[field];

const ERRORS = {
  'Neplatný e-mail.': 'Invalid e-mail address.',
  'Košík je prázdný.': 'Your cart is empty.',
  'Vyplňte heslo.': 'Enter your password.',
  'Vyplňte jméno.': 'Enter your first name.',
  'Vyplňte příjmení.': 'Enter your last name.',
  'Vyplňte město.': 'Enter your city.',
  'Vyplňte název.': 'Enter a name.',
  'Text je příliš krátký.': 'The text is too short.',
  'Vyplňte ulici.': 'Enter your street address.',
  'Recenze musí mít alespoň 5 znaků.': 'A review must be at least 5 characters long.',
  'Heslo musí mít alespoň 8 znaků.': 'The password must be at least 8 characters long.',
  'Vyplňte telefon.': 'Enter your phone number.',
  'Heslo musí obsahovat číslici.': 'The password must contain a digit.',
  'Heslo musí obsahovat písmeno.': 'The password must contain a letter.',
  'PSČ musí mít 5 číslic.': 'The postcode must have 5 digits.',
  'Origin není povolen (CORS).': 'Origin not allowed (CORS).',
  'Nesprávné heslo.': 'Incorrect password.',
  'Některý produkt v košíku už není dostupný.': 'A product in your cart is no longer available.',
  'Platnost slevového kódu vypršela.': 'This discount code has expired.',
  'Slevový kód byl již vyčerpán.': 'This discount code has been used up.',
  'Slevový kód neexistuje.': "This discount code doesn't exist.",
  'Současné heslo není správné.': 'Your current password is incorrect.',
  'Tento produkt jste už hodnotili.': "You've already reviewed this product.",
  'Vyberte způsob dopravy.': 'Choose a delivery method.',
  'Vyberte způsob platby.': 'Choose a payment method.',
  'Vyplňte výdejní místo.': 'Enter the pickup point.',
  'Platbu hotově lze zvolit jen u dopravy s dobírkou.': 'Cash payment is only available with delivery methods that support cash on delivery.',
  'Online platba není k dispozici.': 'Online payment is not available.',
  'Objednávka je již zaplacená nebo zrušená.': 'This order is already paid or cancelled.',
  'Platbu se nepodařilo ověřit.': 'We could not verify the payment.',
  'Účet s tímto e-mailem už existuje.': 'An account with this e-mail already exists.',
  'Administrátorský účet nelze smazat z účtu zákazníka.': "An administrator account can't be deleted from the customer account page.",
  'Dotazy jsou vypnuté.': 'Questions are turned off.',
  'Hodnocení palcem je vypnuté.': 'Likes are turned off.',
  'Oblíbené jsou vypnuté.': 'Favourites are turned off.',
  'Recenze jsou vypnuté.': 'Reviews are turned off.',
  'Recenzi mohou napsat jen zákazníci, kteří produkt zakoupili.': 'Only customers who bought this product can review it.',
  'Registrace je momentálně vypnutá.': 'Registration is currently disabled.',
  'Slevové kódy nejsou aktivní.': 'Discount codes are not active.',
  'Tento účet byl zablokován.': 'This account has been blocked.',
  'Musíte souhlasit s obchodními podmínkami.': 'You must accept the terms and conditions.',
  'Dotaz nenalezen.': 'Question not found.',
  'Kategorie nenalezena.': 'Category not found.',
  'Objednávka nenalezena.': 'Order not found.',
  'Produkt nenalezen.': 'Product not found.',
  'Recept nenalezen.': 'Recipe not found.',
  'Stránka nenalezena.': 'Page not found.',
  'Článek nenalezen.': 'Article not found.',
  'Nesprávný e-mail nebo heslo.': 'Incorrect e-mail or password.',
  'Pro objednávku se prosím přihlaste.': 'Please sign in to place an order.',
  'Pro tuto akci se musíte přihlásit.': 'You need to sign in to do that.',
  'K této akci nemáte oprávnění.': "You don't have permission to do that.",
  'Nenalezeno.': 'Not found.',
  'Neplatná data.': 'Invalid data.',
  'Příliš mnoho pokusů. Zkuste to prosím za chvíli.': 'Too many attempts. Please try again in a moment.',
  'Příliš mnoho požadavků. Zkuste to prosím za chvíli.': 'Too many requests. Please try again in a moment.',
  'Na serveru došlo k chybě.': 'Something went wrong on our side.',
  'Endpoint neexistuje.': 'Endpoint not found.',
  'Záznam nenalezen.': 'Record not found.',
  'Neplatný JSON.': 'Invalid JSON.',
};

const PATTERNS = [
  [/^Kód platí od nákupu (\d+) Kč\.$/, (m) => `This code is valid for orders over ${m[1]} CZK.`],
  [/^Produktu „(.+)“ nemáme dostatek skladem\.$/, (m) => `We don't have enough of “${m[1]}” in stock.`],
];

export function translateError(msg, lang) {
  if (lang === 'cs' || typeof msg !== 'string') return msg;
  if (ERRORS[msg]) return ERRORS[msg];
  for (const [re, fn] of PATTERNS) {
    const m = msg.match(re);
    if (m) return fn(m);
  }
  return msg;
}

/**
 * Sets req.lang and localises every public JSON response. Admin responses are
 * left raw so the editors can see and edit both languages.
 */
export function i18nMiddleware(req, res, next) {
  req.lang = langOf(req);
  res.set('Content-Language', req.lang);
  if (req.path.startsWith('/api/admin')) return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    let out = localize(body, req.lang);
    if (req.lang !== 'cs' && out && typeof out.error === 'string') {
      out.error = translateError(out.error, req.lang);
      if (Array.isArray(out.details)) out.details = out.details.map((d) => ({ ...d, message: translateError(d.message, req.lang) }));
    }
    return json(out);
  };
  next();
}

/** Admin input for `translations`: { en: { field: text } }. Empty strings fall back to Czech. */
export const translationsSchema = z.object({ en: z.record(z.string().max(200000)).optional() }).optional();
