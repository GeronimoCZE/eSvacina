import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import ProductVisual from './ProductVisual.jsx';
import Stars from './Stars.jsx';
import { tagLabel } from '../lib/format.js';
import { tx } from '../lib/i18n.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useInteractions } from '../context/InteractionsContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { favorites, reactions, toggleFavorite, react, countsFor } = useInteractions();
  const { settings } = useSettings();
  const { features } = settings;
  const { money } = useLocale();
  const fav = favorites.has(product.id);
  const reaction = reactions[product.id];
  const counts = countsFor(product);
  const newSince = Date.now() - settings.homepage.newDays * 86400000;
  const isNew = product.isNew || new Date(product.createdAt).getTime() > newSince;

  return (
    <article className="card product-card">
      <Link to={`/produkt/${product.slug}`} className="product-card-media">
        <ProductVisual product={product} />
        <div className="badges">
          {product.discountPercent > 0 && <span className="badge badge-sale">−{product.discountPercent} %</span>}
          {isNew && <span className="badge badge-new">{tx('Novinka', 'New')}</span>}
          {product.stock === 0 && <span className="badge badge-muted">{tx('Vyprodáno', 'Sold out')}</span>}
        </div>
      </Link>
      {features.favorites && (
        <button
          className={`fav-btn ${fav ? 'active' : ''}`}
          onClick={() => toggleFavorite(product)}
          aria-pressed={fav}
          aria-label={fav ? tx('Odebrat z oblíbených', 'Remove from favourites') : tx('Přidat do oblíbených', 'Add to favourites')}
        >
          <Icon name="heart" size={18} fill={fav ? 'currentColor' : 'none'} />
        </button>
      )}
      <div className="product-card-body">
        <div className="product-card-meta">
          <span>{product.brand}</span>
          {product.weight && <span>{product.weight}</span>}
        </div>
        <Link to={`/produkt/${product.slug}`} className="product-card-title">
          {product.name}
        </Link>
        <div className="product-card-rating">
          {product.rating ? (
            <>
              <Stars value={product.rating} size={13} />
              <span>{product.rating.toFixed(1)} ({product.reviewCount})</span>
            </>
          ) : (
            <span className="muted">{product.tags.slice(0, 2).map(tagLabel).join(' · ')}</span>
          )}
        </div>
        <div className="product-card-foot">
          <div className="price">
            <strong>{money(product.finalPrice)}</strong>
            {product.salePrice && <s>{money(product.price)}</s>}
          </div>
          <button
            className="btn btn-primary btn-icon add-btn"
            onClick={() => add(product)}
            disabled={product.stock === 0}
            aria-label={tx(`Přidat ${product.name} do košíku`, `Add ${product.name} to basket`)}
          >
            <Icon name="cart" size={18} />
          </button>
        </div>
        {features.reactions && (
          <div className="reactions reactions-sm">
            <button className={reaction === 'LIKE' ? 'active like' : ''} onClick={() => react(product, 'LIKE')} aria-label={tx('Líbí se mi', 'I like this')} aria-pressed={reaction === 'LIKE'}>
              <Icon name="like" size={14} /> {counts.likes}
            </button>
            <button className={reaction === 'DISLIKE' ? 'active dislike' : ''} onClick={() => react(product, 'DISLIKE')} aria-label={tx('Nelíbí se mi', 'I don\'t like this')} aria-pressed={reaction === 'DISLIKE'}>
              <Icon name="dislike" size={14} /> {counts.dislikes}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, className = '' }) {
  return (
    <div className={`product-grid ${className}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card product-card skeleton">
      <div className="visual visual-md" />
      <div className="product-card-body">
        <div className="sk-line" style={{ width: '40%' }} />
        <div className="sk-line" />
        <div className="sk-line" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
