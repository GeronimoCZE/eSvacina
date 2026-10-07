import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import { Pagination, Spinner } from '../components/Misc.jsx';
import { Confirm, EnBadge, F, ImageList, MarkdownEditor, PageHeader, SearchInput, TagInput, Toggle, TranslationFields, cleanTranslations, nullIfEmpty } from './ui.jsx';
import { api, qs } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatPrice, TAGS } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

/** Flatten the category tree into indented <option>s. */
export function CategoryOptions({ tree, depth = 0 }) {
  return tree.map((c) => [
    <option key={c.id} value={c.id}>{`${'   '.repeat(depth)}${c.icon || ''} ${c.name}`}</option>,
    ...(c.children?.length ? [<CategoryOptions key={`${c.id}-c`} tree={c.children} depth={depth + 1} />] : []),
  ]);
}

export function Products() {
  const [params, setParams] = useSearchParams();
  const p = Object.fromEntries(params);
  const [q, setQ] = useState(p.q || '');
  const [selected, setSelected] = useState([]);
  const toast = useToast();
  const { data, reload, setData } = useFetch(`/admin/products${qs({ ...p, perPage: 25 })}`);
  const { data: cats } = useFetch('/admin/categories');

  useEffect(() => {
    const t = setTimeout(() => q !== (p.q || '') && setParams({ ...p, q, page: 1 }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const update = (patch) => setParams(Object.fromEntries(Object.entries({ ...p, ...patch }).filter(([, v]) => v !== '' && v != null)));
  const patch = async (id, body) => {
    try {
      await api.patch(`/admin/products/${id}`, body);
      setData((d) => ({ ...d, products: d.products.map((x) => (x.id === id ? { ...x, ...body } : x)) }));
    } catch (e) {
      toast.error(e.message);
    }
  };
  const bulk = async (action) => {
    if (action === 'delete' && !confirm(`Smazat ${selected.length} produktů?`)) return;
    await api.post('/admin/products/bulk', { ids: selected, action });
    setSelected([]);
    toast.success('Hotovo.');
    reload();
  };
  const sortBy = (field) => update({ sort: field, dir: p.sort === field && p.dir !== 'asc' ? 'asc' : 'desc' });
  const th = (field, label, cls) => (
    <th className={`sortable ${cls || ''}`} onClick={() => sortBy(field)}>
      {label} {p.sort === field ? (p.dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      <PageHeader title="Produkty" subtitle={data ? `${data.total} produktů` : ''}>
        <Link to="/admin/produkty/novy" className="btn btn-primary"><Icon name="plus" size={18} /> Nový produkt</Link>
      </PageHeader>
      <div className="a-card">
        <div className="a-toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Název, SKU, značka…" />
          <select value={p.categoryId || ''} onChange={(e) => update({ categoryId: e.target.value, page: 1 })}>
            <option value="">Všechny kategorie</option>
            {cats && <CategoryOptions tree={cats.categories} />}
          </select>
          <select value={p.status || ''} onChange={(e) => update({ status: e.target.value, page: 1 })}>
            <option value="">Všechny stavy</option>
            <option value="active">Aktivní</option>
            <option value="hidden">Skryté</option>
            <option value="low">Docházející zásoby</option>
          </select>
          {selected.length > 0 && (
            <div className="a-bulk">
              <span>{selected.length} vybráno</span>
              <button className="btn btn-ghost btn-sm" onClick={() => bulk('activate')}>Zobrazit</button>
              <button className="btn btn-ghost btn-sm" onClick={() => bulk('hide')}>Skrýt</button>
              <button className="btn btn-ghost btn-sm" onClick={() => bulk('feature')}>Doporučit</button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => bulk('delete')}>Smazat</button>
            </div>
          )}
        </div>
        {!data ? <Spinner /> : (
          <div className="a-table-wrap">
            <table className="table a-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.length === data.products.length && data.products.length > 0} onChange={(e) => setSelected(e.target.checked ? data.products.map((x) => x.id) : [])} /></th>
                  {th('name', 'Produkt')}
                  <th>Kategorie</th>
                  {th('price', 'Cena', 'right')}
                  {th('stock', 'Sklad', 'right')}
                  {th('views', 'Zobrazení', 'right')}
                  <th>Hodnocení</th>
                  <th>Aktivní</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.products.map((x) => (
                  <tr key={x.id} className={!x.active ? 'dim' : ''}>
                    <td><input type="checkbox" checked={selected.includes(x.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, x.id] : selected.filter((s) => s !== x.id))} /></td>
                    <td>
                      <div className="a-prod">
                        <ProductVisual product={x} size="xs" />
                        <div>
                          <Link to={`/admin/produkty/${x.id}`}><strong>{x.name}</strong></Link>
                          <EnBadge row={x} fields={EN_LIST_FIELDS} />
                          <small className="muted">{x.sku} · {x.brand}{x.isFeatured && ' · ⭐ doporučený'}</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{x.category?.name}</td>
                    <td className="right">
                      {formatPrice(x.finalPrice)}
                      {x.salePrice && <small className="muted block"><s>{formatPrice(x.price)}</s></small>}
                    </td>
                    <td className="right">
                      <input type="number" className={`a-inline ${x.stock <= 5 ? 'warn' : ''}`} defaultValue={x.stock} min="0" onBlur={(e) => Number(e.target.value) !== x.stock && patch(x.id, { stock: Number(e.target.value) })} />
                    </td>
                    <td className="right muted">{x.views}</td>
                    <td className="muted">{x.rating ? `★ ${x.rating} (${x.reviewCount})` : '–'} · 👍 {x.likes}</td>
                    <td><Toggle checked={x.active} onChange={(v) => patch(x.id, { active: v })} /></td>
                    <td className="right nowrap">
                      <Link to={`/produkt/${x.slug}`} target="_blank" className="icon-btn" title="Zobrazit"><Icon name="eye" size={16} /></Link>
                      <Link to={`/admin/produkty/${x.id}`} className="icon-btn" title="Upravit"><Icon name="edit" size={16} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => update({ page: n })} />}
      </div>
    </div>
  );
}

const EMPTY = {
  name: '', slug: '', brand: '', shortDescription: '', description: '', price: '', salePrice: '', stock: 0, sku: '', weight: '',
  images: [], emoji: '🥗', tags: [], nutrition: {}, ingredients: '', allergens: '', isNew: true, isFeatured: false, active: true, categoryId: '',
};
const EN_FIELDS = [
  { key: 'name', label: 'Název' },
  { key: 'shortDescription', label: 'Krátký popis', type: 'textarea' },
  { key: 'description', label: 'Popis', type: 'markdown' },
  { key: 'ingredients', label: 'Složení', type: 'textarea', rows: 3 },
  { key: 'allergens', label: 'Alergeny', type: 'textarea' },
];
// The list badge checks the texts every product shows; empty ingredients/allergens are fine.
const EN_LIST_FIELDS = ['name', 'shortDescription', 'description'];
const NUTRI = [['energy', 'Energie (kcal)'], ['fat', 'Tuky'], ['saturated', 'Nasycené MK'], ['carbs', 'Sacharidy'], ['sugar', 'Cukry'], ['fiber', 'Vláknina'], ['protein', 'Bílkoviny'], ['salt', 'Sůl']];

export function ProductEditor() {
  const { id } = useParams();
  const isNew = id === 'novy';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [busy, setBusy] = useState(false);
  const { data: cats } = useFetch('/admin/categories');

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/products/${id}`).then((d) => setForm({ ...EMPTY, ...d.product, salePrice: d.product.salePrice ?? '', nutrition: d.product.nutrition || {} }));
    }
  }, [id, isNew]);

  if (!form) return <Spinner />;
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      stock: Number(form.stock),
      categoryId: Number(form.categoryId),
      slug: nullIfEmpty(form.slug),
      sku: nullIfEmpty(form.sku),
      nutrition: Object.fromEntries(Object.entries(form.nutrition || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, Number(v)])),
      translations: cleanTranslations(form.translations),
    };
    for (const k of ['id', 'createdAt', 'updatedAt', 'views', 'category']) delete body[k];
    try {
      if (isNew) {
        const d = await api.post('/admin/products', body);
        toast.success('Produkt vytvořen.');
        navigate(`/admin/produkty/${d.product.id}`, { replace: true });
      } else {
        const d = await api.put(`/admin/products/${id}`, body);
        setForm((f) => ({ ...f, slug: d.product.slug }));
        toast.success('Uloženo.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    await api.del(`/admin/products/${id}`);
    toast.success('Produkt smazán.');
    navigate('/admin/produkty');
  };

  return (
    <form onSubmit={save}>
      <PageHeader title={isNew ? 'Nový produkt' : form.name} subtitle={!isNew && <Link to={`/produkt/${form.slug}`} target="_blank">/produkt/{form.slug} ↗</Link>}>
        <Link to="/admin/produkty" className="btn btn-ghost">Zpět</Link>
        {!isNew && <Confirm onConfirm={remove} className="btn btn-ghost danger">Smazat</Confirm>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Ukládám…' : 'Uložit'}</button>
      </PageHeader>
      <div className="a-editor">
        <div className="stack">
          <section className="a-card pad">
            <h3>Základní informace</h3>
            <div className="fields">
              <F label="Název *"><input required value={form.name} onChange={set('name')} /></F>
              <F label="URL slug" hint="Nechte prázdné pro automatické vytvoření z názvu." half><input value={form.slug || ''} onChange={set('slug')} /></F>
              <F label="Značka" half><input value={form.brand || ''} onChange={set('brand')} /></F>
              <F label="Krátký popis" hint="Zobrazuje se pod názvem a v kartě produktu."><textarea rows={2} value={form.shortDescription || ''} onChange={set('shortDescription')} /></F>
              <F label="Popis"><MarkdownEditor value={form.description} onChange={set('description')} /></F>
            </div>
          </section>
          <section className="a-card pad">
            <h3>Obrázky</h3>
            <p className="muted small">Bez obrázku se zobrazí barevná dlaždice s emoji.</p>
            <ImageList value={form.images} onChange={set('images')} />
          </section>
          <section className="a-card pad">
            <h3>Nutriční hodnoty (na 100 g)</h3>
            <div className="fields">
              {NUTRI.map(([k, l]) => (
                <F key={k} label={l} third>
                  <input type="number" step="0.1" value={form.nutrition?.[k] ?? ''} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, [k]: e.target.value } })} />
                </F>
              ))}
            </div>
          </section>
          <section className="a-card pad">
            <h3>Složení a alergeny</h3>
            <div className="fields">
              <F label="Složení"><textarea rows={3} value={form.ingredients || ''} onChange={set('ingredients')} /></F>
              <F label="Alergeny"><textarea rows={2} value={form.allergens || ''} onChange={set('allergens')} /></F>
            </div>
          </section>
          <section className="a-card pad">
            <TranslationFields value={form} onChange={(t) => setForm((f) => ({ ...f, translations: t }))} fields={EN_FIELDS} />
          </section>
        </div>
        <div className="stack">
          <section className="a-card pad">
            <h3>Viditelnost</h3>
            <Toggle label="Aktivní" hint="Zobrazit v obchodě" checked={form.active} onChange={set('active')} />
            <Toggle label="Novinka" hint="Štítek a sekce Novinky" checked={form.isNew} onChange={set('isNew')} />
            <Toggle label="Doporučený" hint="Zvýrazněný produkt" checked={form.isFeatured} onChange={set('isFeatured')} />
          </section>
          <section className="a-card pad">
            <h3>Cena a sklad</h3>
            <div className="fields">
              <F label="Cena (Kč) *" half><input type="number" step="0.01" min="0" required value={form.price} onChange={set('price')} /></F>
              <F label="Akční cena" half><input type="number" step="0.01" min="0" value={form.salePrice} onChange={set('salePrice')} /></F>
              <F label="Skladem (ks)" half><input type="number" min="0" value={form.stock} onChange={set('stock')} /></F>
              <F label="SKU" half><input value={form.sku || ''} onChange={set('sku')} /></F>
              <F label="Hmotnost / balení" half><input value={form.weight || ''} onChange={set('weight')} placeholder="500 g" /></F>
              <F label="Emoji" half><input value={form.emoji || ''} onChange={set('emoji')} maxLength={8} /></F>
            </div>
          </section>
          <section className="a-card pad">
            <h3>Zařazení</h3>
            <div className="fields">
              <F label="Kategorie *">
                <select required value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">Vyberte…</option>
                  {cats && <CategoryOptions tree={cats.categories} />}
                </select>
              </F>
              <F label="Štítky" hint="Např. vegan, bez-lepku, keto…">
                <TagInput value={form.tags} onChange={set('tags')} suggestions={Object.keys(TAGS)} />
              </F>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
