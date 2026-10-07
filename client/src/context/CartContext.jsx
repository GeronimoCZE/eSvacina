import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './ToastContext.jsx';
import { tx } from '../lib/i18n.js';

const CartContext = createContext(null);
const KEY = 'esv_cart';

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setItems(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = (product, quantity = 1) => {
    if (product.stock === 0) return toast.error(tx('Produkt není skladem.', 'This product is out of stock.'));
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const snapshot = {
        name: product.name, slug: product.slug, emoji: product.emoji, images: product.images,
        price: product.finalPrice ?? product.price, weight: product.weight, stock: product.stock,
      };
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, ...snapshot, quantity: Math.min(99, i.quantity + quantity) } : i
        );
      }
      return [...prev, { productId: product.id, quantity, ...snapshot }];
    });
    setOpen(true);
  };

  const setQuantity = (productId, quantity) =>
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(99, quantity) } : i))
    );
  const remove = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);
  /** Merge fresh server prices/stock into the stored snapshot. */
  const refresh = (lines) =>
    setItems((prev) =>
      prev
        .map((i) => {
          const l = lines.find((x) => x.productId === i.productId);
          if (!l) return i;
          if (!l.available) return null;
          return { ...i, name: l.name, slug: l.slug, price: l.price, stock: l.stock, emoji: l.emoji, images: l.images, weight: l.weight };
        })
        .filter(Boolean)
    );

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, setQuantity, remove, clear, refresh, count, subtotal, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
