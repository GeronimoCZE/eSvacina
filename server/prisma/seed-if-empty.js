// Seeds demo data only on a fresh database, so container restarts keep real data.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const count = await prisma.product.count();
await prisma.$disconnect();
if (count === 0) {
  console.log('Empty database, seeding demo data…');
  await import('./seed.js');
} else {
  console.log(`Database already has ${count} products, skipping seed.`);
}
