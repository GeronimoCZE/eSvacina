import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Modal, Spinner } from '../components/Misc.jsx';
import { Confirm, EnBadge, F, ImageList, MarkdownEditor, PageHeader, Toggle, TranslationFields, cleanTranslations } from './ui.jsx';
import { api, assetUrl } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { formatDate, formatPrice } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

/** Shared create/update/delete flow for simple admin resources edited in a modal. */
function useCrud(path, clean = (x) => x) {
  const toast = useToast();
  const list = useFetch(`/admin/${path}`);
  const [edit, setEdit] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const { id, createdAt, updatedAt, used, ...body } = clean(edit);
    try {
      if (id) await api.put(`/admin/${path}/${id}`, body);
      else await api.post(`/admin/${path}`, body);
      toast.success('Uloženo.');
      setEdit(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (id) => {
    try {
      await api.del(`/admin/${path}/${id}`);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  return { ...list, edit, setEdit, save, remove };
}

const GRADIENTS = [
  'linear-gradient(135deg, #14532d 0%, #16a34a 55%, #4ade80 100%)',
  'linear-gradient(135deg, #312e81 0%, #6366f1 60%, #a5b4fc 100%)',
  'linear-gradient(135deg, #9a3412 0%, #f97316 60%, #fdba74 100%)',
  'linear-gradient(135deg, #831843 0%, #ec4899 60%, #f9a8d4 100%)',
  'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 60%, #7dd3fc 100%)',
  '#dcfce7', '#ffedd5', '#ede9fe', '#fef9c3',
];

const BANNER_EN = [
  { key: 'title', label: 'Titulek' },
  { key: 'subtitle', label: 'Podtitulek', type: 'textarea' },
  { key: 'ctaText', label: 'Text tlačítka' },
];
const PAGE_EN = [
  { key: 'title', label: 'Název' },
  { key: 'content', label: 'Obsah', type: 'markdown', rows: 16 },
];

function BannerPreview({ b }) {
  return (
    <div className={`banner-preview ${b.placement}`} style={{ background: b.background, color: b.textColor }}>
      {b.image && <img src={assetUrl(b.image)} alt="" />}
      <div>
        <strong>{b.title || 'Titulek banneru'}</strong>
        <p>{b.subtitle}</p>
        {b.ctaText && <span className="btn btn-light btn-xs">{b.ctaText}</span>}
      </div>
      {!b.image && <span className="bp-emoji">{b.emoji}</span>}
    </div>
  );
}

export function Banners() {
  const c = useCrud('banners', (b) => ({ ...b, sortOrder: Number(b.sortOrder) || 0, image: b.image || null, translations: cleanTranslations(b.translations) }));
  const empty = { title: '', subtitle: '', ctaText: 'Nakupovat', ctaLink: '/obchod', image: '', emoji: '🥗', background: GRADIENTS[0], textColor: '#ffffff', placement: 'hero', sortOrder: 0, active: true };
  const set = (k) => (e) => c.setEdit({ ...c.edit, [k]: e?.target ? e.target.value : e });
  return (
    <div>
      <PageHeader title="Bannery" subtitle="Hlavní slider na úvodní stránce a promo dlaždice pod ním">
        <button className="btn btn-primary" onClick={() => c.setEdit(empty)}><Icon name="plus" size={18} /> Nový banner</button>
      </PageHeader>
      {!c.data ? <Spinner /> : (
        <div className="banner-grid">
          {c.data.banners.map((b) => (
            <div key={b.id} className={`a-card banner-card ${!b.active ? 'dim' : ''}`}>
              <BannerPreview b={b} />
              <div className="row-between pad-sm">
                <small className="muted">{b.placement === 'hero' ? 'Hlavní slider' : 'Promo dlaždice'} · pořadí {b.sortOrder}{!b.active && ' · skrytý'} <EnBadge row={b} fields={['title']} /></small>
                <div className="row gap">
                  <button className="btn btn-ghost btn-xs" onClick={() => c.setEdit({ ...empty, ...b, image: b.image || '' })}>Upravit</button>
                  <Confirm className="btn btn-ghost btn-xs danger" onConfirm={() => c.remove(b.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={Boolean(c.edit)} onClose={() => c.setEdit(null)} title={c.edit?.id ? 'Upravit banner' : 'Nový banner'} wide>
        {c.edit && (
          <form onSubmit={c.save} className="a-editor">
            <div className="fields">
              <F label="Titulek *"><input required value={c.edit.title} onChange={set('title')} /></F>
              <F label="Podtitulek"><textarea rows={2} value={c.edit.subtitle || ''} onChange={set('subtitle')} /></F>
              <F label="Text tlačítka" half><input value={c.edit.ctaText || ''} onChange={set('ctaText')} /></F>
              <F label="Odkaz tlačítka" half><input value={c.edit.ctaLink || ''} onChange={set('ctaLink')} placeholder="/obchod/keto-a-low-carb" /></F>
              <F label="Umístění" half>
                <select value={c.edit.placement} onChange={set('placement')}>
                  <option value="hero">Hlavní slider</option>
                  <option value="promo">Promo dlaždice</option>
                </select>
              </F>
              <F label="Pořadí" half><input type="number" value={c.edit.sortOrder} onChange={set('sortOrder')} /></F>
              <F label="Emoji (bez obrázku)" half><input value={c.edit.emoji || ''} onChange={set('emoji')} /></F>
              <F label="Barva textu" half><input type="color" value={c.edit.textColor || '#ffffff'} onChange={set('textColor')} /></F>
              <F label="Pozadí" hint="CSS barva nebo gradient">
                <input value={c.edit.background || ''} onChange={set('background')} />
                <div className="swatches">
                  {GRADIENTS.map((g) => <button type="button" key={g} style={{ background: g }} onClick={() => c.setEdit({ ...c.edit, background: g })} aria-label="Vybrat pozadí" />)}
                </div>
              </F>
              <F label="Obrázek (volitelný)"><ImageList single value={c.edit.image ? [c.edit.image] : []} onChange={(v) => c.setEdit({ ...c.edit, image: v[0] || '' })} /></F>
              <Toggle label="Aktivní" checked={c.edit.active} onChange={set('active')} />
              <TranslationFields value={c.edit} onChange={(t) => c.setEdit((x) => ({ ...x, translations: t }))} fields={BANNER_EN} />
            </div>
            <div className="stack">
              <F label="Náhled"><BannerPreview b={c.edit} /></F>
              <div className="row gap"><button className="btn btn-primary">Uložit</button><button type="button" className="btn btn-ghost" onClick={() => c.setEdit(null)}>Zrušit</button></div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function Pages() {
  const c = useCrud('pages', (x) => ({ ...x, translations: cleanTranslations(x.translations) }));
  const empty = { title: '', slug: '', content: '', showInFooter: true };
  return (
    <div>
      <PageHeader title="Stránky a podmínky" subtitle="Obchodní podmínky, cookies, GDPR a další informační stránky">
        <button className="btn btn-primary" onClick={() => c.setEdit(empty)}><Icon name="plus" size={18} /> Nová stránka</button>
      </PageHeader>
      <div className="a-card">
        {!c.data ? <Spinner /> : (
          <table className="table a-table">
            <thead><tr><th>Stránka</th><th>Adresa</th><th>V patičce</th><th>Upraveno</th><th /></tr></thead>
            <tbody>
              {c.data.pages.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.title}</strong> <EnBadge row={p} fields={['title', 'content']} /></td>
                  <td><Link to={`/stranka/${p.slug}`} target="_blank">/stranka/{p.slug}</Link></td>
                  <td>{p.showInFooter ? 'Ano' : 'Ne'}</td>
                  <td>{formatDate(p.updatedAt)}</td>
                  <td className="right nowrap">
                    <button className="btn btn-ghost btn-xs" onClick={() => c.setEdit(p)}>Upravit</button>{' '}
                    <Confirm className="btn btn-ghost btn-xs danger" onConfirm={() => c.remove(p.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Modal open={Boolean(c.edit)} onClose={() => c.setEdit(null)} title={c.edit?.id ? `Upravit: ${c.edit.title}` : 'Nová stránka'} wide>
        {c.edit && (
          <form onSubmit={c.save} className="stack">
            <div className="fields">
              <F label="Název *" half><input required value={c.edit.title} onChange={(e) => c.setEdit({ ...c.edit, title: e.target.value })} /></F>
              <F label="Slug *" half hint="Např. obchodni-podminky"><input required pattern="[a-z0-9-]+" value={c.edit.slug} onChange={(e) => c.setEdit({ ...c.edit, slug: e.target.value })} /></F>
            </div>
            <MarkdownEditor value={c.edit.content} onChange={(v) => c.setEdit({ ...c.edit, content: v })} rows={20} />
            <TranslationFields value={c.edit} onChange={(t) => c.setEdit((x) => ({ ...x, translations: t }))} fields={PAGE_EN} />
            <Toggle label="Zobrazit v patičce" checked={c.edit.showInFooter} onChange={(v) => c.setEdit({ ...c.edit, showInFooter: v })} />
            <div className="row gap"><button className="btn btn-primary">Uložit</button><button type="button" className="btn btn-ghost" onClick={() => c.setEdit(null)}>Zrušit</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function Coupons() {
  const c = useCrud('coupons', (x) => ({
    ...x,
    value: Number(x.value),
    minOrder: x.minOrder === '' || x.minOrder == null ? null : Number(x.minOrder),
    maxUses: x.maxUses === '' || x.maxUses == null ? null : Number(x.maxUses),
    expiresAt: x.expiresAt ? new Date(x.expiresAt).toISOString() : null,
  }));
  const empty = { code: '', type: 'percent', value: 10, minOrder: '', expiresAt: '', maxUses: '', active: true };
  const set = (k) => (e) => c.setEdit({ ...c.edit, [k]: e?.target ? e.target.value : e });
  return (
    <div>
      <PageHeader title="Slevové kódy" subtitle="Kódy, které zákazníci uplatní v pokladně">
        <button className="btn btn-primary" onClick={() => c.setEdit(empty)}><Icon name="plus" size={18} /> Nový kód</button>
      </PageHeader>
      <div className="a-card">
        {!c.data ? <Spinner /> : (
          <table className="table a-table">
            <thead><tr><th>Kód</th><th>Sleva</th><th>Min. objednávka</th><th>Platnost</th><th>Využito</th><th>Stav</th><th /></tr></thead>
            <tbody>
              {c.data.coupons.map((x) => (
                <tr key={x.id} className={!x.active ? 'dim' : ''}>
                  <td><code className="code">{x.code}</code></td>
                  <td>{x.type === 'percent' ? `${x.value} %` : formatPrice(x.value)}</td>
                  <td>{x.minOrder ? formatPrice(x.minOrder) : '–'}</td>
                  <td>{x.expiresAt ? formatDate(x.expiresAt) : 'neomezeně'}</td>
                  <td>{x.used}{x.maxUses ? ` / ${x.maxUses}` : ''}</td>
                  <td>{x.active ? <span className="status status-ok">Aktivní</span> : <span className="status status-muted">Neaktivní</span>}</td>
                  <td className="right nowrap">
                    <button className="btn btn-ghost btn-xs" onClick={() => c.setEdit({ ...x, minOrder: x.minOrder ?? '', maxUses: x.maxUses ?? '', expiresAt: x.expiresAt ? x.expiresAt.slice(0, 10) : '' })}>Upravit</button>{' '}
                    <Confirm className="btn btn-ghost btn-xs danger" onConfirm={() => c.remove(x.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Modal open={Boolean(c.edit)} onClose={() => c.setEdit(null)} title={c.edit?.id ? 'Upravit kód' : 'Nový slevový kód'}>
        {c.edit && (
          <form onSubmit={c.save} className="stack">
            <div className="fields">
              <F label="Kód *"><input required value={c.edit.code} onChange={(e) => c.setEdit({ ...c.edit, code: e.target.value.toUpperCase() })} /></F>
              <F label="Typ" half>
                <select value={c.edit.type} onChange={set('type')}>
                  <option value="percent">Procenta</option>
                  <option value="fixed">Pevná částka (Kč)</option>
                </select>
              </F>
              <F label="Hodnota *" half><input type="number" min="1" required value={c.edit.value} onChange={set('value')} /></F>
              <F label="Min. objednávka (Kč)" half><input type="number" min="0" value={c.edit.minOrder} onChange={set('minOrder')} /></F>
              <F label="Max. počet použití" half><input type="number" min="1" value={c.edit.maxUses} onChange={set('maxUses')} /></F>
              <F label="Platí do"><input type="date" value={c.edit.expiresAt} onChange={set('expiresAt')} /></F>
            </div>
            <Toggle label="Aktivní" checked={c.edit.active} onChange={set('active')} />
            <div className="row gap"><button className="btn btn-primary">Uložit</button><button type="button" className="btn btn-ghost" onClick={() => c.setEdit(null)}>Zrušit</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
