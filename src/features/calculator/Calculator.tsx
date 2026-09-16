import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Delete, History, Trash2 } from 'lucide-react';
import { evaluate, formatResult } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCopy } from '@/hooks/useCopy';
import { StorageKeys } from '@/lib/storage';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { cn, uid } from '@/lib/utils';
import type { CalculatorEntry, ToolProps } from '@/types';

const KEYS = [
  ['AC', '(', ')', '%'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '⌫', '+'],
] as const;

const OPERATORS = new Set(['÷', '×', '−', '+', '%']);
const MAX_HISTORY = 40;

export default function Calculator({ initial }: ToolProps) {
  const { t } = useI18n();
  const { copy } = useCopy();
  const [expression, setExpression] = useState(initial?.expression ?? '');
  const [history, setHistory] = useLocalStorage<CalculatorEntry[]>(StorageKeys.calculator, []);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial?.expression) setExpression(initial.expression);
  }, [initial?.expression]);

  const preview = useMemo(() => {
    if (!expression.trim()) return null;
    const result = evaluate(expression);
    return result.ok ? formatResult(result.value) : null;
  }, [expression]);

  const commit = useCallback(() => {
    if (!expression.trim()) return;
    const result = evaluate(expression);
    if (!result.ok) {
      setFlash(true);
      setTimeout(() => setFlash(false), 420);
      return;
    }
    const value = formatResult(result.value);
    setHistory((current) =>
      [{ id: uid('c'), expression, result: value, at: Date.now() }, ...current].slice(0, MAX_HISTORY),
    );
    setExpression(value);
  }, [expression, setHistory]);

  const press = useCallback(
    (key: string) => {
      if (key === 'AC') {
        setExpression('');
        return;
      }
      if (key === '⌫') {
        setExpression((current) => current.slice(0, -1));
        return;
      }
      setExpression((current) => {
        // Replace a trailing operator rather than stacking two of them.
        if (OPERATORS.has(key) && current && OPERATORS.has(current.slice(-1))) {
          return current.slice(0, -1) + key;
        }
        return current + key;
      });
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target !== inputRef.current && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        commit();
        return;
      }
      if (event.key === 'Escape') {
        setExpression('');
        return;
      }
      if (target === inputRef.current) return; // Let the field handle normal typing.

      if (/^[0-9.+\-*/%()]$/.test(event.key)) {
        event.preventDefault();
        const map: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };
        press(map[event.key] ?? event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        press('⌫');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commit, press]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-0">
        {/* Display */}
        <div
          className={cn(
            'rounded-t-3xl border-b border-line bg-surface/50 px-5 py-6 transition-colors duration-200',
            flash && 'bg-danger/[0.08]',
          )}
        >
          <input
            ref={inputRef}
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            placeholder="0"
            inputMode="text"
            aria-label={t('common.input')}
            spellCheck={false}
            className="w-full bg-transparent text-right font-mono text-[28px] font-medium tracking-tight text-ink outline-none placeholder:text-faint sm:text-[34px]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-faint">{t('calc.expressionHint')}</span>
            <button
              type="button"
              onClick={() => preview && copy(preview)}
              disabled={!preview}
              aria-label={t('common.result')}
              className="max-w-[55%] truncate text-right font-mono text-lg text-muted transition-colors enabled:hover:text-ink"
            >
              {preview ? `= ${preview}` : ''}
            </button>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2 p-4">
          {KEYS.flat().map((key) => {
            const isOperator = OPERATORS.has(key);
            const isAction = key === 'AC' || key === '⌫';
            return (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                aria-label={key === '⌫' ? 'Backspace' : key}
                className={cn(
                  'flex h-14 items-center justify-center rounded-xl border text-lg font-medium transition-all duration-150 ease-nova active:scale-[0.97] sm:h-16',
                  isOperator
                    ? 'border-accent/25 bg-accent/[0.08] text-accent hover:bg-accent/15'
                    : isAction
                      ? 'border-line bg-surface/70 text-muted hover:text-ink'
                      : 'border-line bg-elevated text-ink hover:border-line-strong',
                )}
              >
                {key === '⌫' ? <Delete className="h-5 w-5" /> : key}
              </button>
            );
          })}
          <Button
            variant="primary"
            onClick={commit}
            className="col-span-4 h-14 text-lg sm:h-16"
            disabled={!expression.trim()}
          >
            =
          </Button>
        </div>
      </Card>

      <Card className="flex max-h-[620px] flex-col p-4">
        <SectionHeader
          title={t('calc.history')}
          icon={<History className="h-4 w-4" />}
          className="mb-3"
          action={
            history.length > 0 ? (
              <IconButton label={t('calc.clearHistory')} size="sm" onClick={() => setHistory([])}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            ) : null
          }
        />
        {history.length === 0 ? (
          <EmptyState compact icon={<History className="h-4 w-4" />} title={t('calc.historyEmpty')} />
        ) : (
          <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setExpression(entry.expression)}
                  className="w-full rounded-xl border border-transparent px-3 py-2.5 text-right transition-colors hover:border-line hover:bg-surface/70"
                >
                  <span className="block truncate font-mono text-xs text-faint">{entry.expression}</span>
                  <span className="block truncate font-mono text-[15px] font-medium text-ink">= {entry.result}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
