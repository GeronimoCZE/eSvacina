import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { tx } from '../lib/i18n.js';

function AuthShell({ title, subtitle, children }) {
  const { settings } = useSettings();
  return (
    <div className="auth">
      <div className="auth-art" aria-hidden="true">
        <span>{settings.appearance.logoEmoji}</span>
        <h2>{settings.general.tagline}</h2>
        <ul>
          <li>❤️ {tx('Ukládejte si oblíbené produkty', 'Save your favourite products')}</li>
          <li>⭐ {tx('Hodnoťte, co jste koupili', 'Review what you have bought')}</li>
          <li>💬 {tx('Ptejte se na produkty', 'Ask questions about products')}</li>
          <li>📦 {tx('Sledujte své objednávky', 'Track your orders')}</li>
        </ul>
      </div>
      <div className="auth-card">
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from || '/';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      toast.success(tx(`Vítejte zpět, ${u.firstName}!`, `Welcome back, ${u.firstName}!`));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={tx('Přihlášení', 'Sign in')} subtitle={tx('Rádi vás zase vidíme.', 'Good to see you again.')}>
      <form onSubmit={submit} className="stack">
        {error && <div className="alert">{error}</div>}
        <div className="field">
          <label htmlFor="le">{tx('E-mail', 'Email')}</label>
          <input id="le" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="lp">{tx('Heslo', 'Password')}</label>
          <input id="lp" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? tx('Přihlašuji…', 'Signing in…') : tx('Přihlásit se', 'Sign in')}</button>
        <p className="center muted">{tx('Nemáte účet?', 'No account yet?')} <Link to="/registrace" state={location.state}>{tx('Zaregistrujte se', 'Register')}</Link></p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', newsletter: false, acceptTerms: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  if (!settings.features.registration) {
    return <AuthShell title={tx('Registrace', 'Registration')} subtitle={tx('Registrace nových účtů je momentálně pozastavena.', 'New account registration is currently paused.')} />;
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await register(form);
      toast.success(tx(`Účet vytvořen. Vítejte, ${u.firstName}! 🎉`, `Account created. Welcome, ${u.firstName}! 🎉`));
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={tx('Vytvořit účet', 'Create an account')} subtitle={tx('Zabere to jen chvilku.', 'It only takes a moment.')}>
      <form onSubmit={submit} className="stack">
        {error && <div className="alert">{error}</div>}
        <div className="fields">
          <div className="field half"><label htmlFor="rf">{tx('Jméno', 'First name')}</label><input id="rf" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} /></div>
          <div className="field half"><label htmlFor="rl">{tx('Příjmení', 'Last name')}</label><input id="rl" required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} /></div>
        </div>
        <div className="field"><label htmlFor="re">{tx('E-mail', 'Email')}</label><input id="re" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></div>
        <div className="field">
          <label htmlFor="rp">{tx('Heslo', 'Password')}</label>
          <input id="rp" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} />
          <small className="muted">{tx('Alespoň 8 znaků, písmeno a číslice.', 'At least 8 characters, including a letter and a number.')}</small>
        </div>
        <label className="check"><input type="checkbox" checked={form.newsletter} onChange={set('newsletter')} /> {tx('Chci dostávat novinky a recepty e-mailem', 'Send me news and recipes by email')}</label>
        <label className="check">
          <input type="checkbox" required checked={form.acceptTerms} onChange={set('acceptTerms')} />
          <span>{tx('Souhlasím s', 'I agree to the')} <Link to="/stranka/obchodni-podminky" target="_blank">{tx('obchodními podmínkami', 'terms and conditions')}</Link> {tx('a', 'and the')} <Link to="/stranka/ochrana-osobnich-udaju" target="_blank">{tx('zásadami ochrany osobních údajů', 'privacy policy')}</Link>.</span>
        </label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? tx('Vytvářím účet…', 'Creating account…') : tx('Zaregistrovat se', 'Register')}</button>
        <p className="center muted">{tx('Už máte účet?', 'Already have an account?')} <Link to="/prihlaseni" state={location.state}>{tx('Přihlaste se', 'Sign in')}</Link></p>
      </form>
    </AuthShell>
  );
}
