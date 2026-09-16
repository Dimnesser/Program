/**
 * Generates public/sitemap.xml from the tool registry so every tool route is
 * discoverable. Runs before `vite build`.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = (process.env.NOVA_SITE_URL ?? 'https://nova.tools').replace(/\/+$/, '');
const registry = fs.readFileSync(path.resolve('src/data/tools.ts'), 'utf8');

const toolRoutes = [...registry.matchAll(/route: '([^']+)'/g)].map((match) => match[1]);
const staticRoutes = ['/', '/welcome', '/tools', '/favorites', '/history', '/settings', '/privacy', '/about', '/shortcuts'];
const routes = [...new Set([...staticRoutes, ...toolRoutes])];

const today = new Date().toISOString().slice(0, 10);
const body = routes
  .map(
    (route) =>
      `  <url>\n    <loc>${SITE}${route}</loc>\n    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>monthly</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.7'}</priority>\n  </url>`,
  )
  .join('\n');

fs.writeFileSync(
  path.resolve('public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
);

console.log(`sitemap.xml: ${routes.length} routes`);
