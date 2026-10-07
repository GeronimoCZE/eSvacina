import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { ProductGrid, ProductCardSkeleton } from '../components/ProductCard.jsx';
import { Breadcrumbs, Empty, ErrorBox, Pagination } from '../components/Misc.jsx';
import { useFetch } from '../lib/useFetch.js';
import { qs } from '../lib/api.js';
import { plural, TAGS, tagLabel } from '../lib/format.js';
import { tx } from '../lib/i18n.js';
import { useLocale } from '../context/LocaleContext.jsx';

const SORTS = [
  ['newest', tx('Nejnovější', 'Newest')],
  ['trending', tx('Nejoblíbenější', 'Most popular')],
  ['price-asc', tx('Nejlevnější', 'Price: low to high')],
  ['price-desc', tx('Nejdražší', 'Price: high to low')],
  ['name', tx('Abecedně', 'A–Z')],
];

export default function Shop({ search }) {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const p = Object.fromEntries(params);
  const query = { ...p, category: slug };
  const { data, loading, error } = useFetch(`/products${qs(query)}`);
  const { data: catData } = useFetch(slug ? `/categories/${slug}` : null);
  const category = catData?.category;
  const { rate, currency } = useLocale();
  // The API filters in CZK; English visitors type amounts in their own currency.
  const toShown = (czk) => (czk ? String(Math.round((Number(czk) / rate) * 100) / 100) : '');
  const toCzk = (v) => (v === '' ? '' : String(Math.round(Number(v) * rate)));
  const [price, setPrice] = useState({ min: toShown(p.minPrice), max: toShown(p.maxPrice) });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPrice({ min: toShown(p.minPrice), max: toShown(p.maxPrice) }), [p.minPrice, p.maxPrice, rate]);
  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [slug, p.page]);

  const update = (patch) => {
    const next = { ...p, ...patch };
    if (!('page' in patch)) delete next.page;
    for (const k of Object.keys(next)) if (next[k] === '' || next[k] == null) delete next[k];
    setParams(next);
  };
  const toggleList = (key, value) => {
    const list = (p[key] || '').split(',').filter(Boolean);
    update({ [key]: (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]).join(',') });
  };
  const has = (key, value) => (p[key] || '').split(',').includes(value);

  if (error) return <ErrorBox error={error} />;

  const title = search
    ? tx(`Výsledky pro „${p.q || ''}“`, `Results for “${p.q || ''}”`)
    : category?.name || (p.sale ? tx('Akční nabídka', 'Special offers') : p.isNew ? tx('Novinky', 'New in') : p.sort === 'trending' ? tx('Právě frčí', 'Trending now') : tx('Všechny produkty', 'All products'));
  const crumbs = [];
  if (category?.parent?.parent) crumbs.push({ label: category.parent.parent.name, to: `/obchod/${category.parent.parent.slug}` });
  if (category?.parent) crumbs.push({ label: category.parent.name, to: `/obchod/${category.parent.slug}` });
  crumbs.push({ label: title });

  const activeCount = ['tags', 'brand', 'minPrice', 'maxPrice', 'inStock', 'sale', 'isNew'].filter((k) => p[k]).length;

  return (
    <div className="container page">
      <Breadcrumbs items={title === tx('Všechny produkty', 'All products') ? [{ label: tx('Obchod', 'Shop') }] : [{ label: tx('Obchod', 'Shop'), to: '/obchod' }, ...crumbs]} />
      <header className="page-head shop-head" style={category ? { '--tint': category.color || 'var(--primary)' } : undefined}>
        <div>
          <h1>{category?.icon} {title}</h1>
          {category?.description && <p>{category.description}</p>}
        </div>
        {data && <span className="muted">{data.total} {plural(data.total, 'produkt', 'produkty', 'produktů', ['product', 'products'])}</span>}
      </header>

      {category?.children?.length > 0 && (
        <div className="subcats">
          {category.children.map((c) => (
            <Link key={c.id} to={`/obchod/${c.slug}`} className="subcat">
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="shop-layout">
        <aside className={`filters ${filtersOpen ? 'open' : ''}`}>
          <div className="filters-head mobile-only">
            <h3>{tx('Filtry', 'Filters')}</h3>
            <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label={tx('Zavřít', 'Close')}><Icon name="close" /></button>
          </div>

          <div className="filter-block">
            <h4>{tx('Dostupnost', 'Availability')}</h4>
            <label className="check"><input type="checkbox" checked={p.inStock === '1'} onChange={(e) => update({ inStock: e.target.checked ? '1' : '' })} /> {tx('Skladem', 'In stock')}</label>
            <label className="check"><input type="checkbox" checked={p.sale === '1'} onChange={(e) => update({ sale: e.target.checked ? '1' : '' })} /> {tx('V akci', 'On sale')}</label>
            <label className="check"><input type="checkbox" checked={p.isNew === '1'} onChange={(e) => update({ isNew: e.target.checked ? '1' : '' })} /> {tx('Novinky', 'New in')}</label>
          </div>

          {data?.facets.tags.length > 0 && (
            <div className="filter-block">
              <h4>{tx('Vlastnosti', 'Properties')}</h4>
              <div className="tag-filter">
                {data.facets.tags.map((t) => (
                  <button key={t.name} className={`chip chip-btn ${has('tags', t.name) ? 'active' : ''}`} onClick={() => toggleList('tags', t.name)}>
                    {TAGS[t.name]?.emoji} {tagLabel(t.name)} <small>{t.count}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {data && (
            <form className="filter-block" onSubmit={(e) => { e.preventDefault(); update({ minPrice: toCzk(price.min), maxPrice: toCzk(price.max) }); }}>
              <h4>{tx('Cena (Kč)', `Price (${currency})`)}</h4>
              <div className="price-range">
                <input type="number" min="0" placeholder={Math.floor(data.facets.minPrice / rate)} value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} aria-label={tx('Cena od', 'Price from')} />
                <span>–</span>
                <input type="number" min="0" placeholder={Math.ceil(data.facets.maxPrice / rate)} value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} aria-label={tx('Cena do', 'Price to')} />
              </div>
              <button className="btn btn-ghost btn-sm btn-block">{tx('Použít', 'Apply')}</button>
            </form>
          )}

          {data?.facets.brands.length > 0 && (
            <div className="filter-block">
              <h4>{tx('Značka', 'Brand')}</h4>
              {data.facets.brands.map((b) => (
                <label key={b.name} className="check">
                  <input type="checkbox" checked={has('brand', b.name)} onChange={() => toggleList('brand', b.name)} />
                  {b.name} <small className="muted">({b.count})</small>
                </label>
              ))}
            </div>
          )}

          {activeCount > 0 && (
            <button className="btn btn-ghost btn-block" onClick={() => setParams(p.q ? { q: p.q } : {})}>{tx('Zrušit filtry', 'Clear filters')}</button>
          )}
        </aside>

        <div>
          <div className="toolbar">
            <button className="btn btn-ghost btn-sm mobile-only" onClick={() => setFiltersOpen(true)}>
              <Icon name="filter" size={16} /> {tx('Filtry', 'Filters')} {activeCount > 0 && `(${activeCount})`}
            </button>
            <div className="sort-tabs">
              {SORTS.map(([v, l]) => (
                <button key={v} className={(p.sort || 'newest') === v ? 'active' : ''} onClick={() => update({ sort: v })}>{l}</button>
              ))}
            </div>
          </div>

          {loading && !data ? (
            <div className="product-grid">{Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}</div>
          ) : data?.products.length ? (
            <div className={loading ? 'loading-dim' : ''}>
              <ProductGrid products={data.products} />
              <Pagination page={data.page} pages={data.pages} onChange={(n) => update({ page: String(n) })} />
            </div>
          ) : (
            <Empty emoji="🔍" title={tx('Nic jsme nenašli', 'Nothing found')} action={<button className="btn btn-primary" onClick={() => setParams({})}>{tx('Zrušit filtry', 'Clear filters')}</button>}>
              {tx('Zkuste upravit filtry nebo hledaný výraz.', 'Try adjusting the filters or your search term.')}
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
