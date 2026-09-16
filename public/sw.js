/* NOVA service worker — offline-first shell with a network-first HTML strategy. */
const VERSION = 'nova-v2';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

/**
 * The worker sits at the deployment root, so its own URL yields the base path.
 * That keeps one file working at a domain root and under a subpath such as
 * /Program/ on GitHub Pages.
 */
const BASE = new URL('./', self.location.href).pathname;
const APP_SHELL = BASE;
const OFFLINE_URL = `${BASE}offline.html`;

const SHELL_ASSETS = [
  APP_SHELL,
  OFFLINE_URL,
  `${BASE}manifest.webmanifest`,
  `${BASE}favicon.svg`,
  `${BASE}icons/icon-192.png`,
  `${BASE}fonts/inter.css`,
  `${BASE}fonts/inter-latin.woff2`,
  `${BASE}fonts/inter-cyrillic.woff2`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/** App-shell navigation: try the network, fall back to the cached shell, then offline page. */
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(APP_SHELL, fresh.clone());
    return fresh;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match(APP_SHELL)) || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

/** Hashed build assets are immutable: serve from cache, revalidate in the background. */
async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (/\.(?:js|css|woff2?|png|svg|jpg|jpeg|webp|ico|json|webmanifest)$/.test(url.pathname)) {
    event.respondWith(handleAsset(request));
  }
});
