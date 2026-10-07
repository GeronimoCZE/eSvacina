import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { prisma } from '../db.js';
import { localize } from './i18n.js';
import { getSettings, localizeSettings } from './settings.js';
import { getRates } from './rates.js';
import { createHash } from 'node:crypto';
import { config } from '../config.js';
import { plain } from '../routes/seo.js';

/**
 * Open Graph images (1200×630 PNG) drawn on the server with satori + resvg:
 * the product's photo or emoji, its name, price and the shop's branding.
 */
const require = createRequire(import.meta.url);
const W = 1200;
const H = 630;
const UPLOAD_DIR = path.resolve('uploads');

const fontFile = (subset, weight) =>
  fs.readFileSync(require.resolve(`@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`));
// Basic Latin and Latin Extended (Czech diacritics) are separate files; satori falls back between them.
const FONTS = [400, 700, 800].flatMap((weight) => [
  { name: 'Inter', data: fontFile('latin', weight), weight, style: 'normal' },
  { name: 'InterExt', data: fontFile('latin-ext', weight), weight, style: 'normal' },
]);
const TWEMOJI_DIR = path.dirname(require.resolve('@twemoji/svg/1f004.svg'));

/** Twemoji file name for an emoji: code points in hex, dropping FE0F unless it's a ZWJ sequence. */
function emojiFile(emoji) {
  const points = [...emoji].map((c) => c.codePointAt(0).toString(16));
  const name = (emoji.includes('‍') ? points : points.filter((p) => p !== 'fe0f')).join('-');
  return path.join(TWEMOJI_DIR, `${name}.svg`);
}

function emojiDataUri(emoji) {
  try {
    const svg = fs.readFileSync(emojiFile(emoji));
    return `data:image/svg+xml;base64,${svg.toString('base64')}`;
  } catch {
    return null;
  }
}

async function loadAdditionalAsset(code, segment) {
  if (code === 'emoji') return emojiDataUri(segment) || '';
  return [];
}

/** Local upload as a data URI so resvg never has to fetch anything. */
function imageDataUri(url) {
  if (!url?.startsWith('/uploads/')) return null;
  const file = path.join(UPLOAD_DIR, path.basename(url));
  if (!fs.existsSync(file)) return null;
  const ext = path.extname(file).slice(1).toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return null; // resvg can't decode AVIF
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(file).toString('base64')}`;
}

const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.flat().filter((c) => c !== null && c !== false && c !== undefined) },
});
const img = (src, style) => ({ type: 'img', props: { src, style } });

const LABELS = {
  cs: { product: 'Produkt', recipe: 'Recept', post: 'Blog', category: 'Kategorie', page: 'Informace', min: 'min', servings: 'porce', products: 'produktů' },
  en: { product: 'Product', recipe: 'Recipe', post: 'Blog', category: 'Category', page: 'Info', min: 'min', servings: 'servings', products: 'products' },
};

function formatMoney(czk, lang, rates) {
  if (lang !== 'en') return `${Math.round(czk).toLocaleString('cs-CZ').replace(/ /g, ' ')} Kč`;
  const cur = rates.defaultCurrency;
  return new Intl.NumberFormat(cur === 'USD' ? 'en-US' : 'en-IE', { style: 'currency', currency: cur }).format(czk / rates.rates[cur]);
}

/** Load what the card shows for a given type/slug, already in the right language. */
async function loadSubject(type, slug, lang) {
  const L = (row) => localize(row, lang);
  const t = LABELS[lang];
  if (type === 'product') {
    const p = await prisma.product.findFirst({ where: { slug, active: true }, include: { category: true } });
    if (!p) return null;
    const lp = L(p);
    const final = Number(p.salePrice ?? p.price);
    const rates = await getRates();
    return {
      kicker: lp.category?.name || t.product,
      title: lp.name,
      subtitle: lp.shortDescription,
      emoji: p.emoji || '🥗',
      image: imageDataUri(p.images?.[0]),
      price: formatMoney(final, lang, rates),
      oldPrice: p.salePrice ? formatMoney(Number(p.price), lang, rates) : null,
      badge: p.salePrice ? `−${Math.round((1 - Number(p.salePrice) / Number(p.price)) * 100)}${lang === 'en' ? '' : ' '}%` : null,
      chips: [p.brand, p.weight].filter(Boolean),
      color: p.category?.color,
    };
  }
  if (type === 'recipe') {
    const r = await prisma.recipe.findFirst({ where: { slug, published: true } });
    if (!r) return null;
    const lr = L(r);
    return { kicker: t.recipe, title: lr.title, subtitle: lr.excerpt, emoji: r.emoji || '🍳', image: imageDataUri(r.image), chips: [`⏱ ${r.prepMinutes} ${t.min}`, `🍽 ${r.servings} ${t.servings}`] };
  }
  if (type === 'post') {
    const b = await prisma.blogPost.findFirst({ where: { slug, published: true } });
    if (!b) return null;
    const lb = L(b);
    return { kicker: t.post, title: lb.title, subtitle: lb.excerpt, emoji: b.emoji || '📝', image: imageDataUri(b.coverImage),
      // Tags are stored in Czech only, so the English card leaves them out.
      chips: lang === 'cs' ? b.tags.slice(0, 3).map((x) => `#${x}`) : [] };
  }
  if (type === 'category') {
    const c = await prisma.category.findFirst({ where: { slug, active: true }, include: { _count: { select: { products: true } }, children: { select: { _count: { select: { products: true } } } } } });
    if (!c) return null;
    const lc = L(c);
    const count = c._count.products + c.children.reduce((s, ch) => s + ch._count.products, 0);
    return { kicker: t.category, title: lc.name, subtitle: lc.description, emoji: c.icon || '🛒', image: imageDataUri(c.image), chips: [`${count} ${t.products}`], color: c.color };
  }
  if (type === 'page') {
    const pg = await prisma.page.findUnique({ where: { slug } });
    if (!pg) return null;
    const lpg = L(pg);
    return { kicker: t.page, title: lpg.title, subtitle: plain(lpg.content.replace(/^\*[^*]+\*\s*/, ''), 140), emoji: '📄' };
  }
  if (type === 'site') {
    const s = localizeSettings(await getSettings(), lang);
    return { kicker: s.general.siteName, title: s.general.tagline, subtitle: s.seo.metaDescription, emoji: s.appearance.logoEmoji || '🥑', home: true };
  }
  return null;
}

function card(subject, settings) {
  const primary = settings.appearance.primaryColor || '#16a34a';
  const accent = subject.color || settings.appearance.accentColor || '#f97316';
  const dark = settings.appearance.darkColor || '#0f172a';
  // Simulate word wrapping (Inter ExtraBold ≈ 0.56em per character in a 628px column) so title,
  // subtitle and price never collide: long titles shrink and push the subtitle down to one line.
  const lines = (size, text, em = 0.56) => {
    let count = 1;
    let width = 0;
    for (const word of text.split(/\s+/)) {
      const w = word.length * size * em;
      const next = width ? width + size * 0.28 + w : w;
      if (next > 628 && width) {
        count += 1;
        width = w;
      } else width = next;
    }
    return count;
  };
  const titleSize = [72, 64, 56, 48, 42].find((size) => lines(size, subject.title) <= 2) || 40;
  const titleLines = lines(titleSize, subject.title);
  const subtitleLines = titleLines >= 2 ? 1 : 2;
  const subtitleChars = Math.floor((628 / (28 * 0.5)) * subtitleLines) - 2;
  const emoji = emojiDataUri(subject.emoji);

  const visual = subject.image
    ? img(subject.image, { width: 420, height: 420, objectFit: 'cover', borderRadius: 40 })
    : h(
        'div',
        {
          width: 420, height: 420, borderRadius: 210, alignItems: 'center', justifyContent: 'center',
          backgroundImage: `linear-gradient(135deg, ${accent}55, ${primary}33)`,
        },
        emoji ? img(emoji, { width: 240, height: 240 }) : h('div', { fontSize: 200 }, subject.emoji)
      );

  return h(
    'div',
    { width: W, height: H, backgroundColor: '#fafaf7', fontFamily: 'Inter, InterExt', color: dark, position: 'relative' },
    // Decorative blobs
    h('div', { position: 'absolute', top: -160, right: -120, width: 520, height: 520, borderRadius: 260, backgroundColor: `${primary}1f` }),
    h('div', { position: 'absolute', bottom: -200, left: -140, width: 460, height: 460, borderRadius: 230, backgroundColor: `${accent}1a` }),
    h(
      'div',
      { flexDirection: 'column', justifyContent: 'space-between', padding: '64px 0 56px 72px', width: 700 },
      h(
        'div',
        { flexDirection: 'column' },
        h(
          'div',
          { alignSelf: 'flex-start', fontSize: 24, fontWeight: 700, color: primary, backgroundColor: `${primary}1a`, padding: '8px 20px', borderRadius: 999, marginBottom: 28 },
          subject.kicker
        ),
        h('div', { fontSize: titleSize, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }, subject.title),
        subject.subtitle &&
          h('div', { fontSize: 28, lineHeight: 1.35, color: '#475569', marginTop: 18, maxHeight: 38 * subtitleLines, overflow: 'hidden' }, plain(subject.subtitle, subtitleChars))
      ),
      h(
        'div',
        { flexDirection: 'column' },
        subject.price &&
          h(
            'div',
            { alignItems: 'flex-end', marginTop: 24, marginBottom: 20 },
            h('div', { fontSize: 56, fontWeight: 800, color: subject.oldPrice ? '#dc2626' : dark }, subject.price),
            subject.oldPrice && h('div', { fontSize: 30, color: '#94a3b8', textDecoration: 'line-through', marginLeft: 18, marginBottom: 8 }, subject.oldPrice)
          ),
        subject.chips?.length > 0 &&
          h(
            'div',
            { marginBottom: 24 },
            subject.chips.map((c) =>
              h('div', { fontSize: 22, fontWeight: 700, padding: '8px 18px', borderRadius: 999, backgroundColor: '#ffffff', border: '2px solid #e2e8f0', marginRight: 12, color: '#334155' }, c)
            )
          ),
        h(
          'div',
          { alignItems: 'center' },
          h(
            'div',
            { width: 52, height: 52, borderRadius: 16, backgroundColor: primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
            emojiDataUri(settings.appearance.logoEmoji || '🥑') ? img(emojiDataUri(settings.appearance.logoEmoji || '🥑'), { width: 32, height: 32 }) : null
          ),
          h('div', { fontSize: 30, fontWeight: 800 }, settings.appearance.logoText || settings.general.siteName),
          h('div', { fontSize: 22, color: '#64748b', marginLeft: 16 }, new URL(config.publicUrl).host)
        )
      )
    ),
    h(
      'div',
      { width: 500, alignItems: 'center', justifyContent: 'center', position: 'relative' },
      visual,
      subject.badge &&
        h('div', { position: 'absolute', top: 70, right: 60, backgroundColor: '#dc2626', color: '#fff', fontSize: 34, fontWeight: 800, padding: '12px 24px', borderRadius: 999 }, subject.badge)
    )
  );
}

const memo = new Map(); // small LRU of rendered PNGs
const MEMO_MAX = 200;
const MEMO_TTL = 60 * 60 * 1000;

export async function renderOgImage(type, slug, lang) {
  const subject = await loadSubject(type, slug, lang);
  if (!subject) return null;
  const settings = await getSettings();
  // Keyed by what is drawn, so edits show up immediately and unchanged cards are never redrawn.
  const key = createHash('sha1')
    .update(JSON.stringify([subject, settings.appearance, settings.general.siteName]))
    .digest('hex');
  const hit = memo.get(key);
  if (hit && hit.expires > Date.now()) {
    memo.delete(key);
    memo.set(key, hit);
    return hit.png;
  }
  const svg = await satori(card(subject, settings), { width: W, height: H, fonts: FONTS, loadAdditionalAsset });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  memo.set(key, { png, expires: Date.now() + MEMO_TTL });
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value);
  return png;
}
