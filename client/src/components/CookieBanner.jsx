import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { tx } from '../lib/i18n.js';

const KEY = 'esv_consent';

export function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const { settings } = useSettings();
  const c = settings.cookies;
  const [open, setOpen] = useState(() => !getConsent());
  const [details, setDetails] = useState(false);
  const [prefs, setPrefs] = useState(() => getConsent() || { analytics: false, marketing: false });

  useEffect(() => {
    const show = () => {
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener('esv:cookies', show);
    return () => window.removeEventListener('esv:cookies', show);
  }, []);

  if (!c.enabled || !open) return null;

  const save = (value) => {
    localStorage.setItem(KEY, JSON.stringify({ necessary: true, ...value, at: new Date().toISOString() }));
    setOpen(false);
    setDetails(false);
  };

  return (
    <div className="cookie" role="dialog" aria-label={tx('Souhlas s cookies', 'Cookie consent')}>
      <div className="cookie-text">
        <strong>{c.title}</strong>
        <p>
          {c.text} <Link to="/stranka/cookies">{tx('Více informací', 'More information')}</Link>
        </p>
        {details && (
          <div className="cookie-prefs">
            <label className="switch-row">
              <span><strong>{tx('Nezbytné', 'Necessary')}</strong><small>{tx('Přihlášení, košík, bezpečnost', 'Sign-in, basket, security')}</small></span>
              <input type="checkbox" checked disabled />
            </label>
            {c.analytics && (
              <label className="switch-row">
                <span><strong>{tx('Analytické', 'Analytics')}</strong><small>{tx('Anonymní měření návštěvnosti', 'Anonymous visitor statistics')}</small></span>
                <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })} />
              </label>
            )}
            {c.marketing && (
              <label className="switch-row">
                <span><strong>{tx('Marketingové', 'Marketing')}</strong><small>{tx('Personalizovaná reklama', 'Personalised advertising')}</small></span>
                <input type="checkbox" checked={prefs.marketing} onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })} />
              </label>
            )}
          </div>
        )}
      </div>
      <div className="cookie-actions">
        {details ? (
          <button className="btn btn-ghost" onClick={() => save(prefs)}>{tx('Uložit výběr', 'Save choices')}</button>
        ) : (
          <button className="btn btn-ghost" onClick={() => setDetails(true)}>{tx('Nastavit', 'Customise')}</button>
        )}
        <button className="btn btn-ghost" onClick={() => save({ analytics: false, marketing: false })}>{tx('Jen nezbytné', 'Necessary only')}</button>
        <button className="btn btn-primary" onClick={() => save({ analytics: true, marketing: true })}>{tx('Přijmout vše', 'Accept all')}</button>
      </div>
    </div>
  );
}
