import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { readStorage, writeStorage } from '@/lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'install-dismissed';

/** Native PWA install invitation, shown once and never nagging afterwards. */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  const { success } = useToast();

  useEffect(() => {
    if (readStorage<boolean>(DISMISS_KEY, false)) return;

    const onPrompt = (raw: Event) => {
      raw.preventDefault();
      setEvent(raw as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 8000);
    };
    const onInstalled = () => {
      setVisible(false);
      writeStorage(DISMISS_KEY, true);
      success(t('toast.installed'));
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [success, t]);

  if (!visible || !event) return null;

  const dismiss = () => {
    setVisible(false);
    writeStorage(DISMISS_KEY, true);
  };

  return (
    <div className="fixed bottom-[76px] left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-rise-in lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-elevated/95 p-4 shadow-pop backdrop-blur-xl">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Download className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{t('install.title')}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('install.text')}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await event.prompt();
                await event.userChoice;
                setVisible(false);
              }}
              className="h-8 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-fg transition hover:brightness-110"
            >
              {t('install.action')}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-8 rounded-lg px-3 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              {t('install.later')}
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label={t('common.close')} className="text-faint hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
