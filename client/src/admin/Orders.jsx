import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Pagination, Spinner } from '../components/Misc.jsx';
import { PageHeader, SearchInput } from './ui.jsx';
import { api, qs } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatDateTime, formatPrice, ORDER_STATUS } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

const PAYMENT_TYPES = { cash: 'Hotově / dobírka', card: 'Karta (Stripe)', stripe: 'Stripe (všechny metody)', bank: 'Bankovní převod' };
const LOCALES = { cs: '🇨🇿 čeština', en: '🇬🇧 angličtina' };

/** Total in the customer's currency (exchangeRate = CZK per 1 unit). */
export function foreignTotal(o, amount = o.total) {
  if (!o.currency || o.currency === 'CZK' || !(o.exchangeRate > 0)) return null;
  const v = Math.round((amount / o.exchangeRate) * 100) / 100;
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: o.currency }).format(v);
}

export function Orders() {
  const [params, setParams] = useSearchParams();
  const p = Object.fromEntries(params);
  const [q, setQ] = useState(p.q || '');
  const { data } = useFetch(`/admin/orders${qs(p)}`);
  useEffect(() => {
    const t = setTimeout(() => q !== (p.q || '') && setParams({ ...p, q, page: 1 }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div>
      <PageHeader title="Objednávky" subtitle={data ? `${data.total} objednávek` : ''} />
      <div className="a-card">
        <div className="a-toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Číslo, e-mail, příjmení…" />
          <div className="sort-tabs">
            <button className={!p.status ? 'active' : ''} onClick={() => setParams({})}>Vše</button>
            {Object.entries(ORDER_STATUS).map(([k, v]) => (
              <button key={k} className={p.status === k ? 'active' : ''} onClick={() => setParams({ status: k })}>{v.label}</button>
            ))}
          </div>
        </div>
        {!data ? <Spinner /> : (
          <div className="a-table-wrap">
            <table className="table a-table">
              <thead><tr><th>Číslo</th><th>Zákazník</th><th>Datum</th><th>Položky</th><th>Doprava / platba</th><th>Stav</th><th className="right">Celkem</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/admin/objednavky/${o.id}`}><strong>{o.number}</strong></Link>
                      {o.locale === 'en' && <span className="status status-muted cur-badge" title="Objednávka z anglické verze">EN</span>}
                    </td>
                    <td>{o.firstName} {o.lastName}<small className="muted block">{o.email}{!o.userId && ' · host'}</small></td>
                    <td className="nowrap">{formatDateTime(o.createdAt)}</td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)} ks</td>
                    <td className="muted small">{o.shippingMethod}<br />{o.paymentMethod}</td>
                    <td><span className={`status status-${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span></td>
                    <td className="right nowrap">
                      <strong>{formatPrice(o.total)}</strong>
                      {o.currency && o.currency !== 'CZK' && <span className="status status-info cur-badge" title={`Zákazník platil v ${o.currency}: ${foreignTotal(o) || ''}`}>{o.currency}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ ...p, page: n })} />}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { data, setData } = useFetch(`/admin/orders/${id}`);
  const toast = useToast();
  if (!data) return <Spinner />;
  const o = data.order;
  const setStatus = async (status) => {
    if (status === 'CANCELLED' && !confirm('Zrušit objednávku? Zboží se vrátí na sklad.')) return;
    try {
      const d = await api.patch(`/admin/orders/${o.id}`, { status });
      setData({ order: { ...o, ...d.order, user: o.user } });
      toast.success(`Stav změněn na „${ORDER_STATUS[status].label}“.`);
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div>
      <PageHeader title={`Objednávka ${o.number}`} subtitle={formatDateTime(o.createdAt)}>
        <Link to="/admin/objednavky" className="btn btn-ghost">Zpět</Link>
      </PageHeader>
      <div className="a-card pad">
        <h3>Stav objednávky</h3>
        <div className="status-steps">
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <button key={k} className={`btn btn-sm ${o.status === k ? 'btn-primary' : 'btn-ghost'} ${k === 'CANCELLED' ? 'danger' : ''}`} onClick={() => o.status !== k && setStatus(k)}>{v.label}</button>
          ))}
        </div>
        <p className="muted small">Recenze mohou zákazníci psát až u objednávek ve stavu Zaplaceno, Odesláno nebo Doručeno.</p>
      </div>
      <div className="a-grid-2">
        <div className="a-card pad">
          <h3>Zákazník</h3>
          <p><strong>{o.firstName} {o.lastName}</strong><br />{o.email}<br />{o.phone}</p>
          <p>{o.street}<br />{o.zip} {o.city}<br />{o.country}</p>
          {o.user ? <p className="muted small">Registrovaný zákazník #{o.user.id}</p> : <p className="muted small">Nákup bez registrace</p>}
          {o.note && <p className="notice">📝 {o.note}</p>}
        </div>
        <div className="a-card pad">
          <h3>Doprava a platba</h3>
          <p>{o.shippingMethod}<br />{o.paymentMethod}</p>
          <dl className="kv">
            {o.pickupPoint && <><dt>Výdejní místo</dt><dd>📍 {o.pickupPoint}</dd></>}
            <dt>Typ platby</dt><dd>{PAYMENT_TYPES[o.paymentType] || o.paymentType || '–'}</dd>
            <dt>Zaplaceno</dt><dd>{o.paidAt ? formatDateTime(o.paidAt) : <span className="muted">nezaplaceno</span>}</dd>
            <dt>Jazyk</dt><dd>{LOCALES[o.locale] || o.locale || '–'}</dd>
            <dt>Měna</dt>
            <dd>
              {o.currency || 'CZK'}
              {o.currency && o.currency !== 'CZK' && <small className="muted"> · kurz {Number(o.exchangeRate).toLocaleString('cs-CZ', { maximumFractionDigits: 4 })} Kč za 1 {o.currency}</small>}
            </dd>
          </dl>
          {o.couponCode && <p>Slevový kód: <strong>{o.couponCode}</strong></p>}
        </div>
      </div>
      <div className="a-card pad">
        <h3>Položky</h3>
        <table className="table">
          <thead><tr><th>Produkt</th><th className="right">Cena</th><th className="right">Množství</th><th className="right">Celkem</th></tr></thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id}>
                <td>{i.productId ? <Link to={`/admin/produkty/${i.productId}`}>{i.name}</Link> : i.name}</td>
                <td className="right">{formatPrice(i.price)}</td>
                <td className="right">{i.quantity}</td>
                <td className="right">{formatPrice(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}>Mezisoučet</td><td className="right">{formatPrice(o.subtotal)}</td></tr>
            {o.discount > 0 && <tr><td colSpan={3}>Sleva</td><td className="right">−{formatPrice(o.discount)}</td></tr>}
            <tr><td colSpan={3}>Doprava</td><td className="right">{formatPrice(o.shippingPrice)}</td></tr>
            {o.paymentPrice > 0 && <tr><td colSpan={3}>Platba</td><td className="right">{formatPrice(o.paymentPrice)}</td></tr>}
            <tr className="total"><td colSpan={3}>Celkem</td><td className="right">{formatPrice(o.total)}</td></tr>
            {foreignTotal(o) && <tr><td colSpan={3}>Celkem v měně zákazníka ({o.currency})</td><td className="right"><strong>{foreignTotal(o)}</strong></td></tr>}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
