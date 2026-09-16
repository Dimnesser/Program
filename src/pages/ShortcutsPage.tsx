import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Kbd } from '@/components/ui/Badge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ShortcutsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('shortcuts.title'), t('shortcuts.subtitle'));

  const groups: { title: string; items: { keys: string[]; label: string; chord?: boolean }[] }[] = [
    {
      title: t('shortcuts.general'),
      items: [
        { keys: ['⌘', 'K'], label: t('shortcuts.search') },
        { keys: ['Ctrl', 'K'], label: t('shortcuts.palette') },
        { keys: ['⌘', '/'], label: t('shortcuts.palette') },
        { keys: ['/'], label: t('shortcuts.search') },
        { keys: ['Esc'], label: t('shortcuts.close') },
        { keys: ['Shift', 'D'], label: t('shortcuts.toggleTheme') },
      ],
    },
    {
      title: t('shortcuts.navigation'),
      items: [
        { keys: ['G', 'H'], label: t('shortcuts.goHome'), chord: true },
        { keys: ['G', 'T'], label: t('shortcuts.goTools'), chord: true },
        { keys: ['G', 'F'], label: t('shortcuts.goFavorites'), chord: true },
        { keys: ['G', 'R'], label: t('nav.history'), chord: true },
        { keys: ['G', 'S'], label: t('shortcuts.goSettings'), chord: true },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{t('shortcuts.title')}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t('shortcuts.subtitle')}</p>
      </header>

      {groups.map((group) => (
        <Card key={group.title} className="p-0">
          <h2 className="border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink">{group.title}</h2>
          <ul className="divide-y divide-line">
            {group.items.map((item) => (
              <li key={`${group.title}-${item.keys.join('')}-${item.label}`} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="text-[13px] text-muted">{item.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {item.keys.map((key, index) => (
                    <span key={key} className="flex items-center gap-1">
                      {index > 0 && item.chord ? (
                        <span className="px-0.5 text-[11px] text-faint">{t('shortcuts.thenKey')}</span>
                      ) : null}
                      <Kbd>{key}</Kbd>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
