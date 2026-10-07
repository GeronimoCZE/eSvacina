import { assetUrl } from '../lib/api.js';

/** Product photo, or a soft gradient tile with the product emoji when no photo is uploaded. */
export default function ProductVisual({ product, color, size = 'md', className = '' }) {
  const img = product?.images?.[0];
  const tint = color || product?.category?.color || '#16a34a';
  if (img) {
    return (
      <div className={`visual visual-${size} ${className}`}>
        <img src={assetUrl(img)} alt={product.name} loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className={`visual visual-${size} visual-emoji ${className}`}
      style={{ '--tint': tint }}
      role="img"
      aria-label={product?.name || product?.title}
    >
      <span>{product?.emoji || '🥗'}</span>
    </div>
  );
}
