import { useI18n } from '@/lib/i18n';
import { Kbd } from '@/components/ui/Badge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/PageHeader';

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
      <PageHeader eyebrow="NOVA" title={t('shortcuts.title')} subtitle={t('shortcuts.subtitle')} />

      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="nova-caps border-b border-line pb-2">{group.title}</h2>
          <ul>
            {group.items.map((item) => (
              <li
                key={`${group.title}-${item.keys.join('')}-${item.label}`}
                className="flex items-center justify-between gap-4 border-b border-line py-3"
              >
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
        </section>
      ))}
    </div>
  );
}
