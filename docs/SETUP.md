# eSvačina: setup and technical notes

Everything you need to run, configure and deploy the shop. For an overview with screenshots, see the [README](../README.md).

## Stack

- **Backend:** Node.js 22, Express 5, Prisma ORM, PostgreSQL, Redis cache (in‑memory fallback)
- **Frontend:** React 19 + Vite, React Router, plain CSS with design tokens driven by the admin settings
- **Security:** CORS restricted to the storefront origin, Helmet headers, rate limiting (stricter on login/register), bcrypt password hashing, JWT in an httpOnly SameSite cookie, zod validation on every write, server‑side price calculation, sanitized markdown

## Run it with one command

```bash
docker compose up --build
```

Then open **http://localhost:4010** (English: **http://localhost:4010/en**). One container serves the API and the storefront with server-rendered SEO tags. The first start runs the database migrations and seeds demo data.

| Account | E‑mail | Password |
|---|---|---|
| Admin | admin@esvacina.cz | Admin123! |
| Customer (has paid orders, can review) | jana@example.cz | Demo1234 |

Other demo customers: petr@, lucie@, tomas@, eva@example.cz (all `Demo1234`).
Coupons: `VITEJ10` (−10 %), `SVACINA100` (−100 Kč from 800 Kč).

Before going live, set these (e.g. in a `.env` file next to `docker-compose.yml`) and serve the site over HTTPS:

| Variable | What for |
|---|---|
| `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | login security and the first admin |
| `PUBLIC_URL` | your domain, e.g. `https://esvacina.cz`: canonical links, sitemap, Open Graph images, Stripe return URLs, CORS |
| `COOKIE_SECURE=true` | secure login cookies once you're on HTTPS (compose defaults to `false` for localhost) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | real online payments (see below) |

## Run locally without Docker

You need Node 22, PostgreSQL 16 and optionally Redis.

```bash
# API
cd server
cp .env.example .env          # adjust DATABASE_URL etc.
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev                   # http://localhost:4010

# Storefront (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api, /og, /sitemap.xml to :4010)
```

To try the production setup without Docker: `cd client && npm run build`, then start the API with `NODE_ENV=production CLIENT_DIST=../client/dist PUBLIC_URL=http://localhost:4010 CORS_ORIGIN=http://localhost:4010 COOKIE_SECURE=false JWT_SECRET=<long secret> node src/index.js` and open http://localhost:4010.

`npm run db:reset` in `server/` wipes the database and re-seeds it.

## Features

**Storefront**
- Landing page: animated hero slider, benefits strip, category tiles, “Právě frčí” (trending) rail, promo tiles, new products, sale, recipes, blog and newsletter, all toggleable from admin
- 14 main categories and 52 subcategories with a mega menu; 172 seeded products with nutrition tables, ingredients and allergens
- Listing with search suggestions, filters (tags such as vegan / bez lepku / keto, brand, price, stock, sale, new) and sorting (newest, trending, price, name)
- Every product: like / dislike, add to favourites, reviews, questions & answers
- **Reviews only from verified buyers**: the API checks for a paid, shipped or delivered order containing the product, one review per customer
- **Questions** from any signed‑in user, answers from users or staff (shown as “Tým eSvačina”)
- Recipes linked to ingredients: each linked ingredient has an add‑to‑cart button and the recipe shows on the product page
- Cart drawer, free‑shipping progress, checkout with shipping/payment methods, coupons, guest checkout
- Account: profile and default address, order history and detail, favourites, my reviews & questions, password change, account deletion
- Cookie consent banner with categories (necessary / analytics / marketing), re‑openable from the footer
- Terms of service, cookie policy, privacy policy (GDPR), shipping, returns and about pages, all editable in admin
- Subtle animations (scroll reveal, hover lifts, hero transitions) that respect `prefers-reduced-motion` and can be turned off in admin

**Admin panel** (`/admin`)
- Dashboard: 30‑day revenue and orders, 14‑day revenue chart, best sellers, low stock, unanswered questions
- Products: search, filter, sort, bulk actions, inline stock edits, full editor with image upload, markdown description, nutrition, tags
- Categories tree, orders with status workflow (cancelling returns stock), users (roles, blocking), review and question moderation with staff answers
- Content: hero/promo banners with live preview, recipes with ingredient‑to‑product linking, blog posts with markdown preview and scheduling, legal/info pages, coupons, newsletter export (CSV)
- **Settings for the whole site**: name, contacts, announcement bar, colours, font, corner radius, logo, animations, homepage sections, pagination, low‑stock threshold, VAT, shipping methods and free‑shipping threshold, payment methods and fees, feature switches (reviews, approval, Q&A, likes, favourites, recipes, blog, newsletter, coupons, registration, guest checkout), SEO, social links, cookie banner texts, maintenance mode, cache clearing

**English version and currencies**
- Every page exists under `/en/…`; a CZ/EN switch in the header, mobile menu and footer keeps you on the same page
- All UI texts, products, categories, recipes (including ingredients), blog posts, banners, legal pages, settings texts, shipping/payment names and API error messages are translated; editors fill the English fields in a “🇬🇧 Anglická verze” panel next to the Czech ones, and empty English fields fall back to Czech
- English visitors choose EUR or USD. Rates come from the Czech National Bank daily fixing (`denni_kurz.txt`), refreshed hourly, with fallbacks to the ECB (Frankfurter), then the last stored rate, then a built‑in estimate. Admins can set manual rates or a conversion markup in *Nastavení → Jazyky a měny*
- Orders store totals in CZK plus the customer's currency and the exchange rate used, so receipts never change afterwards

**Delivery and payment** (editable in *Nastavení → Doprava / Platby*)
- Carriers: Zásilkovna, Balíkovna, Česká pošta (Na poštu / Do ruky), PPL (address / Parcelshop), DPD (address / Pickup), GLS and pickup in Prague, each with price, delivery time, pickup-point flag and cash-on-delivery flag. Pickup-point carriers ask for the pickup point at checkout
- Payments: cash on delivery (only offered with carriers that allow it, free at our own pickup), credit card and Stripe (Apple Pay, Google Pay, Link) via Stripe Checkout, and bank transfer with account number, IBAN and payment reference
- Stripe: set `STRIPE_SECRET_KEY` (test key `sk_test_…` to start) and point a webhook at `https://your-domain/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`, then set `STRIPE_WEBHOOK_SECRET`. English customers are charged in EUR/USD, Czech customers in CZK. Paid orders are confirmed by the webhook and again when the customer returns; expired sessions cancel the order and return stock; customers can retry payment from the order page. **Without a key the shop runs in demo mode** and marks online payments as paid immediately

**SEO**
- Server-rendered `<title>`, description, canonical, `hreflang` (cs / en / x-default), Open Graph and Twitter tags for every page, product, category, recipe, post and info page; updated on client-side navigation too
- JSON-LD: Organization and WebSite with site search, Product with offer, shipping and rating, BreadcrumbList, Recipe and BlogPosting
- `/sitemap.xml` with both languages and alternates, `/robots.txt` that keeps cart, checkout, account and admin out of the index; cart/checkout/account pages are `noindex`
- **Open Graph images**: `/og/{product|category|recipe|post|page|site}/<slug>.png?lang=en` renders a 1200×630 share card with the product photo or emoji, name, price and discount in the visitor's language and currency, using the shop's colours

**Responsive**
- Tested at phone (390 px), tablet (820 px) and desktop widths: full-width search row on phones, compact header, stacked checkout, horizontally scrollable tabs and sort chips, no sideways page scroll

## Caching

Public GET endpoints (home, categories, product lists and details, recipes, blog, pages, page meta, sitemap) are cached for anonymous visitors in Redis, or in memory when Redis is unavailable. Signed‑in requests bypass the cache so personal data never leaks between users. Every admin write invalidates the affected groups. Responses carry an `X-Cache: HIT|MISS` header. Cached bodies are language-neutral and localised on the way out, so one entry serves both languages. Rendered Open Graph images are kept in memory and re-rendered when what they show changes.

## Project layout

```
server/
  prisma/schema.prisma      data model
  prisma/migrations/        SQL migrations
  prisma/seed.js, data/     demo catalogue, recipes, blog, legal pages
  src/app.js                Express app, CORS, security middleware
  src/routes/               public API (auth, account, products, catalog, orders)
  src/routes/admin/         admin API
  src/lib/                  cache, settings, product helpers, i18n, rates, stripe, og
  src/routes/seo.js         page meta, sitemap, robots, OG images, serving the built storefront
client/
  src/pages/                storefront pages
  src/admin/                admin panel
  src/components/           shared UI
  src/context/              settings, locale/currency, auth, cart, favourites/likes, toasts
  src/lib/i18n.js           language from the URL, tx('česky', 'English'), money formatting
Dockerfile                  builds the storefront and the API into one image
docker-compose.yml          postgres + redis + app
```

## Notes

- Online payments are a demo until Stripe keys are set (see above). The Stripe flow was tested with signed test webhooks; a live charge needs your own Stripe account.
- Pickup points are entered as text. The Zásilkovna/PPL/DPD map widgets need API keys from those carriers and can be added to the checkout later.
- Delivery is set up for the Czech Republic. Cash and bank-transfer payments are made in CZK even on the English site; card and Stripe payments are charged in the customer's currency.
- Order confirmation e‑mails and password reset need an e‑mail provider and are not wired up yet.
- Products without photos show a coloured tile with an emoji; upload real photos in the admin product editor.
