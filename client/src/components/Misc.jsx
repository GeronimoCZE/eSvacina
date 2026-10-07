import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { tx } from '../lib/i18n.js';

export function Spinner({ label = tx('Načítám…', 'Loading…') }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBox({ error, children }) {
  return (
    <div className="empty">
      <div className="empty-emoji">😕</div>
      <h3>{error?.status === 404 ? tx('Tady nic není', 'Nothing here') : tx('Něco se pokazilo', 'Something went wrong')}</h3>
      <p>{error?.message || children}</p>
      <Link to="/" className="btn btn-primary">{tx('Zpět na úvod', 'Back to home')}</Link>
    </div>
  );
}

export function Empty({ emoji = '🥕', title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-emoji">{emoji}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <nav className="pagination" aria-label={tx('Stránkování', 'Pagination')}>
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={tx('Předchozí', 'Previous')}>
        <Icon name="arrowLeft" size={16} />
      </button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="pagination-gap">…</span>
        ) : (
          <button key={n} className={`btn btn-sm ${n === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange(n)}>
            {n}
          </button>
        )
      )}
      <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={tx('Další', 'Next')}>
        <Icon name="arrowRight" size={16} />
      </button>
    </nav>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label={tx('Drobečková navigace', 'Breadcrumbs')}>
      <Link to="/">{tx('Domů', 'Home')}</Link>
      {items.map((it, i) => (
        <span key={i}>
          <Icon name="chevron" size={12} />
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label={tx('Zavřít', 'Close')}>
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function QuantityInput({ value, onChange, max = 99 }) {
  return (
    <div className="qty">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label={tx('Méně', 'Fewer')}>
        <Icon name="minus" size={14} />
      </button>
      <input
        type="number"
        min="1"
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
        aria-label={tx('Množství', 'Quantity')}
      />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={tx('Více', 'More')}>
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
