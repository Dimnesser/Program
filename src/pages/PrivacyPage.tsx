import { Cpu, Database, Globe, KeyRound, SlidersHorizontal, UserX } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/PageHeader';

const SECTIONS = [
  { icon: Cpu, title: 'privacy.p1.title', text: 'privacy.p1.text' },
  { icon: UserX, title: 'privacy.p2.title', text: 'privacy.p2.text' },
  { icon: Database, title: 'privacy.p3.title', text: 'privacy.p3.text' },
  { icon: KeyRound, title: 'privacy.p4.title', text: 'privacy.p4.text' },
  { icon: Globe, title: 'privacy.p5.title', text: 'privacy.p5.text' },
  { icon: SlidersHorizontal, title: 'privacy.p6.title', text: 'privacy.p6.text' },
] as const;

export default function PrivacyPage() {
  const { t } = useI18n();
  useDocumentTitle(t('privacy.title'), t('privacy.subtitle'));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow={t('privacy.badge')} title={t('privacy.title')} subtitle={t('privacy.subtitle')} />

      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {SECTIONS.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="border-t border-line pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                <Icon className="h-4 w-4 text-faint" strokeWidth={1.7} />
              </div>
              <h2 className="mt-4 font-serif text-[19px] font-semibold text-ink">{t(section.title)}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{t(section.text)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
