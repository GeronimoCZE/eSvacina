import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Spinner } from '../components/Misc.jsx';
import { Confirm, EnBadge, F, ImageList, MarkdownEditor, PageHeader, TagInput, Toggle, TranslationFields, cleanTranslations } from './ui.jsx';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatDate } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

export function BlogList() {
  const { data } = useFetch('/admin/blog');
  return (
    <div>
      <PageHeader title="Blog" subtitle="Články spravované administrátory">
        <Link to="/admin/blog/novy" className="btn btn-primary"><Icon name="plus" size={18} /> Nový článek</Link>
      </PageHeader>
      <div className="a-card">
        {!data ? <Spinner /> : (
          <table className="table a-table">
            <thead><tr><th>Článek</th><th>Autor</th><th>Stav</th><th>Publikováno</th></tr></thead>
            <tbody>
              {data.posts.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/admin/blog/${p.id}`}><strong>{p.emoji} {p.title}</strong></Link>{'translations' in p && <EnBadge row={p} fields={['title', 'content']} />}<small className="muted block">{p.tags.map((t) => `#${t}`).join(' ')}</small></td>
                  <td>{p.author ? `${p.author.firstName} ${p.author.lastName}` : '–'}</td>
                  <td>{p.published ? <span className="status status-ok">Publikováno</span> : <span className="status status-muted">Koncept</span>}</td>
                  <td>{p.publishedAt ? formatDate(p.publishedAt) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const EN_FIELDS = [
  { key: 'title', label: 'Titulek' },
  { key: 'excerpt', label: 'Perex', type: 'textarea' },
  { key: 'content', label: 'Obsah', type: 'markdown', rows: 18 },
];

const EMPTY = { title: '', slug: '', excerpt: '', content: '', coverImage: '', emoji: '📝', tags: [], published: false, publishedAt: '' };
const toLocal = (d) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

export function BlogEditor() {
  const { id } = useParams();
  const isNew = id === 'novy';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(isNew ? EMPTY : null);
  useEffect(() => {
    if (!isNew) api.get(`/admin/blog/${id}`).then(({ post }) => setForm({ ...EMPTY, ...post, coverImage: post.coverImage || '', publishedAt: toLocal(post.publishedAt) }));
  }, [id, isNew]);
  if (!form) return <Spinner />;
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  const save = async (e) => {
    e.preventDefault();
    const body = {
      title: form.title, slug: form.slug || null, excerpt: form.excerpt, content: form.content, coverImage: form.coverImage || null,
      emoji: form.emoji, tags: form.tags, published: form.published, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      translations: cleanTranslations(form.translations),
    };
    try {
      if (isNew) {
        const d = await api.post('/admin/blog', body);
        navigate(`/admin/blog/${d.post.id}`, { replace: true });
      } else {
        const d = await api.put(`/admin/blog/${id}`, body);
        setForm((f) => ({ ...f, slug: d.post.slug, publishedAt: toLocal(d.post.publishedAt) }));
      }
      toast.success('Článek uložen.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? 'Nový článek' : form.title} subtitle={!isNew && form.published && <Link to={`/blog/${form.slug}`} target="_blank">/blog/{form.slug} ↗</Link>}>
        <Link to="/admin/blog" className="btn btn-ghost">Zpět</Link>
        {!isNew && <Confirm className="btn btn-ghost danger" onConfirm={async () => { await api.del(`/admin/blog/${id}`); navigate('/admin/blog'); }}>Smazat</Confirm>}
        <button className="btn btn-primary">Uložit</button>
      </PageHeader>
      <div className="a-editor">
        <section className="a-card pad stack">
          <F label="Titulek *"><input required value={form.title} onChange={set('title')} className="input-lg" /></F>
          <F label="Perex"><textarea rows={2} value={form.excerpt || ''} onChange={set('excerpt')} /></F>
          <F label="Obsah"><MarkdownEditor value={form.content} onChange={set('content')} rows={22} /></F>
          <TranslationFields value={form} onChange={(t) => setForm((f) => ({ ...f, translations: t }))} fields={EN_FIELDS} />
        </section>
        <div className="stack">
          <section className="a-card pad">
            <Toggle label="Publikováno" hint="Viditelné na blogu" checked={form.published} onChange={set('published')} />
            <div className="fields">
              <F label="Datum publikace" hint="Prázdné = při publikování"><input type="datetime-local" value={form.publishedAt} onChange={set('publishedAt')} /></F>
              <F label="Slug"><input value={form.slug || ''} onChange={set('slug')} placeholder="automaticky" /></F>
              <F label="Emoji" half><input value={form.emoji || ''} onChange={set('emoji')} /></F>
              <F label="Štítky"><TagInput value={form.tags} onChange={set('tags')} /></F>
              <F label="Titulní obrázek"><ImageList single value={form.coverImage ? [form.coverImage] : []} onChange={(v) => setForm({ ...form, coverImage: v[0] || '' })} /></F>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
