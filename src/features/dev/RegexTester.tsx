import { useMemo, useState } from 'react';
import { AlertTriangle, Regex as RegexIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { escapeHtml, cn } from '@/lib/utils';

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;

const CHEATSHEET = [
  { token: '\\d', meaning: '0-9' },
  { token: '\\w', meaning: 'a-z A-Z 0-9 _' },
  { token: '\\s', meaning: 'whitespace' },
  { token: '.', meaning: 'any character' },
  { token: '^ $', meaning: 'start / end' },
  { token: '[abc]', meaning: 'one of a, b, c' },
  { token: 'a*  a+  a?', meaning: '0+  1+  0-1' },
  { token: 'a{2,4}', meaning: '2 to 4 times' },
  { token: '(…)', meaning: 'capture group' },
  { token: '(?<name>…)', meaning: 'named group' },
  { token: 'a|b', meaning: 'a or b' },
  { token: '\\b', meaning: 'word boundary' },
];

interface MatchInfo {
  index: number;
  value: string;
  groups: string[];
  named: Record<string, string>;
}

export default function RegexTester() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState('\\b[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}\\b');
  const [flags, setFlags] = useState<string[]>(['g']);
  const [text, setText] = useState('hello@nova.tools\nsupport@example.com\nnot-an-email\nteam@nova.dev');
  const [replacement, setReplacement] = useState('');

  const { matches, errorMessage, highlighted, replaced } = useMemo(() => {
    if (!pattern) {
      return { matches: [] as MatchInfo[], errorMessage: '', highlighted: escapeHtml(text), replaced: text };
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags.includes('g') ? flags.join('') : `${flags.join('')}g`);
    } catch (raw) {
      return {
        matches: [] as MatchInfo[],
        errorMessage: raw instanceof Error ? raw.message : 'Invalid pattern',
        highlighted: escapeHtml(text),
        replaced: text,
      };
    }

    const found: MatchInfo[] = [];
    let html = '';
    let lastIndex = 0;
    let guard = 0;

    for (const match of text.matchAll(regex)) {
      if (guard > 5000) break;
      guard += 1;
      const index = match.index ?? 0;
      // Zero-length matches would loop forever in a manual exec loop; matchAll
      // handles advancement, but they still must not produce empty highlights.
      if (match[0].length === 0) continue;

      found.push({
        index,
        value: match[0],
        groups: match.slice(1).map((group) => group ?? ''),
        named: (match.groups as Record<string, string>) ?? {},
      });

      html += escapeHtml(text.slice(lastIndex, index));
      html += `<mark class="rounded bg-accent/25 px-0.5 text-ink">${escapeHtml(match[0])}</mark>`;
      lastIndex = index + match[0].length;
    }
    html += escapeHtml(text.slice(lastIndex));

    let output = text;
    try {
      output = text.replace(new RegExp(pattern, flags.join('')), replacement);
    } catch {
      output = text;
    }

    return { matches: found, errorMessage: '', highlighted: html, replaced: output };
  }, [pattern, flags, text, replacement]);

  const toggleFlag = (flag: string) =>
    setFlags((current) => (current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag]));

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label={t('regex.pattern')}
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            className="font-mono"
            invalid={Boolean(errorMessage)}
            spellCheck={false}
          />
          <div className="shrink-0">
            <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('regex.flags')}</span>
            <div className="flex gap-1">
              {FLAGS.map((flag) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  aria-pressed={flags.includes(flag)}
                  className={cn(
                    'h-[42px] w-9 rounded-lg border font-mono text-[13px] transition-colors',
                    flags.includes(flag)
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line bg-surface text-faint hover:text-ink',
                  )}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <p className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/[0.05] px-3.5 py-2.5 text-[13px] text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="break-words font-mono text-[12px]">{errorMessage}</span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={matches.length > 0 ? 'success' : 'neutral'}>
              {t('regex.matches')}: {matches.length}
            </Badge>
            <span className="font-mono text-[12px] text-faint">/{pattern}/{flags.join('')}</span>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <span className="mb-2 text-[13px] font-medium text-muted">{t('regex.testText')}</span>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            mono
            className="min-h-[200px]"
            aria-label={t('regex.testText')}
          />
          <div className="mt-3">
            <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('common.preview')}</span>
            <div className="min-h-[100px] overflow-auto rounded-xl border border-line bg-surface/50 p-3.5">
              {/* Every chunk is escaped before <mark> wrappers are added. */}
              <pre
                className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-muted"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <span className="mb-2 text-[13px] font-medium text-muted">{t('regex.matches')}</span>
          <div className="min-h-[160px] flex-1 overflow-auto rounded-xl border border-line bg-surface/50 p-2">
            {matches.length === 0 ? (
              <p className="p-4 text-center text-[13px] text-faint">{t('regex.noMatches')}</p>
            ) : (
              <ol className="space-y-1.5">
                {matches.slice(0, 200).map((match, index) => (
                  <li
                    key={`${match.index}-${index}`}
                    className="rounded-lg border border-line bg-card/60 px-3 py-2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-mono text-[13px] text-ink">{match.value}</span>
                      <span className="shrink-0 font-mono text-[11px] text-faint">#{match.index}</span>
                    </div>
                    {match.groups.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {match.groups.map((group, groupIndex) => (
                          <span
                            key={groupIndex}
                            className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted"
                          >
                            ${groupIndex + 1}: {group || '∅'}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {Object.keys(match.named).length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(match.named).map(([name, value]) => (
                          <span
                            key={name}
                            className="rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent"
                          >
                            {name}: {value || '∅'}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <Input
              label={t('regex.replace')}
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
              className="font-mono"
              placeholder="$1"
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[13px] font-medium text-muted">{t('regex.replaceResult')}</span>
                <CopyButton value={replaced} size="xs" variant="ghost" compact />
              </div>
              <pre className="max-h-32 overflow-auto rounded-xl border border-line bg-surface/50 p-3 font-mono text-[12px] leading-relaxed text-muted">
                {replaced}
              </pre>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
          <RegexIcon className="h-4 w-4 text-accent" />
          {t('regex.cheatsheet')}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CHEATSHEET.map((item) => (
            <div key={item.token} className="rounded-lg border border-line bg-surface/50 px-3 py-2">
              <code className="font-mono text-[13px] text-accent">{item.token}</code>
              <p className="mt-0.5 text-[12px] text-muted">{item.meaning}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
