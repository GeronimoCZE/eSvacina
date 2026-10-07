import { useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ErrorBox, Spinner } from '../components/Misc.jsx';
import { useFetch } from '../lib/useFetch.js';
import { api } from '../lib/api.js';
import { tx } from '../lib/i18n.js';
import { formatDateTime, ORDER_STATUS } from '../lib/format.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import './checkout.css';

const isOnline = (order) => ['card', 'stripe'].includes(order.paymentType);

export function OrderSummary({ order }) {
  const { orderMoney } = useLocale();
  const money = orderMoney(order);
  const address = order.pickupPoint
    ? `${tx('Výdejní místo', 'Pickup point')}: ${order.pickupPoint}`
    : `${order.firstName} ${order.lastName}, ${order.street}, ${order.zip} ${order.city}`;
  return (
    <div className="order-summary">
      <div className="order-meta">
        <div><small>{tx('Stav', 'Status')}</small><span className={`status status-${ORDER_STATUS[order.status].tone}`}>{ORDER_STATUS[order.status].label}</span></div>
        <div><small>{tx('Doprava', 'Delivery')}</small><span>{order.shippingMethod}</span></div>
        <div><small>{tx('Platba', 'Payment')}</small><span>{order.paymentMethod}{order.paidAt ? ` · ${tx('zaplaceno', 'paid')} ${formatDateTime(order.paidAt)}` : ''}</span></div>
        <div><small>{order.pickupPoint ? tx('Vyzvednutí', 'Collection') : tx('Adresa', 'Address')}</small><span>{address}</span></div>
      </div>
      <table className="table">
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}>
              <td>{i.product?.slug ? <Link to={`/produkt/${i.product.slug}`}>{i.name}</Link> : i.name}</td>
              <td>{i.quantity}×</td>
              <td className="right">{money(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {order.discount > 0 && <tr><td colSpan={2}>{tx('Sleva', 'Discount')} {order.couponCode}</td><td className="right">−{money(order.discount)}</td></tr>}
          <tr><td colSpan={2}>{tx('Doprava', 'Delivery')}</td><td className="right">{order.shippingPrice ? money(order.shippingPrice) : tx('Zdarma', 'Free')}</td></tr>
          {order.paymentPrice > 0 && <tr><td colSpan={2}>{tx('Platba', 'Payment')}</td><td className="right">{money(order.paymentPrice)}</td></tr>}
          <tr className="total"><td colSpan={2}>{tx('Celkem', 'Total')}</td><td className="right">{money(order.total)}</td></tr>
        </tfoot>
      </table>
      {order.currency && order.currency !== 'CZK' && (
        <p className="muted small">
          {tx('Přepočteno kurzem', 'Converted at')} 1 {order.currency} = {Number(order.exchangeRate).toFixed(3)} CZK · {tx('celkem', 'total')}{' '}
          {Number(order.total).toLocaleString('cs-CZ')} Kč
        </p>
      )}
    </div>
  );
}

export default function OrderDone() {
  const { number } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const { settings } = useSettings();
  const toast = useToast();
  const email = params.get('email') || '';
  const returningFromStripe = params.has('session_id');
  const cancelled = params.get('cancelled') === '1';
  // Coming back from Stripe we must ask the server, which verifies the payment.
  const preset = returningFromStripe ? null : location.state?.order;
  const sessionQuery = returningFromStripe ? `&session_id=${encodeURIComponent(params.get('session_id'))}` : '';
  const { data, error } = useFetch(preset ? null : `/orders/${number}?email=${encodeURIComponent(email)}${sessionQuery}`);
  const [paying, setPaying] = useState(false);
  const [updated, setUpdated] = useState(null);
  const order = updated || preset || data?.order;
  const { orderMoney } = useLocale();

  if (error) return <ErrorBox error={error} />;
  if (!order) return <Spinner />;
  const money = orderMoney(order);
  const bank = order.paymentType === 'bank' || /převod|transfer/i.test(order.paymentMethod);
  const unpaidOnline = isOnline(order) && order.status === 'PENDING';
  const bankAccount = location.state?.bankAccount || data?.bankAccount || settings.payments.bankAccount;
  const iban = location.state?.iban || settings.payments.iban;
  const demo = location.state?.paymentDemo;

  const pay = async () => {
    setPaying(true);
    try {
      const d = await api.post(`/orders/${order.number}/pay`, { email: order.email });
      if (d.redirectUrl) return window.location.assign(d.redirectUrl);
      setUpdated(d.order);
      toast.success(tx('Platba proběhla.', 'Payment complete.'));
    } catch (e) {
      toast.error(e.message);
    }
    setPaying(false);
  };

  return (
    <div className="container page narrow">
      <div className="done-hero">
        <div className="done-check">{order.status === 'CANCELLED' ? '✕' : '✓'}</div>
        <h1>
          {order.status === 'CANCELLED'
            ? tx('Objednávka byla zrušena', 'This order was cancelled')
            : order.status === 'PAID' && isOnline(order)
              ? tx('Zaplaceno, děkujeme!', 'Paid, thank you!')
              : tx('Děkujeme za objednávku!', 'Thank you for your order!')}
        </h1>
        <p>
          {tx('Objednávka', 'Order')} <strong>{order.number}</strong> {tx('byla přijata. Potvrzení jsme poslali na', 'has been received. We sent a confirmation to')}{' '}
          <strong>{order.email}</strong>.
        </p>
      </div>

      {unpaidOnline && (
        <div className="card pay-box warn">
          <strong>{cancelled ? tx('Platba nebyla dokončena.', "The payment wasn't completed.") : tx('Objednávka čeká na platbu.', 'This order is awaiting payment.')}</strong>
          <span className="muted">
            {tx('Zboží máme rezervované. Platbu můžete zopakovat:', "We've reserved your items. You can try the payment again:")} {money(order.total)}
          </span>
          <button className="btn btn-primary" onClick={pay} disabled={paying}>
            {paying ? tx('Přesměrovávám…', 'Redirecting…') : tx('Zaplatit online', 'Pay online')}
          </button>
        </div>
      )}
      {demo && order.status === 'PAID' && (
        <p className="notice">
          {tx('Platební brána běží v ukázkovém režimu (bez klíčů Stripe), objednávka byla označena jako zaplacená.', 'The payment gateway is in demo mode (no Stripe keys), so the order was marked as paid.')}
        </p>
      )}
      {bank && order.status === 'PENDING' && (
        <div className="card pay-box">
          <strong>{tx('Platební údaje', 'Payment details')}</strong>
          <dl className="bank-grid">
            <dt>{tx('Číslo účtu', 'Account number')}</dt><dd>{bankAccount}</dd>
            {iban && <><dt>IBAN</dt><dd>{iban}</dd></>}
            <dt>{tx('Variabilní symbol', 'Payment reference')}</dt><dd>{order.number.replace(/\D/g, '')}</dd>
            <dt>{tx('Částka', 'Amount')}</dt><dd>{Number(order.total).toLocaleString('cs-CZ')} Kč</dd>
          </dl>
        </div>
      )}
      {order.paymentType === 'cash' && order.status === 'PENDING' && (
        <p className="notice">
          {tx('Platíte při převzetí:', 'You pay on collection:')} <strong>{Number(order.total).toLocaleString('cs-CZ')} Kč</strong>
        </p>
      )}

      <div className="card"><OrderSummary order={order} /></div>
      <div className="row gap center">
        <Link to="/obchod" className="btn btn-primary">{tx('Pokračovat v nákupu', 'Continue shopping')}</Link>
        <Link to="/ucet/objednavky" className="btn btn-ghost">{tx('Moje objednávky', 'My orders')}</Link>
      </div>
    </div>
  );
}
