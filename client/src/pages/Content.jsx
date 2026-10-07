import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Markdown from '../components/Markdown.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import Reveal from '../components/Reveal.jsx';
import { Breadcrumbs, Empty, ErrorBox, Pagination, Spinner } from '../components/Misc.jsx';
import { RecipeCard, PostCard } from './Home.jsx';
import { useFetch } from '../lib/useFetch.js';
import { qs } from '../lib/api.js';
import { DIFFICULTY, formatDate, plural } from '../lib/format.js';
import { tx } from '../lib/i18n.js';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

export function Recipes() {
  const [params, setParams] = useSearchParams();
  const p = Object.fromEntries(params);
  const { data, loading, error } = useFetch(`/recipes${qs(p)}`);
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="container page">
      <header className="page-head center-head">
        <h1>🍳 {tx('Recepty', 'Recipes')}</h1>
        <p>{tx('Zdravé a chutné recepty. Suroviny přidáte do košíku jedním kliknutím.', 'Healthy, tasty recipes. Add every ingredient to your basket in one click.')}</p>
      </header>
      <div className="chips center-chips">
        <button className={`chip chip-btn ${!p.tag && !p.difficulty ? 'active' : ''}`} onClick={() => setParams({})}>{tx('Vše', 'All')}</button>
        {data?.tags.map((t) => (
          <button key={t} className={`chip chip-btn ${p.tag === t ? 'active' : ''}`} onClick={() => setParams({ tag: t })}>{t}</button>
        ))}
      </div>
      {loading && !data ? <Spinner /> : data.recipes.length ? (
        <div className="recipe-grid">
          {data.recipes.map((r, i) => <Reveal key={r.id} delay={(i % 4) * 60}><RecipeCard recipe={r} /></Reveal>)}
        </div>
      ) : <Empty emoji="🥄" title={tx('Žádné recepty', 'No recipes')} />}
    </div>
  );
}

export function Recipe() {
  const { slug } = useParams();
  const { data, error, loading } = useFetch(`/recipes/${slug}`);
  const { add } = useCart();
  const { money } = useLocale();
  const toast = useToast();
  if (error) return <ErrorBox error={error} />;
  if (loading && !data) return <Spinner />;
  const { recipe, more } = data;
  const linked = recipe.ingredients.filter((i) => i.product && i.product.stock > 0);
  const addAll = () => {
    linked.forEach((i) => add(i.product, 1));
    toast.success(tx(`Do košíku přidáno ${linked.length} ${plural(linked.length, 'surovina', 'suroviny', 'surovin', ['ingredient', 'ingredients'])}.`, `${linked.length} ${plural(linked.length, 'surovina', 'suroviny', 'surovin', ['ingredient', 'ingredients'])} added to your basket.`));
  };

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: tx('Recepty', 'Recipes'), to: '/recepty' }, { label: recipe.title }]} />
      <div className="recipe-hero">
        <Reveal><ProductVisual product={{ ...recipe, images: recipe.image ? [recipe.image] : [] }} color="#f97316" size="xl" /></Reveal>
        <Reveal delay={80}>
          <div className="chips">{recipe.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
          <h1>{recipe.title}</h1>
          <p className="pdp-lead">{recipe.excerpt}</p>
          <div className="recipe-facts">
            <div><Icon name="clock" /><strong>{recipe.prepMinutes} min</strong><small>{tx('příprava', 'prep time')}</small></div>
            <div><Icon name="user" /><strong>{recipe.servings}</strong><small>{tx('porce', recipe.servings === 1 ? 'serving' : 'servings')}</small></div>
            <div><Icon name="star" /><strong>{DIFFICULTY[recipe.difficulty]}</strong><small>{tx('obtížnost', 'difficulty')}</small></div>
          </div>
        </Reveal>
      </div>
      <div className="recipe-body">
        <aside className="card pad ingredients">
          <h2>{tx('Suroviny', 'Ingredients')}</h2>
          <ul>
            {recipe.ingredients.map((i) => (
              <li key={i.id}>
                <span className="ing-amount">{i.amount}</span>
                <span className="ing-name">
                  {i.product ? <Link to={`/produkt/${i.product.slug}`}>{i.name}</Link> : i.name}
                </span>
                {i.product && (
                  <button className="btn btn-ghost btn-xs" onClick={() => add(i.product)} disabled={i.product.stock === 0} title={`${i.product.name} – ${money(i.product.finalPrice)}`}>
                    <Icon name="cart" size={14} /> {money(i.product.finalPrice)}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {linked.length > 0 && (
            <button className="btn btn-primary btn-block" onClick={addAll}><Icon name="cart" size={18} /> {tx('Přidat suroviny do košíku', 'Add ingredients to basket')} ({linked.length})</button>
          )}
        </aside>
        <div className="card pad">
          <h2>{tx('Postup', 'Method')}</h2>
          <Markdown className="steps">{recipe.instructions}</Markdown>
        </div>
      </div>
      {more.length > 0 && (
        <section className="section">
          <div className="section-head"><div><h2>{tx('Další recepty', 'More recipes')}</h2></div></div>
          <div className="recipe-grid grid-3">{more.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
        </section>
      )}
    </div>
  );
}

export function Blog() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const { data, loading, error } = useFetch(`/blog${qs({ page, tag: params.get('tag') })}`);
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="container page">
      <header className="page-head center-head">
        <h1>📰 Blog</h1>
        <p>{tx('Výživa, tipy a inspirace pro zdravější život.', 'Nutrition, tips and inspiration for a healthier life.')}</p>
        {params.get('tag') && <button className="chip chip-btn active" onClick={() => setParams({})}>#{params.get('tag')} ✕</button>}
      </header>
      {loading && !data ? <Spinner /> : data.posts.length ? (
        <>
          <div className="post-grid">{data.posts.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 80}><PostCard post={p} /></Reveal>)}</div>
          <Pagination page={data.page} pages={data.pages} onChange={(n) => setParams({ page: n })} />
        </>
      ) : <Empty emoji="✍️" title={tx('Zatím žádné články', 'No articles yet')} />}
    </div>
  );
}

export function Post() {
  const { slug } = useParams();
  const { data, error, loading } = useFetch(`/blog/${slug}`);
  if (error) return <ErrorBox error={error} />;
  if (loading && !data) return <Spinner />;
  const { post, more } = data;
  return (
    <div className="container page narrow">
      <Breadcrumbs items={[{ label: 'Blog', to: '/blog' }, { label: post.title }]} />
      <article className="article">
        <div className="chips">{post.tags.map((t) => <Link key={t} to={`/blog?tag=${t}`} className="chip">#{t}</Link>)}</div>
        <h1>{post.title}</h1>
        <p className="muted">{post.author && `${post.author.firstName} ${post.author.lastName} · `}{formatDate(post.publishedAt)}</p>
        <ProductVisual product={{ ...post, name: post.title, images: post.coverImage ? [post.coverImage] : [] }} color="#0ea5e9" size="wide" className="article-cover" />
        {post.excerpt && <p className="pdp-lead">{post.excerpt}</p>}
        <Markdown>{post.content}</Markdown>
      </article>
      {more.length > 0 && (
        <section className="section">
          <div className="section-head"><div><h2>{tx('Další články', 'More articles')}</h2></div></div>
          <div className="post-grid">{more.map((p) => <PostCard key={p.id} post={p} />)}</div>
        </section>
      )}
    </div>
  );
}

export function Page() {
  const { slug } = useParams();
  const { data, error, loading } = useFetch(`/pages/${slug}`);
  useEffect(() => window.scrollTo(0, 0), [slug]);
  if (error) return <ErrorBox error={error} />;
  if (loading && !data) return <Spinner />;
  return (
    <div className="container page narrow">
      <Breadcrumbs items={[{ label: data.page.title }]} />
      <article className="article card pad">
        <h1>{data.page.title}</h1>
        <Markdown>{data.page.content}</Markdown>
        {slug === 'cookies' && (
          <button className="btn btn-primary" onClick={() => window.dispatchEvent(new Event('esv:cookies'))}>{tx('Změnit nastavení cookies', 'Change cookie settings')}</button>
        )}
      </article>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="container page">
      <Empty emoji="🥦" title={tx('Stránka nenalezena', 'Page not found')} action={<Link to="/" className="btn btn-primary">{tx('Zpět na úvod', 'Back to home')}</Link>}>
        {tx('Tahle stránka se asi snědla. Zkuste hledání nebo se vraťte na úvod.', 'Looks like this page got eaten. Try searching or head back to the home page.')}
      </Empty>
    </div>
  );
}

export function Maintenance({ message }) {
  const { settings } = useSettings();
  return (
    <div className="maintenance">
      <span>{settings.appearance.logoEmoji}</span>
      <h1>{settings.general.siteName}</h1>
      <p>{message}</p>
      <Link to="/prihlaseni" className="muted small">{tx('Přihlášení pro administrátory', 'Admin sign-in')}</Link>
    </div>
  );
}
