import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Spinner } from '../components/Misc.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Dashboard from './Dashboard.jsx';
import { ProductEditor, Products } from './Products.jsx';
import Categories from './Categories.jsx';
import { OrderDetail, Orders } from './Orders.jsx';
import { Subscribers, Users } from './Users.jsx';
import { Questions, Reviews } from './Community.jsx';
import { RecipeEditor, Recipes } from './Recipes.jsx';
import { BlogEditor, BlogList } from './Blog.jsx';
import { Banners, Coupons, Pages } from './Content.jsx';
import Settings from './Settings.jsx';
import './admin.css';

const NAV = [
  ['Přehled', [['', 'eye', 'Dashboard']]],
  ['Obchod', [['objednavky', 'truck', 'Objednávky'], ['produkty', 'cart', 'Produkty'], ['kategorie', 'menu', 'Kategorie'], ['kupony', 'star', 'Slevové kódy']]],
  ['Komunita', [['uzivatele', 'user', 'Uživatelé'], ['recenze', 'star', 'Recenze'], ['dotazy', 'chat', 'Dotazy'], ['newsletter', 'external', 'Newsletter']]],
  ['Obsah', [['bannery', 'upload', 'Bannery'], ['recepty', 'leaf', 'Recepty'], ['blog', 'edit', 'Blog'], ['stranky', 'shield', 'Stránky a podmínky']]],
  ['Systém', [['nastaveni', 'settings', 'Nastavení']]],
];

export default function Admin() {
  const { user, ready, isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  if (!ready) return <div className="boot"><Spinner /></div>;
  if (!user) return <Navigate to="/prihlaseni" state={{ from: '/admin' }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin">
      <aside className="a-side">
        <Link to="/admin" className="logo logo-light">
          <span className="logo-mark">{settings.appearance.logoEmoji}</span>
          <span>Admin</span>
        </Link>
        <nav>
          {NAV.map(([group, links]) => (
            <div key={group} className="a-group">
              <small>{group}</small>
              {links.map(([to, icon, label]) => (
                <NavLink key={to} to={`/admin${to ? `/${to}` : ''}`} end={!to}>
                  <Icon name={icon} size={17} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="a-side-foot">
          <Link to="/" target="_blank"><Icon name="external" size={16} /> Zobrazit obchod</Link>
          <button onClick={logout}><Icon name="logout" size={16} /> Odhlásit</button>
        </div>
      </aside>
      <main className="a-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="produkty" element={<Products />} />
          <Route path="produkty/:id" element={<ProductEditor />} />
          <Route path="kategorie" element={<Categories />} />
          <Route path="objednavky" element={<Orders />} />
          <Route path="objednavky/:id" element={<OrderDetail />} />
          <Route path="uzivatele" element={<Users />} />
          <Route path="newsletter" element={<Subscribers />} />
          <Route path="recenze" element={<Reviews />} />
          <Route path="dotazy" element={<Questions />} />
          <Route path="recepty" element={<Recipes />} />
          <Route path="recepty/:id" element={<RecipeEditor />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:id" element={<BlogEditor />} />
          <Route path="bannery" element={<Banners />} />
          <Route path="stranky" element={<Pages />} />
          <Route path="kupony" element={<Coupons />} />
          <Route path="nastaveni" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
