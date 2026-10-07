import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { cached, invalidate } from '../lib/cache.js';
import { badRequest, forbidden, notFound, parse, toInt } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { getSettings } from '../lib/settings.js';
import {
  cardSelect,
  categoryWithDescendants,
  hasPurchased,
  serializeProduct,
  trendingProductIds,
  withStats,
} from '../lib/products.js';

const router = Router();

/** Ids of products whose English name or short description matches; search works in both languages. */
async function englishMatches(term, limit = 500) {
  const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await prisma.$queryRaw`
    SELECT id FROM "Product"
    WHERE active = true AND (translations->'en'->>'name' ILIKE ${like} OR translations->'en'->>'shortDescription' ILIKE ${like})
    LIMIT ${limit}`;
  return rows.map((r) => r.id);
}

const SORTS = {
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
  name: [{ name: 'asc' }],
  popular: [{ views: 'desc' }],
};

/** GET /api/products — listing with search, filters, sorting and pagination. */
router.get('/', cached('products'), async (req, res) => {
  const settings = await getSettings();
  const { q, category, tags, brand, minPrice, maxPrice, sort = 'newest', sale, inStock, isNew } = req.query;
  const page = Math.max(1, toInt(req.query.page, 1));
  const perPage = Math.min(96, Math.max(1, toInt(req.query.perPage, settings.shop.productsPerPage)));

  const where = { active: true, AND: [] };
  if (q) {
    const term = String(q).slice(0, 80);
    where.AND.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { shortDescription: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
        { id: { in: await englishMatches(term) } },
      ],
    });
  }
  let currentCategory = null;
  if (category) {
    currentCategory = await prisma.category.findUnique({ where: { slug: String(category) } });
    if (!currentCategory) throw notFound('Kategorie nenalezena.');
    where.categoryId = { in: await categoryWithDescendants(currentCategory.id) };
  }
  if (tags) where.tags = { hasEvery: String(tags).split(',').filter(Boolean) };
  if (brand) where.brand = { in: String(brand).split(',').filter(Boolean) };
  if (minPrice) where.AND.push({ price: { gte: Number(minPrice) } });
  if (maxPrice) where.AND.push({ price: { lte: Number(maxPrice) } });
  if (sale === '1') where.salePrice = { not: null };
  if (inStock === '1') where.stock = { gt: 0 };
  if (isNew === '1') {
    const since = new Date(Date.now() - settings.homepage.newDays * 86400000);
    where.AND.push({ OR: [{ isNew: true }, { createdAt: { gte: since } }] });
  }

  let products;
  let total;
  if (sort === 'trending') {
    const ids = await trendingProductIds(500);
    const all = await prisma.product.findMany({ where: { ...where, id: { in: ids } }, select: cardSelect });
    const rank = new Map(ids.map((id, i) => [id, i]));
    all.sort((a, b) => rank.get(a.id) - rank.get(b.id));
    total = all.length;
    products = all.slice((page - 1) * perPage, page * perPage);
  } else {
    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: cardSelect,
        orderBy: SORTS[sort] || SORTS.newest,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);
  }

  // Facets for the filter sidebar (within the current category, ignoring other filters).
  const facetWhere = { active: true, ...(where.categoryId ? { categoryId: where.categoryId } : {}) };
  const [brandRows, tagRows, priceAgg] = await Promise.all([
    prisma.product.groupBy({ by: ['brand'], where: facetWhere, _count: { _all: true }, orderBy: { brand: 'asc' } }),
    prisma.product.findMany({ where: facetWhere, select: { tags: true } }),
    prisma.product.aggregate({ where: facetWhere, _min: { price: true }, _max: { price: true } }),
  ]);
  const tagCounts = {};
  for (const row of tagRows) for (const t of row.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;

  res.json({
    products: await withStats(products),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
    category: currentCategory,
    facets: {
      brands: brandRows.filter((b) => b.brand).map((b) => ({ name: b.brand, count: b._count._all })),
      tags: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      minPrice: Number(priceAgg._min.price || 0),
      maxPrice: Number(priceAgg._max.price || 0),
    },
  });
});

/** GET /api/products/suggest?q= — quick search dropdown. */
router.get('/suggest', cached('products', 30), async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ products: [], categories: [] });
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { id: { in: await englishMatches(q, 6) } },
        ],
      },
      select: { id: true, name: true, slug: true, price: true, salePrice: true, emoji: true, images: true, translations: true },
      take: 6,
    }),
    prisma.category.findMany({
      where: {
        active: true,
        OR: [{ name: { contains: q, mode: 'insensitive' } }, { translations: { path: ['en', 'name'], string_contains: q } }],
      },
      select: { name: true, slug: true, icon: true, translations: true },
      take: 4,
    }),
  ]);
  res.json({ products: products.map((p) => serializeProduct(p)), categories });
});

/** GET /api/products/:slug — detail. Personalised fields are added for signed-in users. */
router.get('/:slug', cached('products'), async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, active: true },
    include: {
      category: { include: { parent: { include: { parent: true } } } },
      recipeLinks: {
        where: { recipe: { published: true } },
        include: {
          recipe: { select: { id: true, title: true, slug: true, emoji: true, image: true, prepMinutes: true, difficulty: true, translations: true } },
        },
      },
    },
  });
  if (!product) throw notFound('Produkt nenalezen.');

  const [withStat] = await withStats([product]);
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, active: true, id: { not: product.id } },
    select: cardSelect,
    take: 8,
    orderBy: { views: 'desc' },
  });

  const recipes = [];
  const seen = new Set();
  for (const link of product.recipeLinks) {
    if (!seen.has(link.recipe.id)) {
      seen.add(link.recipe.id);
      recipes.push(link.recipe);
    }
  }
  delete withStat.recipeLinks;

  const body = { product: { ...withStat, recipes }, related: await withStats(related) };

  if (req.user) {
    const [reaction, favorite, review, purchased] = await Promise.all([
      prisma.productReaction.findUnique({ where: { userId_productId: { userId: req.user.id, productId: product.id } } }),
      prisma.favorite.findUnique({ where: { userId_productId: { userId: req.user.id, productId: product.id } } }),
      prisma.review.findUnique({ where: { userId_productId: { userId: req.user.id, productId: product.id } } }),
      hasPurchased(req.user.id, product.id),
    ]);
    body.me = {
      reaction: reaction?.type || null,
      favorite: Boolean(favorite),
      purchased,
      reviewed: Boolean(review),
      canReview: purchased && !review,
    };
  }
  res.json(body);
});

/** Views are counted separately so cached detail responses still register. */
router.post('/:id/view', async (req, res) => {
  await prisma.product.updateMany({ where: { id: toInt(req.params.id, 0) }, data: { views: { increment: 1 } } });
  res.json({ ok: true });
});

async function activeProduct(id) {
  const product = await prisma.product.findFirst({ where: { id: toInt(id, 0), active: true }, select: { id: true } });
  if (!product) throw notFound('Produkt nenalezen.');
  return product;
}

async function reactionCounts(productId) {
  const rows = await prisma.productReaction.groupBy({ by: ['type'], where: { productId }, _count: { _all: true } });
  const out = { likes: 0, dislikes: 0 };
  for (const r of rows) out[r.type === 'LIKE' ? 'likes' : 'dislikes'] = r._count._all;
  return out;
}

/** POST /api/products/:id/reaction { type: LIKE | DISLIKE | null } — toggles. */
router.post('/:id/reaction', requireAuth, async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.reactions) throw forbidden('Hodnocení palcem je vypnuté.');
  const { id } = await activeProduct(req.params.id);
  const { type } = parse(z.object({ type: z.enum(['LIKE', 'DISLIKE']).nullable() }), req.body);
  const key = { userId_productId: { userId: req.user.id, productId: id } };
  if (type === null) {
    await prisma.productReaction.deleteMany({ where: { userId: req.user.id, productId: id } });
  } else {
    await prisma.productReaction.upsert({
      where: key,
      update: { type },
      create: { type, userId: req.user.id, productId: id },
    });
  }
  await invalidate('products', 'home');
  res.json({ reaction: type, ...(await reactionCounts(id)) });
});

router.post('/:id/favorite', requireAuth, async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.favorites) throw forbidden('Oblíbené jsou vypnuté.');
  const { id } = await activeProduct(req.params.id);
  await prisma.favorite.upsert({
    where: { userId_productId: { userId: req.user.id, productId: id } },
    update: {},
    create: { userId: req.user.id, productId: id },
  });
  res.json({ favorite: true });
});

router.delete('/:id/favorite', requireAuth, async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, productId: toInt(req.params.id, 0) } });
  res.json({ favorite: false });
});

/* ---------------------------- Reviews ---------------------------- */

router.get('/:id/reviews', async (req, res) => {
  const productId = toInt(req.params.id, 0);
  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  res.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
      author: `${r.user.firstName} ${r.user.lastName.charAt(0)}.`,
      verified: true,
    })),
    distribution,
  });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  comment: z.string().trim().min(5, 'Recenze musí mít alespoň 5 znaků.').max(2000),
});

router.post('/:id/reviews', requireAuth, async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.reviews) throw forbidden('Recenze jsou vypnuté.');
  const { id } = await activeProduct(req.params.id);
  const data = parse(reviewSchema, req.body);
  if (!(await hasPurchased(req.user.id, id))) {
    throw forbidden('Recenzi mohou napsat jen zákazníci, kteří produkt zakoupili.');
  }
  const existing = await prisma.review.findUnique({ where: { userId_productId: { userId: req.user.id, productId: id } } });
  if (existing) throw badRequest('Tento produkt jste už hodnotili.');
  const review = await prisma.review.create({
    data: { ...data, userId: req.user.id, productId: id, approved: !settings.features.reviewsRequireApproval },
  });
  await invalidate('products', 'home');
  res.status(201).json({ review, pending: !review.approved });
});

/* --------------------------- Questions --------------------------- */

router.get('/:id/questions', async (req, res) => {
  const questions = await prisma.question.findMany({
    where: { productId: toInt(req.params.id, 0), approved: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      answers: {
        include: { user: { select: { firstName: true, lastName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const name = (u) => `${u.firstName} ${u.lastName.charAt(0)}.`;
  res.json({
    questions: questions.map((q) => ({
      id: q.id,
      body: q.body,
      createdAt: q.createdAt,
      author: name(q.user),
      answers: q.answers.map((a) => ({
        id: a.id,
        body: a.body,
        createdAt: a.createdAt,
        author: a.user.role === 'ADMIN' ? 'Tým eSvačina' : name(a.user),
        staff: a.user.role === 'ADMIN',
      })),
    })),
  });
});

const textSchema = z.object({ body: z.string().trim().min(3, 'Text je příliš krátký.').max(1500) });

router.post('/:id/questions', requireAuth, async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.questions) throw forbidden('Dotazy jsou vypnuté.');
  const { id } = await activeProduct(req.params.id);
  const { body } = parse(textSchema, req.body);
  const question = await prisma.question.create({
    data: { body, userId: req.user.id, productId: id, approved: !settings.features.questionsRequireApproval },
  });
  res.status(201).json({ question, pending: !question.approved });
});

router.post('/questions/:questionId/answers', requireAuth, async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.questions) throw forbidden('Dotazy jsou vypnuté.');
  const question = await prisma.question.findFirst({ where: { id: toInt(req.params.questionId, 0), approved: true } });
  if (!question) throw notFound('Dotaz nenalezen.');
  const { body } = parse(textSchema, req.body);
  const answer = await prisma.answer.create({ data: { body, userId: req.user.id, questionId: question.id } });
  res.status(201).json({ answer });
});

export default router;
