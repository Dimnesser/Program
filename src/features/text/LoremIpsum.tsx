import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { analyzeText } from './textOps';

type Flavour = 'latin' | 'uk' | 'tech';
type Unit = 'paragraphs' | 'sentences' | 'words';

const WORDS: Record<Flavour, string[]> = {
  latin: 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' '),
  uk: 'нова інструмент швидкий простий зручний браузер сторінка дані файл текст зображення обчислення результат кнопка вікно пошук список набір розмір колір формат час хвилина секунда день тиждень робота задача проєкт ідея рішення підхід спосіб якість швидкість зручність приватність безпека мережа пристрій екран клавіша команда'.split(' '),
  tech: 'api cache buffer client server render component module bundle route state props hook effect context payload schema token request response latency throughput cluster pipeline runtime compiler parser worker thread queue socket stream cursor index shard replica migration rollback deploy build artifact"'.replace('"', '').split(' '),
};

const randomInt = (max: number) => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
};

function makeSentence(words: string[], min = 6, max = 16): string {
  const length = min + randomInt(max - min);
  const picked = Array.from({ length }, () => words[randomInt(words.length)]);
  const sentence = picked.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

export default function LoremIpsum() {
  const { t } = useI18n();
  const [flavour, setFlavour] = useState<Flavour>('latin');
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [text, setText] = useState('');

  const generate = useCallback(() => {
    const words = WORDS[flavour];
    let result = '';

    if (unit === 'words') {
      result = Array.from({ length: count }, () => words[randomInt(words.length)]).join(' ');
    } else if (unit === 'sentences') {
      result = Array.from({ length: count }, () => makeSentence(words)).join(' ');
    } else {
      result = Array.from({ length: count }, () =>
        Array.from({ length: 3 + randomInt(3) }, () => makeSentence(words)).join(' '),
      ).join('\n\n');
    }

    // The canonical opening is what people expect from a lorem generator.
    if (classic && flavour === 'latin' && unit !== 'words') {
      result = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${result.replace(/^\S+\s\S+\s/, '')}`;
    }
    setText(result);
  }, [flavour, unit, count, classic]);

  useEffect(() => {
    generate();
  }, [generate]);

  const stats = analyzeText(text);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('lorem.flavour')}</span>
          <Segmented
            value={flavour}
            onChange={setFlavour}
            ariaLabel={t('lorem.flavour')}
            options={[
              { value: 'latin', label: 'Lorem' },
              { value: 'uk', label: 'UA' },
              { value: 'tech', label: 'Tech' },
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('lorem.unit')}</span>
          <Segmented
            value={unit}
            onChange={setUnit}
            ariaLabel={t('lorem.unit')}
            options={[
              { value: 'paragraphs', label: t('text.paragraphs') },
              { value: 'sentences', label: t('text.sentences') },
              { value: 'words', label: t('text.words') },
            ]}
          />
        </div>

        <Slider label={t('random.count')} value={count} min={1} max={unit === 'words' ? 200 : 20} onChange={setCount} />

        {flavour === 'latin' && unit !== 'words' ? (
          <Checkbox checked={classic} onChange={setClassic} label={t('lorem.classic')} />
        ) : null}

        <Button variant="primary" block icon={<RefreshCw className="h-4 w-4" />} onClick={generate}>
          {t('common.generate')}
        </Button>

        <PrivacyBadge />
      </Card>

      <Card className="flex flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-muted">
            {stats.words} {t('text.words').toLowerCase()} · {stats.characters} {t('common.characters')}
          </span>
          <CopyButton value={text} size="xs" variant="ghost" />
        </div>
        <div className="min-h-[360px] flex-1 overflow-auto rounded-xl border border-line bg-surface/50 p-4">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{text}</p>
        </div>
      </Card>
    </div>
  );
}
