import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Spinner } from '../components/Misc.jsx';
import { PageHeader } from './ui.jsx';
import { useFetch } from '../lib/useFetch.js';
import { formatDateTime, formatPrice, ORDER_STATUS } from '../lib/format.js';

function Stat({ icon, label, value, to, tone }) {
  const body = (
    <>
      <span className={`a-stat-icon ${tone || ''}`}><Icon name={icon} size={20} /></span>
      <span><small>{label}</small><strong>{value}</strong></span>
    </>
  );
  return to ? <Link to={to} className="a-card a-stat">{body}</Link> : <div className="a-card a-stat">{body}</div>;
}

function Chart({ daily }) {
  // Fill the last 14 days so empty days show as gaps.
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const row = daily.find((x) => x.day === d);
    days.push({ day: d, revenue: row?.revenue || 0, orders: row?.orders || 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.revenue));
  return (
    <div className="a-chart">
      {days.map((d) => (
        <div key={d.day} className="a-bar" title={`${d.day}: ${formatPrice(d.revenue)} (${d.orders} obj.)`}>
          <div style={{ height: `${(d.revenue / max) * 100}%` }} />
          <small>{Number(d.day.slice(8))}.</small>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading } = useFetch('/admin/stats');
  if (loading || !data) return <Spinner />;
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Přehled obchodu za posledních 30 dní" />
      <div className="a-stats">
        <Stat icon="cart" label="Tržby (30 dní)" value={formatPrice(data.revenue30)} tone="green" />
        <Stat icon="truck" label="Objednávky (30 dní)" value={data.orders30} to="/admin/objednavky" />
        <Stat icon="clock" label="Čeká na platbu" value={data.pending} to="/admin/objednavky?status=PENDING" tone="orange" />
        <Stat icon="user" label="Zákazníci" value={data.users} to="/admin/uzivatele" />
        <Stat icon="leaf" label="Aktivní produkty" value={data.products} to="/admin/produkty" />
        <Stat icon="shield" label="Docházející zásoby" value={data.lowStock} to="/admin/produkty?status=low" tone="red" />
        <Stat icon="chat" label="Nezodpovězené dotazy" value={data.openQuestions} to="/admin/dotazy" tone="orange" />
        <Stat icon="external" label="Odběratelé newsletteru" value={data.subscribers} to="/admin/newsletter" />
      </div>
      <div className="a-grid-2">
        <section className="a-card pad">
          <h3>Tržby za 14 dní</h3>
          <Chart daily={data.daily} />
          <p className="muted small">Celkové tržby od spuštění: <strong>{formatPrice(data.revenue)}</strong></p>
        </section>
        <section className="a-card pad">
          <h3>Nejprodávanější produkty</h3>
          <table className="table">
            <tbody>
              {data.top.map((t, i) => (
                <tr key={t.name}><td>{i + 1}.</td><td>{t.name}</td><td className="right">{t.sold} ks</td><td className="right">{formatPrice(t.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <section className="a-card pad">
        <div className="row-between"><h3>Poslední objednávky</h3><Link to="/admin/objednavky" className="btn btn-ghost btn-sm">Všechny</Link></div>
        <table className="table">
          <thead><tr><th>Číslo</th><th>Zákazník</th><th>Datum</th><th>Stav</th><th className="right">Celkem</th></tr></thead>
          <tbody>
            {data.recent.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/admin/objednavky/${o.id}`}>{o.number}</Link></td>
                <td>{o.firstName} {o.lastName}</td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td><span className={`status status-${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span></td>
                <td className="right">{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
