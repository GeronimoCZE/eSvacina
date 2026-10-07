import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { HttpError } from './lib/http.js';
import { loadUser, requireAdmin } from './middleware/auth.js';
import { getSettings } from './lib/settings.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import productRoutes from './routes/products.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes, { stripeWebhook } from './routes/orders.js';
import { i18nMiddleware } from './lib/i18n.js';
import { localizeSettings } from './lib/settings.js';
import seoRoutes, { serveClient } from './routes/seo.js';
import adminCatalog from './routes/admin/catalog.js';
import adminOperations from './routes/admin/operations.js';
import adminContent, { UPLOAD_DIR } from './routes/admin/content.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS: only the configured storefront origins may call the API with cookies.
  // CORS guards the API; the storefront's own assets and pages are served to anyone.
  app.use(
    ['/api', '/uploads'],
    cors({
      origin(origin, cb) {
        // Same-origin requests and server-to-server calls carry no Origin header.
        if (!origin || origin === config.publicUrl || config.corsOrigins.includes(origin)) return cb(null, true);
        cb(new HttpError(403, 'Origin není povolen (CORS).'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Lang'],
      maxAge: 600,
    })
  );

  app.use(compression());
  // Stripe signs the raw body, so the webhook must see it before JSON parsing.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (!config.isProd && process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use(i18nMiddleware);
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false,
      message: { error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.' },
    })
  );
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

  app.use(loadUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // In maintenance mode nobody but admins can place orders.
  app.use('/api/orders', async (req, _res, next) => {
    if (req.method === 'POST' && req.user?.role !== 'ADMIN') {
      const settings = await getSettings();
      if (settings.maintenance.enabled) throw new HttpError(503, localizeSettings(settings, req.lang).maintenance.message);
    }
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api', orderRoutes);
  app.use('/api/admin', requireAdmin, adminCatalog, adminOperations, adminContent);

  // Page meta for the client, sitemap, robots and Open Graph images.
  app.use(seoRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint neexistuje.' }));

  // In production: the storefront itself, with server-rendered meta tags.
  serveClient(app);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Záznam nenalezen.' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Záznam s touto hodnotou už existuje.' });
    if (err.code === 'P2003') return res.status(400).json({ error: 'Záznam je navázaný na jiná data.' });
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Soubor je příliš velký (max 5 MB).' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Neplatný JSON.' });
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: status >= 500 ? 'Na serveru došlo k chybě.' : err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  });

  return app;
}
