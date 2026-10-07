import { Router } from 'express';
import { z } from 'zod';
import { translationsSchema } from '../../lib/i18n.js';
import { prisma } from '../../db.js';
import { invalidate } from '../../lib/cache.js';
import { badRequest, notFound, parse, toInt } from '../../lib/http.js';
import { uniqueSlug } from '../../lib/slug.js';
import { withStats } from '../../lib/products.js';
import { buildTree } from '../catalog.js';

const router = Router();

const optStr = (max = 500) => z.string().trim().max(max).nullable().optional();
const money = z.coerce.number().min(0).max(1_000_000);

/* ----------------------------- Products ----------------------------- */

const productSchema = z.object({
  name: z.string().trim().min(2, 'Vyplňte název.').max(160),
  slug: optStr(160),
  brand: optStr(80),
  shortDescription: optStr(300),
  description: z.string().max(20000).default(''),
  price: money,
  salePrice: money.nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sku: optStr(60),
  weight: optStr(40),
  images: z.array(z.string().max(500)).max(12).default([]),
  emoji: optStr(16),
  tags: z.array(z.string().trim().toLowerCase().max(40)).max(30).default([]),
  nutrition: z.record(z.union([z.string(), z.number()])).nullable().optional(),
  ingredients: optStr(4000),
  allergens: optStr(1000),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  active: z.boolean().default(true),
  categoryId: z.coerce.number().int().positive('Vyberte kategorii.'),
  translations: translationsSchema,
});

function cleanProduct(data) {
  if (data.salePrice === 0 || data.salePrice === undefined) data.salePrice = null;
  if (data.salePrice != null && data.salePrice >= data.price) {
    throw badRequest('Akční cena musí být nižší než běžná cena.');
  }
  if (!data.sku) data.sku = null;
  return data;
}

router.get('/products', async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const perPage = Math.min(100, toInt(req.query.perPage, 25));
  const where = {};
  if (req.query.q) {
    where.OR = [
      { name: { contains: String(req.query.q), mode: 'insensitive' } },
      { sku: { contains: String(req.query.q), mode: 'insensitive' } },
      { brand: { contains: String(req.query.q), mode: 'insensitive' } },
    ];
  }
  if (req.query.categoryId) where.categoryId = toInt(req.query.categoryId);
  if (req.query.status === 'active') where.active = true;
  if (req.query.status === 'hidden') where.active = false;
  if (req.query.status === 'low') where.stock = { lte: 5 };
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: {
        [['name', 'price', 'stock', 'views', 'createdAt'].includes(req.query.sort) ? req.query.sort : 'createdAt']:
          req.query.dir === 'asc' ? 'asc' : 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ products: await withStats(products), total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
});

router.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: toInt(req.params.id, 0) } });
  if (!product) throw notFound();
  res.json({ product: { ...product, price: Number(product.price), salePrice: product.salePrice && Number(product.salePrice) } });
});

router.post('/products', async (req, res) => {
  const data = cleanProduct(parse(productSchema, req.body));
  data.slug = await uniqueSlug(prisma.product, data.slug || data.name);
  const product = await prisma.product.create({ data });
  await invalidate('products', 'home', 'categories', 'recipes');
  res.status(201).json({ product });
});

router.put('/products/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  const data = cleanProduct(parse(productSchema, req.body));
  data.slug = await uniqueSlug(prisma.product, data.slug || data.name, id);
  const product = await prisma.product.update({ where: { id }, data });
  await invalidate('products', 'home', 'categories', 'recipes');
  res.json({ product });
});

/** Quick inline edits from the table (stock, price, toggles). */
router.patch('/products/:id', async (req, res) => {
  const data = parse(productSchema.partial(), req.body);
  const product = await prisma.product.update({ where: { id: toInt(req.params.id, 0) }, data });
  await invalidate('products', 'home', 'categories');
  res.json({ product });
});

router.post('/products/bulk', async (req, res) => {
  const { ids, action } = parse(
    z.object({ ids: z.array(z.number().int()).min(1), action: z.enum(['activate', 'hide', 'delete', 'feature', 'unfeature']) }),
    req.body
  );
  const where = { id: { in: ids } };
  if (action === 'delete') await prisma.product.deleteMany({ where });
  else {
    const data = {
      activate: { active: true },
      hide: { active: false },
      feature: { isFeatured: true },
      unfeature: { isFeatured: false },
    }[action];
    await prisma.product.updateMany({ where, data });
  }
  await invalidate('products', 'home', 'categories');
  res.json({ ok: true });
});

router.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: toInt(req.params.id, 0) } });
  await invalidate('products', 'home', 'categories', 'recipes');
  res.json({ ok: true });
});

/* ---------------------------- Categories ---------------------------- */

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: optStr(80),
  description: optStr(1000),
  icon: optStr(16),
  color: optStr(30),
  image: optStr(500),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  parentId: z.coerce.number().int().positive().nullable().optional(),
  translations: translationsSchema,
});

router.get('/categories', async (_req, res) => {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.groupBy({ by: ['categoryId'], _count: { _all: true } }),
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c._count._all]));
  res.json({ categories: buildTree(categories, countMap), flat: categories });
});

async function assertNoCycle(id, parentId) {
  let current = parentId;
  while (current) {
    if (current === id) throw badRequest('Kategorie nemůže být podkategorií sama sebe.');
    current = (await prisma.category.findUnique({ where: { id: current }, select: { parentId: true } }))?.parentId;
  }
}

router.post('/categories', async (req, res) => {
  const data = parse(categorySchema, req.body);
  data.slug = await uniqueSlug(prisma.category, data.slug || data.name);
  const category = await prisma.category.create({ data });
  await invalidate('categories', 'home', 'products');
  res.status(201).json({ category });
});

router.put('/categories/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  const data = parse(categorySchema, req.body);
  if (data.parentId) await assertNoCycle(id, data.parentId);
  data.slug = await uniqueSlug(prisma.category, data.slug || data.name, id);
  const category = await prisma.category.update({ where: { id }, data });
  await invalidate('categories', 'home', 'products');
  res.json({ category });
});

router.delete('/categories/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  const products = await prisma.product.count({ where: { categoryId: id } });
  const children = await prisma.category.count({ where: { parentId: id } });
  if (products || children) {
    throw badRequest('Kategorii nelze smazat, obsahuje produkty nebo podkategorie. Nejprve je přesuňte.');
  }
  await prisma.category.delete({ where: { id } });
  await invalidate('categories', 'home', 'products');
  res.json({ ok: true });
});

export default router;
