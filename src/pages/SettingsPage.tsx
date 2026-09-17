import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Info,
  Keyboard,
  Languages,
  Lock,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  Upload,
  Database,
} from 'lucide-react';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/useToast';
import { clearAll, estimateUsage, exportAll, importAll, isStorageAvailable } from '@/lib/storage';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/PageHeader';
import { downloadText, formatBytes, cn } from '@/lib/utils';
import { tools } from '@/data/tools';
import type { Language, ThemeMode } from '@/types';

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { mode, setMode } = useTheme();
  const preferences = usePreferences();
  const { success, error } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usedBytes, setUsedBytes] = useState(() => estimateUsage());
  const fileRef = useRef<HTMLInputElement>(null);
  useDocumentTitle(t('settings.title'), t('settings.subtitle'));

  const storageOk = isStorageAvailable();

  const themes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'dark', label: t('settings.themeDark'), icon: Moon },
    { id: 'light', label: t('settings.themeLight'), icon: Sun },
    { id: 'system', label: t('settings.themeSystem'), icon: Monitor },
  ];

  const handleExport = () => {
    downloadText(
      JSON.stringify(exportAll(), null, 2),
      `nova-data-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json',
    );
    success(t('settings.exported'));
  };

  const handleImport = async (file: File) => {
    try {
      const payload = JSON.parse(await file.text());
      const result = importAll(payload);
      if (!result.ok) {
        error(t('settings.importFailed'));
        return;
      }
      setUsedBytes(estimateUsage());
      success(t('settings.imported'));
      setTimeout(() => window.location.reload(), 700);
    } catch {
      error(t('settings.importFailed'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow="NOVA" title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {!storageOk ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.07] px-4 py-3 text-[13px] text-warning">
          {t('settings.storageUnavailable')}
        </div>
      ) : null}

      {/* Appearance */}
      <Card>
        <SectionHeader title={t('settings.appearance')} icon={<Palette className="h-4 w-4" />} divider="bottom" />
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id);
                  success(t('toast.settingsSaved'));
                }}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ease-nova',
                  active
                    ? 'border-accent/45 bg-accent/[0.07] shadow-glow'
                    : 'border-line bg-surface/60 hover:border-line-strong',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-elevated',
                    active && 'border-accent/30 text-accent',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-medium text-ink">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 space-y-1 border-t border-line pt-4">
          <Switch
            checked={preferences.reduceMotion}
            onChange={(checked) => {
              preferences.set({ reduceMotion: checked });
              success(t('toast.settingsSaved'));
            }}
            label={t('settings.motion')}
            hint={t('settings.motionHint')}
          />
          <Switch
            checked={preferences.compact}
            onChange={(checked) => {
              preferences.set({ compact: checked });
              success(t('toast.settingsSaved'));
            }}
            label={t('settings.compact')}
            hint={t('settings.compactHint')}
          />
        </div>
      </Card>

      {/* Language */}
      <Card>
        <SectionHeader
          title={t('settings.language')}
          subtitle={t('settings.languageHint')}
          icon={<Languages className="h-4 w-4" />}
          divider="bottom"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {LANGUAGES.map((item) => {
            const active = language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLanguage(item.id as Language);
                  success(t('toast.settingsSaved'));
                }}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ease-nova',
                  active
                    ? 'border-accent/45 bg-accent/[0.07] shadow-glow'
                    : 'border-line bg-surface/60 hover:border-line-strong',
                )}
              >
                <span className="text-xl" aria-hidden="true">
                  {item.flag}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{item.label}</span>
                  <span className="block text-xs text-faint">{item.native}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Shortcuts */}
      <Card>
        <SectionHeader
          title={t('settings.shortcuts')}
          subtitle={t('settings.shortcutsHint')}
          icon={<Keyboard className="h-4 w-4" />}
          divider="bottom"
          action={
            <Link
              to="/shortcuts"
              className="text-[13px] font-medium text-accent transition-colors hover:brightness-110"
            >
              {t('common.open')}
            </Link>
          }
        />
      </Card>

      {/* Privacy */}
      <Card>
        <SectionHeader title={t('settings.privacy')} icon={<Lock className="h-4 w-4" />} />
        <PrivacyBadge />
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{t('privacy.p1.text')}</p>
        <Link
          to="/privacy"
          className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors hover:brightness-110"
        >
          {t('nav.privacy')} →
        </Link>
      </Card>

      {/* Data */}
      <Card>
        <SectionHeader title={t('settings.data')} subtitle={t('settings.dataHint')} icon={<Database className="h-4 w-4" />} />
        <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3.5 py-3">
          <span className="text-[13px] text-muted">{t('settings.storageUsed')}</span>
          <span className="font-mono text-[13px] font-medium text-ink">{formatBytes(usedBytes)}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button icon={<Download className="h-4 w-4" />} onClick={handleExport} className="flex-1">
            {t('settings.export')}
          </Button>
          <Button icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()} className="flex-1">
            {t('settings.import')}
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setConfirmOpen(true)}
            className="flex-1"
          >
            {t('settings.clearData')}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label={t('settings.import')}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />
      </Card>

      {/* About */}
      <Card>
        <SectionHeader title={t('settings.about')} icon={<Info className="h-4 w-4" />} />
        <dl className="space-y-2.5 text-[13px]">
          <div className="flex items-center justify-between">
            <dt className="text-muted">{t('settings.version')}</dt>
            <dd className="font-mono text-ink">1.0.0</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">{t('about.toolsCount')}</dt>
            <dd className="font-mono text-ink">{tools.length}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">PWA</dt>
            <dd>
              <Badge tone="success">{t('common.enabled')}</Badge>
            </dd>
          </div>
        </dl>
        <Link
          to="/about"
          className="mt-4 inline-block text-[13px] font-medium text-accent transition-colors hover:brightness-110"
        >
          {t('nav.about')} →
        </Link>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          clearAll();
          setUsedBytes(0);
          success(t('settings.cleared'));
          setTimeout(() => window.location.reload(), 700);
        }}
        title={t('settings.confirmClear')}
        description={t('settings.confirmClearText')}
        confirmLabel={t('settings.clearData')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
