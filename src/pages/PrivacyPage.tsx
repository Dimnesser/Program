import { Cpu, Database, Globe, KeyRound, SlidersHorizontal, UserX } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

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
      <header>
        <PrivacyBadge asLink={false} />
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{t('privacy.title')}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t('privacy.subtitle')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-accent">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="mt-4 text-[14px] font-semibold text-ink">{t(section.title)}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t(section.text)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
