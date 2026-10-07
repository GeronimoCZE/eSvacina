import { config } from './config.js';
import { createApp } from './app.js';
import { initCache } from './lib/cache.js';
import { prisma } from './db.js';

const backend = await initCache();
const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`eSvačina API listening on http://localhost:${config.port} (cache: ${backend})`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
