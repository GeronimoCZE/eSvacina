<div align="center">

<img src="client/public/favicon.svg" width="88" alt="eSvačina logo" />

# eSvačina

**Healthy snacks that taste great.**<br/>
A modern online shop for healthy food, snacks and ingredients, with recipes linked to every product.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-cache-DC382D?logo=redis&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-payments-635BFF?logo=stripe&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-16a34a)

🇨🇿 Čeština · 🇬🇧 English · Kč · € · $

<br/>

<img src="docs/screenshots/home.png" alt="eSvačina home page" width="100%" />

</div>

<br/>

## ✨ Highlights

| | |
|---|---|
| 🛒 **Full shop** | 14 categories, 52 subcategories and 172 products with nutrition tables, ingredients and allergens |
| 🍳 **Recipes** | Every ingredient links to a product you can add to the basket in one click |
| ⭐ **Honest reviews** | Only customers who actually bought a product can review it |
| 💬 **Community** | Likes, dislikes, favourites and a Q&A section on every product |
| 🌍 **Two languages** | Czech and English, with prices in CZK, EUR or USD at the daily Czech National Bank rate |
| 🚚 **Czech carriers** | Zásilkovna, Balíkovna, Česká pošta, PPL, DPD, GLS and personal pickup |
| 💳 **Payments** | Cash on delivery, credit card and Stripe (Apple Pay, Google Pay, Link), plus bank transfer |
| 🔎 **SEO ready** | Server-rendered meta tags, structured data, sitemap and auto-generated share images |
| 🎛️ **Admin panel** | Every product, page, banner, colour and setting is editable without touching code |
| 📱 **Responsive** | Designed for phones, tablets and desktops |

<br/>

## 🖼️ A closer look

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/product-en.png" alt="Product page in English" /><br/><sub><b>Product page</b>: price in your currency, likes, favourites, stock and delivery info</sub></td>
    <td width="50%"><img src="docs/screenshots/category.png" alt="Category listing" /><br/><sub><b>Categories</b>: filters, sorting, subcategories and trending products</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/recipe-en.png" alt="Recipe page" /><br/><sub><b>Recipes</b>: ingredients linked straight to the shop</sub></td>
    <td><img src="docs/screenshots/checkout-delivery.png" alt="Checkout delivery options" /><br/><sub><b>Checkout</b>: Czech carriers with pickup points and delivery times</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/admin-dashboard.png" alt="Admin dashboard" /><br/><sub><b>Admin dashboard</b>: revenue, orders, best sellers and low stock</sub></td>
    <td><img src="docs/screenshots/admin-settings.png" alt="Admin settings" /><br/><sub><b>Settings</b>: languages, currencies, carriers, payments, look and feel</sub></td>
  </tr>
</table>

<div align="center">
  <img src="docs/screenshots/mobile-home.png" width="24%" alt="Mobile home" />
  &nbsp;
  <img src="docs/screenshots/mobile-shop.png" width="24%" alt="Mobile category" />
  &nbsp;
  <img src="docs/screenshots/mobile-product.png" width="24%" alt="Mobile product" />
  <br/><sub><b>On the phone</b>: the same shop, made for thumbs</sub>
</div>

<br/>

<div align="center">
  <img src="docs/screenshots/og-product.png" width="70%" alt="Generated share image" />
  <br/><sub><b>Share images</b>: every product, recipe and article gets its own preview card for social media</sub>
</div>

<br/>

## 🛍️ For customers

- **Inspiring landing page** with banners, trending products, new arrivals, offers, recipes and blog posts
- **Smart search** with instant suggestions in both languages
- **Accounts** with order history, saved address, favourites, reviews and questions
- **Cart and checkout** with discount codes, free-shipping progress and guest checkout
- **Blog** with articles about nutrition and healthy eating
- **Clear legal pages**: terms and conditions, privacy policy, cookie policy, shipping and returns
- **Cookie consent** with necessary, analytics and marketing categories

## 🧑‍💼 For the shop owner

- **Dashboard** with revenue, orders, best sellers, low stock and unanswered questions
- **Products and categories** with images, descriptions, nutrition values and English translations
- **Orders** with a status workflow; cancelling an order returns its stock
- **Content**: banners, recipes, blog posts, pages and discount codes
- **Community moderation** for reviews and questions, with staff answers
- **Complete site settings**: name, contacts, colours, fonts, homepage sections, carriers, payments, exchange rates, SEO, social links, cookie texts and maintenance mode

## 🧱 Built with

| Layer | Technology |
|---|---|
| Storefront and admin | React 19, Vite, React Router |
| API | Node.js 22, Express 5, Prisma |
| Database | PostgreSQL 16 |
| Cache | Redis, with an in-memory fallback |
| Payments | Stripe Checkout |
| Share images | Satori and Resvg |
| Security | CORS, Helmet, rate limiting, bcrypt, httpOnly cookies, input validation |

<br/>

## 🚀 Getting started

The shop runs with Docker in a single step, and comes with demo products, recipes, articles and accounts so you can explore it straight away.

Installation, configuration, demo logins and deployment notes are in **[docs/SETUP.md](docs/SETUP.md)**.

<br/>

## 👤 Author

Designed and built by **Nikolas Malík**.<br/>
🌐 [malikweb.eu](https://malikweb.eu) · GitHub [@GeronimoCZE](https://github.com/GeronimoCZE)

## 📄 License

Released under the [MIT License](LICENSE). © 2026 Nikolas Malík
