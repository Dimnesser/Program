import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CornerDownLeft,
  Home,
  Languages,
  LayoutGrid,
  Moon,
  Search as SearchIcon,
  Settings,
  Sparkles,
  Star,
  Sun,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecent } from '@/hooks/useRecent';
import { searchTools } from '@/lib/search';
import { resolveIntent } from '@/lib/intent';
import { popularTools, toolMap } from '@/data/tools';
import { categoryMap } from '@/data/categories';
import { cn } from '@/lib/utils';
import { Kbd } from './ui/Badge';
import type { Tool } from '@/types';

interface PaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openWith: (query?: string) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState('');

  const openWith = useCallback((query = '') => {
    setSeed(query);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ open, setOpen, openWith }), [open, openWith]);

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <CommandPalette open={open} seed={seed} onClose={() => setOpen(false)} />
    </PaletteContext.Provider>
  );
}

export function useCommandPalette(): PaletteContextValue {
  const context = useContext(PaletteContext);
  if (!context) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>');
  return context;
}

type Item =
  | { kind: 'tool'; id: string; tool: Tool; hint?: string }
  | { kind: 'action'; id: string; label: string; icon: ReactNode; run: () => void; hint?: string }
  | { kind: 'route'; id: string; label: string; icon: ReactNode; to: string; hint?: string };

function CommandPalette({ open, seed, onClose }: { open: boolean; seed: string; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { t, tl, language, setLanguage } = useI18n();
  const { toggle: toggleTheme, resolved } = useTheme();
  const { favorites } = useFavorites();
  const { recent } = useRecent();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(seed);
    setActive(0);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(timer);
  }, [open, seed]);

  const intents = useMemo(() => (query.trim() ? resolveIntent(query, language) : []), [query, language]);
  const smartAnswer = intents.find((intent) => intent.answer && intent.confidence > 0.9);

  const items = useMemo<Item[]>(() => {
    const trimmed = query.trim();

    const routes: Item[] = [
      { kind: 'route', id: 'r-home', label: t('nav.home'), icon: <Home className="h-4 w-4" />, to: '/' },
      { kind: 'route', id: 'r-tools', label: t('nav.tools'), icon: <LayoutGrid className="h-4 w-4" />, to: '/tools' },
      { kind: 'route', id: 'r-fav', label: t('nav.favorites'), icon: <Star className="h-4 w-4" />, to: '/favorites' },
      { kind: 'route', id: 'r-history', label: t('nav.history'), icon: <Clock className="h-4 w-4" />, to: '/history' },
      {
        kind: 'route',
        id: 'r-settings',
        label: t('nav.settings'),
        icon: <Settings className="h-4 w-4" />,
        to: '/settings',
      },
    ];

    const actions: Item[] = [
      {
        kind: 'action',
        id: 'a-theme',
        label: t('shortcuts.toggleTheme'),
        icon: resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        run: toggleTheme,
        hint: resolved === 'dark' ? t('settings.themeLight') : t('settings.themeDark'),
      },
      {
        kind: 'action',
        id: 'a-lang',
        label: t('settings.language'),
        icon: <Languages className="h-4 w-4" />,
        run: () => setLanguage(language === 'uk' ? 'en' : 'uk'),
        hint: language === 'uk' ? 'English' : 'Українська',
      },
    ];

    if (!trimmed) {
      const favoriteTools = favorites
        .map((id) => toolMap.get(id))
        .filter((tool): tool is Tool => Boolean(tool))
        .slice(0, 4)
        .map<Item>((tool) => ({ kind: 'tool', id: `f-${tool.id}`, tool, hint: t('nav.favorites') }));

      const recentTools = recent
        .map((entry) => toolMap.get(entry.toolId))
        .filter((tool): tool is Tool => Boolean(tool))
        .filter((tool) => !favorites.includes(tool.id))
        .slice(0, 5)
        .map<Item>((tool) => ({ kind: 'tool', id: `h-${tool.id}`, tool, hint: t('nav.recent') }));

      const fill = popularTools
        .filter((tool) => !favorites.includes(tool.id) && !recent.some((entry) => entry.toolId === tool.id))
        .slice(0, 6)
        .map<Item>((tool) => ({ kind: 'tool', id: `p-${tool.id}`, tool, hint: t('common.popular') }));

      return [...favoriteTools, ...recentTools, ...fill, ...routes, ...actions];
    }

    const intentTools = intents
      .slice(0, 4)
      .map((intent) => toolMap.get(intent.toolId))
      .filter((tool): tool is Tool => Boolean(tool));

    const searchResults = searchTools(trimmed, language, 12).map((entry) => entry.tool);
    const merged: Tool[] = [];
    for (const tool of [...intentTools, ...searchResults]) {
      if (!merged.some((item) => item.id === tool.id)) merged.push(tool);
    }

    const toolItems = merged.slice(0, 10).map<Item>((tool) => ({
      kind: 'tool',
      id: `s-${tool.id}`,
      tool,
      hint: tl(categoryMap.get(tool.category)?.name ?? { uk: '', en: '' }),
    }));

    const lowered = trimmed.toLowerCase();
    const matchingRoutes = routes.filter((item) => item.kind === 'route' && item.label.toLowerCase().includes(lowered));
    const matchingActions = actions.filter(
      (item) => item.kind === 'action' && item.label.toLowerCase().includes(lowered),
    );

    return [...toolItems, ...matchingRoutes, ...matchingActions];
  }, [query, language, favorites, recent, intents, t, tl, resolved, toggleTheme, setLanguage]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const run = useCallback(
    (item: Item) => {
      if (item.kind === 'tool') {
        const intent = intents.find((entry) => entry.toolId === item.tool.id);
        navigate(item.tool.route, intent?.initial ? { state: { initial: intent.initial } } : undefined);
      } else if (item.kind === 'route') {
        navigate(item.to);
      } else {
        item.run();
      }
      onClose();
    },
    [intents, navigate, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown' || (event.key === 'n' && event.ctrlKey)) {
        event.preventDefault();
        setActive((current) => (items.length === 0 ? 0 : (current + 1) % items.length));
      } else if (event.key === 'ArrowUp' || (event.key === 'p' && event.ctrlKey)) {
        event.preventDefault();
        setActive((current) => (items.length === 0 ? 0 : (current - 1 + items.length) % items.length));
      } else if (event.key === 'Enter') {
        const item = items[active];
        if (item) {
          event.preventDefault();
          run(item);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, items, active, run, onClose]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[95] flex items-start justify-center px-3 pt-[12vh] sm:px-6">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('shortcuts.palette')}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-elevated/95 shadow-pop backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <SearchIcon className="h-4 w-4 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('search.placeholder')}
                aria-label={t('common.search')}
                className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={onClose}
                className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[11px] font-medium text-faint transition-colors hover:text-ink sm:block"
              >
                ESC
              </button>
            </div>

            {smartAnswer ? (
              <div className="flex items-start gap-3 border-b border-line bg-accent/[0.05] px-4 py-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-accent">{t('search.smart')}</p>
                  <p className="mt-0.5 break-words font-mono text-sm font-medium text-ink">{smartAnswer.answer}</p>
                </div>
              </div>
            ) : null}

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
              {items.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <p className="text-sm font-medium text-ink">{t('search.noResults')}</p>
                  <p className="mt-1 text-[13px] text-muted">{t('search.noResultsHint')}</p>
                </div>
              ) : (
                items.map((item, index) => {
                  const isActive = index === active;
                  const label =
                    item.kind === 'tool' ? tl(item.tool.name) : item.kind === 'route' ? item.label : item.label;
                  const Icon = item.kind === 'tool' ? item.tool.icon : null;
                  const tint = item.kind === 'tool' ? categoryMap.get(item.tool.category)?.tint : undefined;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-index={index}
                      onMouseMove={() => setActive(index)}
                      onClick={() => run(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100',
                        isActive ? 'bg-accent/10' : 'hover:bg-card/60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface',
                          isActive && 'border-accent/30',
                        )}
                        style={tint ? { color: tint } : undefined}
                      >
                        {Icon ? <Icon className="h-4 w-4" strokeWidth={1.9} /> : item.kind !== 'tool' ? item.icon : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{label}</span>
                        {item.kind === 'tool' ? (
                          <span className="block truncate text-xs text-muted">{tl(item.tool.description)}</span>
                        ) : null}
                      </span>
                      {item.hint ? (
                        <span className="hidden shrink-0 text-[11px] text-faint sm:block">{item.hint}</span>
                      ) : null}
                      {isActive ? (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            <div className="hidden items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-[11px] text-faint sm:flex">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  {t('search.navigate')}
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>
                    <CornerDownLeft className="h-2.5 w-2.5" />
                  </Kbd>
                  {t('search.select')}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span>NOVA</span>
                <span className="text-line-strong">/</span>
                <span>{items.length}</span>
              </span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
