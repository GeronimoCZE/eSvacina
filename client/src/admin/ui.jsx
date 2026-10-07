import Markdown from '../components/Markdown.jsx';
import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api, assetUrl } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="a-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="row gap">{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <span className={`toggle ${checked ? 'on' : ''}`}>
        <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
        <span />
      </span>
    </label>
  );
}

export function F({ label, hint, children, half, third }) {
  return (
    <div className={`field ${half ? 'half' : ''} ${third ? 'third' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}

/** Comma/enter separated list editor. */
export function TagInput({ value = [], onChange, placeholder = 'Přidat a potvrdit Enterem', suggestions = [] }) {
  const [text, setText] = useState('');
  const add = (t) => {
    const v = t.trim().toLowerCase();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText('');
  };
  return (
    <div className="tag-input">
      {value.map((t) => (
        <span key={t} className="chip">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Odebrat ${t}`}>×</button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(text);
          } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
        placeholder={placeholder}
        list={suggestions.length ? 'tag-suggestions' : undefined}
      />
      {suggestions.length > 0 && (
        <datalist id="tag-suggestions">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
      )}
    </div>
  );
}

/** Upload images to the server and manage an ordered list of URLs. */
export function ImageList({ value = [], onChange, max = 12, single }) {
  const ref = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const upload = async (files) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const d = await api.upload(files);
      onChange(single ? d.urls.slice(0, 1) : [...value, ...d.urls].slice(0, max));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      ref.current.value = '';
    }
  };
  const move = (i, dir) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  return (
    <div className="image-list">
      {value.map((src, i) => (
        <div key={src + i} className="image-item">
          <img src={assetUrl(src)} alt="" />
          <div className="image-tools">
            {!single && i > 0 && <button type="button" onClick={() => move(i, -1)} title="Posunout vlevo">←</button>}
            <button type="button" onClick={() => onChange(value.filter((_, x) => x !== i))} title="Odebrat">×</button>
          </div>
          {i === 0 && !single && <span className="image-main">Hlavní</span>}
        </div>
      ))}
      {(single ? value.length === 0 : value.length < max) && (
        <button type="button" className="image-add" onClick={() => ref.current.click()} disabled={busy}>
          <Icon name="upload" />
          <span>{busy ? 'Nahrávám…' : 'Nahrát'}</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => upload([...e.target.files])} />
      {(single ? value.length === 0 : value.length < max) && (
        <div className="image-url">
          <input placeholder="…nebo vložte URL obrázku" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn btn-ghost btn-sm" disabled={!url} onClick={() => { onChange(single ? [url] : [...value, url]); setUrl(''); }}>Přidat</button>
        </div>
      )}
    </div>
  );
}

export function Confirm({ onConfirm, children = 'Smazat', message = 'Opravdu smazat? Tuto akci nelze vrátit.', className = 'btn btn-ghost btn-sm danger' }) {
  return (
    <button type="button" className={className} onClick={() => confirm(message) && onConfirm()}>
      {children}
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Hledat…' }) {
  return (
    <div className="a-search">
      <Icon name="search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/** Markdown textarea with a live preview toggle. */
export function MarkdownEditor({ value, onChange, rows = 14, placeholder }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="md-editor">
      <div className="md-tabs">
        <button type="button" className={!preview ? 'active' : ''} onClick={() => setPreview(false)}>Upravit</button>
        <button type="button" className={preview ? 'active' : ''} onClick={() => setPreview(true)}>Náhled</button>
        <small className="muted">Podporuje Markdown: **tučně**, ## nadpis, - seznam, [odkaz](url)</small>
      </div>
      {preview ? <PreviewMd text={value} /> : <textarea rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function PreviewMd({ text }) {
  return <div className="md-preview"><Markdown>{text}</Markdown></div>;
}

export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const bind = (k, parse) => ({
    value: form[k] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, [k]: parse ? parse(e.target.value) : e.target.value })),
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return { form, setForm, bind, set };
}

export const nullIfEmpty = (v) => (v === '' || v === undefined ? null : v);

/* ---------------------------- English translations ---------------------------- */

const filled = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * `translations` for the API: only non-empty English fields, never null
 * (the admin schema accepts an object or nothing). Empty fields fall back to Czech.
 */
export function cleanTranslations(t) {
  const en = Object.fromEntries(Object.entries(t?.en || {}).filter(([, v]) => filled(v)));
  return { en };
}

/** How many of `fields` have an English text in a row. */
export const enCount = (row, fields) => fields.filter((f) => filled(row?.translations?.en?.[f])).length;

/** Small "EN ✓ / EN chybí" badge for lists. */
export function EnBadge({ row, fields }) {
  const n = enCount(row, fields);
  if (n === fields.length) return <span className="status status-ok en-badge" title="Anglická verze je vyplněná">EN ✓</span>;
  if (n > 0) return <span className="status status-warn en-badge" title={`Anglicky vyplněno ${n} z ${fields.length} polí`}>EN {n}/{fields.length}</span>;
  return <span className="status status-muted en-badge" title="Chybí anglický překlad – zobrazí se česky">EN chybí</span>;
}

/**
 * Collapsible "🇬🇧 Anglická verze" panel. `value` is the edited record, `fields`
 * is a list of { key, label, type: 'input' | 'textarea' | 'markdown', rows }.
 * Reads/writes value.translations.en[key]; the Czech text is the placeholder.
 */
export function TranslationFields({ value, onChange, fields, title = '🇬🇧 Anglická verze', defaultOpen }) {
  const en = value?.translations?.en || {};
  const done = fields.filter((f) => filled(en[f.key])).length;
  const [open, setOpen] = useState(defaultOpen ?? done > 0);
  const setField = (k, v) => onChange({ ...(value?.translations || {}), en: { ...en, [k]: v } });
  return (
    <div className={`tr-panel ${open ? 'open' : ''}`}>
      <button type="button" className="tr-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <strong>{title}</strong>
        <span className={`status ${done === fields.length ? 'status-ok' : done ? 'status-warn' : 'status-muted'}`}>{done}/{fields.length} vyplněno</span>
        <span className="tr-chev">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="tr-body">
          <p className="muted small">Prázdná pole se v anglické verzi webu zobrazí česky. Český text je uveden šedě jako nápověda.</p>
          <div className="fields">
            {fields.map((f) => {
              const cz = value?.[f.key] || '';
              const props = { value: en[f.key] || '', lang: 'en' };
              return (
                <F key={f.key} label={`${f.label} (EN)`}>
                  {f.type === 'markdown' ? (
                    <MarkdownEditor {...props} onChange={(v) => setField(f.key, v)} rows={f.rows || 10} placeholder={cz} />
                  ) : f.type === 'textarea' ? (
                    <textarea {...props} rows={f.rows || 2} placeholder={cz} onChange={(e) => setField(f.key, e.target.value)} />
                  ) : (
                    <input {...props} placeholder={cz} onChange={(e) => setField(f.key, e.target.value)} />
                  )}
                </F>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
