import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pagination, Spinner } from '../components/Misc.jsx';
import { Confirm, PageHeader, SearchInput, Toggle } from './ui.jsx';
import { api, qs } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatDate } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Users() {
  const [params, setParams] = useSearchParams();
  const p = Object.fromEntries(params);
  const [q, setQ] = useState(p.q || '');
  const { data, setData, reload } = useFetch(`/admin/users${qs(p)}`);
  const { user: me } = useAuth();
  const toast = useToast();
  useEffect(() => {
    const t = setTimeout(() => q !== (p.q || '') && setParams({ ...p, q, page: 1 }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const patch = async (id, body) => {
    try {
      const d = await api.patch(`/admin/users/${id}`, body);
      setData((x) => ({ ...x, users: x.users.map((u) => (u.id === id ? { ...u, ...d.user } : u)) }));
      toast.success('Uloženo.');
    } catch (e) {
      toast.error(e.message);
    }
  };
  const remove = async (id) => {
    try {
      await api.del(`/admin/users/${id}`);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader title="Uživatelé" subtitle={data ? `${data.total} účtů` : ''} />
      <div className="a-card">
        <div className="a-toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Jméno nebo e-mail…" />
          <select value={p.role || ''} onChange={(e) => setParams({ ...p, role: e.target.value })}>
            <option value="">Všechny role</option>
            <option value="USER">Zákazníci</option>
            <option value="ADMIN">Administrátoři</option>
          </select>
        </div>
        {!data ? <Spinner /> : (
          <div className="a-table-wrap">
            <table className="table a-table">
              <thead><tr><th>Uživatel</th><th>Registrace</th><th className="right">Objednávky</th><th className="right">Recenze</th><th>Role</th><th>Blokace</th><th /></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className={u.blocked ? 'dim' : ''}>
                    <td><strong>{u.firstName} {u.lastName}</strong><small className="muted block">{u.email}</small></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="right">{u.orders}</td>
                    <td className="right">{u.reviewCount}</td>
                    <td>
                      <select value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u.id, { role: e.target.value })} className="a-select-sm">
                        <option value="USER">Zákazník</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>{u.id !== me.id && <Toggle checked={u.blocked} onChange={(v) => patch(u.id, { blocked: v })} />}</td>
                    <td className="right">{u.id !== me.id && <Confirm onConfirm={() => remove(u.id)} message="Smazat uživatele včetně recenzí a dotazů?" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ ...p, page: n })} />}
      </div>
    </div>
  );
}

export function Subscribers() {
  const { data } = useFetch('/admin/subscribers');
  const exportCsv = () => {
    const csv = ['email,od', ...data.subscribers.map((s) => `${s.email},${new Date(s.createdAt).toISOString()}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'newsletter.csv';
    a.click();
  };
  return (
    <div>
      <PageHeader title="Newsletter" subtitle={data ? `${data.subscribers.length} odběratelů` : ''}>
        <button className="btn btn-primary" onClick={exportCsv} disabled={!data}>Export CSV</button>
      </PageHeader>
      <div className="a-card">
        {!data ? <Spinner /> : (
          <table className="table a-table">
            <thead><tr><th>E-mail</th><th>Přihlášen od</th></tr></thead>
            <tbody>{data.subscribers.map((s) => <tr key={s.email}><td>{s.email}</td><td>{formatDate(s.createdAt)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
