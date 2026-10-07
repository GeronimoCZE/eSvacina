import fs from 'node:fs';
import path from 'node:path';
import express, { Router } from 'express';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import { localize } from '../lib/i18n.js';
import { getSettings, localizeSettings } from '../lib/settings.js';
import { withStats, cardSelect } from '../lib/products.js';
import { getRates } from '../lib/rates.js';
import { renderOgImage } from '../lib/og.js';

const router = Router();

/* ------------------------------ helpers ------------------------------ */

/** Split "/en/produkt/x" into { lang: 'en', path: '/produkt/x' }. */
export function splitLang(pathname) {
  const clean = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  if (clean === '/en' || clean.startsWith('/en/')) return { lang: 'en', path: clean.slice(3) || '/' };
  return { lang: 'cs', path: clean };
}

const withLang = (p, lang) => (lang === 'en' ? (p === '/' ? '/en' : `/en${p}`) : p);
const abs = (p) => `${config.publicUrl}${p}`;

/** Plain-text excerpt from markdown, cut on a word boundary. */
export function plain(md, max = 160) {
  if (!md) return '';
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+\.|\|)\s*/gm, '')
    .replace(/[*_`|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

const T = {
  cs: {
    shop: 'Všechny produkty', shopDesc: 'Zdravé potraviny, svačiny, proteiny, ořechy a superpotraviny. Doprava zdarma nad 1 500 Kč.',
    search: 'Vyhledávání', recipes: 'Zdravé recepty', recipesDesc: 'Recepty se surovinami, které si přidáte do košíku jedním kliknutím.',
    blog: 'Blog', blogDesc: 'Články o výživě, zdravém stravování a tipy na svačiny.', cart: 'Košík', checkout: 'Pokladna',
    order: 'Objednávka', login: 'Přihlášení', register: 'Registrace', account: 'Můj účet', notFound: 'Stránka nenalezena',
    home: 'Domů', minutes: (n) => `${n} min`,
  },
  en: {
    shop: 'All products', shopDesc: 'Healthy food, snacks, protein, nuts and superfoods. Free shipping over 1,500 CZK.',
    search: 'Search', recipes: 'Healthy recipes', recipesDesc: 'Recipes with ingredients you can add to your cart in one click.',
    blog: 'Blog', blogDesc: 'Articles on nutrition, healthy eating and snack ideas.', cart: 'Cart', checkout: 'Checkout',
    order: 'Order', login: 'Sign in', register: 'Create account', account: 'My account', notFound: 'Page not found',
    home: 'Home', minutes: (n) => `${n} min`,
  },
};

function breadcrumbs(items, lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(withLang(p, lang)) })),
  };
}

/** Category chain from root to the given category. */
async function categoryChain(categoryId) {
  const chain = [];
  let id = categoryId;
  while (id) {
    const c = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true, slug: true, parentId: true, translations: true } });
    if (!c) break;
    chain.unshift(c);
    id = c.parentId;
  }
  return chain;
}

/* ------------------------------- meta -------------------------------- */

/**
 * Everything a page needs in <head>: title, description, canonical and
 * hreflang links, Open Graph/Twitter tags and JSON-LD structured data.
 */
export async function buildMeta(pathname) {
  const { lang, path: p } = splitLang(pathname);
  const key = `seo:${lang}:${p}`;
  const hit = await cacheGet(key);
  if (hit) return hit;

  const settings = localizeSettings(await getSettings(), lang);
  const t = T[lang];
  const site = settings.general.siteName;
  const L = (row) => localize(row, lang);
  const meta = {
    lang,
    path: p,
    title: settings.seo.metaTitle,
    description: settings.seo.metaDescription,
    keywords: settings.seo.keywords,
    type: 'website',
    image: abs(`/og/site/home.png?lang=${lang}`),
    imageAlt: site,
    robots: 'index, follow',
    status: 200,
    jsonLd: [],
    extra: {},
  };
  const titled = (title) => `${title} | ${site}`;
  const seg = p.split('/').filter(Boolean);

  if (p === '/') {
    meta.jsonLd.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site,
        url: abs('/'),
        logo: abs('/favicon.svg'),
        email: settings.general.contactEmail,
        telephone: settings.general.contactPhone,
        sameAs: Object.values(settings.social).filter(Boolean),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site,
        url: abs(withLang('/', lang)),
        inLanguage: lang,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: abs(`${withLang('/hledat', lang)}?q={search_term_string}`) },
          'query-input': 'required name=search_term_string',
        },
      }
    );
  } else if (seg[0] === 'produkt' && seg[1]) {
    const raw = await prisma.product.findFirst({
      where: { slug: seg[1], active: true },
      select: { ...cardSelect, description: true, sku: true, updatedAt: true, categoryId: true },
    });
    if (!raw) return notFoundMeta(meta, t, titled);
    const [product] = (await withStats([raw])).map(L);
    const chain = (await categoryChain(raw.categoryId)).map(L);
    meta.title = titled(product.brand ? `${product.name} – ${product.brand}` : product.name);
    meta.description = plain(product.shortDescription || product.description);
    meta.image = abs(`/og/product/${product.slug}.png?lang=${lang}`);
    meta.imageAlt = product.name;
    meta.type = 'product';
    meta.extra = {
      'product:price:amount': product.finalPrice.toFixed(2),
      'product:price:currency': 'CZK',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:brand': product.brand || site,
    };
    if (lang === 'en') {
      const rates = await getRates();
      const cur = rates.defaultCurrency;
      meta.extra['og:price:alt'] = `${(product.finalPrice / rates.rates[cur]).toFixed(2)} ${cur}`;
    }
    const url = abs(withLang(p, lang));
    meta.jsonLd.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: plain(product.description, 500),
        sku: product.sku || undefined,
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        category: chain.map((c) => c.name).join(' > '),
        image: product.images?.length ? product.images.map((i) => (i.startsWith('http') ? i : abs(i))) : [meta.image],
        url,
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'CZK',
          price: product.finalPrice.toFixed(2),
          availability: `https://schema.org/${product.stock > 0 ? 'InStock' : 'OutOfStock'}`,
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: site },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CZ' },
            shippingRate: { '@type': 'MonetaryAmount', currency: 'CZK', value: product.finalPrice >= settings.shipping.freeShippingThreshold ? 0 : Math.min(...settings.shipping.methods.filter((m) => m.active && m.price > 0).map((m) => m.price)) },
          },
        },
        ...(product.reviewCount
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 } }
          : {}),
      },
      breadcrumbs([[t.home, '/'], ...chain.map((c) => [c.name, `/obchod/${c.slug}`]), [product.name, p]], lang)
    );
  } else if (seg[0] === 'obchod' && seg[1]) {
    const raw = await prisma.category.findFirst({ where: { slug: seg[1], active: true } });
    if (!raw) return notFoundMeta(meta, t, titled);
    const category = L(raw);
    const chain = (await categoryChain(raw.id)).map(L);
    const count = await prisma.product.count({ where: { active: true, category: { OR: [{ id: raw.id }, { parentId: raw.id }] } } });
    meta.title = titled(category.name);
    meta.description = plain(category.description || `${category.name} – ${t.shopDesc}`);
    meta.image = abs(`/og/category/${category.slug}.png?lang=${lang}`);
    meta.imageAlt = category.name;
    meta.jsonLd.push(
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: category.name, description: meta.description, url: abs(withLang(p, lang)), numberOfItems: count },
      breadcrumbs([[t.home, '/'], ...chain.map((c) => [c.name, `/obchod/${c.slug}`])], lang)
    );
  } else if (seg[0] === 'obchod') {
    meta.title = titled(t.shop);
    meta.description = t.shopDesc;
  } else if (seg[0] === 'hledat') {
    meta.title = titled(t.search);
    meta.robots = 'noindex, follow';
  } else if (seg[0] === 'recepty' && seg[1]) {
    const raw = await prisma.recipe.findFirst({ where: { slug: seg[1], published: true }, include: { ingredients: { orderBy: { sortOrder: 'asc' } } } });
    if (!raw) return notFoundMeta(meta, t, titled);
    const recipe = L(raw);
    meta.title = titled(recipe.title);
    meta.description = plain(recipe.excerpt || recipe.instructions);
    meta.image = abs(`/og/recipe/${recipe.slug}.png?lang=${lang}`);
    meta.imageAlt = recipe.title;
    meta.type = 'article';
    const steps = recipe.instructions.split('\n').filter((l) => /^\s*\d+\./.test(l)).map((l) => plain(l, 500));
    meta.jsonLd.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: recipe.title,
        description: meta.description,
        image: [meta.image],
        author: { '@type': 'Organization', name: site },
        datePublished: raw.createdAt.toISOString(),
        prepTime: `PT${recipe.prepMinutes}M`,
        totalTime: `PT${recipe.prepMinutes}M`,
        recipeYield: String(recipe.servings),
        keywords: recipe.tags.join(', '),
        recipeIngredient: recipe.ingredients.map((i) => [i.amount, i.name].filter(Boolean).join(' ')),
        recipeInstructions: steps.map((text) => ({ '@type': 'HowToStep', text })),
      },
      breadcrumbs([[t.home, '/'], [t.recipes, '/recepty'], [recipe.title, p]], lang)
    );
  } else if (seg[0] === 'recepty') {
    meta.title = titled(t.recipes);
    meta.description = t.recipesDesc;
  } else if (seg[0] === 'blog' && seg[1]) {
    const raw = await prisma.blogPost.findFirst({ where: { slug: seg[1], published: true }, include: { author: { select: { firstName: true, lastName: true } } } });
    if (!raw) return notFoundMeta(meta, t, titled);
    const post = L(raw);
    meta.title = titled(post.title);
    meta.description = plain(post.excerpt || post.content);
    meta.image = abs(`/og/post/${post.slug}.png?lang=${lang}`);
    meta.imageAlt = post.title;
    meta.type = 'article';
    meta.extra = {
      'article:published_time': raw.publishedAt?.toISOString(),
      'article:modified_time': raw.updatedAt.toISOString(),
      'article:tag': post.tags.join(', '),
    };
    meta.jsonLd.push(
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: meta.description,
        image: [meta.image],
        datePublished: raw.publishedAt?.toISOString(),
        dateModified: raw.updatedAt.toISOString(),
        inLanguage: lang,
        author: { '@type': 'Person', name: post.author ? `${post.author.firstName} ${post.author.lastName}` : site },
        publisher: { '@type': 'Organization', name: site, logo: { '@type': 'ImageObject', url: abs('/favicon.svg') } },
        mainEntityOfPage: abs(withLang(p, lang)),
      },
      breadcrumbs([[t.home, '/'], [t.blog, '/blog'], [post.title, p]], lang)
    );
  } else if (seg[0] === 'blog') {
    meta.title = titled(t.blog);
    meta.description = t.blogDesc;
  } else if (seg[0] === 'stranka' && seg[1]) {
    const raw = await prisma.page.findUnique({ where: { slug: seg[1] } });
    if (!raw) return notFoundMeta(meta, t, titled);
    const page = L(raw);
    meta.title = titled(page.title);
    meta.description = plain(page.content.replace(/^\*[^*]+\*\s*/, ''));
    meta.image = abs(`/og/page/${page.slug}.png?lang=${lang}`);
    meta.imageAlt = page.title;
  } else {
    const privatePages = { kosik: t.cart, pokladna: t.checkout, objednavka: t.order, prihlaseni: t.login, registrace: t.register, ucet: t.account };
    if (privatePages[seg[0]]) {
      meta.title = titled(privatePages[seg[0]]);
      meta.robots = 'noindex, nofollow';
    } else {
      return notFoundMeta(meta, t, titled);
    }
  }

  meta.canonical = abs(withLang(p, lang));
  meta.alternates = meta.robots.startsWith('noindex')
    ? []
    : [
        { hreflang: 'cs', href: abs(withLang(p, 'cs')) },
        ...(settings.localization.enableEnglish ? [{ hreflang: 'en', href: abs(withLang(p, 'en')) }] : []),
        { hreflang: 'x-default', href: abs(withLang(p, 'cs')) },
      ];
  meta.siteName = site;
  meta.locale = lang === 'en' ? 'en_US' : 'cs_CZ';
  meta.localeAlternate = lang === 'en' ? 'cs_CZ' : 'en_US';
  await cacheSet(key, meta, 300);
  return meta;
}

function notFoundMeta(meta, t, titled) {
  return { ...meta, title: titled(t.notFound), robots: 'noindex, follow', status: 404, alternates: [], canonical: null, jsonLd: [] };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Render meta as HTML tags; every tag carries data-seo so the client can replace them on navigation. */
export function renderHead(meta) {
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta data-seo name="description" content="${esc(meta.description)}">`,
    meta.keywords && `<meta data-seo name="keywords" content="${esc(meta.keywords)}">`,
    `<meta data-seo name="robots" content="${esc(meta.robots)}">`,
    meta.canonical && `<link data-seo rel="canonical" href="${esc(meta.canonical)}">`,
    ...(meta.alternates || []).map((a) => `<link data-seo rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}">`),
    `<meta data-seo property="og:site_name" content="${esc(meta.siteName)}">`,
    `<meta data-seo property="og:type" content="${esc(meta.type)}">`,
    `<meta data-seo property="og:title" content="${esc(meta.title)}">`,
    `<meta data-seo property="og:description" content="${esc(meta.description)}">`,
    meta.canonical && `<meta data-seo property="og:url" content="${esc(meta.canonical)}">`,
    `<meta data-seo property="og:image" content="${esc(meta.image)}">`,
    `<meta data-seo property="og:image:width" content="1200">`,
    `<meta data-seo property="og:image:height" content="630">`,
    `<meta data-seo property="og:image:alt" content="${esc(meta.imageAlt)}">`,
    `<meta data-seo property="og:locale" content="${meta.locale}">`,
    `<meta data-seo property="og:locale:alternate" content="${meta.localeAlternate}">`,
    ...Object.entries(meta.extra || {}).filter(([, v]) => v).map(([k, v]) => `<meta data-seo property="${k}" content="${esc(v)}">`),
    `<meta data-seo name="twitter:card" content="summary_large_image">`,
    `<meta data-seo name="twitter:title" content="${esc(meta.title)}">`,
    `<meta data-seo name="twitter:description" content="${esc(meta.description)}">`,
    `<meta data-seo name="twitter:image" content="${esc(meta.image)}">`,
    ...(meta.jsonLd || []).map((d) => `<script data-seo type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`),
  ];
  return tags.filter(Boolean).join('\n    ');
}

/* ------------------------------ routes ------------------------------- */

router.get('/api/seo', async (req, res) => {
  const meta = await buildMeta(String(req.query.path || '/'));
  res.json({ meta, html: renderHead(meta) });
});

router.get('/robots.txt', async (_req, res) => {
  const privatePaths = ['/admin', '/ucet', '/pokladna', '/kosik', '/objednavka', '/hledat', '/api/'];
  const lines = ['User-agent: *', 'Allow: /'];
  for (const p of privatePaths) lines.push(`Disallow: ${p}`, `Disallow: /en${p}`);
  lines.push('', `Sitemap: ${abs('/sitemap.xml')}`, '');
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(lines.join('\n'));
});

router.get('/sitemap.xml', async (_req, res) => {
  const cachedXml = await cacheGet('seo:sitemap');
  if (cachedXml) return res.type('application/xml').send(cachedXml);
  const settings = await getSettings();
  const english = settings.localization.enableEnglish;
  const [products, categories, recipes, posts, pages] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true, images: true } }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
    settings.features.recipes ? prisma.recipe.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }) : [],
    settings.features.blog ? prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }) : [],
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const entries = [
    ['/', null, 'daily', '1.0'],
    ['/obchod', null, 'daily', '0.9'],
    ...(settings.features.recipes ? [['/recepty', null, 'weekly', '0.7']] : []),
    ...(settings.features.blog ? [['/blog', null, 'weekly', '0.7']] : []),
    ...categories.map((c) => [`/obchod/${c.slug}`, c.createdAt, 'daily', '0.8']),
    ...products.map((p) => [`/produkt/${p.slug}`, p.updatedAt, 'weekly', '0.8']),
    ...recipes.map((r) => [`/recepty/${r.slug}`, r.updatedAt, 'monthly', '0.6']),
    ...posts.map((p) => [`/blog/${p.slug}`, p.updatedAt, 'monthly', '0.6']),
    ...pages.map((p) => [`/stranka/${p.slug}`, p.updatedAt, 'yearly', '0.3']),
  ];
  const langs = english ? ['cs', 'en'] : ['cs'];
  const urls = entries.flatMap(([p, lastmod, freq, prio]) =>
    langs.map((lang) => {
      const alts = langs.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(abs(withLang(p, l)))}"/>`).join('');
      return `<url><loc>${esc(abs(withLang(p, lang)))}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${freq}</changefreq><priority>${prio}</priority>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs(p))}"/></url>`;
    })
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  await cacheSet('seo:sitemap', xml, 3600);
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
});

router.get('/og/:type/:file', async (req, res, next) => {
  const m = req.params.file.match(/^([a-z0-9-]+)\.png$/);
  if (!m) return next();
  const lang = req.query.lang === 'en' ? 'en' : 'cs';
  const png = await renderOgImage(req.params.type, m[1], lang);
  if (!png) return next();
  res.type('image/png').set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400').send(png);
});

export default router;

/* --------------------------- client serving --------------------------- */

/**
 * In production the API also serves the built storefront. HTML responses get
 * the page's real title, description, Open Graph tags and JSON-LD injected,
 * so crawlers and link previews see them without running JavaScript.
 */
export function serveClient(app) {
  if (!config.clientDist) return;
  const dist = path.resolve(config.clientDist);
  const indexFile = path.join(dist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.warn(`[seo] CLIENT_DIST set but ${indexFile} is missing; not serving the storefront`);
    return;
  }
  const template = fs.readFileSync(indexFile, 'utf8');
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (/^\/(api|uploads|og)\//.test(req.path)) return next();
    try {
      const isAdmin = req.path === '/admin' || req.path.startsWith('/admin/');
      const meta = isAdmin
        ? { ...(await buildMeta('/prihlaseni')), title: 'Administrace', robots: 'noindex, nofollow' }
        : await buildMeta(req.path);
      const html = template
        .replace(/<html lang="[^"]*"/, `<html lang="${meta.lang}"`)
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace(/<meta name="description"[^>]*>/, '')
        .replace('</head>', `    ${renderHead(meta)}\n  </head>`);
      res.status(meta.status).type('html').set('Cache-Control', 'no-cache').send(html);
    } catch (err) {
      next(err);
    }
  });
}
