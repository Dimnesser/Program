import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import { Spark } from '@/components/Logo';
import type { ShortLink } from '@/types';

/** Resolves locally stored /s/<code> aliases created by the short-link tool. */
export default function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const { t } = useI18n();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const links = readStorage<ShortLink[]>(StorageKeys.shortLinks, []);
    const match = links.find((link) => link.code === code);
    if (!match) {
      setMissing(true);
      return;
    }
    writeStorage(
      StorageKeys.shortLinks,
      links.map((link) => (link.id === match.id ? { ...link, hits: link.hits + 1 } : link)),
    );
    window.location.replace(match.url);
  }, [code]);

  return (
    <div className="nova-backdrop flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-card text-accent">
        <Spark className="h-5 w-5" />
      </span>
      {missing ? (
        <>
          <h1 className="mt-5 text-xl font-semibold text-ink">{t('short.notFound')}</h1>
          <p className="mt-2 max-w-sm text-[13px] text-muted">{t('short.hint')}</p>
          <Link
            to="/tools/short-link"
            className="mt-5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition hover:brightness-110"
          >
            {t('short.create')}
          </Link>
        </>
      ) : (
        <p className="mt-5 text-sm text-muted">{t('short.redirecting')}</p>
      )}
    </div>
  );
}
