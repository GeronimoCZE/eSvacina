import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import { Spinner } from './components/Misc.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderDone from './pages/OrderDone.jsx';
import Account from './pages/Account.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { Blog, Maintenance, NotFound, Page, Post, Recipe, Recipes } from './pages/Content.jsx';
import { SettingsProvider, useSettings } from './context/SettingsContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { InteractionsProvider } from './context/InteractionsContext.jsx';
import { LocaleProvider } from './context/LocaleContext.jsx';
import { useFetch } from './lib/useFetch.js';
import { useSeo } from './lib/seo.js';
import { LANG, tx, urlInLang } from './lib/i18n.js';

const Admin = lazy(() => import('./admin/Admin.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function Storefront() {
  const { settings } = useSettings();
  const { isAdmin, ready } = useAuth();
  const { data } = useFetch('/categories');
  const location = useLocation();
  const categories = data?.categories || [];
  const authPage = ['/prihlaseni', '/registrace'].includes(location.pathname);
  useSeo();

  if (settings.maintenance.enabled && ready && !isAdmin && !authPage) {
    return <Maintenance message={settings.maintenance.message} />;
  }

  return (
    <>
      <Header categories={categories} />
      <main className="main" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/obchod" element={<Shop />} />
          <Route path="/obchod/:slug" element={<Shop />} />
          <Route path="/hledat" element={<Shop search />} />
          <Route path="/produkt/:slug" element={<Product />} />
          <Route path="/kosik" element={<Cart />} />
          <Route path="/pokladna" element={<Checkout />} />
          <Route path="/objednavka/:number" element={<OrderDone />} />
          <Route path="/prihlaseni" element={<Login />} />
          <Route path="/registrace" element={<Register />} />
          <Route path="/ucet/*" element={<Account />} />
          {settings.features.recipes && <Route path="/recepty" element={<Recipes />} />}
          {settings.features.recipes && <Route path="/recepty/:slug" element={<Recipe />} />}
          {settings.features.blog && <Route path="/blog" element={<Blog />} />}
          {settings.features.blog && <Route path="/blog/:slug" element={<Post />} />}
          <Route path="/stranka/:slug" element={<Page />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer categories={categories} />
      <CartDrawer />
      <CookieBanner />
    </>
  );
}

function Shell() {
  const { settings, error } = useSettings();
  if (error) {
    return (
      <div className="maintenance">
        <span>🔌</span>
        <h1>{tx('Server je nedostupný', 'The server is unavailable')}</h1>
        <p>{tx('Nepodařilo se načíst obchod. Zkuste to prosím za chvíli.', "We couldn't load the shop. Please try again in a moment.")}</p>
      </div>
    );
  }
  if (!settings) return <div className="boot"><Spinner /></div>;
  // English turned off in the admin: send visitors to the Czech version of the same page.
  if (LANG === 'en' && settings.localization?.enableEnglish === false) {
    window.location.replace(urlInLang('cs'));
    return null;
  }
  return (
    <LocaleProvider>
    <AuthProvider>
      <InteractionsProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<div className="boot"><Spinner /></div>}>
                  <Admin />
                </Suspense>
              }
            />
            <Route path="/*" element={<Storefront />} />
          </Routes>
        </CartProvider>
      </InteractionsProvider>
    </AuthProvider>
    </LocaleProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <Shell />
      </SettingsProvider>
    </ToastProvider>
  );
}
