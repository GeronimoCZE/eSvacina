import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { invalidate } from '../../lib/cache.js';
import { badRequest, notFound, parse, toInt } from '../../lib/http.js';
import { publicUser } from '../../middleware/auth.js';
import { serializeOrder } from '../orders.js';

const router = Router();

/* ----------------------------- Dashboard ----------------------------- */

router.get('/stats', async (_req, res) => {
  const paid = { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } };
  const since30 = new Date(Date.now() - 30 * 86400000);
  const [revenue, revenue30, orders, pending, users, products, lowStock, reviews, openQuestions, subscribers, daily, top, recent] =
    await Promise.all([
      prisma.order.aggregate({ where: paid, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...paid, createdAt: { gte: since30 } }, _sum: { total: true }, _count: { _all: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true, stock: { lte: 5 } } }),
      prisma.review.count(),
      prisma.question.count({ where: { answers: { none: {} } } }),
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS n FROM (
          SELECT email FROM "NewsletterSubscriber" UNION SELECT email FROM "User" WHERE newsletter = true
        ) s`.then((r) => r[0].n),
      prisma.$queryRaw`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS orders, COALESCE(SUM(total), 0)::float AS revenue
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '14 days' AND status <> 'CANCELLED'
        GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw`
        SELECT oi.name, SUM(oi.quantity)::int AS sold, SUM(oi.quantity * oi.price)::float AS revenue
        FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
        WHERE o.status <> 'CANCELLED'
        GROUP BY oi.name ORDER BY sold DESC LIMIT 5`,
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { items: true } }),
    ]);
  res.json({
    revenue: Number(revenue._sum.total || 0),
    revenue30: Number(revenue30._sum.total || 0),
    orders30: revenue30._count._all,
    orders,
    pending,
    users,
    products,
    lowStock,
    reviews,
    openQuestions,
    subscribers,
    daily,
    top,
    recent: recent.map(serializeOrder),
  });
});

/* ------------------------------- Orders ------------------------------- */

router.get('/orders', async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const perPage = 25;
  const where = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.q) {
    const q = String(req.query.q);
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders: orders.map(serializeOrder), total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
});

router.get('/orders/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: toInt(req.params.id, 0) },
    include: { items: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
  if (!order) throw notFound();
  res.json({ order: serializeOrder(order) });
});

router.patch('/orders/:id', async (req, res) => {
  const { status, note } = parse(
    z.object({ status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(), note: z.string().max(500).optional() }),
    req.body
  );
  const id = toInt(req.params.id, 0);
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw notFound();

  const updated = await prisma.$transaction(async (tx) => {
    // Return stock when an order is cancelled, take it again if un-cancelled.
    if (status && status !== order.status && (status === 'CANCELLED' || order.status === 'CANCELLED')) {
      const delta = status === 'CANCELLED' ? 1 : -1;
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: delta * item.quantity } },
          });
        }
      }
    }
    return tx.order.update({ where: { id }, data: { status, note }, include: { items: true } });
  });
  await invalidate('products', 'home');
  res.json({ order: serializeOrder(updated) });
});

/* ------------------------------- Users ------------------------------- */

router.get('/users', async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const perPage = 25;
  const where = {};
  if (req.query.q) {
    const q = String(req.query.q);
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (req.query.role) where.role = String(req.query.role);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { orders: true, reviews: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({
    users: users.map((u) => ({ ...publicUser(u), blocked: u.blocked, orders: u._count.orders, reviewCount: u._count.reviews })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});

router.patch('/users/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  const data = parse(
    z.object({
      role: z.enum(['USER', 'ADMIN']).optional(),
      blocked: z.boolean().optional(),
      firstName: z.string().trim().min(1).max(60).optional(),
      lastName: z.string().trim().min(1).max(60).optional(),
    }),
    req.body
  );
  if (id === req.user.id && (data.role === 'USER' || data.blocked)) {
    throw badRequest('Nemůžete odebrat práva nebo zablokovat sami sebe.');
  }
  const user = await prisma.user.update({ where: { id }, data });
  res.json({ user: { ...publicUser(user), blocked: user.blocked } });
});

router.delete('/users/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  if (id === req.user.id) throw badRequest('Nemůžete smazat sami sebe.');
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
});

/* ------------------------- Reviews & questions ------------------------- */

router.get('/reviews', async (req, res) => {
  const where = req.query.pending === '1' ? { approved: false } : {};
  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      product: { select: { name: true, slug: true } },
    },
  });
  res.json({ reviews });
});

router.patch('/reviews/:id', async (req, res) => {
  const { approved } = parse(z.object({ approved: z.boolean() }), req.body);
  const review = await prisma.review.update({ where: { id: toInt(req.params.id, 0) }, data: { approved } });
  await invalidate('products', 'home');
  res.json({ review });
});

router.delete('/reviews/:id', async (req, res) => {
  await prisma.review.delete({ where: { id: toInt(req.params.id, 0) } });
  await invalidate('products', 'home');
  res.json({ ok: true });
});

router.get('/questions', async (req, res) => {
  const where = {};
  if (req.query.filter === 'pending') where.approved = false;
  if (req.query.filter === 'unanswered') where.answers = { none: {} };
  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      product: { select: { name: true, slug: true } },
      answers: { include: { user: { select: { firstName: true, lastName: true, role: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  res.json({ questions });
});

router.patch('/questions/:id', async (req, res) => {
  const { approved } = parse(z.object({ approved: z.boolean() }), req.body);
  const question = await prisma.question.update({ where: { id: toInt(req.params.id, 0) }, data: { approved } });
  res.json({ question });
});

router.delete('/questions/:id', async (req, res) => {
  await prisma.question.delete({ where: { id: toInt(req.params.id, 0) } });
  res.json({ ok: true });
});

router.post('/questions/:id/answers', async (req, res) => {
  const { body } = parse(z.object({ body: z.string().trim().min(2).max(1500) }), req.body);
  const answer = await prisma.answer.create({
    data: { body, questionId: toInt(req.params.id, 0), userId: req.user.id },
  });
  res.status(201).json({ answer });
});

router.delete('/answers/:id', async (req, res) => {
  await prisma.answer.delete({ where: { id: toInt(req.params.id, 0) } });
  res.json({ ok: true });
});

/* ----------------------------- Newsletter ----------------------------- */

router.get('/subscribers', async (_req, res) => {
  const [subscribers, users] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.user.findMany({ where: { newsletter: true }, select: { email: true, createdAt: true } }),
  ]);
  const merged = new Map();
  for (const s of [...subscribers, ...users]) if (!merged.has(s.email)) merged.set(s.email, s);
  res.json({ subscribers: [...merged.values()] });
});

export default router;
