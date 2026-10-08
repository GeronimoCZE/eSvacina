import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = process.env.VITE_PROXY_TARGET || 'http://localhost:4010';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: api, changeOrigin: false },
      '/uploads': { target: api, changeOrigin: false },
      '/og': { target: api, changeOrigin: false },
      '/sitemap.xml': { target: api, changeOrigin: false },
      '/robots.txt': { target: api, changeOrigin: false },
    },
  },
});
