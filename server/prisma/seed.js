import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { CATEGORIES, NUTRITION } from './data/catalog.js';
import { RECIPES } from './data/recipes.js';
import { BANNERS, PAGES, POSTS } from './data/content.js';
import { CATEGORY_EN, PRODUCT_EN } from './data/en-catalog.js';
import { AMOUNT_EN, BANNERS_EN, PAGES_EN, POSTS_EN, RECIPES_EN } from './data/en-content.js';

const prisma = new PrismaClient();
const slug = (s) => slugify(s, { lower: true, strict: true, locale: 'cs' });

// Deterministic pseudo-random numbers so every seed produces the same shop.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => Math.floor(a + rand() * (b - a + 1));
const daysAgo = (d) => new Date(Date.now() - d * 86400000 - between(0, 86400000));

const TAG_LABELS = {
  vegan: 'vhodné pro vegany',
  'bez-lepku': 'bez lepku',
  bio: 'v BIO kvalitě',
  keto: 'vhodné pro keto',
  'bez-cukru': 'bez přidaného cukru',
  'high-protein': 's vysokým obsahem bílkovin',
  'bez-laktozy': 'bez laktózy',
  raw: 'v raw kvalitě',
};

const TAG_LABELS_EN = {
  vegan: 'vegan', 'bez-lepku': 'gluten-free', bio: 'organic', keto: 'keto-friendly', 'bez-cukru': 'free of added sugar',
  'high-protein': 'high in protein', 'bez-laktozy': 'lactose-free', raw: 'raw',
};

function describeEn(name, short, tags, categoryName) {
  const tagText = tags.map((t) => TAG_LABELS_EN[t]).filter(Boolean);
  return `${short}

**${name}** is one of the favourites in our *${categoryName}* category. We picked it for its short ingredient list and honest taste${tagText.length ? `. It is ${tagText.join(', ')}` : ''}.

### Why you'll love it
- great as a snack, for breakfast or in the kitchen,
- quality ingredients from a trusted producer,
- practical, resealable packaging.

### How to use
Enjoy on its own or as part of a varied diet. Find inspiration in our recipes.

### Storage
Store in a cool, dry place away from direct sunlight. Once opened, use within 3 months.`;
}

const amountEn = (a) => {
  if (!a) return a;
  if (AMOUNT_EN[a]) return AMOUNT_EN[a];
  const m = a.match(/^([\d½,.]+)\s+(.+)$/);
  if (!m) return a;
  const unit = m[2] === 'ks' ? (m[1] === '1' ? 'pc' : 'pcs') : AMOUNT_EN[m[2]] ?? m[2];
  return `${m[1]} ${unit}`;
};

function nutritionFor(profile) {
  const base = NUTRITION[profile] || NUTRITION.snack;
  const out = {};
  for (const [k, v] of Object.entries(base)) {
    const varied = v * (0.85 + rand() * 0.3);
    out[k] = k === 'energy' ? Math.round(varied) : Math.round(varied * 10) / 10;
  }
  return out;
}

function describe(name, short, tags, categoryName) {
  const tagText = tags.map((t) => TAG_LABELS[t]).filter(Boolean);
  return `${short}

**${name}** patří mezi oblíbené produkty v kategorii *${categoryName}*. Vybrali jsme jej pro krátké složení a poctivou chuť${tagText.length ? ` – produkt je ${tagText.join(', ')}` : ''}.

### Proč si ho zamilujete
- skvěle se hodí na svačinu, do snídaně i do kuchyně,
- kvalitní suroviny od prověřeného výrobce,
- praktické balení, které vydrží.

### Jak používat
Konzumujte samostatně nebo jako součást pestrého jídelníčku. Inspiraci najdete v našich receptech.

### Skladování
Skladujte v suchu a chladu, mimo přímé sluneční světlo. Po otevření spotřebujte do 3 měsíců.`;
}

const REVIEW_TEXTS = [
  [5, 'Nejlepší, co jsem zkoušel', 'Chuť je výborná a složení krátké. Objednávám už potřetí a určitě ne naposledy.'],
  [5, 'Doporučuji', 'Rychlé dodání, kvalitní produkt. Celá rodina je nadšená.'],
  [4, 'Velmi dobré', 'Chutná skvěle, jen bych uvítal/a větší balení za lepší cenu.'],
  [5, 'Top kvalita', 'Konečně produkt, který není přeslazený. Super na svačinu do práce.'],
  [4, 'Spokojenost', 'Dobrá chuť i konzistence. Hvězdičku dolů jen za obal, který se hůř zavírá.'],
  [3, 'Ujde', 'Čekal jsem trochu výraznější chuť, ale jinak v pořádku.'],
  [5, 'Láska na první ochutnání', 'Používám do kaše i do pečení. Nemůžu si vynachválit.'],
  [4, 'Kupuji opakovaně', 'Poměr cena/výkon je u tohohle produktu výborný.'],
];

const QUESTIONS = [
  ['Je produkt vhodný i pro děti?', 'Ano, produkt mohou konzumovat i děti od 3 let v přiměřeném množství.'],
  ['Jak dlouho vydrží po otevření?', 'Po otevření doporučujeme spotřebovat do 3 měsíců a skladovat v suchu.'],
  ['Obsahuje produkt stopy ořechů?', 'Produkt se vyrábí v provozu, kde se zpracovávají ořechy, proto může obsahovat jejich stopy.'],
  ['Kdy bude opět skladem větší balení?', 'Větší balení očekáváme do dvou týdnů. Můžete si nastavit hlídání dostupnosti.'],
];

async function main() {
  console.log('🌱 Seeding eSvačina…');

  // Wipe in dependency order so the seed can be re-run.
  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.question.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productReaction.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.recipeIngredient.deleteMany(),
    prisma.recipe.deleteMany(),
    prisma.blogPost.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.page.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  /* Users */
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@esvacina.cz').toLowerCase();
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12),
      firstName: 'Admin',
      lastName: 'eSvačina',
      role: 'ADMIN',
    },
  });
  const demoHash = await bcrypt.hash('Demo1234', 12);
  const people = [
    ['jana@example.cz', 'Jana', 'Nováková', 'Vinohradská 25', 'Praha', '120 00'],
    ['petr@example.cz', 'Petr', 'Svoboda', 'Masarykova 10', 'Brno', '602 00'],
    ['lucie@example.cz', 'Lucie', 'Dvořáková', 'Nádražní 5', 'Ostrava', '702 00'],
    ['tomas@example.cz', 'Tomáš', 'Černý', 'Husova 8', 'Plzeň', '301 00'],
    ['eva@example.cz', 'Eva', 'Procházková', 'Komenského 3', 'Olomouc', '779 00'],
  ];
  const customers = [];
  for (const [email, firstName, lastName, street, city, zip] of people) {
    customers.push(
      await prisma.user.create({
        data: { email, passwordHash: demoHash, firstName, lastName, street, city, zip, phone: '+420 600 000 000', newsletter: rand() > 0.5 },
      })
    );
  }

  /* Categories & products */
  const products = [];
  let skuCounter = 1000;
  let catOrder = 0;
  for (const root of CATEGORIES) {
    const parent = await prisma.category.create({
      data: {
        name: root.name, slug: slug(root.name), icon: root.icon, color: root.color,
        description: root.description, sortOrder: catOrder++,
        translations: { en: { name: CATEGORY_EN[root.name][0], description: CATEGORY_EN[root.name][1] } },
      },
    });
    let childOrder = 0;
    for (const child of root.children) {
      const sub = await prisma.category.create({
        data: {
          name: child.name, slug: slug(child.name), icon: child.icon, color: root.color,
          description: `${child.name} – ${root.description.toLowerCase()}`, parentId: parent.id, sortOrder: childOrder++,
          translations: { en: { name: CATEGORY_EN[child.name][0], description: `${CATEGORY_EN[child.name][0]}. ${CATEGORY_EN[root.name][1]}` } },
        },
      });
      for (const [name, brand, price, salePrice, weight, emoji, tagStr, short] of child.products) {
        const tags = tagStr.split(',').filter(Boolean);
        const age = between(1, 200);
        const [nameEn, shortEn] = PRODUCT_EN[name];
        const glutenFree = tags.includes('bez-lepku');
        let pct;
        const p = await prisma.product.create({
          data: {
            name, slug: slug(name), brand, price, salePrice, weight, emoji, tags,
            shortDescription: short,
            description: describe(name, short, tags, child.name),
            sku: `ESV-${skuCounter++}`,
            stock: rand() < 0.06 ? 0 : between(3, 150),
            nutrition: nutritionFor(root.profile),
            ingredients: `${name.split(' ').slice(0, 2).join(' ')} (${(pct = between(85, 100))} %), přírodní aroma.`,
            allergens: glutenFree ? 'Může obsahovat stopy ořechů a sezamu.' : 'Obsahuje lepek. Může obsahovat stopy ořechů, sóji a mléka.',
            translations: {
              en: {
                name: nameEn,
                shortDescription: shortEn,
                description: describeEn(nameEn, shortEn, tags, CATEGORY_EN[child.name][0]),
                ingredients: `${nameEn.split(' ').slice(0, 2).join(' ')} (${pct}%), natural flavouring.`,
                allergens: glutenFree ? 'May contain traces of nuts and sesame.' : 'Contains gluten. May contain traces of nuts, soy and milk.',
              },
            },
            isNew: age < 20,
            isFeatured: rand() < 0.12,
            views: between(20, 2500),
            categoryId: sub.id,
            createdAt: daysAgo(age),
          },
        });
        products.push(p);
      }
    }
  }
  const byName = new Map(products.map((p) => [p.name, p]));

  /* Orders, reviews, reactions, favourites */
  const statuses = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'SHIPPED', 'PAID', 'PENDING'];
  let orderNo = 10000;
  const bought = new Map(); // userId -> Set(productId) from paid orders
  for (const user of customers) {
    bought.set(user.id, new Set());
    const orderCount = between(2, 5);
    for (let i = 0; i < orderCount; i++) {
      const lines = [];
      const lineCount = between(2, 5);
      for (let j = 0; j < lineCount; j++) {
        const p = pick(products);
        if (!lines.find((l) => l.productId === p.id)) {
          lines.push({ productId: p.id, name: p.name, price: Number(p.salePrice ?? p.price), quantity: between(1, 3) });
        }
      }
      const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
      const shippingPrice = subtotal >= 1500 ? 0 : 69;
      const status = pick(statuses);
      await prisma.order.create({
        data: {
          number: `ESV${orderNo++}`,
          status,
          userId: user.id,
          email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone,
          street: user.street, city: user.city, zip: user.zip, country: 'Česká republika',
          shippingMethod: 'Zásilkovna – výdejní místo',
          paymentMethod: 'Platba kartou online',
          subtotal, shippingPrice, total: subtotal + shippingPrice,
          createdAt: daysAgo(between(0, 28)),
          items: { create: lines },
        },
      });
      if (status !== 'PENDING') lines.forEach((l) => bought.get(user.id).add(l.productId));
    }
  }

  // Only customers who bought a product review it, mirroring the live rule.
  for (const user of customers) {
    for (const productId of bought.get(user.id)) {
      if (rand() < 0.7) {
        const [rating, title, comment] = pick(REVIEW_TEXTS);
        await prisma.review.create({ data: { rating, title, comment, userId: user.id, productId, createdAt: daysAgo(between(0, 20)) } });
      }
    }
    for (const p of products) {
      const r = rand();
      if (r < 0.12) await prisma.productReaction.create({ data: { type: 'LIKE', userId: user.id, productId: p.id, createdAt: daysAgo(between(0, 25)) } });
      else if (r < 0.14) await prisma.productReaction.create({ data: { type: 'DISLIKE', userId: user.id, productId: p.id } });
      if (rand() < 0.05) await prisma.favorite.create({ data: { userId: user.id, productId: p.id, createdAt: daysAgo(between(0, 25)) } });
    }
  }

  for (let i = 0; i < 24; i++) {
    const [q, a] = pick(QUESTIONS);
    const question = await prisma.question.create({
      data: { body: q, userId: pick(customers).id, productId: pick(products).id, createdAt: daysAgo(between(1, 30)) },
    });
    if (rand() < 0.75) await prisma.answer.create({ data: { body: a, userId: admin.id, questionId: question.id } });
  }

  /* Recipes */
  for (const r of RECIPES) {
    const en = RECIPES_EN[r.title];
    await prisma.recipe.create({
      data: {
        translations: { en: { title: en.title, excerpt: en.excerpt, instructions: en.instructions } },
        title: r.title, slug: slug(r.title), excerpt: r.excerpt, instructions: r.instructions, emoji: r.emoji,
        prepMinutes: r.prepMinutes, servings: r.servings, difficulty: r.difficulty, tags: r.tags,
        ingredients: {
          create: r.ingredients.map(([name, amount, productName], i) => {
            if (productName && !byName.has(productName)) throw new Error(`Recipe "${r.title}" links unknown product "${productName}"`);
            return { name, amount, sortOrder: i, translations: { en: { name: en.ingredients[i], amount: amountEn(amount) } }, productId: productName ? byName.get(productName).id : null };
          }),
        },
      },
    });
  }

  /* Blog, banners, pages, coupons */
  for (const p of POSTS) {
    await prisma.blogPost.create({
      data: {
        title: p.title, slug: slug(p.title), excerpt: p.excerpt, content: p.content, emoji: p.emoji, tags: p.tags,
        published: true, publishedAt: daysAgo(p.daysAgo), authorId: admin.id,
        translations: { en: POSTS_EN[p.title] },
      },
    });
  }
  await prisma.banner.createMany({ data: BANNERS.map((b) => ({ ...b, translations: { en: BANNERS_EN[b.title] } })) });
  await prisma.page.createMany({ data: PAGES.map((p) => ({ ...p, translations: { en: PAGES_EN[p.slug] } })) });
  await prisma.coupon.createMany({
    data: [
      { code: 'VITEJ10', type: 'percent', value: 10 },
      { code: 'SVACINA100', type: 'fixed', value: 100, minOrder: 800 },
    ],
  });

  const count = await prisma.category.count();
  console.log(`✅ ${count} categories, ${products.length} products, ${RECIPES.length} recipes, ${POSTS.length} posts`);
  console.log(`   Admin: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
  console.log('   Demo customer: jana@example.cz / Demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
