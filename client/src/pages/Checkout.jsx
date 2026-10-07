import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import ProductVisual from '../components/ProductVisual.jsx';
import { api } from '../lib/api.js';
import { LANG, tx } from '../lib/i18n.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useCartQuote } from './Cart.jsx';
import './checkout.css';

/** Brand colours so carriers are recognisable at a glance. */
const CARRIERS = {
  'Zásilkovna': { color: '#ba1b02', short: 'Z' },
  'Česká pošta': { color: '#f5b400', short: 'ČP', dark: true },
  PPL: { color: '#003b89', short: 'PPL' },
  DPD: { color: '#dc0032', short: 'DPD' },
  GLS: { color: '#061ab1', short: 'GLS' },
};

const PAYMENT_ICONS = { cash: '💵', card: '💳', stripe: '⚡', bank: '🏦' };

function etaText(eta) {
  if (eta === undefined || eta === null || eta === '') return null;
  if (String(eta) === '0') return tx('Ještě dnes k vyzvednutí', 'Ready for pickup today');
  return tx(`Doručení do ${eta} prac. dnů`, `Delivery in ${eta} business day${String(eta) === '1' ? '' : 's'}`);
}

function paymentHint(type) {
  switch (type) {
    case 'card':
      return tx('Po odeslání vás přesměrujeme na zabezpečenou platební bránu Stripe.', "After placing the order you'll be redirected to Stripe's secure payment page.");
    case 'stripe':
      return tx('Zaplaťte přes Stripe kartou, Apple Pay, Google Pay nebo Link.', 'Pay with Stripe by card, Apple Pay, Google Pay or Link.');
    case 'cash':
      return tx('Zaplatíte hotově nebo kartou kurýrovi či na výdejním místě.', "Pay in cash (or by card where available) when you collect the parcel.");
    case 'bank':
      return tx('Platební údaje uvidíte po odeslání objednávky. Zboží odešleme po připsání platby.', "You'll see the payment details after placing the order. We ship once the payment arrives.");
    default:
      return null;
  }
}

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { money, currency, rate, rates } = useLocale();
  const toast = useToast();
  const navigate = useNavigate();
  useCartQuote();
  const shippingMethods = settings.shipping.methods.filter((m) => m.active);
  const paymentMethods = settings.payments.methods.filter((m) => m.active);
  const typeOf = (m) => m?.type || (m?.id === 'cod' ? 'cash' : m?.id);

  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', phone: '', street: '', city: '', zip: '',
    country: tx('Česká republika', 'Czech Republic'), note: '', pickupPoint: '',
    shippingMethod: shippingMethods[0]?.id, paymentMethod: paymentMethods[0]?.id, acceptTerms: false, saveAddress: true,
  });
  const [coupon, setCoupon] = useState({ code: '', applied: null });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: user.email, firstName: user.firstName, lastName: user.lastName,
        phone: user.phone || '', street: user.street || '', city: user.city || '', zip: user.zip || '', country: user.country || f.country,
      }));
    }
  }, [user]);

  const shipping = shippingMethods.find((m) => m.id === form.shippingMethod);
  const payment = paymentMethods.find((m) => m.id === form.paymentMethod);
  const cashAllowed = shipping?.codAllowed !== false;

  // Cash only works with carriers that collect cash on delivery.
  useEffect(() => {
    if (!cashAllowed && typeOf(payment) === 'cash') {
      const next = paymentMethods.find((m) => typeOf(m) !== 'cash');
      if (next) setForm((f) => ({ ...f, paymentMethod: next.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashAllowed]);

  if (!items.length && !busy) return <Navigate to="/kosik" replace />;
  if (!user && !settings.features.guestCheckout) return <Navigate to="/prihlaseni" state={{ from: '/pokladna' }} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const discount = coupon.applied?.discount || 0;
  const afterDiscount = subtotal - discount;
  const freeShipping = afterDiscount >= settings.shipping.freeShippingThreshold;
  const shippingPrice = freeShipping ? 0 : Number(shipping?.price || 0);
  const paymentPrice = typeOf(payment) === 'cash' && shipping?.id === 'pickup' ? 0 : Number(payment?.fee || 0);
  const total = afterDiscount + shippingPrice + paymentPrice;
  const cartPayload = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  const online = ['card', 'stripe'].includes(typeOf(payment));

  const applyCoupon = async () => {
    try {
      const d = await api.post('/coupons/validate', { code: coupon.code, items: cartPayload });
      setCoupon({ code: d.code, applied: d });
      toast.success(tx(`Slevový kód ${d.code} uplatněn.`, `Discount code ${d.code} applied.`));
    } catch (e) {
      setCoupon({ ...coupon, applied: null });
      toast.error(e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const d = await api.post('/orders', {
        ...form,
        items: cartPayload,
        couponCode: coupon.applied?.code,
        note: form.note || undefined,
        pickupPoint: shipping?.pickupPoint ? form.pickupPoint : undefined,
        currency: LANG === 'en' ? currency : undefined,
      });
      clear();
      if (d.redirectUrl) {
        window.location.assign(d.redirectUrl); // Stripe Checkout
        return;
      }
      navigate(`/objednavka/${d.order.number}?email=${encodeURIComponent(d.order.email)}`, {
        state: { order: d.order, bankAccount: d.bankAccount, iban: d.iban, fresh: true, paymentDemo: d.paymentDemo },
      });
    } catch (err) {
      const fieldErrors = Object.fromEntries((err.details || []).map((x) => [x.path, x.message]));
      setErrors(fieldErrors);
      toast.error(err.message);
      setBusy(false);
    }
  };

  const Field = ({ name, label, type = 'text', half, ...rest }) => (
    <div className={`field ${half ? 'half' : ''}`}>
      <label htmlFor={`f-${name}`}>{label}</label>
      <input id={`f-${name}`} type={type} value={form[name]} onChange={set(name)} aria-invalid={Boolean(errors[name])} {...rest} />
      {errors[name] && <small className="text-bad">{errors[name]}</small>}
    </div>
  );

  return (
    <div className="container page">
      <h1 className="page-title">{tx('Pokladna', 'Checkout')}</h1>
      {!user && (
        <p className="notice">
          {tx('Máte účet?', 'Have an account?')}{' '}
          <Link to="/prihlaseni" state={{ from: '/pokladna' }}>{tx('Přihlaste se', 'Sign in')}</Link>{' '}
          {tx('a objednávka se uloží do vaší historie. Jen přihlášení zákazníci mohou psát recenze.', 'to save the order to your history. Only signed-in customers can write reviews.')}
        </p>
      )}
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-steps">
          <section className="card step">
            <h3><span className="step-num">1</span> {tx('Kontaktní údaje', 'Contact details')}</h3>
            <div className="fields">
              {Field({ name: 'email', label: 'E-mail', type: 'email', required: true, autoComplete: 'email' })}
              {Field({ name: 'phone', label: tx('Telefon', 'Phone'), type: 'tel', required: true, autoComplete: 'tel' })}
              {Field({ name: 'firstName', label: tx('Jméno', 'First name'), required: true, half: true, autoComplete: 'given-name' })}
              {Field({ name: 'lastName', label: tx('Příjmení', 'Last name'), required: true, half: true, autoComplete: 'family-name' })}
            </div>
          </section>

          <section className="card step">
            <h3><span className="step-num">2</span> {tx('Doručovací adresa', 'Delivery address')}</h3>
            <div className="fields">
              {Field({ name: 'street', label: tx('Ulice a číslo popisné', 'Street and number'), required: true, autoComplete: 'street-address' })}
              {Field({ name: 'city', label: tx('Město', 'City'), required: true, half: true, autoComplete: 'address-level2' })}
              {Field({ name: 'zip', label: tx('PSČ', 'Postcode'), required: true, half: true, autoComplete: 'postal-code', placeholder: '110 00' })}
              {Field({ name: 'country', label: tx('Země', 'Country'), required: true })}
              <div className="field">
                <label htmlFor="f-note">{tx('Poznámka k objednávce', 'Order note')}</label>
                <textarea id="f-note" rows={2} value={form.note} onChange={set('note')} />
              </div>
              {user && (
                <label className="check">
                  <input type="checkbox" checked={form.saveAddress} onChange={set('saveAddress')} /> {tx('Uložit adresu do mého účtu', 'Save this address to my account')}
                </label>
              )}
            </div>
            {LANG === 'en' && <p className="muted small">We currently deliver within the Czech Republic.</p>}
          </section>

          <section className="card step">
            <h3><span className="step-num">3</span> {tx('Doprava', 'Delivery')}</h3>
            {freeShipping && <p className="ship-free-note">🎉 {tx('Máte dopravu zdarma!', 'You get free delivery!')}</p>}
            <div className="options">
              {shippingMethods.map((m) => {
                const carrier = CARRIERS[m.carrier];
                const active = form.shippingMethod === m.id;
                return (
                  <div key={m.id} className={`option-wrap ${active ? 'active' : ''}`}>
                    <label className={`option option-rich ${active ? 'active' : ''}`}>
                      <input type="radio" name="shipping" value={m.id} checked={active} onChange={set('shippingMethod')} />
                      <span
                        className={`carrier-badge ${carrier?.dark ? 'dark' : ''}`}
                        style={{ background: carrier?.color || 'var(--primary)' }}
                        aria-hidden="true"
                      >
                        {carrier?.short || '🏪'}
                      </span>
                      <span className="option-text">
                        <span className="option-name">{m.name}</span>
                        <span className="option-sub">
                          {[m.pickupPoint ? tx('Výdejní místo', 'Pickup point') : m.id === 'pickup' ? tx('Osobní odběr', 'In-store pickup') : tx('Na adresu', 'Home delivery'), etaText(m.eta)]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <strong className="option-price">{freeShipping || !Number(m.price) ? tx('Zdarma', 'Free') : money(m.price)}</strong>
                    </label>
                    {active && m.pickupPoint && (
                      <div className="pickup-field field">
                        <label htmlFor="f-pickupPoint">{tx('Výdejní místo', 'Pickup point')} *</label>
                        <input
                          id="f-pickupPoint"
                          value={form.pickupPoint}
                          onChange={set('pickupPoint')}
                          required
                          placeholder={tx('Např. Praha 2, Vinohradská 12 (Albert)', 'e.g. Praha 2, Vinohradská 12 (Albert)')}
                          aria-invalid={Boolean(errors.pickupPoint)}
                        />
                        <small className="muted">
                          {tx(`Zadejte adresu nebo název výdejního místa ${m.carrier || ''}. Najdete je na webu dopravce.`, `Enter the address or name of the ${m.carrier || ''} pickup point. You can find them on the carrier's website.`)}
                        </small>
                        {errors.pickupPoint && <small className="text-bad">{errors.pickupPoint}</small>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card step">
            <h3><span className="step-num">4</span> {tx('Platba', 'Payment')}</h3>
            <div className="options">
              {paymentMethods.map((m) => {
                const type = typeOf(m);
                const disabled = type === 'cash' && !cashAllowed;
                const active = form.paymentMethod === m.id;
                const fee = type === 'cash' && shipping?.id === 'pickup' ? 0 : Number(m.fee);
                return (
                  <label key={m.id} className={`option option-rich ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
                    <input type="radio" name="payment" value={m.id} checked={active} disabled={disabled} onChange={set('paymentMethod')} />
                    <span className="pay-icon" aria-hidden="true">{PAYMENT_ICONS[type] || '💰'}</span>
                    <span className="option-text">
                      <span className="option-name">{m.name}</span>
                      {disabled && <span className="option-sub">{tx('Tento dopravce neumožňuje dobírku', "This carrier doesn't accept cash on delivery")}</span>}
                      {type === 'card' && <span className="card-logos" aria-hidden="true">VISA · Mastercard · Maestro · Amex</span>}
                    </span>
                    <strong className="option-price">{fee ? money(fee) : tx('Zdarma', 'Free')}</strong>
                  </label>
                );
              })}
            </div>
            {paymentHint(typeOf(payment)) && <p className="muted small pay-hint">{paymentHint(typeOf(payment))}</p>}
          </section>
        </div>

        <aside className="card summary sticky">
          <h3>{tx('Shrnutí objednávky', 'Order summary')}</h3>
          <div className="summary-lines">
            {items.map((i) => (
              <div key={i.productId} className="summary-line">
                <ProductVisual product={i} size="xs" />
                <span>{i.quantity}× {i.name}</span>
                <strong>{money(i.price * i.quantity)}</strong>
              </div>
            ))}
          </div>
          {settings.features.coupons && (
            <div className="coupon">
              <input
                placeholder={tx('Slevový kód', 'Discount code')}
                value={coupon.code}
                onChange={(e) => setCoupon({ code: e.target.value.toUpperCase(), applied: null })}
                aria-label={tx('Slevový kód', 'Discount code')}
              />
              <button type="button" className="btn btn-ghost" onClick={applyCoupon} disabled={!coupon.code}>{tx('Uplatnit', 'Apply')}</button>
            </div>
          )}
          <div className="row-between"><span>{tx('Mezisoučet', 'Subtotal')}</span><span>{money(subtotal)}</span></div>
          {discount > 0 && <div className="row-between text-ok"><span>{tx('Sleva', 'Discount')} ({coupon.applied.code})</span><span>−{money(discount)}</span></div>}
          <div className="row-between"><span>{tx('Doprava', 'Delivery')}</span><span>{shippingPrice ? money(shippingPrice) : tx('Zdarma', 'Free')}</span></div>
          {paymentPrice > 0 && <div className="row-between"><span>{tx('Platba', 'Payment')}</span><span>{money(paymentPrice)}</span></div>}
          <div className="row-between total"><span>{tx('Celkem s DPH', 'Total incl. VAT')}</span><strong>{money(total)}</strong></div>
          {currency !== 'CZK' && (
            <p className="muted small fx-note">
              {online
                ? `You'll be charged ${money(total)}.`
                : `Cash and bank transfer payments are made in Czech koruna: CZK ${total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}.`}{' '}
              {`Rate 1 ${currency} = ${rate.toFixed(3)} CZK (Czech National Bank${rates?.date ? `, ${new Date(rates.date).toLocaleDateString('en-GB')}` : ''}).`}
            </p>
          )}
          <label className="check terms">
            <input type="checkbox" required checked={form.acceptTerms} onChange={set('acceptTerms')} />
            <span>
              {tx('Souhlasím s ', 'I agree to the ')}
              <Link to="/stranka/obchodni-podminky" target="_blank">{tx('obchodními podmínkami', 'terms and conditions')}</Link>
              {tx(' a beru na vědomí ', ' and acknowledge the ')}
              <Link to="/stranka/ochrana-osobnich-udaju" target="_blank">{tx('zpracování osobních údajů', 'privacy policy')}</Link>.
            </span>
          </label>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy
              ? tx('Odesílám…', 'Placing order…')
              : online
                ? tx('Objednat a zaplatit', 'Place order and pay')
                : tx('Objednat s povinností platby', 'Place order with obligation to pay')}
          </button>
        </aside>
      </form>
    </div>
  );
}
