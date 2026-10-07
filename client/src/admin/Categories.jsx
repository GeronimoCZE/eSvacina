import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Modal, Spinner } from '../components/Misc.jsx';
import { Confirm, EnBadge, F, ImageList, PageHeader, Toggle, TranslationFields, cleanTranslations } from './ui.jsx';
import { CategoryOptions } from './Products.jsx';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';

const EN_FIELDS = [
  { key: 'name', label: 'Název' },
  { key: 'description', label: 'Popis', type: 'textarea', rows: 3 },
];

const EMPTY = { name: '', slug: '', description: '', icon: '📦', color: '#16a34a', image: '', sortOrder: 0, active: true, parentId: '' };

function Row({ c, depth, onEdit, onAddChild, onDelete }) {
  const [open, setOpen] = useState(depth === 0);
  return (
    <>
      <div className={`cat-row ${!c.active ? 'dim' : ''}`} style={{ paddingLeft: 12 + depth * 28 }}>
        {c.children.length > 0 ? (
          <button className="icon-btn sm" onClick={() => setOpen(!open)} aria-label="Rozbalit">
            <Icon name={open ? 'chevronDown' : 'chevron'} size={14} />
          </button>
        ) : <span className="icon-spacer" />}
        <span className="cat-icon" style={{ background: `${c.color || '#16a34a'}22` }}>{c.icon}</span>
        <div className="grow">
          <strong>{c.name}</strong>
          <EnBadge row={c} fields={['name']} />
          <small className="muted"> /{c.slug} · {c.productCount} produktů{!c.active && ' · skrytá'}</small>
        </div>
        <Link to={`/admin/produkty?categoryId=${c.id}`} className="btn btn-ghost btn-xs">Produkty</Link>
        <button className="btn btn-ghost btn-xs" onClick={() => onAddChild(c)}>+ Podkategorie</button>
        <button className="btn btn-ghost btn-xs" onClick={() => onEdit(c)}>Upravit</button>
        <Confirm className="btn btn-ghost btn-xs danger" onConfirm={() => onDelete(c)}>Smazat</Confirm>
      </div>
      {open && c.children.map((ch) => <Row key={ch.id} c={ch} depth={depth + 1} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} />)}
    </>
  );
}

export default function Categories() {
  const { data, reload } = useFetch('/admin/categories');
  const toast = useToast();
  const [edit, setEdit] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const body = { ...edit, parentId: edit.parentId ? Number(edit.parentId) : null, sortOrder: Number(edit.sortOrder) || 0, slug: edit.slug || null, image: edit.image || null, translations: cleanTranslations(edit.translations) };
    const id = body.id;
    for (const k of ['id', 'children', 'productCount', 'createdAt']) delete body[k];
    try {
      if (id) await api.put(`/admin/categories/${id}`, body);
      else await api.post('/admin/categories', body);
      toast.success('Kategorie uložena.');
      setEdit(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (c) => {
    try {
      await api.del(`/admin/categories/${c.id}`);
      toast.success('Smazáno.');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Kategorie" subtitle="Strom kategorií a podkategorií v hlavním menu">
        <button className="btn btn-primary" onClick={() => setEdit({ ...EMPTY })}><Icon name="plus" size={18} /> Nová kategorie</button>
      </PageHeader>
      <div className="a-card">
        {!data ? <Spinner /> : data.categories.map((c) => (
          <Row key={c.id} c={c} depth={0} onEdit={(x) => setEdit({ ...EMPTY, ...x, parentId: x.parentId || '', image: x.image || '' })} onAddChild={(p) => setEdit({ ...EMPTY, parentId: p.id, color: p.color })} onDelete={remove} />
        ))}
      </div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? 'Upravit kategorii' : 'Nová kategorie'}>
        {edit && (
          <form onSubmit={save} className="stack">
            <div className="fields">
              <F label="Název *"><input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></F>
              <F label="Slug" half><input value={edit.slug || ''} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} placeholder="automaticky" /></F>
              <F label="Nadřazená kategorie" half>
                <select value={edit.parentId} onChange={(e) => setEdit({ ...edit, parentId: e.target.value })}>
                  <option value="">— hlavní kategorie —</option>
                  {data && <CategoryOptions tree={data.categories} />}
                </select>
              </F>
              <F label="Ikona (emoji)" third><input value={edit.icon || ''} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} /></F>
              <F label="Barva" third><input type="color" value={edit.color || '#16a34a'} onChange={(e) => setEdit({ ...edit, color: e.target.value })} /></F>
              <F label="Pořadí" third><input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: e.target.value })} /></F>
              <F label="Popis"><textarea rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></F>
              <F label="Obrázek"><ImageList single value={edit.image ? [edit.image] : []} onChange={(v) => setEdit({ ...edit, image: v[0] || '' })} /></F>
            </div>
            <TranslationFields value={edit} onChange={(t) => setEdit((x) => ({ ...x, translations: t }))} fields={EN_FIELDS} />
            <Toggle label="Aktivní" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
            <div className="row gap"><button className="btn btn-primary">Uložit</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Zrušit</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
