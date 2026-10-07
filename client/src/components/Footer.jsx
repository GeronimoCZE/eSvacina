import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../lib/useFetch.js';
import { formatDate } from '../lib/format.js';
import { LANG, tx } from '../lib/i18n.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { LangSwitch } from './Header.jsx';

export function NewsletterForm({ big }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/newsletter', { email });
      toast.success(tx('Děkujeme! Jste přihlášeni k odběru novinek.', 'Thank you! You are now subscribed to our newsletter.'));
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className={`newsletter-form ${big ? 'big' : ''}`} onSubmit={submit}>
      <input type="email" required placeholder={tx('váš@email.cz', 'your@email.com')} value={email} onChange={(e) => setEmail(e.target.value)} aria-label={tx('E-mail', 'Email')} />
      <button className="btn btn-accent" disabled={busy}>{tx('Odebírat', 'Subscribe')}</button>
    </form>
  );
}

export default function Footer({ categories }) {
  const { settings } = useSettings();
  const { data } = useFetch('/pages');
  const { general, social, appearance, features } = settings;
  const pages = data?.pages?.filter((p) => p.showInFooter) || [];
  const openCookies = () => window.dispatchEvent(new Event('esv:cookies'));
  const { rates } = useLocale();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="logo logo-light"><span className="logo-mark">{appearance.logoEmoji}</span>{appearance.logoText}</Link>
          <p className="footer-tag">{general.tagline}</p>
          {features.newsletter && (
            <>
              <p className="footer-small">{tx('Novinky, akce a recepty jednou týdně do e-mailu.', 'News, offers and recipes in your inbox once a week.')}</p>
              <NewsletterForm />
            </>
          )}
          <div className="socials">
            {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer">Instagram</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer">Facebook</a>}
            {social.tiktok && <a href={social.tiktok} target="_blank" rel="noreferrer">TikTok</a>}
            {social.youtube && <a href={social.youtube} target="_blank" rel="noreferrer">YouTube</a>}
          </div>
        </div>
        <div>
          <h4>{tx('Obchod', 'Shop')}</h4>
          {categories.slice(0, 7).map((c) => <Link key={c.id} to={`/obchod/${c.slug}`}>{c.name}</Link>)}
        </div>
        <div>
          <h4>{tx('Informace', 'Information')}</h4>
          {pages.map((p) => <Link key={p.slug} to={`/stranka/${p.slug}`}>{p.title}</Link>)}
          <button className="link-btn" onClick={openCookies}>{tx('Nastavení cookies', 'Cookie settings')}</button>
        </div>
        <div>
          <h4>{tx('Kontakt', 'Contact')}</h4>
          <a href={`mailto:${general.contactEmail}`}>{general.contactEmail}</a>
          <a href={`tel:${general.contactPhone.replace(/\s/g, '')}`}>{general.contactPhone}</a>
          <span>{general.address}</span>
          <span className="footer-small">{tx('IČO', 'Company ID')} {general.companyId} · {tx('DIČ', 'VAT ID')} {general.vatId}</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <div className="footer-copy">
          <span>© {new Date().getFullYear()} {general.siteName}. {tx('Všechna práva vyhrazena.', 'All rights reserved.')}</span>
          <small className="footer-credit">
            {tx('Tvorba webu:', 'Website by')}{' '}
            <a href="https://malikweb.eu" target="_blank" rel="noopener">Nikolas Malík</a>
            {' · '}
            <Link to="/stranka/o-nas">{tx('O nás', 'About us')}</Link>
          </small>
          {LANG === 'en' && (
            <small className="footer-fx">
              Prices in EUR/USD are converted from CZK using the daily Czech National Bank rate
              {rates?.date ? ` (${formatDate(rates.date)})` : ''}.
            </small>
          )}
        </div>
        <span>
          <Link to="/stranka/obchodni-podminky">{tx('Obchodní podmínky', 'Terms & conditions')}</Link> · <Link to="/stranka/cookies">Cookies</Link> ·{' '}
          <Link to="/stranka/ochrana-osobnich-udaju">{tx('Ochrana údajů', 'Privacy')}</Link>
        </span>
        <LangSwitch className="lang-switch-footer" />
      </div>
    </footer>
  );
}
