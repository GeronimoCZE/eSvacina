// PM2 config: serves the built storefront and the API from one process.
// Build the client first (cd client && npm run build); settings come from server/.env.
const path = require('path');
require(path.join(__dirname, 'server/node_modules/dotenv')).config({ path: path.join(__dirname, 'server/.env') });

const port = process.env.PORT || 4010;
const publicUrl = process.env.PM2_PUBLIC_URL || `http://localhost:${port}`;

module.exports = {
  apps: [
    {
      name: 'esvacina',
      cwd: path.join(__dirname, 'server'),
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: port,
        CLIENT_DIST: path.join(__dirname, 'client/dist'),
        PUBLIC_URL: publicUrl,
        CORS_ORIGIN: publicUrl,
        COOKIE_SECURE: process.env.COOKIE_SECURE || (publicUrl.startsWith('https') ? 'true' : 'false'),
      },
    },
  ],
};
