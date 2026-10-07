import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import Stars from '../components/Stars.jsx';
import Markdown from '../components/Markdown.jsx';
import Reveal from '../components/Reveal.jsx';
import { ProductGrid } from '../components/ProductCard.jsx';
import { Breadcrumbs, ErrorBox, QuantityInput, Spinner } from '../components/Misc.jsx';
import { api, assetUrl } from '../lib/api.js';
import { useFetch } from '../lib/useFetch.js';
import { DIFFICULTY, formatDate, plural, TAGS, tagLabel } from '../lib/format.js';
import { tx } from '../lib/i18n.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useInteractions } from '../context/InteractionsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

const NUTRITION_LABELS = [
  ['energy', tx('Energetická hodnota', 'Energy'), 'kcal'],
  ['fat', tx('Tuky', 'Fat'), 'g'],
  ['saturated', tx('  z toho nasycené mastné kyseliny', '  of which saturates'), 'g'],
  ['carbs', tx('Sacharidy', 'Carbohydrate'), 'g'],
  ['sugar', tx('  z toho cukry', '  of which sugars'), 'g'],
  ['fiber', tx('Vláknina', 'Fibre'), 'g'],
  ['protein', tx('Bílkoviny', 'Protein'), 'g'],
  ['salt', tx('Sůl', 'Salt'), 'g'],
];

function Gallery({ product }) {
  const [active, setActive] = useState(0);
  const images = product.images || [];
  return (
    <div className="gallery">
      <div className="gallery-main">
        {images.length ? (
          <img src={assetUrl(images[active])} alt={product.name} />
        ) : (
          <ProductVisual product={product} size="xl" />
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button key={src} className={i === active ? 'active' : ''} onClick={() => setActive(i)} aria-label={tx(`Obrázek ${i + 1}`, `Image ${i + 1}`)}>
              <img src={assetUrl(src)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Reviews({ product, me, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, reload } = useFetch(`/products/${product.id}/reviews`);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post(`/products/${product.id}/reviews`, form);
      toast.success(d.pending ? tx('Děkujeme! Recenze se zobrazí po schválení.', 'Thank you! Your review will appear once approved.') : tx('Děkujeme za recenzi!', 'Thanks for your review!'));
      setForm({ rating: 5, title: '', comment: '' });
      reload();
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const total = data?.reviews.length || 0;

  return (
    <div className="reviews">
      <div className="reviews-summary">
        <div className="big-rating">
          <strong>{product.rating ? product.rating.toFixed(1) : '–'}</strong>
          <Stars value={product.rating || 0} size={20} />
          <span className="muted">{total} {plural(total, 'recenze', 'recenze', 'recenzí', ['review', 'reviews'])}</span>
        </div>
        <div className="dist">
          {data?.distribution.map((d) => (
            <div key={d.stars} className="dist-row">
              <span>{d.stars} ★</span>
              <div className="dist-bar"><div style={{ width: total ? `${(d.count / total) * 100}%` : 0 }} /></div>
              <span className="muted">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="review-gate">
        {!user ? (
          <p><Icon name="shield" size={16} /> {tx('Recenze mohou psát jen ověření zákazníci.', 'Only verified customers can write reviews.')} <Link to="/prihlaseni">{tx('Přihlaste se', 'Sign in')}</Link>{tx(', pokud jste produkt zakoupili.', ' if you have bought this product.')}</p>
        ) : me?.reviewed ? (
          <p><Icon name="check" size={16} /> {tx('Tento produkt jste už ohodnotili. Děkujeme!', 'You have already reviewed this product. Thank you!')}</p>
        ) : me?.canReview ? (
          <form onSubmit={submit} className="review-form">
            <h4>{tx('Napište recenzi', 'Write a review')}</h4>
            <div className="field">
              <label>{tx('Vaše hodnocení', 'Your rating')}</label>
              <Stars value={form.rating} size={28} onChange={(rating) => setForm({ ...form, rating })} />
            </div>
            <div className="field">
              <label htmlFor="rt">{tx('Nadpis (nepovinné)', 'Title (optional)')}</label>
              <input id="rt" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="rc">{tx('Recenze', 'Review')}</label>
              <textarea id="rc" rows={4} required minLength={5} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder={tx('Jak vám produkt chutnal? Co byste vyzdvihli?', 'How did you like it? What stood out for you?')} />
            </div>
            <button className="btn btn-primary" disabled={busy}>{tx('Odeslat recenzi', 'Submit review')}</button>
          </form>
        ) : (
          <p><Icon name="shield" size={16} /> {tx('Recenzi můžete napsat, jakmile si produkt zakoupíte a objednávka bude zaplacena.', 'You can write a review once you have bought the product and your order has been paid.')}</p>
        )}
      </div>

      {data?.reviews.map((r) => (
        <article key={r.id} className="review">
          <div className="review-head">
            <span className="avatar">{r.author[0]}</span>
            <div>
              <strong>{r.author}</strong>
              <small className="verified"><Icon name="check" size={12} /> {tx('Ověřený nákup', 'Verified purchase')} · {formatDate(r.createdAt)}</small>
            </div>
            <Stars value={r.rating} size={14} />
          </div>
          {r.title && <h5>{r.title}</h5>}
          <p>{r.comment}</p>
        </article>
      ))}
      {data && total === 0 && <p className="muted">{tx('Zatím tu nejsou žádné recenze.', 'No reviews yet.')}</p>}
    </div>
  );
}

function Questions({ product }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, reload } = useFetch(`/products/${product.id}/questions`);
  const [body, setBody] = useState('');
  const [answering, setAnswering] = useState(null);
  const [answer, setAnswer] = useState('');

  const ask = async (e) => {
    e.preventDefault();
    try {
      const d = await api.post(`/products/${product.id}/questions`, { body });
      toast.success(d.pending ? tx('Dotaz odeslán, zobrazí se po schválení.', 'Question sent. It will appear once approved.') : tx('Dotaz byl přidán.', 'Your question has been added.'));
      setBody('');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const reply = async (e, qid) => {
    e.preventDefault();
    try {
      await api.post(`/products/questions/${qid}/answers`, { body: answer });
      setAnswer('');
      setAnswering(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="questions">
      {user ? (
        <form onSubmit={ask} className="ask-form">
          <textarea rows={2} required minLength={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={tx('Máte dotaz k produktu? Zeptejte se nás i ostatních zákazníků…', 'Got a question about this product? Ask us and other customers…')} aria-label={tx('Váš dotaz', 'Your question')} />
          <button className="btn btn-primary">{tx('Zeptat se', 'Ask')}</button>
        </form>
      ) : (
        <p className="review-gate"><Icon name="chat" size={16} /> {tx('Pro položení dotazu se', 'To ask a question, please')} <Link to="/prihlaseni">{tx('přihlaste', 'sign in')}</Link>.</p>
      )}
      {data?.questions.map((q) => (
        <article key={q.id} className="question">
          <div className="q-body">
            <span className="q-mark">Q</span>
            <div>
              <p>{q.body}</p>
              <small className="muted">{q.author} · {formatDate(q.createdAt)}</small>
            </div>
          </div>
          {q.answers.map((a) => (
            <div key={a.id} className={`answer ${a.staff ? 'staff' : ''}`}>
              <span className="q-mark">A</span>
              <div>
                <p>{a.body}</p>
                <small className="muted">{a.staff ? <strong>{a.author}</strong> : a.author} · {formatDate(a.createdAt)}</small>
              </div>
            </div>
          ))}
          {user && (answering === q.id ? (
            <form onSubmit={(e) => reply(e, q.id)} className="ask-form answer-form">
              <textarea rows={2} required minLength={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={tx('Vaše odpověď…', 'Your answer…')} aria-label={tx('Odpověď', 'Answer')} autoFocus />
              <div className="row gap">
                <button className="btn btn-primary btn-sm">{tx('Odpovědět', 'Reply')}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAnswering(null)}>{tx('Zrušit', 'Cancel')}</button>
              </div>
            </form>
          ) : (
            <button className="link-btn" onClick={() => setAnswering(q.id)}>{tx('Odpovědět', 'Reply')}</button>
          ))}
        </article>
      ))}
      {data && data.questions.length === 0 && <p className="muted">{tx('Zatím žádné dotazy. Buďte první!', 'No questions yet. Be the first!')}</p>}
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useFetch(`/products/${slug}`);
  const { user } = useAuth();
  const { settings } = useSettings();
  const { money } = useLocale();
  const { add } = useCart();
  const { favorites, reactions, toggleFavorite, react, countsFor } = useInteractions();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');

  useEffect(() => {
    setQty(1);
    setTab('desc');
  }, [slug]);

  // Re-fetch personalised fields after login/logout.
  useEffect(() => {
    if (data) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (data?.product?.id) api.post(`/products/${data.product.id}/view`).catch(() => {});
  }, [data?.product?.id]);

  if (error) return <ErrorBox error={error} />;
  if (loading && !data) return <Spinner />;
  const { product, related, me } = data;
  const { features, shop } = settings;
  const fav = favorites.has(product.id);
  const reaction = reactions[product.id];
  const counts = countsFor(product);
  const cat = product.category;
  const crumbs = [];
  if (cat.parent?.parent) crumbs.push({ label: cat.parent.parent.name, to: `/obchod/${cat.parent.parent.slug}` });
  if (cat.parent) crumbs.push({ label: cat.parent.name, to: `/obchod/${cat.parent.slug}` });
  crumbs.push({ label: cat.name, to: `/obchod/${cat.slug}` }, { label: product.name });

  const tabs = [
    ['desc', tx('Popis', 'Description')],
    ['nutrition', tx('Nutriční hodnoty', 'Nutrition')],
    ['ingredients', tx('Složení', 'Ingredients')],
    ...(features.reviews ? [['reviews', tx(`Recenze (${product.reviewCount})`, `Reviews (${product.reviewCount})`)]] : []),
    ...(features.questions ? [['questions', tx('Dotazy', 'Questions')]] : []),
  ];

  return (
    <div className="container page">
      <Breadcrumbs items={crumbs} />
      <div className="pdp">
        <Reveal><Gallery product={product} /></Reveal>
        <Reveal delay={80} className="pdp-info">
          <div className="pdp-brand">{product.brand}</div>
          <h1>{product.name}</h1>
          <div className="pdp-rating">
            {product.rating ? (
              <button className="link-btn" onClick={() => setTab('reviews')}>
                <Stars value={product.rating} /> {product.rating.toFixed(1)} · {product.reviewCount} {plural(product.reviewCount, 'recenze', 'recenze', 'recenzí', ['review', 'reviews'])}
              </button>
            ) : (
              <span className="muted">{tx('Zatím bez recenzí', 'No reviews yet')}</span>
            )}
            {product.weight && <span className="chip">{product.weight}</span>}
          </div>
          {product.shortDescription && <p className="pdp-lead">{product.shortDescription}</p>}
          <div className="chips">
            {product.tags.map((t) => (
              <Link key={t} to={`/obchod?tags=${t}`} className="chip chip-tag">{TAGS[t]?.emoji} {tagLabel(t)}</Link>
            ))}
          </div>

          <div className="pdp-buy">
            <div className="pdp-price">
              <strong>{money(product.finalPrice)}</strong>
              {product.salePrice && (
                <>
                  <s>{money(product.price)}</s>
                  <span className="badge badge-sale">−{product.discountPercent} %</span>
                </>
              )}
            </div>
            <div className={`stock ${product.stock === 0 ? 'out' : product.stock <= shop.lowStockThreshold ? 'low' : ''}`}>
              <span className="stock-dot" />
              {product.stock === 0 ? tx('Momentálně vyprodáno', 'Currently sold out') : product.stock <= shop.lowStockThreshold ? tx(`Poslední kusy (${product.stock} ks)`, `Only a few left (${product.stock} pcs)`) : tx('Skladem, odesíláme do 24 hodin', 'In stock, dispatched within 24 hours')}
            </div>
            <div className="pdp-actions">
              <QuantityInput value={qty} onChange={setQty} max={product.stock || 1} />
              <button className="btn btn-primary btn-lg grow" onClick={() => add(product, qty)} disabled={product.stock === 0}>
                <Icon name="cart" /> {tx('Do košíku', 'Add to basket')}
              </button>
              {features.favorites && (
                <button className={`btn btn-ghost btn-lg btn-icon fav-big ${fav ? 'active' : ''}`} onClick={() => toggleFavorite(product)} aria-pressed={fav} aria-label={tx('Oblíbené', 'Favourites')}>
                  <Icon name="heart" fill={fav ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
            {features.reactions && (
              <div className="reactions">
                <span className="muted">{tx('Jak se vám produkt líbí?', 'How do you like this product?')}</span>
                <button className={reaction === 'LIKE' ? 'active like' : ''} onClick={() => react(product, 'LIKE')} aria-pressed={reaction === 'LIKE'}>
                  <Icon name="like" size={18} /> {counts.likes}
                </button>
                <button className={reaction === 'DISLIKE' ? 'active dislike' : ''} onClick={() => react(product, 'DISLIKE')} aria-pressed={reaction === 'DISLIKE'}>
                  <Icon name="dislike" size={18} /> {counts.dislikes}
                </button>
              </div>
            )}
          </div>

          <ul className="pdp-perks">
            <li><Icon name="truck" size={18} /> {tx('Doprava zdarma nad', 'Free delivery over')} {money(settings.shipping.freeShippingThreshold)}</li>
            <li><Icon name="shield" size={18} /> {tx('Vrácení do 14 dnů', '14-day returns')}</li>
            {product.sku && <li className="muted">{tx('Kód', 'Code')}: {product.sku}</li>}
          </ul>
        </Reveal>
      </div>

      <section className="tabs-wrap">
        <div className="tabs" role="tablist">
          {tabs.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="tab-panel" key={tab}>
          {tab === 'desc' && <Markdown>{product.description}</Markdown>}
          {tab === 'nutrition' && (
            product.nutrition ? (
              <table className="nutri">
                <thead><tr><th>{tx('Výživové údaje', 'Nutrition information')}</th><th>{tx('na 100 g', 'per 100 g')}</th></tr></thead>
                <tbody>
                  {NUTRITION_LABELS.filter(([k]) => product.nutrition[k] != null).map(([k, l, u]) => (
                    <tr key={k} className={l.startsWith('  ') ? 'sub' : ''}><td>{l.trim()}</td><td>{product.nutrition[k]} {u}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="muted">{tx('Nutriční hodnoty nejsou k dispozici.', 'Nutrition information is not available.')}</p>
          )}
          {tab === 'ingredients' && (
            <div className="prose">
              <h4>{tx('Složení', 'Ingredients')}</h4><p>{product.ingredients || tx('Neuvedeno.', 'Not specified.')}</p>
              <h4>{tx('Alergeny', 'Allergens')}</h4><p>{product.allergens || tx('Neuvedeno.', 'Not specified.')}</p>
            </div>
          )}
          {tab === 'reviews' && <Reviews product={product} me={me} onChange={reload} />}
          {tab === 'questions' && <Questions product={product} />}
        </div>
      </section>

      {features.recipes && product.recipes.length > 0 && (
        <section className="section">
          <div className="section-head"><div><h2>🍳 {tx('Recepty s tímto produktem', 'Recipes with this product')}</h2></div></div>
          <div className="mini-recipes">
            {product.recipes.map((r) => (
              <Link key={r.id} to={`/recepty/${r.slug}`} className="mini-recipe">
                <span className="mini-recipe-emoji">{r.emoji}</span>
                <span><strong>{r.title}</strong><small>{r.prepMinutes} min · {DIFFICULTY[r.difficulty]}</small></span>
                <Icon name="arrowRight" size={16} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><div><h2>{tx('Mohlo by vás zajímat', 'You might also like')}</h2></div></div>
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
