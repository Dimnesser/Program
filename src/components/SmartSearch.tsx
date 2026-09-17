import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { resolveIntent } from '@/lib/intent';
import { toolMap } from '@/data/tools';
import { cn } from '@/lib/utils';
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
          'flex items-center gap-3 border-b-2 pb-3 transition-colors duration-150',
          focused ? 'border-ink' : 'border-line hover:border-line-strong',
        )}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 140)}
          placeholder={t('dash.searchPlaceholder')}
          aria-label={t('dash.searchHint')}
          className="h-9 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-faint"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!best}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-2 px-4 text-[13px] font-medium transition-colors',
            best ? 'bg-ink text-bg hover:bg-ink/90' : 'border border-line text-faint',
          )}
        >
          <span className="hidden sm:inline">{t('dash.doIt')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+10px)] z-30 animate-scale-in border border-ink bg-surface shadow-pop">
          {answer ? (
            <div className="border-b border-line bg-accent/[0.05] px-4 py-3">
              <p className="nova-caps text-accent">{t('search.understood')}</p>
              <p className="mt-1 break-words font-mono text-[15px] font-medium text-ink">{answer.answer}</p>
            </div>
          ) : null}

          <ul className="max-h-[320px] overflow-y-auto">
            {suggestions.map((intent) => {
              const tool = toolMap.get(intent.toolId);
              if (!tool) return null;
              const Icon = tool.icon;
              return (
                <li key={intent.toolId} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(intent)}
                    className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/[0.05]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-ink" strokeWidth={1.7} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{tl(tool.name)}</span>
                      <span className="block truncate text-[12px] text-muted">{tl(intent.reason)}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2">
            <span className="nova-caps truncate">{t('dash.doItHint')}</span>
            <Kbd>↵</Kbd>
          </div>
        </div>
      ) : null}
    </div>
  );
}
