import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { invalidate } from '../lib/cache.js';
import { badRequest, forbidden, notFound, parse, unauthorized } from '../lib/http.js';
import { getSettings } from '../lib/settings.js';
import { config } from '../config.js';
import { tr } from '../lib/i18n.js';
import { getRates, SUPPORTED } from '../lib/rates.js';
import { constructEvent, createCheckoutSession, retrieveSession, stripeEnabled } from '../lib/stripe.js';

const router = Router();

export function serializeOrder(o) {
  const num = (v) => (v == null ? v : Number(v));
  return {
    ...o,
    subtotal: num(o.subtotal),
    shippingPrice: num(o.shippingPrice),
    paymentPrice: num(o.paymentPrice),
    discount: num(o.discount),
    total: num(o.total),
    exchangeRate: num(o.exchangeRate),
    stripeSessionId: undefined,
    items: o.items?.map((i) => ({ ...i, price: num(i.price) })),
  };
}

/** Returns the discount for a coupon, or throws with a readable reason. */
export async function evaluateCoupon(code, subtotal, db = prisma) {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) throw badRequest('Slevový kód neexistuje.');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw badRequest('Platnost slevového kódu vypršela.');
  if (coupon.maxUses != null && coupon.used >= coupon.maxUses) throw badRequest('Slevový kód byl již vyčerpán.');
  if (coupon.minOrder != null && subtotal < Number(coupon.minOrder)) {
    throw badRequest(`Kód platí od nákupu ${Number(coupon.minOrder)} Kč.`);
  }
  const value = Number(coupon.value);
  const discount = coupon.type === 'percent' ? Math.round((subtotal * value) / 100) : Math.min(value, subtotal);
  return { coupon, discount };
}

const cartSchema = z
  .array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) }))
  .min(1, 'Košík je prázdný.')
  .max(100);

/** Price the cart from the database, never trusting client prices. */
async function priceCart(items, db = prisma) {
  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, active: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) throw badRequest('Některý produkt v košíku už není dostupný.');
    lines.push({ product: p, quantity: item.quantity, price: Number(p.salePrice ?? p.price) });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return { lines, subtotal };
}

/** Current prices and stock for the cart, so the client never shows stale numbers. */
router.post('/cart/quote', async (req, res) => {
  const { items } = parse(z.object({ items: z.array(z.object({ productId: z.number().int(), quantity: z.number().int().min(1).max(99) })).max(100) }), req.body);
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, stock: true, active: true, emoji: true, images: true, weight: true, translations: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = items.map((i) => {
    const p = byId.get(i.productId);
    if (!p || !p.active) return { productId: i.productId, quantity: i.quantity, available: false };
    const price = Number(p.salePrice ?? p.price);
    return {
      productId: p.id, quantity: i.quantity, available: true, name: p.name, translations: p.translations, slug: p.slug, emoji: p.emoji, images: p.images,
      weight: p.weight, stock: p.stock, price, originalPrice: Number(p.price),
    };
  });
  const subtotal = lines.filter((l) => l.available).reduce((s, l) => s + l.price * l.quantity, 0);
  res.json({ lines, subtotal });
});

router.post('/coupons/validate', async (req, res) => {
  const settings = await getSettings();
  if (!settings.features.coupons) throw forbidden('Slevové kódy nejsou aktivní.');
  const { code, items } = parse(z.object({ code: z.string().min(1), items: cartSchema }), req.body);
  const { subtotal } = await priceCart(items);
  const { coupon, discount } = await evaluateCoupon(code, subtotal);
  res.json({ code: coupon.code, discount, type: coupon.type, value: Number(coupon.value) });
});

const checkoutSchema = z.object({
  items: cartSchema,
  email: z.string().trim().toLowerCase().email('Neplatný e-mail.'),
  firstName: z.string().trim().min(1, 'Vyplňte jméno.').max(60),
  lastName: z.string().trim().min(1, 'Vyplňte příjmení.').max(60),
  phone: z.string().trim().min(9, 'Vyplňte telefon.').max(30),
  street: z.string().trim().min(3, 'Vyplňte ulici.').max(120),
  city: z.string().trim().min(2, 'Vyplňte město.').max(80),
  zip: z.string().trim().regex(/^\d{3}\s?\d{2}$/, 'PSČ musí mít 5 číslic.'),
  country: z.string().trim().min(2).max(60),
  note: z.string().trim().max(500).optional(),
  shippingMethod: z.string(),
  pickupPoint: z.string().trim().max(200).optional(),
  paymentMethod: z.string(),
  currency: z.enum(['CZK', ...SUPPORTED]).optional(),
  couponCode: z.string().trim().max(40).optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Musíte souhlasit s obchodními podmínkami.' }) }),
  saveAddress: z.boolean().optional(),
});

const ONLINE = ['card', 'stripe'];

/** Amount and currency to charge: Czech visitors pay CZK, English visitors their chosen EUR/USD. */
async function chargeFor(order) {
  if (order.currency === 'CZK') return { amount: Number(order.total), currency: 'CZK' };
  return { amount: Math.round((Number(order.total) / Number(order.exchangeRate)) * 100) / 100, currency: order.currency };
}

/** Start online payment: a Stripe Checkout URL, or immediate confirmation in demo mode. */
async function startPayment(order, lang) {
  if (!stripeEnabled()) {
    const paid = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { items: true },
    });
    return { order: paid, redirectUrl: null, demo: true };
  }
  const { amount, currency } = await chargeFor(order);
  const session = await createCheckoutSession(order, { amount, currency, methodType: order.paymentType, lang });
  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return { order, redirectUrl: session.url, demo: false };
}

router.post('/orders', async (req, res) => {
  const settings = await getSettings();
  if (!req.user && !settings.features.guestCheckout) throw unauthorized('Pro objednávku se prosím přihlaste.');
  const data = parse(checkoutSchema, req.body);
  const lang = req.lang;

  const shipping = settings.shipping.methods.find((m) => m.id === data.shippingMethod && m.active);
  const payment = settings.payments.methods.find((m) => m.id === data.paymentMethod && m.active);
  if (!shipping) throw badRequest('Vyberte způsob dopravy.');
  if (!payment) throw badRequest('Vyberte způsob platby.');
  const paymentType = payment.type || (payment.id === 'cod' ? 'cash' : payment.id);
  if (shipping.pickupPoint && !data.pickupPoint) throw badRequest('Vyplňte výdejní místo.');
  if (paymentType === 'cash' && shipping.codAllowed === false) throw badRequest('Platbu hotově lze zvolit jen u dopravy s dobírkou.');

  // English visitors see EUR/USD; lock the rate into the order so totals never drift.
  let currency = lang === 'en' ? data.currency || settings.localization.defaultCurrencyEn : 'CZK';
  if (!SUPPORTED.includes(currency)) currency = 'CZK';
  const exchangeRate = currency === 'CZK' ? 1 : (await getRates()).rates[currency];
  const label = (m) => (lang === 'en' && m.nameEn) || m.name;

  const order = await prisma.$transaction(async (tx) => {
    const { lines, subtotal } = await priceCart(data.items, tx);

    // Reserve stock atomically: the update only matches while enough stock remains.
    if (!settings.shop.allowBackorder) {
      for (const l of lines) {
        const updated = await tx.product.updateMany({
          where: { id: l.product.id, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (updated.count === 0) throw badRequest(`Produktu „${l.product.name}“ nemáme dostatek skladem.`);
      }
    } else {
      for (const l of lines) {
        await tx.product.update({ where: { id: l.product.id }, data: { stock: { decrement: l.quantity } } });
      }
    }

    let discount = 0;
    let couponCode = null;
    if (data.couponCode && settings.features.coupons) {
      const result = await evaluateCoupon(data.couponCode, subtotal, tx);
      discount = result.discount;
      couponCode = result.coupon.code;
      await tx.coupon.update({ where: { id: result.coupon.id }, data: { used: { increment: 1 } } });
    }

    const afterDiscount = subtotal - discount;
    const shippingPrice = afterDiscount >= settings.shipping.freeShippingThreshold ? 0 : Number(shipping.price);
    // No cash-handling fee when the customer pays at our own counter.
    const paymentPrice = paymentType === 'cash' && shipping.id === 'pickup' ? 0 : Number(payment.fee || 0);
    const total = afterDiscount + shippingPrice + paymentPrice;

    const created = await tx.order.create({
      data: {
        number: `ESV${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`,
        status: 'PENDING',
        userId: req.user?.id ?? null,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        zip: data.zip,
        country: data.country,
        note: data.note,
        shippingMethod: label(shipping),
        pickupPoint: shipping.pickupPoint ? data.pickupPoint : null,
        paymentMethod: label(payment),
        paymentType,
        locale: lang,
        currency,
        exchangeRate,
        subtotal,
        shippingPrice,
        paymentPrice,
        discount,
        total,
        couponCode,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            name: tr(l.product, 'name', lang),
            price: l.price,
            quantity: l.quantity,
          })),
        },
      },
      include: { items: true },
    });

    if (req.user && data.saveAddress) {
      await tx.user.update({
        where: { id: req.user.id },
        data: { phone: data.phone, street: data.street, city: data.city, zip: data.zip, country: data.country },
      });
    }
    return created;
  });

  await invalidate('products', 'home');
  let result = { order, redirectUrl: null, demo: false };
  if (ONLINE.includes(paymentType)) {
    try {
      result = await startPayment(order, lang);
    } catch (err) {
      // The order exists; the customer can retry payment from the confirmation page.
      console.error('[stripe] could not start checkout', err.message);
    }
  }
  res.status(201).json({
    order: serializeOrder(result.order),
    redirectUrl: result.redirectUrl,
    paymentDemo: result.demo,
    bankAccount: settings.payments.bankAccount,
    iban: settings.payments.iban,
  });
});

/** Order lookup: the owner, or anyone holding both the number and the e-mail. */
async function findOrderFor(req) {
  const email = String(req.query.email || req.body?.email || '').toLowerCase();
  const order = await prisma.order.findUnique({ where: { number: req.params.number }, include: { items: true } });
  const allowed = order && ((req.user && order.userId === req.user.id) || (email && order.email === email));
  if (!allowed) throw notFound('Objednávka nenalezena.');
  return order;
}

async function markPaid(orderId, sessionId) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', paidAt: new Date(), ...(sessionId ? { stripeSessionId: sessionId } : {}) },
    include: { items: true },
  });
}

/** Cancel an unpaid order and put its stock back. Safe to call twice. */
async function cancelUnpaid(orderId) {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    if (!updated.count) return;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const i of items) {
      if (i.productId) await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
    }
  });
  await invalidate('products', 'home');
}

router.get('/orders/:number', async (req, res) => {
  let order = await findOrderFor(req);
  // Returning from Stripe: confirm with Stripe rather than trusting the redirect.
  const sessionId = String(req.query.session_id || '');
  if (sessionId && order.status === 'PENDING' && stripeEnabled() && sessionId === order.stripeSessionId) {
    try {
      const session = await retrieveSession(sessionId);
      if (session.payment_status === 'paid' && session.client_reference_id === order.number) order = await markPaid(order.id);
    } catch (err) {
      console.error('[stripe] session lookup failed', err.message);
    }
  }
  res.json({ order: serializeOrder(order), bankAccount: (await getSettings()).payments.bankAccount });
});

/** Retry online payment for a pending order (e.g. after closing the Stripe page). */
router.post('/orders/:number/pay', async (req, res) => {
  const order = await findOrderFor(req);
  if (order.status !== 'PENDING') throw badRequest('Objednávka je již zaplacená nebo zrušená.');
  if (!ONLINE.includes(order.paymentType)) throw badRequest('Online platba není k dispozici.');
  const result = await startPayment(order, order.locale || req.lang);
  res.json({ order: serializeOrder(result.order), redirectUrl: result.redirectUrl, paymentDemo: result.demo });
});

/**
 * Stripe webhook (mounted with a raw body parser in app.js). The source of
 * truth for payments: marks orders paid even if the customer never returns.
 */
export async function stripeWebhook(req, res) {
  if (!stripeEnabled() || !config.stripeWebhookSecret) return res.status(503).json({ error: 'Stripe webhook is not configured.' });
  let event;
  try {
    event = constructEvent(req.body, req.get('stripe-signature'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid Stripe signature.' });
  }
  const session = event.data.object;
  const order = session?.client_reference_id
    ? await prisma.order.findUnique({ where: { number: session.client_reference_id } })
    : null;
  if (order) {
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && session.payment_status === 'paid') {
      if (order.status === 'PENDING') await markPaid(order.id, session.id);
    } else if (['checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type)) {
      // Only cancel if this was the order's latest session; an older expired one must not cancel a retry.
      if (order.stripeSessionId === session.id) await cancelUnpaid(order.id);
    }
  }
  res.json({ received: true });
}

export default router;
