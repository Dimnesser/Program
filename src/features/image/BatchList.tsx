import { AlertTriangle, Check, Download, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { IconButton } from '@/components/ui/Button';
import { downloadBlob, formatBytes, cn } from '@/lib/utils';
import type { BatchItem } from './useImageBatch';

/** Per-file rows shared by the compressor, resizer and converter. */
export function BatchList({ items, onRemove }: { items: BatchItem[]; onRemove: (id: string) => void }) {
  const { t } = useI18n();

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const saved = item.result ? 1 - item.result.blob.size / item.source.size : 0;
        const percent = Math.round(saved * 100);

        return (
          <li
            key={item.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-2.5 transition-colors',
              item.status === 'working' && 'border-accent/35 bg-accent/[0.05]',
              item.status === 'error' && 'border-danger/30 bg-danger/[0.05]',
            )}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-bg">
              <img
                src={item.result?.url ?? item.source.dataUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{item.source.name}</span>
              <span className="mt-0.5 block truncate font-mono text-[11px] text-faint">
                {item.source.width}×{item.source.height} · {formatBytes(item.source.size)}
                {item.result ? (
                  <>
                    {' → '}
                    {item.result.width}×{item.result.height} · {formatBytes(item.result.blob.size)}
                  </>
                ) : null}
              </span>
            </span>

            {item.status === 'done' && item.result ? (
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-medium',
                  percent > 0 ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning',
                )}
              >
                {percent > 0 ? '−' : '+'}
                {Math.abs(percent)}%
              </span>
            ) : null}

            {item.status === 'working' ? (
              <span
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent"
                aria-label={t('common.loading')}
              />
            ) : null}

            {item.status === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0 text-danger" /> : null}
            {item.status === 'done' ? <Check className="h-4 w-4 shrink-0 text-success" /> : null}

            {item.result ? (
              <IconButton
                label={t('common.download')}
                size="sm"
                variant="ghost"
                onClick={() => downloadBlob(item.result!.blob, item.result!.name)}
              >
                <Download className="h-3.5 w-3.5" />
              </IconButton>
            ) : null}

            <IconButton label={t('common.delete')} size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
              <X className="h-3.5 w-3.5" />
            </IconButton>
          </li>
        );
      })}
    </ul>
  );
}
