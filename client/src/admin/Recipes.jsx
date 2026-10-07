import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Spinner } from '../components/Misc.jsx';
import { Confirm, EnBadge, F, ImageList, MarkdownEditor, PageHeader, TagInput, Toggle, TranslationFields, cleanTranslations } from './ui.jsx';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { DIFFICULTY, formatDate } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

export function Recipes() {
  const { data } = useFetch('/admin/recipes');
  return (
    <div>
      <PageHeader title="Recepty" subtitle="Suroviny receptu se propojují s produkty v obchodě">
        <Link to="/admin/recepty/novy" className="btn btn-primary"><Icon name="plus" size={18} /> Nový recept</Link>
      </PageHeader>
      <div className="a-card">
        {!data ? <Spinner /> : (
          <table className="table a-table">
            <thead><tr><th>Recept</th><th>Čas</th><th>Obtížnost</th><th className="right">Suroviny</th><th>Stav</th><th>Vytvořeno</th></tr></thead>
            <tbody>
              {data.recipes.map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/admin/recepty/${r.id}`}><strong>{r.emoji} {r.title}</strong></Link>{'translations' in r && <EnBadge row={r} fields={['title', 'instructions']} />}</td>
                  <td>{r.prepMinutes} min</td>
                  <td>{DIFFICULTY[r.difficulty]}</td>
                  <td className="right">{r._count.ingredients}</td>
                  <td>{r.published ? <span className="status status-ok">Publikováno</span> : <span className="status status-muted">Koncept</span>}</td>
                  <td>{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ProductPicker({ value, label, onChange }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (q.length < 2) return setRes([]);
    const t = setTimeout(() => api.get(`/admin/products?q=${encodeURIComponent(q)}&perPage=8`).then((d) => setRes(d.products)), 200);
    return () => clearTimeout(t);
  }, [q]);
  if (value) {
    return (
      <span className="chip linked">🔗 {label || `#${value}`} <button type="button" onClick={() => onChange(null, null)} aria-label="Zrušit propojení">×</button></span>
    );
  }
  return (
    <div className="picker">
      <input placeholder="Propojit s produktem…" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && res.length > 0 && (
        <div className="picker-drop">
          {res.map((p) => (
            <button type="button" key={p.id} onClick={() => { onChange(p.id, p.name); setQ(''); }}>{p.emoji} {p.name} <small className="muted">{p.weight}</small></button>
          ))}
        </div>
      )}
    </div>
  );
}

const EN_FIELDS = [
  { key: 'title', label: 'Název' },
  { key: 'excerpt', label: 'Perex', type: 'textarea' },
  { key: 'instructions', label: 'Postup', type: 'markdown', rows: 12 },
];

const EMPTY = { title: '', slug: '', excerpt: '', instructions: '', image: '', emoji: '🍽️', prepMinutes: 15, servings: 2, difficulty: 'EASY', tags: [], published: true, ingredients: [] };

export function RecipeEditor() {
  const { id } = useParams();
  const isNew = id === 'novy';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [showIngEn, setShowIngEn] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/recipes/${id}`).then(({ recipe }) =>
        setForm({ ...EMPTY, ...recipe, image: recipe.image || '', ingredients: recipe.ingredients.map((i) => ({ name: i.name, amount: i.amount || '', productId: i.productId, productName: i.product?.name, translations: i.translations || undefined })) })
      );
    }
  }, [id, isNew]);
  if (!form) return <Spinner />;
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });
  const setIng = (i, patch) => setForm({ ...form, ingredients: form.ingredients.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
  const setIngEn = (i, k, v) => setIng(i, { translations: { ...form.ingredients[i].translations, en: { ...form.ingredients[i].translations?.en, [k]: v } } });
  const ingEnDone = form.ingredients.filter((i) => i.translations?.en?.name?.trim()).length;

  const save = async (e) => {
    e.preventDefault();
    const body = {
      title: form.title, slug: form.slug || null, excerpt: form.excerpt, instructions: form.instructions, image: form.image || null, emoji: form.emoji,
      prepMinutes: Number(form.prepMinutes), servings: Number(form.servings), difficulty: form.difficulty, tags: form.tags, published: form.published,
      ingredients: form.ingredients.filter((i) => i.name.trim()).map((i) => ({ name: i.name, amount: i.amount || null, productId: i.productId || null, translations: cleanTranslations(i.translations) })),
      translations: cleanTranslations(form.translations),
    };
    try {
      if (isNew) {
        const d = await api.post('/admin/recipes', body);
        navigate(`/admin/recepty/${d.recipe.id}`, { replace: true });
      } else {
        const d = await api.put(`/admin/recipes/${id}`, body);
        setForm((f) => ({ ...f, slug: d.recipe.slug }));
      }
      toast.success('Recept uložen.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? 'Nový recept' : form.title} subtitle={!isNew && <Link to={`/recepty/${form.slug}`} target="_blank">/recepty/{form.slug} ↗</Link>}>
        <Link to="/admin/recepty" className="btn btn-ghost">Zpět</Link>
        {!isNew && <Confirm className="btn btn-ghost danger" onConfirm={async () => { await api.del(`/admin/recipes/${id}`); navigate('/admin/recepty'); }}>Smazat</Confirm>}
        <button className="btn btn-primary">Uložit</button>
      </PageHeader>
      <div className="a-editor">
        <div className="stack">
          <section className="a-card pad">
            <div className="fields">
              <F label="Název *"><input required value={form.title} onChange={set('title')} /></F>
              <F label="Perex"><textarea rows={2} value={form.excerpt || ''} onChange={set('excerpt')} /></F>
            </div>
          </section>
          <section className="a-card pad">
            <h3>Suroviny</h3>
            <p className="muted small">Propojené suroviny se dají z receptu přidat přímo do košíku a recept se zobrazí na stránce produktu.</p>
            <div className="ing-editor">
              {form.ingredients.map((i, idx) => (
                <div key={idx} className="ing-row">
                  <input placeholder="Množství" value={i.amount} onChange={(e) => setIng(idx, { amount: e.target.value })} />
                  <input placeholder="Surovina" value={i.name} onChange={(e) => setIng(idx, { name: e.target.value })} />
                  <ProductPicker value={i.productId} label={i.productName} onChange={(productId, productName) => setIng(idx, { productId, productName, name: i.name || productName || '' })} />
                  <button type="button" className="icon-btn" onClick={() => setForm({ ...form, ingredients: form.ingredients.filter((_, x) => x !== idx) })} aria-label="Odebrat"><Icon name="trash" size={16} /></button>
                  {showIngEn && (
                    <div className="ing-en">
                      <input lang="en" placeholder={`🇬🇧 ${i.amount || 'Množství'}`} value={i.translations?.en?.amount || ''} onChange={(e) => setIngEn(idx, 'amount', e.target.value)} aria-label="Množství anglicky" />
                      <input lang="en" placeholder={`🇬🇧 ${i.name || 'Surovina anglicky'}`} value={i.translations?.en?.name || ''} onChange={(e) => setIngEn(idx, 'name', e.target.value)} aria-label="Surovina anglicky" />
                    </div>
                  )}
                </div>
              ))}
              <div className="row gap">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, ingredients: [...form.ingredients, { name: '', amount: '', productId: null }] })}>
                  <Icon name="plus" size={14} /> Přidat surovinu
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowIngEn(!showIngEn)}>
                  🇬🇧 {showIngEn ? 'Skrýt anglické názvy' : `Anglické názvy surovin (${ingEnDone}/${form.ingredients.length})`}
                </button>
              </div>
            </div>
          </section>
          <section className="a-card pad">
            <h3>Postup</h3>
            <MarkdownEditor value={form.instructions} onChange={set('instructions')} />
          </section>
          <section className="a-card pad">
            <TranslationFields value={form} onChange={(t) => setForm((f) => ({ ...f, translations: t }))} fields={EN_FIELDS} />
          </section>
        </div>
        <div className="stack">
          <section className="a-card pad">
            <Toggle label="Publikováno" checked={form.published} onChange={set('published')} />
            <div className="fields">
              <F label="Čas přípravy (min)" half><input type="number" min="1" value={form.prepMinutes} onChange={set('prepMinutes')} /></F>
              <F label="Porce" half><input type="number" min="1" value={form.servings} onChange={set('servings')} /></F>
              <F label="Obtížnost">
                <select value={form.difficulty} onChange={set('difficulty')}>
                  {Object.entries(DIFFICULTY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </F>
              <F label="Emoji" half><input value={form.emoji || ''} onChange={set('emoji')} /></F>
              <F label="Slug" half><input value={form.slug || ''} onChange={set('slug')} placeholder="automaticky" /></F>
              <F label="Štítky"><TagInput value={form.tags} onChange={set('tags')} /></F>
              <F label="Obrázek"><ImageList single value={form.image ? [form.image] : []} onChange={(v) => setForm({ ...form, image: v[0] || '' })} /></F>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
