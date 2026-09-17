# NOVA

**Everything you need. One place.** — _Усе потрібне в одному місці._

NOVA is a digital utility hub: 67 everyday tools — calculator, converters, QR codes,
image compression, text and developer utilities, notes and timers — behind one fast
interface with a command palette and a local smart search.

Everything runs in the browser. There is no backend, no account, and no upload step.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sitemap + typecheck + production bundle
npm run preview  # serve the production build (service worker included)
```

## What it does

- **Smart search / “Do it for me”** — type `порахуй 15% від 800`, `10 km to miles`,
  `100 usd in uah` or `зроби QR для example.com` and NOVA answers inline, then opens
  the right tool already filled in.
- **Command palette** — `⌘/Ctrl + K` anywhere, with keyboard navigation and `g`-chords
  (`g` then `h` / `t` / `f` / `r` / `s`).
- **67 tools across 8 categories**, each on its own route (`/tools/<id>`).
- **Bilingual** — Ukrainian (default) and English, switchable everywhere.
- **Editorial design system** — a warm-paper light theme and a warm-black dark theme,
  both hand-tuned rather than inverted, plus a system option.
- **PWA** — installable, with an offline app shell and cached tools.
- **Batch image processing** — drop up to 40 photos into the compressor, resizer or
  converter, process them in one pass and download the lot as a ZIP.
- **Local-first** — favorites, history, notes, flashcards and stats live in `localStorage`
  and can be exported, imported or erased from Settings.
- **Preferences that do something** — reduced motion and compact density are real
  switches wired to `data-*` attributes, not decoration.

## Design

NOVA is laid out like a printed reference work rather than a wall of cards: a masthead,
numbered rubrics, and a catalogue of ruled index rows.

- **Type does the work.** IBM Plex Serif sets headlines and figures, Inter carries the
  interface text, and IBM Plex Mono handles labels, counts and eyebrows in small caps.
  All three are self-hosted (latin, latin-ext and cyrillic subsets) in `public/fonts/`.
- **Rules instead of shadows.** Structure comes from hairline dividers and a faint
  engineering grid; `boxShadow` is `none` throughout and radii sit between 2 and 10px.
- **Two real themes.** Light is warm paper (`251 250 248`) with near-black ink; dark is
  warm black (`13 12 11`) with a lifted accent. Both are defined as `--nova-*` custom
  properties in `src/index.css` and consumed through Tailwind, so a token change
  re-skins all 67 tools at once.
- **Accent with restraint.** A single ink-blue accent marks the one action that matters
  on a screen; everything else is ink, muted ink and rule.

Layout primitives live in `src/index.css` (`.nova-card`, `.nova-panel`, `.nova-row`,
`.nova-caps`, `.nova-field`, `.nova-display`) and the scale is in `tailwind.config.js`.

## Architecture

```
src/
  components/      layout (sidebar, topbar, mobile nav), UI primitives, command palette
  data/            tool registry + categories — the single source of truth for routing,
                   search, navigation and the palette
  features/        one self-contained module per tool (calculator, qr, image, json, …)
                   image/ also holds the shared batch engine (useImageBatch + BatchList)
  hooks/           theme, i18n-adjacent state, favorites, recent, toasts, hotkeys
  lib/             calc engine, intent resolution, search ranking, storage, i18n, utils
  pages/           routed screens (landing, dashboard, tools, settings, privacy, …)
  types/           shared contracts
```

### Adding a tool

Add one entry to `src/data/tools.ts` and a component under `src/features/`:

```ts
{
  id: 'my-tool',
  name: { uk: 'Мій інструмент', en: 'My tool' },
  description: { uk: '…', en: '…' },
  category: 'quick-tools',
  icon: Sparkles,
  keywords: ['my', 'tool', 'мій'],
  route: '/tools/my-tool',
  component: lazy(() => import('@/features/my-tool/MyTool')),
  offline: true,
}
```

The route, catalogue entry, search index, command palette, favorites, history and
sitemap all pick it up automatically. Several registry entries may share one component
via `preset` (that is how the eight unit converters and the text toolkit variants work).

### Extension points

| Seam | File | Purpose |
| --- | --- | --- |
| `resolveIntent()` | `src/lib/intent.ts` | Rules engine behind smart search. A hosted model can merge into the same `IntentMatch[]` contract. |
| `fetchRates()` | `src/features/converters/currencies.ts` | Set `VITE_RATES_ENDPOINT` to a `{ base, date, rates }` endpoint for live currency rates; built-in reference rates are the offline fallback. |
| `StudyAnalyzer` | `src/features/study/analyzer.ts` | Summaries/flashcards are extractive and local; the interface is ready for a real model. |
| `useImageBatch()` | `src/features/image/useImageBatch.ts` | Queue, progress and ZIP export for any per-image operation — pass it a processor and it handles the rest. |
| `createZip()` | `src/lib/zip.ts` | Dependency-free STORE-method ZIP writer used by the batch tools. |

## Deployment

The build targets either a domain root or a subpath, controlled by `VITE_BASE_PATH`:

```bash
npm run build                                   # domain root (Vercel, Cloudflare, custom domain)
VITE_BASE_PATH=/Program/ npm run build          # subpath (GitHub Pages project site)
```

`NOVA_SITE_URL` sets the canonical and social-card host and the sitemap entries.

**GitHub Pages** is wired up in `.github/workflows/deploy-pages.yml`: it builds with
the repository name as the base path and publishes `dist/`. Pages requires a public
repository on the free plan. Enable it under *Settings → Pages → Source: GitHub Actions*.

Anything base-dependent resolves at runtime rather than being hardcoded: the service
worker derives its own scope from `self.location`, the manifest uses relative URLs,
the router takes `import.meta.env.BASE_URL` as its basename, and `postbuild.mjs`
emits `404.html` so deep links survive a refresh on hosts without rewrite rules.

## Privacy

Image, text, JSON, hashing and password tools use Canvas, Web Crypto and plain JS —
nothing is transmitted. History stores a tool id and a timestamp, never tool contents.
Generated passwords are never persisted. Every font is self-hosted, so the app makes no
third-party requests at all.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · React Router · Zod ·
lucide-react · qrcode · jsPDF · Canvas API · Web Crypto · Service Worker
