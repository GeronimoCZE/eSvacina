import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import ProductVisual from './ProductVisual.jsx';
import { QuantityInput } from './Misc.jsx';
import { tx } from '../lib/i18n.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export function FreeShippingBar({ subtotal }) {
  const { settings } = useSettings();
  const limit = settings.shipping.freeShippingThreshold;
  const left = Math.max(0, limit - subtotal);
  const pct = Math.min(100, (subtotal / limit) * 100);
  const { money } = useLocale();
  return (
    <div className="ship-bar">
      <p>
        {left > 0 ? (
          <>{tx('Do dopravy zdarma vám chybí', 'You are')} <strong>{money(left)}</strong>{tx('', ' away from free delivery')}</>
        ) : (
          <>🎉 {tx('Máte', 'You have')} <strong>{tx('dopravu zdarma!', 'free delivery!')}</strong></>
        )}
      </p>
      <div className="ship-track"><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function CartDrawer() {
  const { items, open, setOpen, setQuantity, remove, subtotal, count } = useCart();
  const { money } = useLocale();
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer drawer-right ${open ? 'open' : ''}`} aria-hidden={!open} aria-label={tx('Košík', 'Basket')}>
        <div className="drawer-head">
          <h3>{tx('Košík', 'Basket')} ({count})</h3>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label={tx('Zavřít', 'Close')}><Icon name="close" /></button>
        </div>
        {items.length === 0 ? (
          <div className="drawer-body center">
            <div className="empty-emoji">🛒</div>
            <p>{tx('Košík je zatím prázdný.', 'Your basket is empty.')}</p>
            <Link to="/obchod" className="btn btn-primary" onClick={() => setOpen(false)}>{tx('Začít nakupovat', 'Start shopping')}</Link>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <FreeShippingBar subtotal={subtotal} />
              {items.map((i) => (
                <div key={i.productId} className="mini-line">
                  <Link to={`/produkt/${i.slug}`} onClick={() => setOpen(false)}>
                    <ProductVisual product={i} size="sm" />
                  </Link>
                  <div className="mini-line-info">
                    <Link to={`/produkt/${i.slug}`} onClick={() => setOpen(false)}>{i.name}</Link>
                    <small>{i.weight}</small>
                    <div className="mini-line-row">
                      <QuantityInput value={i.quantity} max={i.stock || 99} onChange={(q) => setQuantity(i.productId, q)} />
                      <strong>{money(i.price * i.quantity)}</strong>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => remove(i.productId)} aria-label={tx('Odebrat', 'Remove')}><Icon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
            <div className="drawer-foot">
              <div className="row-between"><span>{tx('Mezisoučet', 'Subtotal')}</span><strong>{money(subtotal)}</strong></div>
              <Link to="/kosik" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>{tx('Zobrazit košík', 'View basket')}</Link>
              <Link to="/pokladna" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>{tx('Přejít k pokladně', 'Go to checkout')}</Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
