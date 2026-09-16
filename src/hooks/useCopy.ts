import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from '@/lib/utils';
import { useToast } from './useToast';
import { useI18n } from '@/lib/i18n';

/** Copy-to-clipboard with the "Copied ✓" microinteraction built in. */
export function useCopy(resetAfter = 1600) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const { toast, error } = useToast();
  const { t } = useI18n();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (value: string, id = 'default', options?: { silent?: boolean }) => {
      if (!value) return false;
      const ok = await copyText(value);
      if (ok) {
        setCopied(id);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(null), resetAfter);
        if (!options?.silent) toast(t('toast.copied'));
      } else {
        error(t('toast.copyFailed'));
      }
      return ok;
    },
    [resetAfter, toast, error, t],
  );

  return { copy, copied, isCopied: (id = 'default') => copied === id };
}
