import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Spinner } from '../components/Misc.jsx';
import { F, PageHeader, Toggle } from './ui.jsx';
import { api } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const GROUPS = {
  general: ['Obecné', 'Název obchodu, kontakty a oznámení'],
  appearance: ['Vzhled', 'Barvy, písmo, logo a animace'],
  homepage: ['Úvodní stránka', 'Které sekce se zobrazují na úvodu'],
  shop: ['Obchod', 'Stránkování, sklad a DPH'],
  shipping: ['Doprava', 'Způsoby dopravy a doprava zdarma'],
  payments: ['Platby', 'Platební metody, bankovní účet a Stripe'],
  localization: ['Jazyky a měny', 'Anglická verze webu, cizí měny a kurzy'],
  english: ['Anglické texty', 'Slogan, oznámení, SEO, cookies a údržba v angličtině'],
  features: ['Funkce', 'Zapnutí a vypnutí funkcí webu'],
  seo: ['SEO', 'Meta titulek a popis'],
  social: ['Sociální sítě', 'Odkazy v patičce'],
  cookies: ['Cookies lišta', 'Texty a kategorie souhlasu'],
  maintenance: ['Údržba', 'Dočasné vypnutí obchodu pro zákazníky'],
};

const LABELS = {
  siteName: ['Název obchodu'], tagline: ['Slogan'], contactEmail: ['Kontaktní e-mail'], contactPhone: ['Telefon'], address: ['Adresa'],
  companyId: ['IČO'], vatId: ['DIČ'], currency: ['Měna'], locale: ['Jazyk / locale'], announcement: ['Text oznámení v horní liště'],
  showAnnouncement: ['Zobrazit oznámení'],
  primaryColor: ['Hlavní barva'], accentColor: ['Doplňková barva'], darkColor: ['Tmavá barva'], backgroundColor: ['Barva pozadí'],
  radius: ['Zaoblení rohů (px)'], fontFamily: ['Písmo', 'Inter, Poppins, Nunito nebo DM Sans'], logoText: ['Text loga'], logoEmoji: ['Emoji loga'],
  animations: ['Animace', 'Jemné animace při posouvání a přechodech'],
  showHero: ['Hlavní slider'], showCategories: ['Dlaždice kategorií'], showNew: ['Novinky'], showTrending: ['Právě frčí (trendy)'],
  showSale: ['Akční nabídka'], showRecipes: ['Recepty'], showBlog: ['Blog'], showNewsletter: ['Newsletter'], showBenefits: ['Výhody nákupu'],
  newDays: ['Novinka po dobu (dní)', 'Jak dlouho se produkt považuje za novinku'], productsPerSection: ['Produktů v sekci'],
  productsPerPage: ['Produktů na stránku'], lowStockThreshold: ['Upozornit na nízký sklad od (ks)'], allowBackorder: ['Povolit objednávky bez skladu'],
  taxRate: ['Sazba DPH (%)'], pricesIncludeTax: ['Ceny jsou včetně DPH'],
  freeShippingThreshold: ['Doprava zdarma od (Kč)'], bankAccount: ['Číslo bankovního účtu'],
  reviews: ['Recenze', 'Jen od zákazníků, kteří produkt koupili'], reviewsRequireApproval: ['Recenze schvaluje admin'],
  questions: ['Dotazy k produktům'], questionsRequireApproval: ['Dotazy schvaluje admin'], reactions: ['Palec nahoru / dolů'],
  favorites: ['Oblíbené produkty'], recipes: ['Recepty'], blog: ['Blog'], newsletter: ['Newsletter'], coupons: ['Slevové kódy'],
  registration: ['Registrace nových účtů'], guestCheckout: ['Nákup bez registrace'],
  metaTitle: ['Meta titulek'], metaDescription: ['Meta popis'], keywords: ['Klíčová slova'],
  instagram: ['Instagram'], facebook: ['Facebook'], tiktok: ['TikTok'], youtube: ['YouTube'],
  enabled: ['Zapnuto'], title: ['Titulek'], text: ['Text'], analytics: ['Nabízet analytické cookies'], marketing: ['Nabízet marketingové cookies'],
  message: ['Zpráva pro zákazníky'],
  iban: ['IBAN', 'Zobrazí se zahraničním zákazníkům u bankovního převodu'],
  stripePublishableKey: ['Stripe publishable key', 'Veřejný klíč pk_… (nepovinné, tajný klíč patří do STRIPE_SECRET_KEY na serveru)'],
  stripeTestMode: ['Testovací režim Stripe', 'Označí platby v administraci jako testovací'],
  enableEnglish: ['Anglická verze webu', 'Zapne přepínač jazyka a adresy /en/…'],
  currencies: ['Měny pro zahraniční zákazníky', 'Ceny se přepočítávají z Kč; zákazník platí ve zvolené měně'],
  defaultCurrencyEn: ['Výchozí měna anglické verze'],
  manualRateEUR: ['Ruční kurz EUR (Kč za 1 €)', '0 = aktuální kurz ČNB'],
  manualRateUSD: ['Ruční kurz USD (Kč za 1 $)', '0 = aktuální kurz ČNB'],
  markupPercent: ['Přirážka při přepočtu (%)', 'Pokrývá poplatky za konverzi a platbu kartou'],
  cookieTitle: ['Titulek cookies lišty'], cookieText: ['Text cookies lišty'], maintenanceMessage: ['Zpráva při údržbě'],
};

const CURRENCIES = ['EUR', 'USD'];
const PAYMENT_TYPES = { cash: 'Hotově', card: 'Karta (Stripe)', stripe: 'Stripe (všechny metody)', bank: 'Bankovní převod' };

function MethodsEditor({ value, onChange, kind }) {
  const ship = kind === 'shipping';
  const priceKey = ship ? 'price' : 'fee';
  const setRow = (i, patch) => onChange(value.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const check = (m, i, k, title) => <input type="checkbox" title={title} checked={Boolean(m[k])} onChange={(e) => setRow(i, { [k]: e.target.checked })} />;
  const blank = ship
    ? { id: `doprava-${value.length + 1}`, name: 'Nová doprava', nameEn: '', carrier: '', price: 0, eta: '1–2', pickupPoint: false, codAllowed: true, active: true }
    : { id: `platba-${value.length + 1}`, type: 'bank', name: 'Nová platba', nameEn: '', fee: 0, active: true };
  return (
    <div className="methods-scroll">
      <div className="methods">
        <div className={`method-row head ${kind}`}>
          <span>ID</span><span>Název</span><span>🇬🇧 Název EN</span>
          {ship ? <><span>Dopravce</span><span>Cena</span><span>Doba (dny)</span><span title="Zákazník vybírá výdejní místo">Výdejní místo</span><span title="Lze platit na dobírku">Dobírka</span></>
            : <><span>Typ</span><span>Poplatek</span></>}
          <span>Aktivní</span><span />
        </div>
        {value.map((m, i) => (
          <div key={i} className={`method-row ${kind}`}>
            <input value={m.id} onChange={(e) => setRow(i, { id: e.target.value.replace(/[^a-z0-9-]/g, '') })} />
            <input value={m.name} onChange={(e) => setRow(i, { name: e.target.value })} />
            <input lang="en" value={m.nameEn || ''} placeholder={m.name} onChange={(e) => setRow(i, { nameEn: e.target.value })} />
            {ship ? (
              <>
                <input value={m.carrier || ''} onChange={(e) => setRow(i, { carrier: e.target.value })} />
                <input type="number" min="0" value={m.price} onChange={(e) => setRow(i, { price: Number(e.target.value) })} />
                <input value={m.eta || ''} placeholder="1–2" onChange={(e) => setRow(i, { eta: e.target.value })} />
                {check(m, i, 'pickupPoint', 'Výdejní místo')}
                {check(m, i, 'codAllowed', 'Dobírka')}
              </>
            ) : (
              <>
                <select value={m.type || 'bank'} onChange={(e) => setRow(i, { type: e.target.value })}>
                  {Object.entries(PAYMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input type="number" min="0" value={m.fee} onChange={(e) => setRow(i, { fee: Number(e.target.value) })} />
              </>
            )}
            {check(m, i, 'active', 'Aktivní')}
            <button type="button" className="icon-btn" onClick={() => onChange(value.filter((_, x) => x !== i))} aria-label="Odebrat"><Icon name="trash" size={16} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...value, blank])}>
          <Icon name="plus" size={14} /> Přidat
        </button>
      </div>
    </div>
  );
}

const SOURCE = { 'ČNB': 'Česká národní banka', ECB: 'Evropská centrální banka', manual: 'ruční kurz z nastavení', fallback: 'nouzový odhad' };

function RatesBox({ loc }) {
  const [rates, setRates] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/rates').then(setRates).catch((e) => setError(e.message));
  }, []);
  return (
    <div className="info-box">
      <h4>Aktuální kurzy</h4>
      {error && <p className="alert">Kurzy se nepodařilo načíst: {error}</p>}
      {!rates && !error && <p className="muted">Načítám…</p>}
      {rates && (
        <>
          <div className="rates-grid">
            {Object.entries(rates.rates || {}).map(([c, r]) => (
              <div key={c}>
                <small className="muted block">1 {c}{rates.overridden?.includes(c) ? ' · ruční kurz' : ''}</small>
                <strong>{Number(r).toLocaleString('cs-CZ', { maximumFractionDigits: 4 })} Kč</strong>
              </div>
            ))}
          </div>
          <p className="muted small">Platné k {rates.date ? new Date(rates.date).toLocaleDateString('cs-CZ') : '–'} · zdroj: {SOURCE[rates.source] || rates.source}</p>
          {(rates.stale || rates.source === 'fallback') && (
            <p className="alert">
              {rates.source === 'fallback'
                ? 'Živé kurzy nejsou dostupné, používá se nouzový odhad. Zkontrolujte připojení serveru nebo nastavte ruční kurz.'
                : 'Kurz je starší – nepodařilo se načíst aktuální kurz, používá se poslední uložený.'}
            </p>
          )}
          <p className="muted small">Kurzy použité v obchodě včetně uložené přirážky{Number(loc?.markupPercent) ? ` (${loc.markupPercent} %)` : ''} a ručních kurzů. Změny se projeví po uložení nastavení (prohlížeč může kurzy cachovat až 10 minut).</p>
        </>
      )}
    </div>
  );
}

function StripeBox({ integrations }) {
  if (!integrations) return null;
  const { stripe, stripeWebhook, publicUrl } = integrations;
  return (
    <div className="info-box">
      <h4>Stripe – online platby</h4>
      <p>
        Tajný klíč (STRIPE_SECRET_KEY): {stripe ? <span className="status status-ok">nastaven</span> : <span className="status status-warn">chybí</span>}
        {' '}· Webhook secret (STRIPE_WEBHOOK_SECRET): {stripeWebhook ? <span className="status status-ok">nastaven</span> : <span className="status status-warn">chybí</span>}
      </p>
      <p className="small">Webhook URL pro Stripe Dashboard: <code className="code">{`${publicUrl}/api/stripe/webhook`}</code> <small className="muted">(událost checkout.session.completed)</small></p>
      {!stripe && (
        <p className="notice small">
          Bez klíčů běží online platby v <strong>demo režimu</strong>: objednávka zaplacená kartou nebo přes Stripe se ihned označí jako zaplacená, žádné peníze se nestrhávají.
          Pro ostré platby nastavte na serveru proměnné STRIPE_SECRET_KEY a STRIPE_WEBHOOK_SECRET a restartujte API.
        </p>
      )}
      {stripe && !stripeWebhook && <p className="alert small">Bez webhook secretu se platby nepotvrdí automaticky, pokud zákazník po zaplacení zavře okno.</p>}
      <p className="muted small">Klíče se nastavují jen v proměnných prostředí serveru, jejich hodnoty se zde nikdy nezobrazují.</p>
    </div>
  );
}

function SettingField({ group, k, value, onChange }) {
  const [base, hint] = LABELS[k] || [k];
  const label = group === 'english' ? `🇬🇧 ${base}` : base;
  if (k === 'currencies') {
    return (
      <F label={label} hint={hint}>
        <div className="check-group">
          {CURRENCIES.map((c) => (
            <label key={c}>
              <input type="checkbox" checked={value.includes(c)} onChange={(e) => onChange(e.target.checked ? CURRENCIES.filter((x) => x === c || value.includes(x)) : value.filter((x) => x !== c))} /> {c}
            </label>
          ))}
        </div>
      </F>
    );
  }
  if (k === 'defaultCurrencyEn') {
    return (
      <F label={label} hint={hint} half>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {['CZK', ...CURRENCIES].map((c) => <option key={c} value={c}>{c === 'CZK' ? 'CZK (Kč)' : c}</option>)}
        </select>
      </F>
    );
  }
  if (/^manualRate/.test(k)) {
    return <F label={label} hint={hint} half><input type="number" min="0" step="0.001" value={value} onChange={(e) => onChange(Number(e.target.value))} /></F>;
  }
  if (k === 'methods') return <F label={group === 'shipping' ? 'Způsoby dopravy' : 'Platební metody'}><MethodsEditor value={value} onChange={onChange} kind={group} /></F>;
  if (typeof value === 'boolean') return <Toggle label={label} hint={hint} checked={value} onChange={onChange} />;
  if (typeof value === 'number') return <F label={label} hint={hint} half><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} /></F>;
  if (k === 'fontFamily') {
    return (
      <F label={label} half>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {['Inter', 'Poppins', 'Nunito', 'DM Sans'].map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </F>
    );
  }
  if (/Color$/.test(k)) {
    return (
      <F label={label} half>
        <div className="color-field">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
          <input value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      </F>
    );
  }
  const long = ['text', 'message', 'metaDescription', 'announcement', 'cookieText', 'maintenanceMessage'].includes(k);
  return (
    <F label={label} hint={hint} half={!long && String(value).length < 40}>
      {long ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </F>
  );
}

export default function Settings() {
  const { update } = useSettings();
  const toast = useToast();
  const [state, setState] = useState(null);
  const [group, setGroup] = useState('general');
  const [cache, setCache] = useState('');
  const [integrations, setIntegrations] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then((d) => {
      setState(d.settings);
      setCache(d.cache);
      setIntegrations(d.integrations || null);
    });
  }, []);
  if (!state) return <Spinner />;

  const setValue = (k, v) => setState({ ...state, [group]: { ...state[group], [k]: v } });
  const save = async () => {
    setBusy(true);
    try {
      const d = await api.put('/admin/settings', state);
      setState(d.settings);
      update(d.settings);
      toast.success('Nastavení uloženo a aplikováno.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    if (!confirm(`Obnovit výchozí nastavení sekce „${GROUPS[group][0]}“?`)) return;
    const d = await api.post(`/admin/settings/reset/${group}`);
    setState(d.settings);
    update(d.settings);
    toast.success('Výchozí hodnoty obnoveny.');
  };
  const clearCache = async () => {
    const d = await api.post('/admin/cache/clear');
    toast.success(`Cache vyčištěna (${d.backend}).`);
  };

  return (
    <div>
      <PageHeader title="Nastavení" subtitle={`Všechna nastavení webu. Cache: ${cache === 'redis' ? 'Redis' : 'v paměti'}`}>
        <button className="btn btn-ghost" onClick={clearCache}>Vyčistit cache</button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Ukládám…' : 'Uložit vše'}</button>
      </PageHeader>
      <div className="settings-layout">
        <nav className="settings-nav">
          {Object.entries(GROUPS).map(([k, [label]]) => (
            <button key={k} className={group === k ? 'active' : ''} onClick={() => setGroup(k)}>{label}</button>
          ))}
        </nav>
        <section className="a-card pad" key={group}>
          <div className="row-between">
            <div>
              <h2>{GROUPS[group][0]}</h2>
              <p className="muted">{GROUPS[group][1]}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Obnovit výchozí</button>
          </div>
          {group === 'english' && <p className="notice small">Texty pro anglickou verzi webu. Prázdné pole = zobrazí se česká verze. Názvy dopravy a plateb v angličtině nastavíte v sekcích Doprava a Platby.</p>}
          {group === 'localization' && !state.localization?.enableEnglish && <div className="alert">Anglická verze je vypnutá – zákazníci vidí jen český web v Kč.</div>}
          {group === 'maintenance' && state.maintenance.enabled && <div className="alert">Obchod je v režimu údržby. Zákazníci vidí jen informační stránku, administrátoři vše.</div>}
          <div className="fields settings-fields">
            {Object.entries(state[group] || {}).map(([k, v]) => (
              <SettingField key={k} group={group} k={k} value={v} onChange={(val) => setValue(k, val)} />
            ))}
          </div>
          {group === 'localization' && <RatesBox loc={state.localization} />}
          {group === 'payments' && <StripeBox integrations={integrations} />}
          {group === 'appearance' && (
            <div className="appearance-preview" style={{ '--p': state.appearance.primaryColor, '--a': state.appearance.accentColor, '--d': state.appearance.darkColor, '--bgp': state.appearance.backgroundColor, '--r': `${state.appearance.radius}px`, fontFamily: state.appearance.fontFamily }}>
              <div className="ap-logo"><span>{state.appearance.logoEmoji}</span>{state.appearance.logoText}</div>
              <div className="ap-btns"><span className="ap-btn p">Do košíku</span><span className="ap-btn a">Akce −20 %</span><span className="ap-btn d">Pokladna</span></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
