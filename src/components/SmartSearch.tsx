import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { resolveIntent } from '@/lib/intent';
import { toolMap } from '@/data/tools';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { Kbd } from './ui/Badge';
import type { IntentMatch } from '@/types';

/**
 * The "describe what you need" entry point. Intent resolution runs locally on
 * every keystroke, so the answer and the target tool are both known before the
 * user commits.
 */
export function SmartSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const { t, tl, language } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const intents = useMemo(() => (query.trim().length > 1 ? resolveIntent(query, language) : []), [query, language]);
  const best = intents[0];
  const answer = intents.find((intent) => intent.answer && intent.confidence > 0.9);
  const suggestions = intents.slice(0, 5);

  const open = focused && query.trim().length > 1 && suggestions.length > 0;

  const go = (intent: IntentMatch | undefined) => {
    if (!intent) return;
    const tool = toolMap.get(intent.toolId);
    if (!tool) return;
    navigate(tool.route, intent.initial ? { state: { initial: intent.initial } } : undefined);
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          go(best);
        }}
        className={cn(
          'relative flex items-center gap-2 rounded-2xl border bg-card/80 p-2 backdrop-blur-xl transition-all duration-200 ease-nova',
          focused ? 'border-accent/45 shadow-glow' : 'border-line shadow-soft hover:border-line-strong',
        )}
      >
        <Search className="ml-2 h-[18px] w-[18px] shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 140)}
          placeholder={t('dash.searchPlaceholder')}
          aria-label={t('dash.searchHint')}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          spellCheck={false}
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!best}
          icon={<Sparkles className="h-4 w-4" />}
          className="shrink-0 max-sm:px-3"
        >
          <span className="hidden sm:inline">{t('dash.doIt')}</span>
        </Button>
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 animate-scale-in overflow-hidden rounded-2xl border border-line bg-elevated/95 shadow-pop backdrop-blur-2xl">
          {answer ? (
            <div className="flex items-start gap-3 border-b border-line bg-accent/[0.06] px-4 py-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-accent">
                  {t('search.understood')}
                </p>
                <p className="mt-0.5 break-words font-mono text-sm font-semibold text-ink">{answer.answer}</p>
              </div>
            </div>
          ) : null}

          <ul className="max-h-[320px] overflow-y-auto p-2">
            {suggestions.map((intent) => {
              const tool = toolMap.get(intent.toolId);
              if (!tool) return null;
              const Icon = tool.icon;
              return (
                <li key={intent.toolId}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(intent)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100 hover:bg-card/70"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted group-hover:text-accent">
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{tl(tool.name)}</span>
                      <span className="block truncate text-xs text-muted">{tl(intent.reason)}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-faint">
            <span>{t('dash.doItHint')}</span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>↵</Kbd>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
