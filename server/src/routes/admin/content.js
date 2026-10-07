import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import { translationsSchema } from '../../lib/i18n.js';
import { prisma } from '../../db.js';
import { cacheBackend, invalidate } from '../../lib/cache.js';
import { badRequest, notFound, parse, toInt } from '../../lib/http.js';
import { uniqueSlug } from '../../lib/slug.js';
import { DEFAULT_SETTINGS, getSettings, saveSettings } from '../../lib/settings.js';
import { stripeEnabled } from '../../lib/stripe.js';
import { config } from '../../config.js';

const router = Router();
const optStr = (max = 500) => z.string().trim().max(max).nullable().optional();

/* ------------------------------ Recipes ------------------------------ */

const recipeSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: optStr(160),
  excerpt: optStr(400),
  instructions: z.string().max(30000),
  image: optStr(500),
  emoji: optStr(16),
  prepMinutes: z.coerce.number().int().min(1).max(1440).default(15),
  servings: z.coerce.number().int().min(1).max(50).default(2),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
  tags: z.array(z.string().trim().toLowerCase().max(40)).max(20).default([]),
  published: z.boolean().default(true),
  translations: translationsSchema,
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        amount: optStr(60),
        productId: z.coerce.number().int().positive().nullable().optional(),
        translations: translationsSchema,
      })
    )
    .max(60)
    .default([]),
});

const recipeData = ({ ingredients, ...rest }) => ({
  ...rest,
  ingredients: {
    create: ingredients.map((i, idx) => ({ name: i.name, amount: i.amount, productId: i.productId || null, sortOrder: idx, translations: i.translations ?? undefined })),
  },
});

router.get('/recipes', async (_req, res) => {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { ingredients: true } } },
  });
  res.json({ recipes });
});

router.get('/recipes/:id', async (req, res) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: toInt(req.params.id, 0) },
    include: { ingredients: { orderBy: { sortOrder: 'asc' }, include: { product: { select: { id: true, name: true } } } } },
  });
  if (!recipe) throw notFound();
  res.json({ recipe });
});

router.post('/recipes', async (req, res) => {
  const data = parse(recipeSchema, req.body);
  data.slug = await uniqueSlug(prisma.recipe, data.slug || data.title);
  const recipe = await prisma.recipe.create({ data: recipeData(data) });
  await invalidate('recipes', 'home', 'products');
  res.status(201).json({ recipe });
});

router.put('/recipes/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  const data = parse(recipeSchema, req.body);
  data.slug = await uniqueSlug(prisma.recipe, data.slug || data.title, id);
  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    return tx.recipe.update({ where: { id }, data: recipeData(data) });
  });
  await invalidate('recipes', 'home', 'products');
  res.json({ recipe });
});

router.delete('/recipes/:id', async (req, res) => {
  await prisma.recipe.delete({ where: { id: toInt(req.params.id, 0) } });
  await invalidate('recipes', 'home', 'products');
  res.json({ ok: true });
});

/* -------------------------------- Blog -------------------------------- */

const postSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: optStr(200),
  excerpt: optStr(500),
  content: z.string().max(100000),
  coverImage: optStr(500),
  emoji: optStr(16),
  tags: z.array(z.string().trim().toLowerCase().max(40)).max(20).default([]),
  published: z.boolean().default(false),
  publishedAt: z.coerce.date().nullable().optional(),
  translations: translationsSchema,
});

router.get('/blog', async (_req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  res.json({ posts });
});

router.get('/blog/:id', async (req, res) => {
  const post = await prisma.blogPost.findUnique({ where: { id: toInt(req.params.id, 0) } });
  if (!post) throw notFound();
  res.json({ post });
});

router.post('/blog', async (req, res) => {
  const data = parse(postSchema, req.body);
  data.slug = await uniqueSlug(prisma.blogPost, data.slug || data.title);
  if (data.published && !data.publishedAt) data.publishedAt = new Date();
  const post = await prisma.blogPost.create({ data: { ...data, authorId: req.user.id } });
  await invalidate('blog', 'home');
  res.status(201).json({ post });
});

router.put('/blog/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  const data = parse(postSchema, req.body);
  data.slug = await uniqueSlug(prisma.blogPost, data.slug || data.title, id);
  if (data.published && !data.publishedAt) data.publishedAt = new Date();
  const post = await prisma.blogPost.update({ where: { id }, data });
  await invalidate('blog', 'home');
  res.json({ post });
});

router.delete('/blog/:id', async (req, res) => {
  await prisma.blogPost.delete({ where: { id: toInt(req.params.id, 0) } });
  await invalidate('blog', 'home');
  res.json({ ok: true });
});

/* ------------------------------- Banners ------------------------------- */

const bannerSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: optStr(400),
  ctaText: optStr(60),
  ctaLink: optStr(300),
  image: optStr(500),
  emoji: optStr(16),
  background: optStr(300),
  textColor: optStr(30),
  placement: z.enum(['hero', 'promo']).default('hero'),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  translations: translationsSchema,
});

router.get('/banners', async (_req, res) => {
  res.json({ banners: await prisma.banner.findMany({ orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }] }) });
});

router.post('/banners', async (req, res) => {
  const banner = await prisma.banner.create({ data: parse(bannerSchema, req.body) });
  await invalidate('home');
  res.status(201).json({ banner });
});

router.put('/banners/:id', async (req, res) => {
  const banner = await prisma.banner.update({ where: { id: toInt(req.params.id, 0) }, data: parse(bannerSchema, req.body) });
  await invalidate('home');
  res.json({ banner });
});

router.delete('/banners/:id', async (req, res) => {
  await prisma.banner.delete({ where: { id: toInt(req.params.id, 0) } });
  await invalidate('home');
  res.json({ ok: true });
});

/* -------------------------------- Pages -------------------------------- */

const pageSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug smí obsahovat jen malá písmena, čísla a pomlčky.'),
  content: z.string().max(200000),
  showInFooter: z.boolean().default(true),
  translations: translationsSchema,
});

router.get('/pages', async (_req, res) => {
  res.json({ pages: await prisma.page.findMany({ orderBy: { title: 'asc' } }) });
});

router.post('/pages', async (req, res) => {
  const page = await prisma.page.create({ data: parse(pageSchema, req.body) });
  await invalidate('pages');
  res.status(201).json({ page });
});

router.put('/pages/:id', async (req, res) => {
  const page = await prisma.page.update({ where: { id: toInt(req.params.id, 0) }, data: parse(pageSchema, req.body) });
  await invalidate('pages');
  res.json({ page });
});

router.delete('/pages/:id', async (req, res) => {
  await prisma.page.delete({ where: { id: toInt(req.params.id, 0) } });
  await invalidate('pages');
  res.json({ ok: true });
});

/* ------------------------------- Coupons ------------------------------- */

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/, 'Kód smí obsahovat jen písmena, čísla, - a _.'),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  active: z.boolean().default(true),
});

router.get('/coupons', async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ coupons: coupons.map((c) => ({ ...c, value: Number(c.value), minOrder: c.minOrder && Number(c.minOrder) })) });
});

router.post('/coupons', async (req, res) => {
  const data = parse(couponSchema, req.body);
  if (data.type === 'percent' && data.value > 100) throw badRequest('Procentní sleva může být maximálně 100 %.');
  const coupon = await prisma.coupon.create({ data });
  res.status(201).json({ coupon });
});

router.put('/coupons/:id', async (req, res) => {
  const data = parse(couponSchema, req.body);
  if (data.type === 'percent' && data.value > 100) throw badRequest('Procentní sleva může být maximálně 100 %.');
  const coupon = await prisma.coupon.update({ where: { id: toInt(req.params.id, 0) }, data });
  res.json({ coupon });
});

router.delete('/coupons/:id', async (req, res) => {
  await prisma.coupon.delete({ where: { id: toInt(req.params.id, 0) } });
  res.json({ ok: true });
});

/* ------------------------------ Settings ------------------------------ */

router.get('/settings', async (_req, res) => {
  res.json({
    settings: await getSettings(),
    defaults: DEFAULT_SETTINGS,
    cache: cacheBackend(),
    // Only whether secrets are configured, never their values.
    integrations: { stripe: stripeEnabled(), stripeWebhook: Boolean(config.stripeWebhookSecret), publicUrl: config.publicUrl },
  });
});

router.put('/settings', async (req, res) => {
  const body = parse(z.record(z.record(z.any())), req.body);
  res.json({ settings: await saveSettings(body) });
});

router.post('/settings/reset/:group', async (req, res) => {
  const group = req.params.group;
  if (!(group in DEFAULT_SETTINGS)) throw notFound();
  await prisma.setting.deleteMany({ where: { key: group } });
  await invalidate('');
  res.json({ settings: await getSettings() });
});

router.post('/cache/clear', async (_req, res) => {
  await invalidate('');
  res.json({ ok: true, backend: cacheBackend() });
});

/* ------------------------------- Uploads ------------------------------- */

export const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(badRequest('Povolené jsou jen obrázky JPG, PNG, WEBP, GIF a AVIF.')),
});

router.post('/uploads', upload.array('files', 10), (req, res) => {
  res.status(201).json({ urls: (req.files || []).map((f) => `/uploads/${f.filename}`) });
});

export default router;
