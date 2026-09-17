import { useEffect, useMemo, useState } from 'react';
import { CornerDownLeft, Search, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { usePreferences } from '@/hooks/usePreferences';
import { toolMap } from '@/data/tools';
import { categoryMap } from '@/data/categories';
import { Kbd } from './ui/Badge';
import { cn } from '@/lib/utils';
import type { Language } from '@/types';

interface Scene {
  query: Record<Language, string>;
  answer: string;
  tools: string[];
}

const SCENES: Scene[] = [
  {
    query: { uk: 'порахувати 15% від 800', en: '15% of 800' },
    answer: '15% × 800 = 120',
    tools: ['percentage-calculator', 'calculator'],
  },
  {
    query: { uk: 'переведи 5 км у милі', en: 'convert 5 km to miles' },
    answer: '5 км = 3.106856 mi',
    tools: ['length-converter', 'unit-converter'],
  },
  {
    query: { uk: 'фото важить 12 МБ', en: 'photo is 12 MB, too big' },
    answer: '',
    tools: ['image-compressor', 'image-resizer'],
  },
  {
    query: { uk: 'зробити QR для сайту', en: 'make a QR code for my site' },
    answer: '',
    tools: ['qr-generator', 'short-link'],
  },
];

const TYPE_MS = 55;
const HOLD_MS = 2400;

/**
 * A non-interactive replay of the command palette, built from the same tokens
 * as the real thing — the hero visual is the product, not an illustration.
 */
export function PalettePreview() {
  const { t, tl, language } = useI18n();
  const systemReduced = usePrefersReducedMotion();
  const { reduceMotion } = usePreferences();
  const still = systemReduced || reduceMotion;

  const [sceneIndex, setSceneIndex] = useState(0);
  const [typed, setTyped] = useState(0);

  const scene = SCENES[sceneIndex];
  const full = scene.query[language];

  useEffect(() => {
    if (still) {
      setTyped(full.length);
      return;
    }
    setTyped(0);

    let cancelled = false;
    let index = 0;
    const tick = () => {
      if (cancelled) return;
      index += 1;
      setTyped(index);
      if (index < full.length) {
        timer = setTimeout(tick, TYPE_MS);
      } else {
        timer = setTimeout(() => {
          if (!cancelled) setSceneIndex((current) => (current + 1) % SCENES.length);
        }, HOLD_MS);
      }
    };
    let timer = setTimeout(tick, 380);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [full, still]);

  const typedText = full.slice(0, typed);
  const complete = typed >= full.length;

  const rows = useMemo(
    () => scene.tools.map((id) => toolMap.get(id)).filter((tool): tool is NonNullable<typeof tool> => Boolean(tool)),
    [scene.tools],
  );

  return (
    <div
      aria-hidden="true"
      className="nova-card mx-auto w-full max-w-xl overflow-hidden rounded-2xl text-left shadow-pop"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="h-4 w-4 shrink-0 text-faint" />
        <div className="flex h-14 min-w-0 flex-1 items-center">
          <span className="truncate text-[15px] text-ink">{typedText}</span>
          {!still ? (
            <span
              className={cn('ml-0.5 inline-block h-[18px] w-px bg-accent', complete ? 'animate-pulse' : '')}
            />
          ) : null}
        </div>
        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </div>

      {scene.answer && complete ? (
        <div className="flex items-start gap-3 border-b border-line bg-accent/[0.06] px-4 py-3 animate-fade-in">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-accent">{t('search.smart')}</p>
            <p className="mt-0.5 truncate font-mono text-sm font-semibold text-ink">{scene.answer}</p>
          </div>
        </div>
      ) : null}

      <div className="p-2">
        {rows.map((tool, index) => {
          const Icon = tool.icon;
          const tint = categoryMap.get(tool.category)?.tint;
          return (
            <div
              key={tool.id}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5',
                index === 0 && complete ? 'bg-accent/10' : '',
              )}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface"
                style={{ color: tint }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-ink">{tl(tool.name)}</span>
                <span className="block truncate text-xs text-muted">{tl(tool.description)}</span>
              </span>
              {index === 0 && complete ? (
                <Kbd>
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </Kbd>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
