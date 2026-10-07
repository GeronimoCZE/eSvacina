import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { tx } from '../lib/i18n.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const InteractionsContext = createContext(null);

/** Favourites and like/dislike state for the signed-in user, shared by every product card. */
export function InteractionsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [favorites, setFavorites] = useState(new Set());
  const [reactions, setReactions] = useState({});
  const [counts, setCounts] = useState({}); // productId -> {likes, dislikes} after a local change

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setReactions({});
      return;
    }
    api.get('/account/interactions').then((d) => {
      setFavorites(new Set(d.favorites));
      setReactions(d.reactions);
    }).catch(() => {});
  }, [user]);

  const needLogin = (what) => {
    toast.info(what);
    navigate('/prihlaseni', { state: { from: location.pathname } });
  };

  const toggleFavorite = async (product) => {
    if (!user) return needLogin(tx('Pro ukládání oblíbených se prosím přihlaste.', 'Please sign in to save favourites.'));
    const isFav = favorites.has(product.id);
    const next = new Set(favorites);
    isFav ? next.delete(product.id) : next.add(product.id);
    setFavorites(next);
    try {
      if (isFav) await api.del(`/products/${product.id}/favorite`);
      else {
        await api.post(`/products/${product.id}/favorite`);
        toast.success(tx('Přidáno do oblíbených ❤️', 'Added to favourites ❤️'));
      }
    } catch (e) {
      setFavorites(favorites);
      toast.error(e.message);
    }
  };

  const react = async (product, type) => {
    if (!user) return needLogin(tx('Pro hodnocení se prosím přihlaste.', 'Please sign in to rate products.'));
    const current = reactions[product.id] || null;
    const nextType = current === type ? null : type;
    setReactions((r) => ({ ...r, [product.id]: nextType }));
    try {
      const d = await api.post(`/products/${product.id}/reaction`, { type: nextType });
      setCounts((c) => ({ ...c, [product.id]: { likes: d.likes, dislikes: d.dislikes } }));
    } catch (e) {
      setReactions((r) => ({ ...r, [product.id]: current }));
      toast.error(e.message);
    }
  };

  const countsFor = (product) => counts[product.id] || { likes: product.likes || 0, dislikes: product.dislikes || 0 };

  return (
    <InteractionsContext.Provider value={{ favorites, reactions, toggleFavorite, react, countsFor }}>
      {children}
    </InteractionsContext.Provider>
  );
}

export const useInteractions = () => useContext(InteractionsContext);
