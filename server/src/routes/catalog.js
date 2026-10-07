import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { cached } from '../lib/cache.js';
import { notFound, parse, toInt } from '../lib/http.js';
import { getSettings, localizeSettings } from '../lib/settings.js';
import { getRates } from '../lib/rates.js';
import { cardSelect, trendingProductIds, withStats } from '../lib/products.js';

const router = Router();

/** Build a nested tree from a flat category list. */
export function buildTree(categories, counts = {}) {
  const byId = new Map(categories.map((c) => [c.id, { ...c, children: [], productCount: counts[c.id] || 0 }]));
  const roots = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId).children.push(c);
    else roots.push(c);
  }
  const sortRec = (list) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'cs'));
    for (const c of list) {
      sortRec(c.children);
      c.productCount += c.children.reduce((s, ch) => s + ch.productCount, 0);
    }
  };
  sortRec(roots);
  return roots;
}

router.get('/settings', async (req, res) => {
  res.json({ settings: localizeSettings(await getSettings(), req.lang) });
});

/** CZK exchange rates for showing prices in EUR/USD. */
router.get('/rates', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=600');
  res.json(await getRates());
});

router.get('/categories', cached('categories', 300), async (_req, res) => {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ where: { active: true } }),
    prisma.product.groupBy({ by: ['categoryId'], where: { active: true }, _count: { _all: true } }),
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c._count._all]));
  res.json({ categories: buildTree(categories, countMap) });
});

router.get('/categories/:slug', cached('categories', 300), async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      parent: { include: { parent: true } },
      children: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
    },
  });
  if (!category || !category.active) throw notFound('Kategorie nenalezena.');
  res.json({ category });
});

router.get('/home', cached('home', 120), async (_req, res) => {
  const settings = await getSettings();
  const n = settings.homepage.productsPerSection;
  const since = new Date(Date.now() - settings.homepage.newDays * 86400000);

  const [banners, categories, newest, sale, trendingIds, recipes, posts, featured] = await Promise.all([
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.category.findMany({ where: { active: true, parentId: null }, orderBy: { sortOrder: 'asc' } }),
    prisma.product.findMany({
      where: { active: true, OR: [{ isNew: true }, { createdAt: { gte: since } }] },
      select: cardSelect,
      orderBy: { createdAt: 'desc' },
      take: n,
    }),
    prisma.product.findMany({ where: { active: true, salePrice: { not: null } }, select: cardSelect, take: n }),
    trendingProductIds(n),
    settings.features.recipes
      ? prisma.recipe.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 4 })
      : [],
    settings.features.blog
      ? prisma.blogPost.findMany({
          where: { published: true },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, emoji: true, tags: true, publishedAt: true, translations: true },
        })
      : [],
    prisma.product.findMany({ where: { active: true, isFeatured: true }, select: cardSelect, take: n }),
  ]);

  const trendingRaw = await prisma.product.findMany({ where: { id: { in: trendingIds } }, select: cardSelect });
  const rank = new Map(trendingIds.map((id, i) => [id, i]));
  trendingRaw.sort((a, b) => rank.get(a.id) - rank.get(b.id));

  res.json({
    heroBanners: banners.filter((b) => b.placement === 'hero'),
    promoBanners: banners.filter((b) => b.placement === 'promo'),
    categories,
    newProducts: await withStats(newest),
    trending: await withStats(trendingRaw),
    sale: await withStats(sale),
    featured: await withStats(featured),
    recipes,
    posts,
  });
});

/* ----------------------------- Recipes ----------------------------- */

router.get('/recipes', cached('recipes'), async (req, res) => {
  const { q, tag, difficulty } = req.query;
  const where = { published: true };
  if (q) where.title = { contains: String(q), mode: 'insensitive' };
  if (tag) where.tags = { has: String(tag) };
  if (difficulty) where.difficulty = String(difficulty);
  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { ingredients: true } } },
  });
  const tags = [...new Set((await prisma.recipe.findMany({ where: { published: true }, select: { tags: true } })).flatMap((r) => r.tags))];
  res.json({ recipes, tags });
});

router.get('/recipes/:slug', cached('recipes'), async (req, res) => {
  const recipe = await prisma.recipe.findFirst({
    where: { slug: req.params.slug, published: true },
    include: {
      ingredients: {
        orderBy: { sortOrder: 'asc' },
        include: { product: { select: cardSelect } },
      },
    },
  });
  if (!recipe) throw notFound('Recept nenalezen.');
  const products = await withStats(recipe.ingredients.filter((i) => i.product?.id).map((i) => i.product));
  const byId = new Map(products.map((p) => [p.id, p]));
  recipe.ingredients = recipe.ingredients.map((i) => ({ ...i, product: i.product ? byId.get(i.product.id) || null : null }));
  const more = await prisma.recipe.findMany({
    where: { published: true, id: { not: recipe.id } },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ recipe, more });
});

/* ------------------------------- Blog ------------------------------- */

router.get('/blog', cached('blog'), async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const perPage = 9;
  const where = { published: true, ...(req.query.tag ? { tags: { has: String(req.query.tag) } } : {}) };
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, title: true, slug: true, excerpt: true, coverImage: true, emoji: true, tags: true, publishedAt: true, translations: true,
        author: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);
  res.json({ posts, total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
});

router.get('/blog/:slug', cached('blog'), async (req, res) => {
  const post = await prisma.blogPost.findFirst({
    where: { slug: req.params.slug, published: true },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  if (!post) throw notFound('Článek nenalezen.');
  const more = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, emoji: true, publishedAt: true, translations: true },
  });
  res.json({ post, more });
});

/* ------------------------------- Pages ------------------------------- */

router.get('/pages', cached('pages', 300), async (_req, res) => {
  const pages = await prisma.page.findMany({ select: { slug: true, title: true, showInFooter: true, translations: true }, orderBy: { title: 'asc' } });
  res.json({ pages });
});

router.get('/pages/:slug', cached('pages', 300), async (req, res) => {
  const page = await prisma.page.findUnique({ where: { slug: req.params.slug } });
  if (!page) throw notFound('Stránka nenalezena.');
  res.json({ page });
});

/* ----------------------------- Newsletter ----------------------------- */

router.post('/newsletter', async (req, res) => {
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email('Neplatný e-mail.') }), req.body);
  await prisma.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
  res.json({ ok: true });
});

export default router;
