/**
 * The language comes from the URL: /en/... is English, everything else Czech.
 * It is fixed for the page load (switching languages reloads the page), so it
 * can be a plain constant instead of React state.
 */
const path = typeof window === 'undefined' ? '/' : window.location.pathname;
export const LANG = path === '/en' || path.startsWith('/en/') ? 'en' : 'cs';
export const BASENAME = LANG === 'en' ? '/en' : '';
export const LOCALE = LANG === 'en' ? 'en-GB' : 'cs-CZ';

/** Pick the text for the current language: tx('Košík', 'Cart'). */
export const tx = (cs, en) => (LANG === 'en' ? en : cs);

/** URL of the current page in another language. */
export function urlInLang(target, pathname = path.slice(BASENAME.length) || '/', search = window.location.search) {
  const p = pathname || '/';
  return `${target === 'en' ? (p === '/' ? '/en' : `/en${p}`) : p}${search}`;
}

/** Plural forms: Czech has one/few/many, English one/other. */
export function plural(n, csForms, enForms) {
  if (LANG === 'en') return n === 1 ? enForms[0] : enForms[1];
  const [one, few, many] = csForms;
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
}

/** Format an amount given in CZK in a currency. `rate` is CZK per 1 unit of that currency. */
export function formatMoney(czk, currency = 'CZK', rate = 1) {
  const n = Number(czk || 0);
  if (currency === 'CZK') {
    const s = n.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return LANG === 'en' ? `CZK ${s}` : `${s} Kč`;
  }
  const value = n / (rate || 1);
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IE', { style: 'currency', currency }).format(value);
}
