import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { getSeoRoute, readSeoCatalog } from './scripts/seo';

function seoPagesInDev(): Plugin {
  return {
    name: 'seo-pages-in-dev',
    configureServer(server) {
      const catalog = readSeoCatalog();
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        const result = getSeoRoute(pathname, catalog);
        if (!result) return next();
        response.statusCode = result.status;
        response.setHeader('Content-Type', `${result.type}; charset=utf-8`);
        response.end(request.method === 'HEAD' ? undefined : result.body);
      });
    },
  };
}

export default defineConfig({
  // Folder-based HTML pages are real routes; unknown medicine URLs must not fall back to the SPA homepage.
  appType: 'mpa',
  plugins: [seoPagesInDev(), react()],
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
});
