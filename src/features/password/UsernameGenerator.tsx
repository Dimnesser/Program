import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, UserRound } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

type Style = 'clean' | 'gamer' | 'pro';

const WORDS = {
  adjectives: ['swift', 'lunar', 'quiet', 'bright', 'north', 'solar', 'amber', 'nova', 'cobalt', 'velvet', 'atlas', 'crisp'],
  nouns: ['falcon', 'harbor', 'ember', 'cipher', 'summit', 'pixel', 'comet', 'garden', 'signal', 'canyon', 'orbit', 'forge'],
  gamer: ['shadow', 'blaze', 'frost', 'venom', 'rogue', 'storm', 'ghost', 'raptor', 'onyx', 'titan'],
  gamerTail: ['slayer', 'hunter', 'x', 'core', 'prime', 'zero', 'byte', 'wolf'],
  pro: ['dev', 'design', 'data', 'code', 'studio', 'labs', 'works', 'craft'],
};

const randomInt = (max: number) => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
};

const pick = <T,>(list: T[]): T => list[randomInt(list.length)];

function build(style: Style, withNumbers: boolean, length: number): string {
  let name: string;
  switch (style) {
    case 'gamer':
      name = `${pick(WORDS.gamer)}${pick(WORDS.gamerTail)}`;
      break;
    case 'pro':
      name = `${pick(WORDS.nouns)}.${pick(WORDS.pro)}`;
      break;
    case 'clean':
    default:
      name = `${pick(WORDS.adjectives)}${pick(WORDS.nouns)}`;
  }

  if (withNumbers) name += String(randomInt(90) + 10);
  if (name.length > length) name = name.slice(0, Math.max(4, length));
  return name;
}

export default function UsernameGenerator() {
  const { t } = useI18n();
  const { copy, isCopied } = useCopy();
  const [style, setStyle] = useState<Style>('clean');
  const [withNumbers, setWithNumbers] = useState(true);
  const [count, setCount] = useState(8);
  const [length, setLength] = useState(16);
  const [names, setNames] = useState<string[]>([]);

  const regenerate = useCallback(() => {
    const generated = new Set<string>();
    let guard = 0;
    while (generated.size < count && guard < count * 20) {
      generated.add(build(style, withNumbers, length));
      guard += 1;
    }
    setNames([...generated]);
  }, [style, withNumbers, count, length]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('user.style')}</span>
          <Segmented
            value={style}
            onChange={setStyle}
            ariaLabel={t('user.style')}
            options={[
              { value: 'clean', label: t('user.style.clean') },
              { value: 'gamer', label: t('user.style.gamer') },
              { value: 'pro', label: t('user.style.pro') },
            ]}
          />
        </div>

        <Slider label={t('user.count')} value={count} min={3} max={24} onChange={setCount} />
        <Slider label={t('common.length')} value={length} min={6} max={24} onChange={setLength} />
        <Checkbox checked={withNumbers} onChange={setWithNumbers} label={t('user.withNumbers')} />

        <Button variant="primary" block icon={<RefreshCw className="h-4 w-4" />} onClick={regenerate}>
          {t('common.generate')}
        </Button>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
          <UserRound className="h-4 w-4 text-accent" />
          {t('common.result')}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {names.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => copy(name, name)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3.5 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface"
              >
                <span className="truncate font-mono text-[13px] text-ink">{name}</span>
                <span className="shrink-0 text-[11px] text-faint">
                  {isCopied(name) ? t('common.copied') : t('common.copy')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
