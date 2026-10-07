import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { ProductGrid } from '../components/ProductCard.jsx';
import { Empty, Spinner } from '../components/Misc.jsx';
import Stars from '../components/Stars.jsx';
import { OrderSummary } from './OrderDone.jsx';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatDate, ORDER_STATUS, plural } from '../lib/format.js';
import { tx } from '../lib/i18n.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: user.firstName, lastName: user.lastName, phone: user.phone || '',
    street: user.street || '', city: user.city || '', zip: user.zip || '', country: user.country || '', newsletter: user.newsletter,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const d = await api.patch('/account/profile', form);
      setUser(d.user);
      toast.success(tx('Profil uložen.', 'Profile saved.'));
    } catch (err) {
      toast.error(err.message);
    }
  };
  const field = (k, label, half) => (
    <div className={`field ${half ? 'half' : ''}`}><label htmlFor={`p-${k}`}>{label}</label><input id={`p-${k}`} value={form[k]} onChange={set(k)} /></div>
  );
  return (
    <form className="card pad stack" onSubmit={submit}>
      <h2>{tx('Osobní údaje', 'Personal details')}</h2>
      <div className="fields">
        {field('firstName', tx('Jméno', 'First name'), true)}
        {field('lastName', tx('Příjmení', 'Last name'), true)}
        <div className="field"><label>{tx('E-mail', 'Email')}</label><input value={user.email} disabled /></div>
        {field('phone', tx('Telefon', 'Phone'))}
      </div>
      <h3>{tx('Výchozí doručovací adresa', 'Default delivery address')}</h3>
      <div className="fields">
        {field('street', tx('Ulice a č. p.', 'Street and number'))}
        {field('city', tx('Město', 'Town/City'), true)}
        {field('zip', tx('PSČ', 'Postcode'), true)}
        {field('country', tx('Země', 'Country'))}
      </div>
      <label className="check"><input type="checkbox" checked={form.newsletter} onChange={set('newsletter')} /> {tx('Odebírat newsletter', 'Subscribe to the newsletter')}</label>
      <div><button className="btn btn-primary">{tx('Uložit změny', 'Save changes')}</button></div>
    </form>
  );
}

function Orders() {
  const { data, loading } = useFetch('/account/orders');
  const { orderMoney } = useLocale();
  if (loading) return <Spinner />;
  if (!data.orders.length) return <Empty emoji="📦" title={tx('Zatím žádné objednávky', 'No orders yet')} action={<Link className="btn btn-primary" to="/obchod">{tx('Nakupovat', 'Go shopping')}</Link>} />;
  return (
    <div className="card pad">
      <h2>{tx('Moje objednávky', 'My orders')}</h2>
      <table className="table">
        <thead><tr><th>{tx('Číslo', 'Number')}</th><th>{tx('Datum', 'Date')}</th><th>{tx('Stav', 'Status')}</th><th className="right">{tx('Celkem', 'Total')}</th><th /></tr></thead>
        <tbody>
          {data.orders.map((o) => (
            <tr key={o.id}>
              <td><strong>{o.number}</strong></td>
              <td>{formatDate(o.createdAt)}</td>
              <td><span className={`status status-${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span></td>
              <td className="right">{orderMoney(o)(o.total)}</td>
              <td className="right"><Link to={`/ucet/objednavky/${o.number}`} className="btn btn-ghost btn-sm">{tx('Detail', 'Details')}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetail() {
  const { number } = useParams();
  const { data, loading } = useFetch(`/account/orders/${number}`);
  if (loading) return <Spinner />;
  return (
    <div className="card pad">
      <Link to="/ucet/objednavky" className="link-btn"><Icon name="arrowLeft" size={14} /> {tx('Zpět na objednávky', 'Back to orders')}</Link>
      <h2>{tx('Objednávka', 'Order')} {data.order.number}</h2>
      <p className="muted">{formatDate(data.order.createdAt)}</p>
      <OrderSummary order={data.order} />
      {['PAID', 'SHIPPED', 'DELIVERED'].includes(data.order.status) && (
        <p className="notice">⭐ {tx('Produkty z této objednávky už můžete ohodnotit na jejich stránce v záložce Recenze.', 'You can now review the products from this order on their pages, under the Reviews tab.')}</p>
      )}
    </div>
  );
}

function Favorites() {
  const { data, loading } = useFetch('/account/favorites');
  if (loading) return <Spinner />;
  if (!data.products.length) return <Empty emoji="❤️" title={tx('Zatím nemáte oblíbené produkty', 'No favourites yet')} action={<Link className="btn btn-primary" to="/obchod">{tx('Prohlédnout obchod', 'Browse the shop')}</Link>}>{tx('Klikněte na srdíčko u produktu a uložte si ho sem.', 'Tap the heart on a product to save it here.')}</Empty>;
  return (
    <div>
      <h2 className="mb">{tx('Oblíbené produkty', 'Favourite products')}</h2>
      <ProductGrid products={data.products} className="grid-3" />
    </div>
  );
}

function Activity() {
  const { data, loading } = useFetch('/account/activity');
  if (loading) return <Spinner />;
  return (
    <div className="stack">
      <div className="card pad">
        <h2>{tx('Moje recenze', 'My reviews')}</h2>
        {data.reviews.length === 0 && <p className="muted">{tx('Zatím jste nenapsali žádnou recenzi.', 'You have not written any reviews yet.')}</p>}
        {data.reviews.map((r) => (
          <div key={r.id} className="activity-row">
            <Stars value={r.rating} size={14} />
            <Link to={`/produkt/${r.product.slug}`}>{r.product.name}</Link>
            <p>{r.comment}</p>
            {!r.approved && <span className="status status-warn">{tx('Čeká na schválení', 'Awaiting approval')}</span>}
          </div>
        ))}
      </div>
      <div className="card pad">
        <h2>{tx('Moje dotazy', 'My questions')}</h2>
        {data.questions.length === 0 && <p className="muted">{tx('Zatím jste se na nic neptali.', 'You have not asked any questions yet.')}</p>}
        {data.questions.map((q) => (
          <div key={q.id} className="activity-row">
            <Link to={`/produkt/${q.product.slug}`}>{q.product.name}</Link>
            <p>{q.body}</p>
            <small className="muted">{q._count.answers} {plural(q._count.answers, 'odpověď', 'odpovědi', 'odpovědí', ['answer', 'answers'])} · {formatDate(q.createdAt)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Security() {
  const toast = useToast();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [del, setDel] = useState('');
  const change = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/account/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success(tx('Heslo bylo změněno.', 'Your password has been changed.'));
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (e) => {
    e.preventDefault();
    if (!confirm(tx('Opravdu chcete trvale smazat svůj účet?', 'Do you really want to delete your account permanently?'))) return;
    try {
      await api.del('/account', { password: del });
      setUser(null);
      toast.success(tx('Účet byl smazán.', 'Your account has been deleted.'));
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <div className="stack">
      <form className="card pad stack" onSubmit={change}>
        <h2>{tx('Změna hesla', 'Change password')}</h2>
        <div className="field"><label htmlFor="cp">{tx('Současné heslo', 'Current password')}</label><input id="cp" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
        <div className="field"><label htmlFor="np">{tx('Nové heslo', 'New password')}</label><input id="np" type="password" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
        <div><button className="btn btn-primary">{tx('Změnit heslo', 'Change password')}</button></div>
      </form>
      <form className="card pad stack danger-zone" onSubmit={remove}>
        <h2>{tx('Smazání účtu', 'Delete account')}</h2>
        <p className="muted">{tx('Smazáním účtu odstraníte své osobní údaje, oblíbené produkty, recenze a dotazy. Objednávky zůstanou zachovány kvůli účetnictví.', 'Deleting your account removes your personal details, favourites, reviews and questions. Orders are kept for accounting purposes.')}</p>
        <div className="field"><label htmlFor="dp">{tx('Pro potvrzení zadejte heslo', 'Enter your password to confirm')}</label><input id="dp" type="password" required value={del} onChange={(e) => setDel(e.target.value)} /></div>
        <div><button className="btn btn-danger">{tx('Trvale smazat účet', 'Delete account permanently')}</button></div>
      </form>
    </div>
  );
}

export default function Account() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/prihlaseni" state={{ from: '/ucet' }} replace />;
  const links = [
    ['', 'user', tx('Profil', 'Profile')],
    ['objednavky', 'truck', tx('Objednávky', 'Orders')],
    ['oblibene', 'heart', tx('Oblíbené', 'Favourites')],
    ['aktivita', 'chat', tx('Recenze a dotazy', 'Reviews and questions')],
    ['zabezpeceni', 'shield', tx('Zabezpečení', 'Security')],
  ];
  return (
    <div className="container page">
      <div className="account-head">
        <span className="avatar avatar-lg">{user.firstName[0]}</span>
        <div>
          <h1>{tx('Ahoj', 'Hello')}, {user.firstName}! 👋</h1>
          <p className="muted">{tx('Zákazníkem od', 'Customer since')} {formatDate(user.createdAt)}</p>
        </div>
      </div>
      <div className="account-layout">
        <nav className="account-nav">
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={`/ucet${to ? `/${to}` : ''}`} end>
              <Icon name={icon} size={18} /> {label}
            </NavLink>
          ))}
          <button onClick={logout}><Icon name="logout" size={18} /> {tx('Odhlásit se', 'Sign out')}</button>
        </nav>
        <div>
          <Routes>
            <Route index element={<Profile />} />
            <Route path="objednavky" element={<Orders />} />
            <Route path="objednavky/:number" element={<OrderDetail />} />
            <Route path="oblibene" element={<Favorites />} />
            <Route path="aktivita" element={<Activity />} />
            <Route path="zabezpeceni" element={<Security />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
