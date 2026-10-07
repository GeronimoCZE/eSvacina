import { prisma } from '../db.js';

/** Fields every product card needs. */
export const cardSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  shortDescription: true,
  price: true,
  salePrice: true,
  stock: true,
  weight: true,
  images: true,
  emoji: true,
  tags: true,
  isNew: true,
  isFeatured: true,
  createdAt: true,
  translations: true,
  category: { select: { id: true, name: true, slug: true, color: true, translations: true } },
};

/** Convert Prisma Decimal to numbers and attach aggregate stats. */
export function serializeProduct(p, stats = {}) {
  const price = Number(p.price);
  const salePrice = p.salePrice == null ? null : Number(p.salePrice);
  return {
    ...p,
    price,
    salePrice,
    finalPrice: salePrice ?? price,
    discountPercent: salePrice ? Math.round((1 - salePrice / price) * 100) : 0,
    rating: stats.rating ?? null,
    reviewCount: stats.reviewCount ?? 0,
    likes: stats.likes ?? 0,
    dislikes: stats.dislikes ?? 0,
  };
}

/** Load rating and reaction totals for a list of products in two queries. */
export async function withStats(products) {
  const ids = products.map((p) => p.id);
  if (!ids.length) return [];
  const [ratings, reactions] = await Promise.all([
    prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: ids }, approved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.productReaction.groupBy({
      by: ['productId', 'type'],
      where: { productId: { in: ids } },
      _count: { _all: true },
    }),
  ]);
  const stats = new Map(ids.map((id) => [id, { likes: 0, dislikes: 0 }]));
  for (const r of ratings) {
    Object.assign(stats.get(r.productId), {
      rating: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
      reviewCount: r._count._all,
    });
  }
  for (const r of reactions) {
    stats.get(r.productId)[r.type === 'LIKE' ? 'likes' : 'dislikes'] = r._count._all;
  }
  return products.map((p) => serializeProduct(p, stats.get(p.id)));
}

/**
 * Trending score over the last 30 days: purchases weigh most, then
 * favourites and likes, then raw page views.
 */
export async function trendingProductIds(limit = 8) {
  const rows = await prisma.$queryRaw`
    SELECT p.id,
      COALESCE(o.qty, 0) * 5 + COALESCE(f.cnt, 0) * 3 + COALESCE(r.cnt, 0) * 2 + p.views * 0.05 AS score
    FROM "Product" p
    LEFT JOIN (
      SELECT oi."productId", SUM(oi.quantity) AS qty FROM "OrderItem" oi
      JOIN "Order" ord ON ord.id = oi."orderId"
      WHERE ord."createdAt" > NOW() - INTERVAL '30 days' AND ord.status <> 'CANCELLED'
      GROUP BY oi."productId"
    ) o ON o."productId" = p.id
    LEFT JOIN (
      SELECT "productId", COUNT(*) AS cnt FROM "Favorite"
      WHERE "createdAt" > NOW() - INTERVAL '30 days' GROUP BY "productId"
    ) f ON f."productId" = p.id
    LEFT JOIN (
      SELECT "productId", COUNT(*) AS cnt FROM "ProductReaction"
      WHERE type = 'LIKE' AND "createdAt" > NOW() - INTERVAL '30 days' GROUP BY "productId"
    ) r ON r."productId" = p.id
    WHERE p.active = true
    ORDER BY score DESC, p."createdAt" DESC
    LIMIT ${limit}`;
  return rows.map((r) => r.id);
}

/** Collect ids of a category and all its descendants. */
export async function categoryWithDescendants(rootId) {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
  }
  return ids;
}

/** Has this user bought the product in an order that was paid? */
export async function hasPurchased(userId, productId) {
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
    },
    select: { id: true },
  });
  return Boolean(item);
}
