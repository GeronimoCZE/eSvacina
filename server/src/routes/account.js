import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { badRequest, notFound, parse } from '../lib/http.js';
import { clearAuthCookie, publicUser, requireAuth } from '../middleware/auth.js';
import { passwordSchema } from './auth.js';
import { cardSelect, withStats } from '../lib/products.js';
import { serializeOrder } from './orders.js';

const router = Router();
router.use(requireAuth);

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  street: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  zip: z.string().trim().max(12).nullable().optional(),
  country: z.string().trim().max(60).nullable().optional(),
  newsletter: z.boolean().optional(),
});

router.patch('/profile', async (req, res) => {
  const data = parse(profileSchema, req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: publicUser(user) });
});

router.patch('/password', async (req, res) => {
  const { currentPassword, newPassword } = parse(
    z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }),
    req.body
  );
  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) {
    throw badRequest('Současné heslo není správné.');
  }
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  res.json({ ok: true });
});

router.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders: orders.map(serializeOrder) });
});

router.get('/orders/:number', async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { number: req.params.number, userId: req.user.id },
    include: { items: { include: { product: { select: { slug: true, emoji: true, images: true } } } } },
  });
  if (!order) throw notFound('Objednávka nenalezena.');
  res.json({ order: serializeOrder(order) });
});

router.get('/favorites', async (req, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.user.id, product: { active: true } },
    include: { product: { select: cardSelect } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ products: await withStats(favs.map((f) => f.product)) });
});

/** Ids the storefront needs to highlight hearts and thumbs on every product card. */
router.get('/interactions', async (req, res) => {
  const [favorites, reactions] = await Promise.all([
    prisma.favorite.findMany({ where: { userId: req.user.id }, select: { productId: true } }),
    prisma.productReaction.findMany({ where: { userId: req.user.id }, select: { productId: true, type: true } }),
  ]);
  res.json({
    favorites: favorites.map((f) => f.productId),
    reactions: Object.fromEntries(reactions.map((r) => [r.productId, r.type])),
  });
});

router.get('/activity', async (req, res) => {
  const [reviews, questions] = await Promise.all([
    prisma.review.findMany({
      where: { userId: req.user.id },
      include: { product: { select: { name: true, slug: true, translations: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.question.findMany({
      where: { userId: req.user.id },
      include: { product: { select: { name: true, slug: true, translations: true } }, _count: { select: { answers: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  res.json({ reviews, questions });
});

router.delete('/', async (req, res) => {
  const { password } = parse(z.object({ password: z.string().min(1) }), req.body);
  if (!(await bcrypt.compare(password, req.user.passwordHash))) throw badRequest('Nesprávné heslo.');
  if (req.user.role === 'ADMIN') throw badRequest('Administrátorský účet nelze smazat z účtu zákazníka.');
  await prisma.user.delete({ where: { id: req.user.id } });
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
