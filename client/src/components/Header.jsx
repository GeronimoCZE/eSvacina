import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { api } from '../lib/api.js';
import { plural } from '../lib/format.js';
import { LANG, tx, urlInLang } from '../lib/i18n.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useInteractions } from '../context/InteractionsContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

const CURRENCY_SYMBOL = { EUR: '€', USD: '$', CZK: 'Kč' };
const CURRENCY_HINT = "Prices are converted from CZK at today's Czech National Bank rate; you pay in this currency.";

/** CZ / EN links. Plain anchors on purpose: switching language reloads the page. */
export function LangSwitch({ className = '' }) {
  const { settings } = useSettings();
  const location = useLocation();
  if (settings.localization?.enableEnglish === false) return null;
  const opts = [
    ['cs', 'CZ', '🇨🇿', 'Čeština'],
    ['en', 'EN', '🇬🇧', 'English'],
  ];
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={tx('Jazyk', 'Language')}>
      {opts.map(([code, label, flag, name]) => (
        <a
          key={code}
          href={urlInLang(code, location.pathname, location.search)}
          hrefLang={code}
          lang={code}
          title={name}
          className={LANG === code ? 'active' : ''}
          aria-current={LANG === code ? 'true' : undefined}
        >
          <span aria-hidden="true">{flag}</span> {label}
        </a>
      ))}
    </div>
  );
}

/** EUR / USD toggle, English storefront only. */
export function CurrencySwitch({ className = '' }) {
  const { currency, currencies, setCurrency } = useLocale();
  if (LANG !== 'en' || !currencies?.length) return null;
  return (
    <div className={`cur-switch ${className}`} role="group" aria-label="Currency" title={CURRENCY_HINT}>
      {currencies.map((c) => (
        <button key={c} type="button" className={c === currency ? 'active' : ''} aria-pressed={c === currency} onClick={() => setCurrency(c)}>
          {CURRENCY_SYMBOL[c] || ''} {c}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ onDone }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const { money } = useLocale();

  useEffect(() => {
    if (q.trim().length < 2) return setRes(null);
    const t = setTimeout(() => api.get(`/products/suggest?q=${encodeURIComponent(q.trim())}`).then(setRes).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/hledat?q=${encodeURIComponent(q.trim())}`);
    setFocus(false);
    onDone?.();
  };
  const go = () => {
    setQ('');
    setFocus(false);
    onDone?.();
  };

  return (
    <form className="search" onSubmit={submit} role="search">
      <Icon name="search" size={18} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={tx('Hledat proteiny, ořechy, recepty…', 'Search proteins, nuts, recipes…')}
        aria-label={tx('Hledat', 'Search')}
        enterKeyHint="search"
      />
      {focus && res && (res.products.length > 0 || res.categories.length > 0) && (
        <div className="search-drop">
          {res.categories.map((c) => (
            <Link key={c.slug} to={`/obchod/${c.slug}`} onClick={go} className="search-row">
              <span className="search-emoji">{c.icon}</span>
              <span>{c.name}</span>
              <span className="muted">{tx('kategorie', 'category')}</span>
            </Link>
          ))}
          {res.products.map((p) => (
            <Link key={p.id} to={`/produkt/${p.slug}`} onClick={go} className="search-row">
              <span className="search-emoji">{p.emoji}</span>
              <span>{p.name}</span>
              <strong>{money(p.finalPrice)}</strong>
            </Link>
          ))}
          <button type="submit" className="search-all">{tx('Zobrazit všechny výsledky →', 'Show all results →')}</button>
        </div>
      )}
    </form>
  );
}

function MegaMenu({ categories, onClose }) {
  const [active, setActive] = useState(categories[0]?.id);
  const cat = categories.find((c) => c.id === active) || categories[0];
  if (!cat) return null;
  return (
    <div className="mega" onMouseLeave={onClose}>
      <div className="container mega-inner">
        <ul className="mega-roots">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to={`/obchod/${c.slug}`}
                onMouseEnter={() => setActive(c.id)}
                onFocus={() => setActive(c.id)}
                onClick={onClose}
                className={c.id === cat.id ? 'active' : ''}
              >
                <span>{c.icon}</span> {c.name}
                <Icon name="chevron" size={14} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mega-panel" key={cat.id}>
          <div className="mega-head">
            <h3>{cat.icon} {cat.name}</h3>
            <p>{cat.description}</p>
          </div>
          <div className="mega-subs">
            {cat.children.map((s) => (
              <Link key={s.id} to={`/obchod/${s.slug}`} onClick={onClose} className="mega-sub">
                <span className="mega-sub-icon" style={{ background: `${cat.color}1a` }}>{s.icon}</span>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.productCount} {plural(s.productCount, 'produkt', 'produkty', 'produktů', ['product', 'products'])}</small>
                </span>
              </Link>
            ))}
          </div>
          <Link to={`/obchod/${cat.slug}`} onClick={onClose} className="btn btn-ghost btn-sm">
            {tx(`Vše z kategorie ${cat.name}`, `All of ${cat.name}`)} <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Header({ categories }) {
  const { settings } = useSettings();
  const { user, isAdmin, logout } = useAuth();
  const { count, subtotal, setOpen } = useCart();
  const { favorites } = useInteractions();
  const { money } = useLocale();
  const showLocale = settings.localization?.enableEnglish !== false || LANG === 'en';
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);
  const { general, appearance, features } = settings;

  useEffect(() => {
    setMega(false);
    setMobile(false);
    setUserMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setUserMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <>
      {general.showAnnouncement && general.announcement && <div className="announce">{general.announcement}</div>}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-row">
          <button className="icon-btn mobile-only" onClick={() => setMobile(true)} aria-label="Menu">
            <Icon name="menu" />
          </button>
          <Link to="/" className="logo">
            <span className="logo-mark">{appearance.logoEmoji}</span>
            <span>{appearance.logoText}</span>
          </Link>
          <div className="desktop-only grow">
            <SearchBox />
          </div>
          <nav className="header-actions">
            {showLocale && (
              <div className="locale-tools desktop-only">
                <LangSwitch />
                <CurrencySwitch />
              </div>
            )}
            {features.favorites && (
              <Link to={user ? '/ucet/oblibene' : '/prihlaseni'} className="icon-btn desktop-only" aria-label={tx('Oblíbené', 'Favourites')}>
                <Icon name="heart" />
                {favorites.size > 0 && <span className="dot">{favorites.size}</span>}
              </Link>
            )}
            <div className="user-menu" ref={menuRef}>
              {user ? (
                <button className="icon-btn" onClick={() => setUserMenu((v) => !v)} aria-label={tx('Účet', 'Account')} aria-expanded={userMenu}>
                  <span className="avatar">{user.firstName[0]}</span>
                </button>
              ) : (
                <Link to="/prihlaseni" className="icon-btn" aria-label={tx('Přihlásit', 'Sign in')}>
                  <Icon name="user" />
                </Link>
              )}
              {userMenu && user && (
                <div className="dropdown">
                  <div className="dropdown-head">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <small>{user.email}</small>
                  </div>
                  <Link to="/ucet">{tx('Můj účet', 'My account')}</Link>
                  <Link to="/ucet/objednavky">{tx('Objednávky', 'Orders')}</Link>
                  <Link to="/ucet/oblibene">{tx('Oblíbené', 'Favourites')}</Link>
                  {isAdmin && <Link to="/admin" className="dropdown-admin"><Icon name="settings" size={16} /> {tx('Administrace', 'Administration')}</Link>}
                  <button onClick={logout}><Icon name="logout" size={16} /> {tx('Odhlásit se', 'Sign out')}</button>
                </div>
              )}
            </div>
            <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`${tx('Košík', 'Basket')}, ${count} ${plural(count, 'položka', 'položky', 'položek', ['item', 'items'])}`}>
              <Icon name="cart" />
              {count > 0 && <span className="dot dot-accent">{count}</span>}
              <span className="desktop-only">{money(subtotal)}</span>
            </button>
          </nav>
        </div>
        <div className="container header-search-mobile">
          <SearchBox />
        </div>
        <div className="container nav-row desktop-only">
          <button className={`nav-link nav-cats ${mega ? 'active' : ''}`} onMouseEnter={() => setMega(true)} onClick={() => setMega((v) => !v)}>
            <Icon name="menu" size={18} /> {tx('Kategorie', 'Categories')}
          </button>
          <NavLink to="/obchod?isNew=1" className="nav-link">{tx('Novinky', 'New in')}</NavLink>
          <NavLink to="/obchod?sort=trending" className="nav-link">{tx('Trendy', 'Trending')} 🔥</NavLink>
          <NavLink to="/obchod?sale=1" className="nav-link nav-sale">{tx('Akce', 'Offers')}</NavLink>
          {categories.slice(0, 4).map((c) => (
            <NavLink key={c.id} to={`/obchod/${c.slug}`} className="nav-link">{c.name}</NavLink>
          ))}
          {features.recipes && <NavLink to="/recepty" className="nav-link">{tx('Recepty', 'Recipes')}</NavLink>}
          {features.blog && <NavLink to="/blog" className="nav-link">Blog</NavLink>}
        </div>
        {mega && <MegaMenu categories={categories} onClose={() => setMega(false)} />}
      </header>

      <div className={`drawer-backdrop ${mobile ? 'open' : ''}`} onClick={() => setMobile(false)} />
      <aside className={`drawer drawer-left ${mobile ? 'open' : ''}`} aria-hidden={!mobile}>
        <div className="drawer-head">
          <Link to="/" className="logo"><span className="logo-mark">{appearance.logoEmoji}</span>{appearance.logoText}</Link>
          <button className="icon-btn" onClick={() => setMobile(false)} aria-label={tx('Zavřít', 'Close')}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {showLocale && (
            <div className="drawer-locale">
              <LangSwitch />
              <CurrencySwitch />
              {LANG === 'en' && <p className="drawer-locale-hint">{CURRENCY_HINT}</p>}
            </div>
          )}
          <SearchBox onDone={() => setMobile(false)} />
          <div className="mobile-links">
            <Link to="/obchod?isNew=1">✨ {tx('Novinky', 'New in')}</Link>
            <Link to="/obchod?sort=trending">🔥 {tx('Trendy', 'Trending')}</Link>
            <Link to="/obchod?sale=1">🏷️ {tx('Akce', 'Offers')}</Link>
            {features.recipes && <Link to="/recepty">🍳 {tx('Recepty', 'Recipes')}</Link>}
            {features.blog && <Link to="/blog">📰 Blog</Link>}
          </div>
          <h4>{tx('Kategorie', 'Categories')}</h4>
          {categories.map((c) => (
            <details key={c.id} className="mobile-cat">
              <summary>{c.icon} {c.name}</summary>
              <Link to={`/obchod/${c.slug}`}>{tx('Vše z kategorie', 'All in this category')}</Link>
              {c.children.map((s) => <Link key={s.id} to={`/obchod/${s.slug}`}>{s.name}</Link>)}
            </details>
          ))}
        </div>
      </aside>
    </>
  );
}
