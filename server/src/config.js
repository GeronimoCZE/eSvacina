import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('change-me'))) {
  throw new Error('JWT_SECRET must be set to a strong secret in production');
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 4010),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL || '',
  cacheTtl: Number(process.env.CACHE_TTL || 60),
  cookieName: 'esv_token',
  // Secure cookies need HTTPS (localhost is exempt in browsers). Set COOKIE_SECURE=false for plain-HTTP hosting.
  // Public URL of the storefront: used for canonical links, sitemap, OG images and Stripe redirects.
  publicUrl: (process.env.PUBLIC_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173').replace(/\/$/, ''),
  // Built client served by the API in production (single container). Empty in development.
  clientDist: process.env.CLIENT_DIST || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
};
