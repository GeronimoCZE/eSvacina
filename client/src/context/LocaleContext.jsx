import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { LANG, formatMoney } from '../lib/i18n.js';
import { useSettings } from './SettingsContext.jsx';
import { Spinner } from '../components/Misc.jsx';

const LocaleContext = createContext(null);
const KEY = 'esv_currency';

/**
 * Display currency and exchange rates. Czech visitors see CZK; English visitors
 * pick EUR or USD and prices are converted with the current ČNB rate. All
 * amounts in the app stay in CZK and are converted only when shown.
 */
export function LocaleProvider({ children }) {
  const { settings } = useSettings();
  const loc = settings.localization || {};
  const allowed = loc.currencies?.length ? loc.currencies : ['EUR', 'USD'];
  const [rates, setRates] = useState(null);
  const [ratesFailed, setRatesFailed] = useState(false);
  const [currency, setCurrencyState] = useState(() => {
    if (LANG !== 'en') return 'CZK';
    let stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      /* private mode */
    }
    return allowed.includes(stored) ? stored : allowed.includes(loc.defaultCurrencyEn) ? loc.defaultCurrencyEn : allowed[0];
  });

  useEffect(() => {
    if (LANG !== 'en') return;
    const load = () => api.get('/rates').then(setRates).catch(() => setRatesFailed(true));
    load();
    const timer = setInterval(load, 30 * 60 * 1000); // stay current on long sessions
    return () => clearInterval(timer);
  }, []);

  const setCurrency = useCallback((c) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  // Without rates we can only show koruna.
  const active = LANG === 'en' && rates?.rates?.[currency] ? currency : 'CZK';
  const rate = active === 'CZK' ? 1 : rates.rates[active];

  const value = useMemo(
    () => ({
      lang: LANG,
      currency: active,
      currencies: allowed,
      setCurrency,
      rates,
      rate,
      /** Format a CZK amount in the visitor's currency. */
      money: (czk) => formatMoney(czk, active, rate),
      /** Formatter bound to an order's own currency and locked-in rate. */
      orderMoney: (order) => (czk) => formatMoney(czk, order?.currency || 'CZK', Number(order?.exchangeRate) || 1),
    }),
    [active, rate, rates, allowed, setCurrency]
  );

  if (LANG === 'en' && !rates && !ratesFailed) return <div className="boot"><Spinner /></div>;
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
