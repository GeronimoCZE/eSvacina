import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import { Empty, QuantityInput } from '../components/Misc.jsx';
import { FreeShippingBar } from '../components/CartDrawer.jsx';
import { api } from '../lib/api.js';
import { tx } from '../lib/i18n.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useCart } from '../context/CartContext.jsx';

/** Refresh cart prices and stock from the server once per mount. */
export function useCartQuote() {
  const { items, refresh } = useCart();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (!items.length) return setChecked(true);
    api
      .post('/cart/quote', { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) })
      .then((d) => refresh(d.lines))
      .catch(() => {})
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return checked;
}

export default function Cart() {
  const { items, setQuantity, remove, subtotal } = useCart();
  const { money } = useLocale();
  const navigate = useNavigate();
  useCartQuote();

  if (!items.length) {
    return (
      <div className="container page">
        <Empty emoji="🛒" title={tx('Váš košík je prázdný', 'Your basket is empty')} action={<Link to="/obchod" className="btn btn-primary">{tx('Začít nakupovat', 'Start shopping')}</Link>}>
          {tx('Mrkněte na novinky nebo naše nejprodávanější produkty.', 'Have a look at our new arrivals or best sellers.')}
        </Empty>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page-title">{tx('Nákupní košík', 'Shopping basket')}</h1>
      <div className="checkout-layout">
        <div className="card cart-lines">
          {items.map((i) => (
            <div key={i.productId} className="cart-line">
              <Link to={`/produkt/${i.slug}`}><ProductVisual product={i} size="sm" /></Link>
              <div className="cart-line-info">
                <Link to={`/produkt/${i.slug}`}><strong>{i.name}</strong></Link>
                <small className="muted">{i.weight} · {money(i.price)} / {tx('ks', 'pc')}</small>
                {i.stock < i.quantity && <small className="text-bad">{tx(`Skladem jen ${i.stock} ks`, `Only ${i.stock} in stock`)}</small>}
              </div>
              <QuantityInput value={i.quantity} max={i.stock || 99} onChange={(q) => setQuantity(i.productId, q)} />
              <strong className="cart-line-total">{money(i.price * i.quantity)}</strong>
              <button className="icon-btn" onClick={() => remove(i.productId)} aria-label={tx('Odebrat', 'Remove')}><Icon name="trash" size={18} /></button>
            </div>
          ))}
        </div>
        <aside className="card summary">
          <FreeShippingBar subtotal={subtotal} />
          <div className="row-between"><span>{tx('Mezisoučet', 'Subtotal')}</span><strong>{money(subtotal)}</strong></div>
          <p className="muted small">{tx('Doprava a slevový kód se počítají v pokladně.', 'Delivery and discount codes are applied at checkout.')}</p>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/pokladna')}>
            {tx('Pokračovat k pokladně', 'Continue to checkout')} <Icon name="arrowRight" size={18} />
          </button>
          <Link to="/obchod" className="btn btn-ghost btn-block">{tx('Pokračovat v nákupu', 'Continue shopping')}</Link>
        </aside>
      </div>
    </div>
  );
}
