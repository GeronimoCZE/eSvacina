import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/Misc.jsx';
import Stars from '../components/Stars.jsx';
import { Confirm, PageHeader } from './ui.jsx';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatDateTime } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

export function Reviews() {
  const [pending, setPending] = useState(false);
  const { data, reload } = useFetch(`/admin/reviews${pending ? '?pending=1' : ''}`);
  const toast = useToast();
  const act = async (fn) => {
    try {
      await fn();
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div>
      <PageHeader title="Recenze" subtitle="Recenze mohou psát jen zákazníci, kteří produkt koupili.">
        <div className="sort-tabs">
          <button className={!pending ? 'active' : ''} onClick={() => setPending(false)}>Všechny</button>
          <button className={pending ? 'active' : ''} onClick={() => setPending(true)}>Ke schválení</button>
        </div>
      </PageHeader>
      <div className="a-card">
        {!data ? <Spinner /> : data.reviews.length === 0 ? <p className="pad muted">Žádné recenze.</p> : data.reviews.map((r) => (
          <div key={r.id} className={`a-item ${!r.approved ? 'pending' : ''}`}>
            <div className="grow">
              <div className="row gap">
                <Stars value={r.rating} size={14} />
                <Link to={`/produkt/${r.product.slug}`} target="_blank"><strong>{r.product.name}</strong></Link>
                {!r.approved && <span className="status status-warn">Čeká na schválení</span>}
              </div>
              {r.title && <h4>{r.title}</h4>}
              <p>{r.comment}</p>
              <small className="muted">{r.user.firstName} {r.user.lastName} ({r.user.email}) · {formatDateTime(r.createdAt)}</small>
            </div>
            <div className="a-item-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => act(() => api.patch(`/admin/reviews/${r.id}`, { approved: !r.approved }))}>{r.approved ? 'Skrýt' : 'Schválit'}</button>
              <Confirm onConfirm={() => act(() => api.del(`/admin/reviews/${r.id}`))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Questions() {
  const [filter, setFilter] = useState('');
  const { data, reload } = useFetch(`/admin/questions${filter ? `?filter=${filter}` : ''}`);
  const [answers, setAnswers] = useState({});
  const toast = useToast();
  const act = async (fn, msg) => {
    try {
      await fn();
      if (msg) toast.success(msg);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div>
      <PageHeader title="Dotazy k produktům" subtitle="Odpovědi administrátora se zobrazují jako „Tým eSvačina“.">
        <div className="sort-tabs">
          <button className={!filter ? 'active' : ''} onClick={() => setFilter('')}>Všechny</button>
          <button className={filter === 'unanswered' ? 'active' : ''} onClick={() => setFilter('unanswered')}>Nezodpovězené</button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Ke schválení</button>
        </div>
      </PageHeader>
      <div className="a-card">
        {!data ? <Spinner /> : data.questions.length === 0 ? <p className="pad muted">Žádné dotazy.</p> : data.questions.map((q) => (
          <div key={q.id} className={`a-item ${!q.approved ? 'pending' : ''}`}>
            <div className="grow">
              <div className="row gap">
                <Link to={`/produkt/${q.product.slug}`} target="_blank"><strong>{q.product.name}</strong></Link>
                {!q.approved && <span className="status status-warn">Čeká na schválení</span>}
                {q.answers.length === 0 && <span className="status status-info">Bez odpovědi</span>}
              </div>
              <p className="q-text">❓ {q.body}</p>
              <small className="muted">{q.user.firstName} {q.user.lastName} · {formatDateTime(q.createdAt)}</small>
              {q.answers.map((a) => (
                <div key={a.id} className="a-answer">
                  <p>{a.body}</p>
                  <small className="muted">{a.user.role === 'ADMIN' ? 'Tým eSvačina' : `${a.user.firstName} ${a.user.lastName}`} · {formatDateTime(a.createdAt)}</small>
                  <Confirm className="link-btn danger small" onConfirm={() => act(() => api.del(`/admin/answers/${a.id}`))}>smazat</Confirm>
                </div>
              ))}
              <form className="a-reply" onSubmit={(e) => { e.preventDefault(); act(() => api.post(`/admin/questions/${q.id}/answers`, { body: answers[q.id] }), 'Odpověď odeslána.').then(() => setAnswers({ ...answers, [q.id]: '' })); }}>
                <input placeholder="Odpovědět jako Tým eSvačina…" value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} required minLength={2} />
                <button className="btn btn-primary btn-sm">Odpovědět</button>
              </form>
            </div>
            <div className="a-item-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => act(() => api.patch(`/admin/questions/${q.id}`, { approved: !q.approved }))}>{q.approved ? 'Skrýt' : 'Schválit'}</button>
              <Confirm onConfirm={() => act(() => api.del(`/admin/questions/${q.id}`))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
