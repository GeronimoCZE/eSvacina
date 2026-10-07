import Redis from 'ioredis';
import { config } from '../config.js';

/**
 * Small cache abstraction: Redis when REDIS_URL is reachable, otherwise an
 * in-memory Map with TTL. Keys are namespaced so admin writes can clear a
 * whole group (e.g. every cached product listing) with one call.
 */
const PREFIX = 'esv:';

class MemoryStore {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (hit.expires < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return hit.value;
  }
  async set(key, value, ttl) {
    this.map.set(key, { value, expires: Date.now() + ttl * 1000 });
  }
  async delPrefix(prefix) {
    for (const key of this.map.keys()) if (key.startsWith(prefix)) this.map.delete(key);
  }
}

class RedisStore {
  constructor(client) {
    this.client = client;
  }
  async get(key) {
    return this.client.get(key);
  }
  async set(key, value, ttl) {
    await this.client.set(key, value, 'EX', ttl);
  }
  async delPrefix(prefix) {
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
      cursor = next;
      if (keys.length) await this.client.del(...keys);
    } while (cursor !== '0');
  }
}

const memory = new MemoryStore();
let store = memory;
let backend = 'memory';

export async function initCache() {
  if (!config.redisUrl) return backend;
  try {
    const client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    client.on('error', () => {
      // Fall back silently; a broken Redis must never take the shop down.
      if (store !== memory) {
        console.warn('[cache] Redis error, falling back to in-memory cache');
        store = memory;
        backend = 'memory';
      }
    });
    await client.connect();
    await client.ping();
    store = new RedisStore(client);
    backend = 'redis';
  } catch (err) {
    console.warn(`[cache] Redis unavailable (${err.message}), using in-memory cache`);
  }
  return backend;
}

export const cacheBackend = () => backend;

export async function cacheGet(key) {
  try {
    const raw = await store.get(PREFIX + key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttl = config.cacheTtl) {
  try {
    await store.set(PREFIX + key, JSON.stringify(value), ttl);
  } catch {
    /* ignore cache write errors */
  }
}

export async function invalidate(...groups) {
  // Page meta and the sitemap are built from the same content, so they always go too.
  const all = groups.includes('') ? groups : [...groups, 'seo'];
  await Promise.all(all.map((g) => store.delPrefix(PREFIX + g).catch(() => {})));
}

/**
 * Express middleware caching JSON GET responses for anonymous visitors.
 * Personalised responses (logged-in user) bypass the cache.
 */
export function cached(group, ttl) {
  return async (req, res, next) => {
    if (req.method !== 'GET' || req.user) return next();
    const key = `${group}:${req.originalUrl}`;
    const hit = await cacheGet(key);
    if (hit) {
      res.set('X-Cache', 'HIT');
      return res.json(hit);
    }
    const json = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) cacheSet(key, body, ttl);
      res.set('X-Cache', 'MISS');
      return json(body);
    };
    next();
  };
}
