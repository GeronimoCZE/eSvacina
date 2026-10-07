import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import { ErrorBox } from '../components/Misc.jsx';
import { NewsletterForm } from '../components/Footer.jsx';
import { useFetch } from '../lib/useFetch.js';
import { assetUrl } from '../lib/api.js';
import { formatDate, DIFFICULTY } from '../lib/format.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { tx } from '../lib/i18n.js';

function Hero({ banners }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || banners.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [paused, banners.length]);
  if (!banners.length) return null;

  return (
    <section className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {banners.map((b, idx) => (
        <div
          key={b.id}
          className={`hero-slide ${idx === i ? 'active' : ''}`}
          style={{ background: b.background || 'var(--primary)', color: b.textColor || '#fff' }}
          aria-hidden={idx !== i}
        >
          {b.image && <img className="hero-img" src={assetUrl(b.image)} alt="" />}
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="hero-kicker">{tx('eSvačina doporučuje', 'eSvačina recommends')}</span>
              <h1>{b.title}</h1>
              {b.subtitle && <p>{b.subtitle}</p>}
              {b.ctaText && (
                <Link to={b.ctaLink || '/obchod'} className="btn btn-light btn-lg" tabIndex={idx === i ? 0 : -1}>
                  {b.ctaText} <Icon name="arrowRight" size={18} />
                </Link>
              )}
            </div>
            {!b.image && (
              <div className="hero-art" aria-hidden="true">
                <span className="hero-emoji">{b.emoji}</span>
                <span className="hero-orb o1" />
                <span className="hero-orb o2" />
                <span className="hero-orb o3" />
              </div>
            )}
          </div>
        </div>
      ))}
      {banners.length > 1 && (
        <div className="hero-dots">
          {banners.map((b, idx) => (
            <button key={b.id} className={idx === i ? 'active' : ''} onClick={() => setI(idx)} aria-label={`Banner ${idx + 1}`} />
          ))}
        </div>
      )}
    </section>
  );
}

function Rail({ title, subtitle, link, products, emoji }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!products?.length) return null;
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <h2>{emoji} {title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="section-head-actions">
            <button className="icon-btn round" onClick={() => scroll(-1)} aria-label={tx('Posunout zpět', 'Scroll back')}><Icon name="arrowLeft" size={18} /></button>
            <button className="icon-btn round" onClick={() => scroll(1)} aria-label={tx('Posunout dál', 'Scroll forward')}><Icon name="arrowRight" size={18} /></button>
            {link && <Link to={link} className="btn btn-ghost btn-sm">{tx('Zobrazit vše', 'View all')}</Link>}
          </div>
        </Reveal>
        <div className="rail" ref={ref}>
          {products.map((p, idx) => (
            <Reveal key={p.id} delay={Math.min(idx, 6) * 60} className="rail-item">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  ['truck', tx('Doprava zdarma', 'Free delivery'), tx('při nákupu nad 1 500 Kč', 'on orders over 1 500 Kč')],
  ['clock', tx('Expedice do 24 h', 'Dispatched within 24 h'), tx('objednávky skladem', 'for in-stock orders')],
  ['leaf', tx('Poctivé složení', 'Honest ingredients'), tx('pečlivě vybrané produkty', 'carefully chosen products')],
  ['shield', tx('Ověřené recenze', 'Verified reviews'), tx('jen od skutečných zákazníků', 'from real customers only')],
];

export default function Home() {
  const { settings } = useSettings();
  const { money } = useLocale();
  const { data, error, loading } = useFetch('/home');
  const h = settings.homepage;

  if (error) return <ErrorBox error={error} />;

  return (
    <div className="home">
      {h.showHero && (data ? <Hero banners={data.heroBanners} /> : <div className="hero hero-skeleton" />)}

      {h.showBenefits && (
        <div className="container benefits">
          {BENEFITS.map(([icon, title, text], i) => (
            <Reveal key={title} delay={i * 80} className="benefit">
              <span className="benefit-icon"><Icon name={icon} size={22} /></span>
              <span><strong>{title}</strong><small>{text.replace('1 500 Kč', money(settings.shipping.freeShippingThreshold))}</small></span>
            </Reveal>
          ))}
        </div>
      )}

      {h.showCategories && data && (
        <section className="section">
          <div className="container">
            <Reveal className="section-head"><div><h2>{tx('Vyberte si kategorii', 'Shop by category')}</h2><p>{tx('Od proteinů po superpotraviny. Všechno pro zdravější den.', 'From protein to superfoods. Everything for a healthier day.')}</p></div></Reveal>
            <div className="cat-grid">
              {data.categories.map((c, i) => (
                <Reveal key={c.id} delay={i * 40}>
                  <Link to={`/obchod/${c.slug}`} className="cat-tile" style={{ '--tint': c.color }}>
                    <span className="cat-tile-icon">{c.icon}</span>
                    <span>{c.name}</span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div className="container section">
          <div className="product-grid">{Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}</div>
        </div>
      )}

      {data && (
        <>
          {h.showTrending && <Rail emoji="🔥" title={tx('Právě frčí', 'Trending now')} subtitle={tx('Co si zákazníci tento měsíc kupují a lajkují nejvíc', 'What customers are buying and loving most this month')} link="/obchod?sort=trending" products={data.trending} />}

          {data.promoBanners.length > 0 && (
            <section className="container promo-grid">
              {data.promoBanners.map((b, i) => (
                <Reveal key={b.id} delay={i * 80}>
                  <Link to={b.ctaLink || '/obchod'} className="promo" style={{ background: b.background, color: b.textColor }}>
                    <div>
                      <h3>{b.title}</h3>
                      <p>{b.subtitle}</p>
                      <span className="promo-cta">{b.ctaText} <Icon name="arrowRight" size={16} /></span>
                    </div>
                    {b.image ? <img src={assetUrl(b.image)} alt="" /> : <span className="promo-emoji">{b.emoji}</span>}
                  </Link>
                </Reveal>
              ))}
            </section>
          )}

          {h.showNew && <Rail emoji="✨" title={tx('Novinky', 'New in')} subtitle={tx('Čerstvě naskladněné produkty', 'Freshly stocked products')} link="/obchod?isNew=1" products={data.newProducts} />}
          {h.showSale && <Rail emoji="🏷️" title={tx('Akční nabídka', 'Special offers')} subtitle={tx('Ulovte zdravé dobroty za nižší ceny', 'Grab healthy treats for less')} link="/obchod?sale=1" products={data.sale} />}

          {h.showRecipes && settings.features.recipes && data.recipes.length > 0 && (
            <section className="section section-tint">
              <div className="container">
                <Reveal className="section-head">
                  <div><h2>🍳 {tx('Inspirace do kuchyně', 'Kitchen inspiration')}</h2><p>{tx('Recepty, ve kterých koupíte každou surovinu jedním kliknutím', 'Recipes where you can buy every ingredient in one click')}</p></div>
                  <Link to="/recepty" className="btn btn-ghost btn-sm">{tx('Všechny recepty', 'All recipes')}</Link>
                </Reveal>
                <div className="recipe-grid">
                  {data.recipes.map((r, i) => (
                    <Reveal key={r.id} delay={i * 80}>
                      <RecipeCard recipe={r} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {h.showBlog && settings.features.blog && data.posts.length > 0 && (
            <section className="section">
              <div className="container">
                <Reveal className="section-head">
                  <div><h2>📰 {tx('Z našeho blogu', 'From our blog')}</h2><p>{tx('Tipy na zdravé stravování od našich výživových poradců', 'Healthy eating tips from our nutrition advisers')}</p></div>
                  <Link to="/blog" className="btn btn-ghost btn-sm">{tx('Celý blog', 'Full blog')}</Link>
                </Reveal>
                <div className="post-grid">
                  {data.posts.map((p, i) => (
                    <Reveal key={p.id} delay={i * 80}><PostCard post={p} /></Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {h.showNewsletter && settings.features.newsletter && (
        <section className="container">
          <Reveal className="newsletter">
            <div>
              <h2>{tx('Buďte o krok napřed', 'Stay one step ahead')} 💌</h2>
              <p>{tx('Novinky, akce a nové recepty jednou týdně. Žádný spam, odhlásit se můžete jedním klikem.', 'New products, offers and fresh recipes once a week. No spam, unsubscribe in one click.')}</p>
            </div>
            <NewsletterForm big />
          </Reveal>
        </section>
      )}
    </div>
  );
}

export function RecipeCard({ recipe }) {
  return (
    <Link to={`/recepty/${recipe.slug}`} className="card recipe-card">
      <ProductVisual product={{ ...recipe, images: recipe.image ? [recipe.image] : [] }} color="#f97316" size="wide" />
      <div className="recipe-card-body">
        <div className="chips">
          <span className="chip"><Icon name="clock" size={14} /> {recipe.prepMinutes} min</span>
          <span className="chip">{DIFFICULTY[recipe.difficulty]}</span>
        </div>
        <h3>{recipe.title}</h3>
        {recipe.excerpt && <p>{recipe.excerpt}</p>}
      </div>
    </Link>
  );
}

export function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="card post-card">
      <ProductVisual product={{ ...post, name: post.title, images: post.coverImage ? [post.coverImage] : [] }} color="#0ea5e9" size="wide" />
      <div className="post-card-body">
        <small>{post.publishedAt && formatDate(post.publishedAt)}</small>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <span className="read-more">{tx('Číst dál', 'Read more')} <Icon name="arrowRight" size={14} /></span>
      </div>
    </Link>
  );
}
