import { useMemo, useState } from 'react';
import { ArrowLeftRight, GitCompare } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { diffLines, MAX_DIFF_LINES } from '@/lib/diff';
import { cn } from '@/lib/utils';
import type { ToolProps } from '@/types';

type View = 'split' | 'unified';

const ROW_TONES = {
  same: '',
  add: 'bg-success/[0.10]',
  del: 'bg-danger/[0.10]',
} as const;

const MARKERS = { same: ' ', add: '+', del: '−' } as const;

export default function DiffChecker({ initial }: ToolProps) {
  const { t } = useI18n();
  const [left, setLeft] = useState(initial?.left ?? '');
  const [right, setRight] = useState(initial?.right ?? '');
  const [view, setView] = useState<View>('split');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const result = useMemo(
    () => diffLines(left, right, { ignoreCase, ignoreWhitespace }),
    [left, right, ignoreCase, ignoreWhitespace],
  );

  const identical = left.length > 0 && result.added === 0 && result.removed === 0;

  const patch = useMemo(
    () => result.rows.map((row) => `${MARKERS[row.type]} ${row.text}`).join('\n'),
    [result.rows],
  );

  /* Split view pairs each row with the side it belongs to. */
  const splitRows = useMemo(
    () =>
      result.rows.map((row) => ({
        ...row,
        leftText: row.type === 'add' ? null : row.text,
        rightText: row.type === 'del' ? null : row.text,
      })),
    [result.rows],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('diff.original')}</span>
            <span className="text-[11px] text-faint">{left ? left.split('\n').length : 0}</span>
          </div>
          <Textarea
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            placeholder={t('diff.originalPlaceholder')}
            mono
            className="min-h-[220px]"
            aria-label={t('diff.original')}
          />
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('diff.changed')}</span>
            <span className="text-[11px] text-faint">{right ? right.split('\n').length : 0}</span>
          </div>
          <Textarea
            value={right}
            onChange={(event) => setRight(event.target.value)}
            placeholder={t('diff.changedPlaceholder')}
            mono
            className="min-h-[220px]"
            aria-label={t('diff.changed')}
          />
        </Card>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Segmented
          value={view}
          onChange={setView}
          ariaLabel={t('common.preview')}
          className="w-auto"
          options={[
            { value: 'split', label: t('diff.split') },
            { value: 'unified', label: t('diff.unified') },
          ]}
        />
        <Checkbox checked={ignoreCase} onChange={setIgnoreCase} label={t('diff.ignoreCase')} className="w-auto" />
        <Checkbox
          checked={ignoreWhitespace}
          onChange={setIgnoreWhitespace}
          label={t('diff.ignoreWhitespace')}
          className="w-auto"
        />
        <Button
          size="sm"
          icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
          onClick={() => {
            setLeft(right);
            setRight(left);
          }}
          disabled={!left && !right}
        >
          {t('common.swap')}
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge tone="success">+{result.added}</Badge>
          <Badge tone="danger">−{result.removed}</Badge>
          <Badge>= {result.unchanged}</Badge>
          <CopyButton value={patch} size="xs" variant="ghost" label={t('diff.copyPatch')} />
        </div>
      </Card>

      {result.truncated ? (
        <p className="rounded-xl border border-warning/25 bg-warning/[0.07] px-3.5 py-2.5 text-[13px] text-warning">
          {t('diff.truncated', { limit: MAX_DIFF_LINES })}
        </p>
      ) : null}

      <Card className="p-0">
        {!left && !right ? (
          <p className="px-5 py-14 text-center text-[13px] text-muted">{t('diff.empty')}</p>
        ) : identical ? (
          <p className="flex items-center justify-center gap-2 px-5 py-14 text-center text-[13px] font-medium text-success">
            <GitCompare className="h-4 w-4" />
            {t('diff.identical')}
          </p>
        ) : (
          <div className="max-h-[560px] overflow-auto rounded-3xl">
            {view === 'unified' ? (
              <table className="w-full border-collapse font-mono text-[12.5px]">
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={index} className={ROW_TONES[row.type]}>
                      <td className="w-12 select-none border-r border-line px-2 py-0.5 text-right text-faint">
                        {row.leftNo ?? ''}
                      </td>
                      <td className="w-12 select-none border-r border-line px-2 py-0.5 text-right text-faint">
                        {row.rightNo ?? ''}
                      </td>
                      <td
                        className={cn(
                          'w-6 select-none px-2 py-0.5 text-center',
                          row.type === 'add' && 'text-success',
                          row.type === 'del' && 'text-danger',
                        )}
                      >
                        {MARKERS[row.type]}
                      </td>
                      <td className="whitespace-pre-wrap break-words px-2 py-0.5 text-ink">{row.text || ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full table-fixed border-collapse font-mono text-[12.5px]">
                <tbody>
                  {splitRows.map((row, index) => (
                    <tr key={index}>
                      <td className="w-10 select-none border-r border-line px-2 py-0.5 text-right align-top text-faint">
                        {row.leftNo ?? ''}
                      </td>
                      <td
                        className={cn(
                          'w-[calc(50%-2.5rem)] whitespace-pre-wrap break-words border-r border-line px-2 py-0.5 align-top text-ink',
                          row.type === 'del' && ROW_TONES.del,
                        )}
                      >
                        {row.leftText ?? ''}
                      </td>
                      <td className="w-10 select-none border-r border-line px-2 py-0.5 text-right align-top text-faint">
                        {row.rightNo ?? ''}
                      </td>
                      <td
                        className={cn(
                          'whitespace-pre-wrap break-words px-2 py-0.5 align-top text-ink',
                          row.type === 'add' && ROW_TONES.add,
                        )}
                      >
                        {row.rightText ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      <PrivacyBadge />
    </div>
  );
}
