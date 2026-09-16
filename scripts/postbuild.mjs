/**
 * Post-build steps that Vite does not cover:
 *
 * 1. `404.html` — GitHub Pages has no rewrite rules, so it serves this file for
 *    unknown paths. Making it a copy of index.html lets the SPA boot and hand
 *    the URL to the router, which is what keeps /tools/<id> working on refresh.
 * 2. `.nojekyll` — stops GitHub from running the built output through Jekyll.
 * 3. Absolute social/canonical URLs — crawlers do not resolve relative og:image.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const site = (process.env.NOVA_SITE_URL ?? 'https://nova.tools').replace(/\/+$/, '');

const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html
  .replace(/content="\/icons\//g, `content="${site}/icons/`)
  .replace(/href="https:\/\/nova\.tools\/"/g, `href="${site}/"`)
  .replace(/content="https:\/\/nova\.tools\/"/g, `content="${site}/"`);

fs.writeFileSync(indexPath, html);
fs.writeFileSync(path.join(dist, '404.html'), html);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

console.log(`postbuild: 404.html + .nojekyll written, canonical host ${site}`);
